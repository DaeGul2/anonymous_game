// src/services/gameService.js
const { Op } = require("sequelize");
const { env } = require("../config/env");
const { Room, Player, Round, Question, Answer, sequelize } = require("../models");
const { scheduleAt, clearTimers } = require("./timerService");
const { setGameRuntime, getRoomRuntime } = require("../store/memoryStore");

const REVEAL_SECONDS = 2;

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function broadcastRoom(io, roomId) {
    const room = await Room.findByPk(roomId);
    if (!room) return;

    const players = await Player.findAll({ where: { room_id: roomId }, order: [["joined_at", "ASC"]] });

    io.to(room.code).emit("room:update", {
        ok: true,
        state: {
            room: {
                id: room.id,
                code: room.code,
                title: room.title,
                max_players: room.max_players,
                status: room.status,
                phase: room.phase,
                current_round_no: room.current_round_no,
                host_player_id: room.host_player_id,
                phase_deadline_at: room.phase_deadline_at,
            },
            players: players.map((p) => ({
                id: p.id,
                guest_id: p.guest_id,       
                nickname: p.nickname,
                is_ready: p.is_ready,
                is_connected: p.is_connected,
                joined_at: p.joined_at,
            })),
        },
    });
}

function isBeforeDeadline(room) {
    if (!room.phase_deadline_at) return true;
    return Date.now() <= new Date(room.phase_deadline_at).getTime();
}

async function startRound(io, roomCode) {
    const room = await Room.findOne({ where: { code: roomCode } });
    if (!room) throw new Error("방을 찾을 수 없음");

    // 이미 진행 중이면 무시
    if (room.phase !== "lobby" && room.phase !== "round_end") return;

    const now = new Date();
    const deadline = new Date(Date.now() + env.QUESTION_SUBMIT_SECONDS * 1000);

    await sequelize.transaction(async (t) => {
        // round 생성
        const nextNo = (room.current_round_no || 0) + 1;
        const round = await Round.create(
            {
                room_id: room.id,
                round_no: nextNo,
                started_at: now,
            },
            { transaction: t }
        );

        room.status = "playing";
        room.current_round_no = nextNo;
        room.phase = "question_submit";
        room.phase_deadline_at = deadline;
        room.last_activity_at = now;
        await room.save({ transaction: t });

        // 런타임 초기화
        setGameRuntime(room.code, {
            roundId: round.id,
            questionIds: [],
            questionIndex: 0,
            currentQuestionId: null,
        });
    });

    await broadcastRoom(io, room.id);

    io.to(room.code).emit("game:phase", {
        ok: true,
        phase: "question_submit",
        round_no: room.current_round_no,
        deadline_at: deadline.toISOString(),
    });

    clearTimers(room.code, ["question_submit_end", "answer_end", "reveal_end"]);

    scheduleAt(room.code, "question_submit_end", deadline.getTime() + 20, async () => {
        try {
            await endQuestionSubmit(io, room.code);
        } catch (e) {
            console.error("[endQuestionSubmit]", e?.message || e);
        }
    });
}

async function submitQuestion(io, { roomCode, playerId, text }) {
    const room = await Room.findOne({ where: { code: roomCode } });
    if (!room) throw new Error("방을 찾을 수 없음");
    if (room.phase !== "question_submit") throw new Error("지금은 질문 입력 시간이 아님");
    if (!isBeforeDeadline(room)) throw new Error("질문 입력 시간이 끝남");

    const rt = getRoomRuntime(room.code);
    const roundId = rt?.game?.roundId;
    if (!roundId) throw new Error("라운드 정보가 없음");

    const content = String(text || "").trim();
    if (!content) throw new Error("질문을 입력해줘");
    if (content.length > 500) throw new Error("질문이 너무 김(최대 500자)");

    // 라운드당 1개 질문: 있으면 업데이트(시간 내)
    const existing = await Question.findOne({
        where: { round_id: roundId, submitted_by_player_id: playerId },
    });

    if (existing) {
        existing.text = content;
        existing.submitted_at = new Date();
        await existing.save();
    } else {
        await Question.create({
            room_id: room.id,
            round_id: roundId,
            text: content,
            submitted_by_player_id: playerId,
            submitted_at: new Date(),
            order_no: 0,
            is_used: false,
        });
    }

    room.last_activity_at = new Date();
    await room.save();

    io.to(room.code).emit("game:questionSubmitted", { ok: true });
}

