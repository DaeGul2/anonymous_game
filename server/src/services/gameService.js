// server/src/services/gameService.js
const { Op } = require("sequelize");
const { env } = require("../config/env");
const { Room, Player, Round, Question, Answer, QuestionHeart, sequelize } = require("../models");
const { scheduleAt, clearTimers } = require("./timerService");
const { setGameRuntime, getRoomRuntime, addEditing, removeEditing, getEditingCount, clearEditing } = require("../store/memoryStore");
const aiService = require("./aiService");

// ===== 방장 잠수 → 자동 위임 =====

async function scheduleHostTimeout(io, roomCode, phase) {
  const deadline = new Date(Date.now() + env.HOST_ACTION_SECONDS * 1000);

  // DB에 deadline 저장 (클라이언트가 타이머 표시용)
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) return;
  room.phase_deadline_at = deadline;
  await room.save();

  await broadcastRoom(io, room.id);

  clearTimers(roomCode, ["host_timeout"]);
  scheduleAt(roomCode, "host_timeout", deadline.getTime() + 20, async () => {
    try {
      await handleHostTimeout(io, roomCode, phase);
    } catch (e) {
      console.error("[hostTimeout]", e?.message || e);
    }
  });
}

async function handleHostTimeout(io, roomCode, phase) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) return;
  // phase가 바뀌었으면 이미 방장이 행동한 것
  if (room.phase !== phase) return;

  const currentHostId = room.host_player_id;

  // 현재 방장 제외, 접속 중인 인간 플레이어 중 가장 오래된 사람에게 위임
  const nextHost = await Player.findOne({
    where: {
      room_id: room.id,
      is_ai: false,
      is_connected: true,
      id: { [Op.ne]: currentHostId },
    },
    order: [["joined_at", "ASC"]],
  });

  if (nextHost) {
    room.host_player_id = nextHost.id;
    // last_activity_at를 갱신하지 않음 — 자동 위임은 실제 유저 활동이 아님
    // 실제 유저 이벤트만 global middleware를 통해 touchRoomByCode() 호출
    await room.save();

    await broadcastRoom(io, room.id);

    io.to(roomCode).emit("game:hostChanged", {
      ok: true,
      new_host_player_id: nextHost.id,
      new_host_nickname: nextHost.nickname,
    });

    // 새 방장에게도 타이머 다시 시작
    await scheduleHostTimeout(io, roomCode, phase);
  } else {
    // 위임할 사람 없으면 자동 진행
    if (phase === "reveal") {
      await nextQuestionOrEnd(io, roomCode);
    } else if (phase === "round_end") {
      // 위임할 사람 없는 round_end → 혼자서 새 라운드 시작하는 대신 게임 종료
      await hostEndGame(io, roomCode, room.host_player_id);
    }
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== AI 포함 방 헬퍼 =====

// 아직 제출 안 한 AI 플레이어들의 질문을 GPT로 생성해 저장
async function _generateAndSaveAIQuestions(room, roundId) {
  const aiPlayers = await Player.findAll({ where: { room_id: room.id, is_ai: true } });
  if (aiPlayers.length === 0) return;

  const humanQuestions = await Question.findAll({ where: { round_id: roundId } });
  const humanQTexts = humanQuestions.map((q) => q.text);

  for (const aiPlayer of aiPlayers) {
    const exists = await Question.findOne({
      where: { round_id: roundId, submitted_by_player_id: aiPlayer.id },
    });
    if (exists) continue;

    const aiResult = await aiService.generateAIQuestion({
      roomId: room.id,
      roundId,
      humanQuestions: humanQTexts,
    });

    await Question.create({
      room_id: room.id,
      round_id: roundId,
      text: aiResult.text,
      answer_type: aiResult.answer_type || "free",
      submitted_by_player_id: aiPlayer.id,
      submitted_at: new Date(),
      order_no: 0,
      is_used: false,
    });
  }
}

// 아직 답변 안 한 AI 플레이어들의 답변을 GPT로 생성해 저장
async function _generateAndSaveAIAnswers(room, game) {
  const { roundId, currentQuestionId } = game;
  if (!currentQuestionId) return;

  const aiPlayers = await Player.findAll({ where: { room_id: room.id, is_ai: true } });
  if (aiPlayers.length === 0) return;

  const question = await Question.findByPk(currentQuestionId);
  if (!question) return;

  const allQuestions = await Question.findAll({ where: { round_id: roundId } });
  const allQTexts = allQuestions.map((q) => q.text);

  // 인간 플레이어들의 답변을 가져와서 AI에게 톤/뉘앙스 참고용으로 전달
  const humanPlayers = await Player.findAll({ where: { room_id: room.id, is_ai: false } });
  const humanPlayerIds = humanPlayers.map((p) => p.id);
  const humanAnswerRows = await Answer.findAll({
    where: {
      question_id: currentQuestionId,
      answered_by_player_id: { [Op.in]: humanPlayerIds },
    },
  });
  const humanAnswers = humanAnswerRows.map((a) => (a.text || "").trim()).filter((t) => t);

  for (const aiPlayer of aiPlayers) {
    const exists = await Answer.findOne({
      where: { question_id: currentQuestionId, answered_by_player_id: aiPlayer.id },
    });
    if (exists) continue;

    const text = await aiService.generateAIAnswer({
      roomId: room.id,
      roundId,
      question: question.text,
      allQuestions: allQTexts,
      currentQuestionOrderNo: question.order_no,
      answer_type: question.answer_type || "free",
      humanAnswers,
    });

    await Answer.create({
      room_id: room.id,
      round_id: roundId,
      question_id: currentQuestionId,
      text,
      answered_by_player_id: aiPlayer.id,
      submitted_at: new Date(),
    });
  }
}

async function broadcastRoom(io, roomId) {
  const room = await Room.findByPk(roomId);
  if (!room) return;

  const players = await Player.findAll({
    where: { room_id: roomId },
    order: [["joined_at", "ASC"]],
  });

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
        has_password: room.has_password,
      },
      players: players.map((p) => ({
        id: p.id,
        user_id: p.user_id,
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

  if (room.phase !== "lobby" && room.phase !== "round_end") return;

  // 인간 플레이어 최소 1명 (방어 코드 — 혼자서 라운드 시작 방지)
  const humanCount = await Player.count({ where: { room_id: room.id, is_ai: false } });
  if (humanCount < 1) return;

  // 최대 라운드 제한
  const MAX_ROUNDS = 10;
  if ((room.current_round_no || 0) >= MAX_ROUNDS) {
    throw new Error(`최대 ${MAX_ROUNDS}라운드까지만 가능합니다`);
  }

  const now = new Date();
  const deadline = new Date(Date.now() + env.QUESTION_SUBMIT_SECONDS * 1000);

  await sequelize.transaction(async (t) => {
    const nextNo = (room.current_round_no || 0) + 1;
    const round = await Round.create(
      { room_id: room.id, round_no: nextNo, started_at: now },
      { transaction: t }
    );

    room.status = "playing";
    room.current_round_no = nextNo;
    room.phase = "question_submit";
    room.phase_deadline_at = deadline;
    room.last_activity_at = now;
    await room.save({ transaction: t });

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

async function submitQuestion(io, { roomCode, playerId, text, answer_type }) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) throw new Error("방을 찾을 수 없음");
  if (room.phase !== "question_submit") throw new Error("지금은 질문 입력 시간이 아님");
  if (!isBeforeDeadline(room)) throw new Error("질문 입력 시간이 끝남");

  const rt = getRoomRuntime(room.code);
  const roundId = rt?.game?.roundId;
  if (!roundId) throw new Error("라운드 정보가 없음");

  const content = String(text || "").trim();
  if (!content) throw new Error("질문을 입력해줘");
  if (content.length > 100) throw new Error("질문이 너무 김(최대 100자)");

  const validType = answer_type === "yesno" ? "yesno" : "free";

  const existing = await Question.findOne({
    where: { round_id: roundId, submitted_by_player_id: playerId },
  });

  if (existing) {
    existing.text = content;
    existing.answer_type = validType;
    existing.submitted_at = new Date();
    await existing.save();
  } else {
    await Question.create({
      room_id: room.id,
      round_id: roundId,
      text: content,
      answer_type: validType,
      submitted_by_player_id: playerId,
      submitted_at: new Date(),
      order_no: 0,
      is_used: false,
    });
  }

  room.last_activity_at = new Date();
  await room.save();

  // 다시쓰기 editing 해제 (재제출이므로)
  removeEditing(room.code, "question", playerId);

  // 전원 제출하면 타임아웃 기다리지 말고 즉시 다음 단계로
  const editingQ = getEditingCount(room.code, "question");

  if (room.is_ai_room) {
    // AI 방: 인간 플레이어 전원 제출 여부만 체크
    const humanPlayers = await Player.findAll({ where: { room_id: room.id, is_ai: false } });
    const humanSubmitted = await Question.count({
      where: {
        round_id: roundId,
        submitted_by_player_id: { [Op.in]: humanPlayers.map((p) => p.id) },
      },
    });
    if ((humanSubmitted - editingQ) >= humanPlayers.length) {
      clearTimers(room.code, ["question_submit_end"]);
      endQuestionSubmit(io, room.code).catch((e) => console.error("[endQuestionSubmit]", e?.message));
      return;
    }
    io.to(room.code).emit("game:questionSubmitted", { ok: true, submitted: humanSubmitted, total: humanPlayers.length });
  } else {
    const players = await Player.findAll({ where: { room_id: room.id } });
    const submittedCount = await Question.count({ where: { round_id: roundId } });
    if ((submittedCount - editingQ) >= players.length) {
      clearTimers(room.code, ["question_submit_end"]);
      await endQuestionSubmit(io, room.code);
      return;
    }
    io.to(room.code).emit("game:questionSubmitted", { ok: true, submitted: submittedCount, total: players.length });
  }
}

async function endQuestionSubmit(io, roomCode) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) return;
  if (room.phase !== "question_submit") return;

  // 다시쓰기 상태 클리어 (타이머 만료 시 DB의 최초 저장본 사용)
  clearEditing(roomCode, "question");

  // 레이스 컨디션 방지: phase를 먼저 전환하여 중복 진입 차단
  room.phase = "preparing_ask";
  room.last_activity_at = new Date();
  await room.save();

  const rt = getRoomRuntime(room.code);
  const roundId = rt?.game?.roundId;
  if (!roundId) return;

  // AI 방: 아직 제출 안 한 AI 플레이어 질문을 GPT로 생성
  if (room.is_ai_room) {
    try {
      await _generateAndSaveAIQuestions(room, roundId);
    } catch (e) {
      console.error("[AI generateQuestions]", e?.message);
    }
  }

  const questions = await Question.findAll({
    where: { round_id: roundId },
    order: [["created_at", "ASC"]],
  });

  const shuffled = shuffle(questions);

  await sequelize.transaction(async (t) => {
    for (let i = 0; i < shuffled.length; i++) {
      shuffled[i].order_no = i + 1;
      await shuffled[i].save({ transaction: t });
    }

    if (shuffled.length === 0) {
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
    question: { id: first.id, text: first.text, answer_type: first.answer_type || "free" },
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
  if (content.length > 100) throw new Error("답변이 너무 김(최대 100자)");

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

  // 다시쓰기 editing 해제 (재제출이므로)
  removeEditing(room.code, "answer", playerId);

  const editingA = getEditingCount(room.code, "answer");

  if (room.is_ai_room) {
    // AI 방: 인간 플레이어 전원 답변 여부만 체크
    const humanPlayers = await Player.findAll({ where: { room_id: room.id, is_ai: false } });
    const humanAnswered = await Answer.count({
      where: {
        question_id: qid,
        answered_by_player_id: { [Op.in]: humanPlayers.map((p) => p.id) },
      },
    });
    if ((humanAnswered - editingA) >= humanPlayers.length) {
      clearTimers(room.code, ["answer_end"]);
      endAnswer(io, room.code).catch((e) => console.error("[endAnswer]", e?.message));
    } else {
      io.to(room.code).emit("game:answerSubmitted", { ok: true, submitted: humanAnswered, total: humanPlayers.length });
    }
  } else {
    const players = await Player.findAll({ where: { room_id: room.id } });
    const answeredCount = await Answer.count({ where: { question_id: qid } });
    if ((answeredCount - editingA) >= players.length) {
      await endAnswer(io, room.code);
    } else {
      io.to(room.code).emit("game:answerSubmitted", { ok: true, submitted: answeredCount, total: players.length });
    }
  }
}

async function endAnswer(io, roomCode) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) return;
  if (room.phase !== "ask") return;

  // 다시쓰기 상태 클리어 (타이머 만료 시 DB의 최초 저장본 사용)
  clearEditing(roomCode, "answer");

  // 레이스 컨디션 방지: phase를 먼저 전환하여 중복 진입 차단
  room.phase = "preparing_reveal";
  room.last_activity_at = new Date();
  await room.save();

  const rt = getRoomRuntime(room.code);
  const roundId = rt?.game?.roundId;
  const qid = rt?.game?.currentQuestionId;
  if (!roundId || !qid) return;

  // AI 방: 아직 답변 안 한 AI 플레이어 답변을 GPT로 생성
  if (room.is_ai_room) {
    try {
      await _generateAndSaveAIAnswers(room, rt.game);
    } catch (e) {
      console.error("[AI generateAnswers]", e?.message);
    }
  }

  const question = await Question.findByPk(qid);
  if (!question) return;

  const answers = await Answer.findAll({
    where: { question_id: qid },
    order: [["created_at", "ASC"]],
  });

  const game = rt?.game || {};
  const isLast = (Number(game.questionIndex || 0) + 1) >= (game.questionIds?.length || 0);

  const shuffledAnswers = shuffle(
    answers.map((a) => (a.text || "").trim()).filter((t) => t.length > 0)
  );

  // 카드 까기 타이머 (30초)
  const cardDeadline = new Date(Date.now() + env.REVEAL_CARD_SECONDS * 1000);

  await sequelize.transaction(async (t) => {
    room.phase = "reveal";
    room.phase_deadline_at = cardDeadline;
    room.last_activity_at = new Date();
    await room.save({ transaction: t });
  });

  setGameRuntime(room.code, {
    revealSubPhase: "cards",
    revealAnswerCount: shuffledAnswers.length,
    revealedCardSet: [],
  });

  await broadcastRoom(io, room.id);

  io.to(room.code).emit("game:reveal", {
    ok: true,
    round_no: room.current_round_no,
    is_last: isLast,
    question: { id: question.id, text: question.text, answer_type: question.answer_type || "free" },
    answers: shuffledAnswers,
    deadline_at: cardDeadline.toISOString(),
    sub_phase: "cards",
    total_seconds: env.REVEAL_CARD_SECONDS,
  });

  clearTimers(room.code, ["reveal_end", "host_timeout", "reveal_cards_end", "reveal_viewing_end"]);

  // 카드 까기 타이머: 30초 후 자동 전체 공개 → 감상 시작
  scheduleAt(room.code, "reveal_cards_end", cardDeadline.getTime() + 20, async () => {
    try {
      await autoRevealAllAndStartViewing(io, room.code);
    } catch (e) {
      console.error("[autoRevealAll]", e?.message || e);
    }
  });
}

async function hostRevealNext(io, roomCode, hostPlayerId) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) throw new Error("방을 찾을 수 없음");
  if (room.host_player_id !== hostPlayerId) throw new Error("방장만 가능");
  if (room.phase !== "reveal") throw new Error("지금은 정답 공개 상태가 아님");

  clearTimers(room.code, ["host_timeout", "reveal_cards_end", "reveal_viewing_end"]);
  await nextQuestionOrEnd(io, room.code);
}

// ===== reveal 자동 타이머 =====

// 카드 까기 타이머 만료 → 잔여 카드 자동 공개 + 감상 시작
async function autoRevealAllAndStartViewing(io, roomCode) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room || room.phase !== "reveal") return;

  const rt = getRoomRuntime(roomCode);
  if (rt?.game?.revealSubPhase !== "cards") return;

  io.to(roomCode).emit("game:revealAllCards:broadcast", {});
  await startRevealViewing(io, roomCode);
}

// 감상 타이머 시작 (min(인원수 × 15초, 60초))
async function startRevealViewing(io, roomCode) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room || room.phase !== "reveal") return;

  const rt = getRoomRuntime(roomCode);
  if (rt?.game?.revealSubPhase === "viewing") return; // 중복 방지

  const humanCount = await Player.count({ where: { room_id: room.id, is_ai: false } });
  const viewSec = Math.min(humanCount * env.REVEAL_VIEW_PER_PLAYER, env.REVEAL_VIEW_MAX_SECONDS);
  const viewDeadline = new Date(Date.now() + viewSec * 1000);

  room.phase_deadline_at = viewDeadline;
  room.last_activity_at = new Date();
  await room.save();

  setGameRuntime(roomCode, { revealSubPhase: "viewing" });

  await broadcastRoom(io, room.id);

  io.to(roomCode).emit("game:revealViewing", {
    deadline_at: viewDeadline.toISOString(),
    total_seconds: viewSec,
  });

  clearTimers(roomCode, ["reveal_cards_end", "reveal_viewing_end"]);
  scheduleAt(roomCode, "reveal_viewing_end", viewDeadline.getTime() + 20, async () => {
    try {
      await nextQuestionOrEnd(io, roomCode);
    } catch (e) {
      console.error("[revealViewingEnd]", e?.message || e);
    }
  });
}