async function endQuestionSubmit(io, roomCode) {
    const room = await Room.findOne({ where: { code: roomCode } });
    if (!room) return;
    if (room.phase !== "question_submit") return;

    const rt = getRoomRuntime(room.code);
    const roundId = rt?.game?.roundId;
    if (!roundId) return;

    const questions = await Question.findAll({
        where: { round_id: roundId },
        order: [["created_at", "ASC"]],
    });

    // 섞고 order_no 저장
    const shuffled = shuffle(questions);
    await sequelize.transaction(async (t) => {
        for (let i = 0; i < shuffled.length; i++) {
            shuffled[i].order_no = i + 1;
            await shuffled[i].save({ transaction: t });
        }

        if (shuffled.length === 0) {
            // 질문 0개면 라운드 즉시 종료
            room.phase = "round_end";
            room.phase_deadline_at = null;
            room.last_activity_at = new Date();
            await room.save({ transaction: t });

            const round = await Round.findByPk(roundId, { transaction: t });
            if (round) {
                round.ended_at = new Date();
                await round.save({ transaction: t });
            }
        } else {
            // 첫 질문 ask로 진입
            const deadline = new Date(Date.now() + env.ANSWER_SECONDS * 1000);
            room.phase = "ask";
            room.phase_deadline_at = deadline;
            room.last_activity_at = new Date();
            await room.save({ transaction: t });

            setGameRuntime(room.code, {
                questionIds: shuffled.map((q) => q.id),
                questionIndex: 0,
                currentQuestionId: shuffled[0].id,
            });
        }
    });

    await broadcastRoom(io, room.id);

    if (shuffled.length === 0) {
        io.to(room.code).emit("game:roundEnd", { ok: true, round_no: room.current_round_no });
        return;
    }

    const first = shuffled[0];
    io.to(room.code).emit("game:ask", {
        ok: true,
        round_no: room.current_round_no,
        question: { id: first.id, text: first.text },
        deadline_at: new Date(room.phase_deadline_at).toISOString(),
    });

    clearTimers(room.code, ["answer_end", "reveal_end"]);
    scheduleAt(room.code, "answer_end", new Date(room.phase_deadline_at).getTime() + 20, async () => {
        try {
            await endAnswer(io, room.code);
        } catch (e) {
            console.error("[endAnswer]", e?.message || e);
        }
    });
}

async function submitAnswer(io, { roomCode, playerId, text }) {
    const room = await Room.findOne({ where: { code: roomCode } });
    if (!room) throw new Error("방을 찾을 수 없음");
    if (room.phase !== "ask") throw new Error("지금은 답변 시간이 아님");
    if (!isBeforeDeadline(room)) throw new Error("답변 시간이 끝남");

    const rt = getRoomRuntime(room.code);
    const roundId = rt?.game?.roundId;
    const qid = rt?.game?.currentQuestionId;
    if (!roundId || !qid) throw new Error("현재 질문 정보가 없음");

    const content = String(text || "").trim();
    if (content.length > 1000) throw new Error("답변이 너무 김(최대 1000자)");

    const existing = await Answer.findOne({
        where: { question_id: qid, answered_by_player_id: playerId },
    });

    if (existing) {
        existing.text = content;
        existing.submitted_at = new Date();
        await existing.save();
    } else {
        await Answer.create({
            room_id: room.id,
            round_id: roundId,
            question_id: qid,
            text: content,
            answered_by_player_id: playerId,
            submitted_at: new Date(),
        });
    }

    room.last_activity_at = new Date();
    await room.save();

    // 전원 제출하면 타이머 전에 종료
    const players = await Player.findAll({ where: { room_id: room.id } });
    const answeredCount = await Answer.count({ where: { question_id: qid } });

    if (answeredCount >= players.length) {
        await endAnswer(io, room.code);
    } else {
        io.to(room.code).emit("game:answerSubmitted", { ok: true });
    }
}

async function endAnswer(io, roomCode) {
    const room = await Room.findOne({ where: { code: roomCode } });
    if (!room) return;
    if (room.phase !== "ask") return;

    const rt = getRoomRuntime(room.code);
    const roundId = rt?.game?.roundId;
    const qid = rt?.game?.currentQuestionId;
    if (!roundId || !qid) return;

    const question = await Question.findByPk(qid);
    if (!question) return;

    const answers = await Answer.findAll({
        where: { question_id: qid },
        order: [["created_at", "ASC"]],
    });

    // reveal로 전환
    await sequelize.transaction(async (t) => {
        room.phase = "reveal";
        room.phase_deadline_at = new Date(Date.now() + REVEAL_SECONDS * 1000);
        room.last_activity_at = new Date();
        await room.save({ transaction: t });
    });

    await broadcastRoom(io, room.id);

    io.to(room.code).emit("game:reveal", {
        ok: true,
        round_no: room.current_round_no,
        question: { id: question.id, text: question.text },
        // ✅ 익명: text만 보냄
        answers: shuffle(answers.map((a) => (a.text || "").trim()).filter((t) => t.length > 0)),
    });

    clearTimers(room.code, ["reveal_end"]);
    scheduleAt(room.code, "reveal_end", Date.now() + REVEAL_SECONDS * 1000 + 20, async () => {
        try {
            await nextQuestionOrEnd(io, room.code);
        } catch (e) {
            console.error("[nextQuestionOrEnd]", e?.message || e);
        }
    });
}