// 개별 카드 공개 시 서버 추적 + 전부 까졌으면 감상 전환
async function trackRevealCard(io, roomCode, cardIndex) {
  const rt = getRoomRuntime(roomCode);
  const g = rt?.game;
  if (!g || g.revealSubPhase !== "cards") return;

  const revealed = new Set(g.revealedCardSet || []);
  revealed.add(cardIndex);
  setGameRuntime(roomCode, { revealedCardSet: [...revealed] });

  if (revealed.size >= (g.revealAnswerCount || 0)) {
    clearTimers(roomCode, ["reveal_cards_end"]);
    await startRevealViewing(io, roomCode);
  }
}

async function nextQuestionOrEnd(io, roomCode) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) return;

  const rt = getRoomRuntime(room.code);
  const game = rt?.game;
  if (!game?.roundId) return;

  if (game.currentQuestionId) {
    await Question.update({ is_used: true }, { where: { id: game.currentQuestionId } });
  }

  const nextIndex = (game.questionIndex || 0) + 1;

  if (!game.questionIds || nextIndex >= game.questionIds.length) {
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

    // 이번 라운드 질문별 하트 집계
    let heartSummary = [];
    try {
      const roundQuestions = await Question.findAll({
        where: { round_id: game.roundId },
        order: [["order_no", "ASC"]],
      });
      const qIds = roundQuestions.map((q) => q.id);
      if (qIds.length > 0) {
        const heartRows = await QuestionHeart.findAll({
          where: { question_id: { [Op.in]: qIds } },
          attributes: ["question_id", [sequelize.fn("COUNT", sequelize.col("id")), "cnt"]],
          group: ["question_id"],
          raw: true,
        });
        const heartMap = new Map(heartRows.map((h) => [h.question_id, Number(h.cnt)]));
        heartSummary = roundQuestions
          .map((q) => ({ text: q.text, hearts: heartMap.get(q.id) || 0 }))
          .filter((q) => q.hearts > 0)
          .sort((a, b) => b.hearts - a.hearts);
      }
    } catch (e) {
      console.error("[heartSummary]", e?.message);
    }

    io.to(room.code).emit("game:roundEnd", {
      ok: true,
      round_no: room.current_round_no,
      host_player_id: room.host_player_id,
      heart_summary: heartSummary,
    });

    // 방장 잠수 타이머 시작
    clearTimers(room.code, ["host_timeout"]);
    await scheduleHostTimeout(io, room.code, "round_end");

    return;
  }

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
    question: { id: q.id, text: q.text, answer_type: q.answer_type || "free" },
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

// 방장이 "게임 시작" 버튼을 눌렀을 때 (로비에서 전원 준비 후)
async function hostStartGame(io, roomCode, hostPlayerId) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) throw new Error("방을 찾을 수 없음");
  if (room.host_player_id !== hostPlayerId) throw new Error("방장만 가능");
  if (room.phase !== "lobby") throw new Error("로비 상태에서만 시작 가능");

  const players = await Player.findAll({ where: { room_id: room.id } });
  const humanPlayers = players.filter((p) => !p.is_ai);
  if (humanPlayers.length < 1) throw new Error("플레이어가 없음");
  // AI는 항상 ready, 인간 플레이어만 체크
  const allReady = humanPlayers.every((p) => p.is_ready);
  if (!allReady) throw new Error("아직 모든 플레이어가 준비되지 않았습니다");

  await startRound(io, roomCode);
}

async function hostNextRound(io, roomCode, hostPlayerId) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) throw new Error("방을 찾을 수 없음");
  if (room.host_player_id !== hostPlayerId) throw new Error("방장만 가능");
  if (room.phase !== "round_end") throw new Error("라운드 종료 상태가 아님");

  clearTimers(room.code, ["host_timeout"]);
  await startRound(io, room.code);
}

async function hostEndGame(io, roomCode, hostPlayerId) {
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) throw new Error("방을 찾을 수 없음");
  if (room.host_player_id !== hostPlayerId) throw new Error("방장만 가능");

  await sequelize.transaction(async (t) => {
    room.status = "lobby";
    room.phase = "lobby";
    room.phase_deadline_at = null;
    room.last_activity_at = new Date();
    await room.save({ transaction: t });

    await Player.update({ is_ready: false }, { where: { room_id: room.id }, transaction: t });
  });

  clearTimers(room.code, ["question_submit_end", "answer_end", "reveal_end", "host_timeout", "reveal_cards_end", "reveal_viewing_end"]);
  setGameRuntime(room.code, { roundId: null, questionIds: [], questionIndex: 0, currentQuestionId: null });

  await broadcastRoom(io, room.id);
  io.to(room.code).emit("game:ended", { ok: true });
}