async function nextQuestionOrEnd(io, roomCode) {
    const room = await Room.findOne({ where: { code: roomCode } });
    if (!room) return;

    const rt = getRoomRuntime(room.code);
    const game = rt?.game;
    if (!game?.roundId) return;

    // 현재 질문 used 표시
    if (game.currentQuestionId) {
        await Question.update({ is_used: true }, { where: { id: game.currentQuestionId } });
    }

    const nextIndex = (game.questionIndex || 0) + 1;

    if (!game.questionIds || nextIndex >= game.questionIds.length) {
        // 라운드 종료
        await sequelize.transaction(async (t) => {
            room.phase = "round_end";
            room.phase_deadline_at = null;
            room.last_activity_at = new Date();
            await room.save({ transaction: t });

            const round = await Round.findByPk(game.roundId, { transaction: t });
            if (round) {
                round.ended_at = new Date();
                await round.save({ transaction: t });
            }
        });

        await broadcastRoom(io, room.id);

        io.to(room.code).emit("game:roundEnd", {
            ok: true,
            round_no: room.current_round_no,
            host_player_id: room.host_player_id,
        });

        return;
    }

    // 다음 질문 ask
    const nextQid = game.questionIds[nextIndex];
    const q = await Question.findByPk(nextQid);
    if (!q) {
        setGameRuntime(room.code, { questionIndex: nextIndex, currentQuestionId: null });
        return nextQuestionOrEnd(io, room.code);
    }

    const deadline = new Date(Date.now() + env.ANSWER_SECONDS * 1000);

    await sequelize.transaction(async (t) => {
        room.phase = "ask";
        room.phase_deadline_at = deadline;
        room.last_activity_at = new Date();
        await room.save({ transaction: t });
    });

    setGameRuntime(room.code, { questionIndex: nextIndex, currentQuestionId: q.id });

    await broadcastRoom(io, room.id);

    io.to(room.code).emit("game:ask", {
        ok: true,
        round_no: room.current_round_no,
        question: { id: q.id, text: q.text },
        deadline_at: deadline.toISOString(),
    });

    clearTimers(room.code, ["answer_end"]);
    scheduleAt(room.code, "answer_end", deadline.getTime() + 20, async () => {
        try {
            await endAnswer(io, room.code);
        } catch (e) {
            console.error("[endAnswer]", e?.message || e);
        }
    });
}

async function hostNextRound(io, roomCode, hostPlayerId) {
    const room = await Room.findOne({ where: { code: roomCode } });
    if (!room) throw new Error("방을 찾을 수 없음");
    if (room.host_player_id !== hostPlayerId) throw new Error("방장만 가능");
    if (room.phase !== "round_end") throw new Error("라운드 종료 상태가 아님");

    await startRound(io, room.code);
}

async function hostEndGame(io, roomCode, hostPlayerId) {
    const room = await Room.findOne({ where: { code: roomCode } });
    if (!room) throw new Error("방을 찾을 수 없음");
    if (room.host_player_id !== hostPlayerId) throw new Error("방장만 가능");

    // 로비 복귀 + ready reset
    await sequelize.transaction(async (t) => {
        room.status = "lobby";
        room.phase = "lobby";
        room.phase_deadline_at = null;
        room.last_activity_at = new Date();
        await room.save({ transaction: t });

        await Player.update({ is_ready: false }, { where: { room_id: room.id }, transaction: t });
    });

    clearTimers(room.code, ["question_submit_end", "answer_end", "reveal_end"]);
    setGameRuntime(room.code, { roundId: null, questionIds: [], questionIndex: 0, currentQuestionId: null });

    await broadcastRoom(io, room.id);
    io.to(room.code).emit("game:ended", { ok: true });
}

module.exports = {
    startRound,
    submitQuestion,
    endQuestionSubmit,
    submitAnswer,
    endAnswer,
    hostNextRound,
    hostEndGame,
};