async function heartQuestion(io, { roomCode, playerId, question_id }) {
  if (!question_id || !playerId) return;

  // 질문이 현재 방 소속인지 검증
  const room = await Room.findOne({ where: { code: roomCode } });
  if (!room) return;
  const q = await Question.findOne({ where: { id: question_id, room_id: room.id } });
  if (!q) return;

  const existing = await QuestionHeart.findOne({ where: { question_id, player_id: playerId } });
  if (existing) {
    await existing.destroy();
  } else {
    try {
      await QuestionHeart.create({ question_id, player_id: playerId });
    } catch (_) {} // unique constraint 중복 무시
  }

  const hearts = await QuestionHeart.findAll({ where: { question_id } });
  io.to(roomCode).emit("game:heartQuestion:update", {
    ok: true,
    question_id,
    count: hearts.length,
    hearted_by: hearts.map((h) => h.player_id),
  });
}

// ===== 다시쓰기 알림 =====
async function editQuestion(roomCode, playerId) {
  addEditing(roomCode, "question", playerId);
}

async function editAnswer(roomCode, playerId) {
  addEditing(roomCode, "answer", playerId);
}

// ===== rejoin 시 현재 phase에 맞는 게임 상태 반환 =====
async function getGameStateForPlayer(room, playerId) {
  const phase = room.phase;
  if (!phase || phase === "lobby") return null;

  const rt = getRoomRuntime(room.code);
  const game = rt?.game || {};
  const roundId = game.roundId;
  const roundNo = room.current_round_no || 0;

  const base = {
    phase,
    round_no: roundNo,
    deadline_at: room.phase_deadline_at ? new Date(room.phase_deadline_at).toISOString() : null,
  };

  if (phase === "question_submit" || phase === "preparing_ask") {
    if (!roundId) return base;

    const myQuestion = await Question.findOne({
      where: { round_id: roundId, submitted_by_player_id: playerId },
    });

    return {
      ...base,
      question_submitted: !!myQuestion,
      question_saved_text: myQuestion ? myQuestion.text : "",
    };
  }

  if (phase === "ask") {
    const qid = game.currentQuestionId;
    if (!qid) return base;

    const question = await Question.findByPk(qid);
    const myAnswer = await Answer.findOne({
      where: { question_id: qid, answered_by_player_id: playerId },
    });

    // 하트 정보
    const hearts = await QuestionHeart.findAll({ where: { question_id: qid } });

    return {
      ...base,
      current_question: question
        ? { id: question.id, text: question.text, answer_type: question.answer_type || "free" }
        : null,
      answer_submitted: !!myAnswer,
      answer_saved_text: myAnswer ? myAnswer.text : "",
      heart_count: hearts.length,
      hearted_by: hearts.map((h) => h.player_id),
    };
  }

  if (phase === "reveal") {
    const qid = game.currentQuestionId;
    if (!qid) return base;

    const question = await Question.findByPk(qid);
    const answers = await Answer.findAll({
      where: { question_id: qid },
      order: [["created_at", "ASC"]],
    });
    const isLast = (Number(game.questionIndex || 0) + 1) >= (game.questionIds?.length || 0);

    const hearts = await QuestionHeart.findAll({ where: { question_id: qid } });

    const subPhase = game.revealSubPhase || "cards";

    return {
      ...base,
      deadline_at: room.phase_deadline_at ? new Date(room.phase_deadline_at).toISOString() : null,
      sub_phase: subPhase,
      reveal: {
        question: question
          ? { id: question.id, text: question.text, answer_type: question.answer_type || "free" }
          : null,
        answers: shuffle(
          answers.map((a) => (a.text || "").trim()).filter((t) => t.length > 0)
        ),
        is_last: isLast,
      },
      heart_count: hearts.length,
      hearted_by: hearts.map((h) => h.player_id),
    };
  }

  if (phase === "round_end") {
    let heartSummary = [];
    if (roundId) {
      try {
        const roundQuestions = await Question.findAll({
          where: { round_id: roundId },
          order: [["order_no", "ASC"]],
        });
        const qIds = roundQuestions.map((q) => q.id);
        if (qIds.length > 0) {
          const heartRows = await QuestionHeart.findAll({
            where: { question_id: { [Op.in]: qIds } },
            attributes: ["question_id", [sequelize.fn("COUNT", sequelize.col("id")), "cnt"]],
            group: ["question_id"],
            raw: true,
          });
          const heartMap = new Map(heartRows.map((h) => [h.question_id, Number(h.cnt)]));
          heartSummary = roundQuestions
            .map((q) => ({ text: q.text, hearts: heartMap.get(q.id) || 0 }))
            .filter((q) => q.hearts > 0)
            .sort((a, b) => b.hearts - a.hearts);
        }
      } catch (e) {
        console.error("[rejoin heartSummary]", e?.message);
      }
    }

    return {
      ...base,
      deadline_at: null,
      round_end: {
        ok: true,
        round_no: roundNo,
        host_player_id: room.host_player_id,
        heart_summary: heartSummary,
      },
    };
  }

  // preparing_reveal 등 기타 과도기 상태
  return base;
}

module.exports = {
  startRound,
  hostStartGame,
  submitQuestion,
  endQuestionSubmit,
  submitAnswer,
  endAnswer,
  hostRevealNext,
  hostNextRound,
  hostEndGame,
  heartQuestion,
  editQuestion,
  editAnswer,
  getGameStateForPlayer,
  broadcastRoom,
  startRevealViewing,
  trackRevealCard,
};
