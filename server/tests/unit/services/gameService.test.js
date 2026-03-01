// tests/unit/services/gameService.test.js
const { syncTestDb, clearTestDb, closeTestDb } = require("../../helpers/testDb");
const { createUser, createRoomDirect, createPlayerDirect } = require("../../helpers/fixtures");
const { createMockIo } = require("../../helpers/mockIo");
const { _resetForTesting, setGameRuntime, getRoomRuntime } = require("../../../src/store/memoryStore");
const { Room, Player, Round, Question, Answer, QuestionHeart } = require("../../../src/models");

jest.mock("../../../src/services/aiService", () => ({
  generateAIQuestion: jest.fn().mockResolvedValue({ text: "AI질문", answer_type: "free" }),
  generateAIAnswer: jest.fn().mockResolvedValue("AI답변"),
}));

const gameService = require("../../../src/services/gameService");

// ===== 공통 헬퍼 =====

/** 방 + 방장 + 플레이어 2명 세팅 (기본 lobby 상태) */
async function setupLobbyRoom(overrides = {}) {
  const userA = await createUser({ display_name: "HostUser" });
  const userB = await createUser({ display_name: "PlayerB" });
  const room = await createRoomDirect({ phase: "lobby", status: "lobby", ...overrides });
  const hostPlayer = await createPlayerDirect(room.id, userA.id, { is_ready: true, nickname: "Host" });
  const playerB = await createPlayerDirect(room.id, userB.id, { is_ready: true, nickname: "B" });
  await room.update({ host_player_id: hostPlayer.id });
  return { room, hostPlayer, playerB, userA, userB };
}

/** lobby 방에서 startRound 까지 진행 (question_submit 상태) */
async function setupQuestionSubmitPhase(roomOverrides = {}) {
  const ctx = await setupLobbyRoom(roomOverrides);
  const io = createMockIo();
  await gameService.startRound(io, ctx.room.code);
  io.reset();
  const room = await Room.findByPk(ctx.room.id);
  return { ...ctx, room, io };
}

/** question_submit 에서 질문 2개 제출 후 endQuestionSubmit 까지 진행 (ask 상태) */
async function setupAskPhase() {
  const ctx = await setupQuestionSubmitPhase();
  const { io, room, hostPlayer, playerB } = ctx;

  await gameService.submitQuestion(io, { roomCode: room.code, playerId: hostPlayer.id, text: "질문1", answer_type: "free" });
  await gameService.submitQuestion(io, { roomCode: room.code, playerId: playerB.id, text: "질문2", answer_type: "yesno" });
  // endQuestionSubmit is auto-called when all submit, but let's ensure phase
  io.reset();

  const updatedRoom = await Room.findByPk(room.id);
  return { ...ctx, room: updatedRoom, io };
}

/** ask 상태에서 답변 2개 제출 후 endAnswer 까지 진행 (reveal 상태) */
async function setupRevealPhase() {
  const ctx = await setupAskPhase();
  const { io, room, hostPlayer, playerB } = ctx;

  // Room should be in ask phase now
  const askRoom = await Room.findByPk(room.id);
  if (askRoom.phase !== "ask") {
    // If auto-advanced past ask, force it
    await askRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
  }

  await gameService.submitAnswer(io, { roomCode: askRoom.code, playerId: hostPlayer.id, text: "답변1" });
  await gameService.submitAnswer(io, { roomCode: askRoom.code, playerId: playerB.id, text: "답변2" });
  io.reset();

  const updatedRoom = await Room.findByPk(room.id);
  return { ...ctx, room: updatedRoom, io };
}

// ===== 테스트 시작 =====

describe("gameService", () => {
  beforeAll(async () => {
    await syncTestDb();
  });

  beforeEach(async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    await clearTestDb();
    _resetForTesting();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  // =========================================================
  // 1. startRound
  // =========================================================
  describe("startRound", () => {
    test("creates a Round record and sets phase to question_submit", async () => {
      const { room } = await setupLobbyRoom();
      const io = createMockIo();

      await gameService.startRound(io, room.code);

      const updatedRoom = await Room.findByPk(room.id);
      expect(updatedRoom.phase).toBe("question_submit");
      expect(updatedRoom.status).toBe("playing");
      expect(updatedRoom.current_round_no).toBe(1);

      const rounds = await Round.findAll({ where: { room_id: room.id } });
      expect(rounds).toHaveLength(1);
      expect(rounds[0].round_no).toBe(1);
    });

    test("emits game:phase with question_submit after starting round", async () => {
      const { room } = await setupLobbyRoom();
      const io = createMockIo();

      await gameService.startRound(io, room.code);

      const phaseEmissions = io.getEmissions("game:phase");
      expect(phaseEmissions.length).toBeGreaterThanOrEqual(1);
      expect(phaseEmissions[0].data.phase).toBe("question_submit");
      expect(phaseEmissions[0].data.round_no).toBe(1);
      expect(phaseEmissions[0].data.deadline_at).toBeDefined();
    });

    test("sets game runtime with roundId and empty questionIds", async () => {
      const { room } = await setupLobbyRoom();
      const io = createMockIo();

      await gameService.startRound(io, room.code);

      const rt = getRoomRuntime(room.code);
      expect(rt.game.roundId).toBeDefined();
      expect(rt.game.questionIds).toEqual([]);
      expect(rt.game.questionIndex).toBe(0);
      expect(rt.game.currentQuestionId).toBeNull();
    });

    test("throws error when max rounds (10) is reached", async () => {
      const { room } = await setupLobbyRoom({ current_round_no: 10, phase: "round_end" });
      const io = createMockIo();

      await expect(gameService.startRound(io, room.code)).rejects.toThrow("10");
    });

    test("does nothing if phase is not lobby or round_end", async () => {
      const { room } = await setupLobbyRoom({ phase: "ask" });
      const io = createMockIo();

      await gameService.startRound(io, room.code);

      const updatedRoom = await Room.findByPk(room.id);
      expect(updatedRoom.phase).toBe("ask");
    });
  });

  // =========================================================
  // 2. hostStartGame
  // =========================================================
  describe("hostStartGame", () => {
    test("starts round when host calls and all players are ready", async () => {
      const { room, hostPlayer } = await setupLobbyRoom();
      const io = createMockIo();

      await gameService.hostStartGame(io, room.code, hostPlayer.id);

      const updatedRoom = await Room.findByPk(room.id);
      expect(updatedRoom.phase).toBe("question_submit");
      expect(updatedRoom.status).toBe("playing");
    });

    test("throws if caller is not the host", async () => {
      const { room, playerB } = await setupLobbyRoom();
      const io = createMockIo();

      await expect(
        gameService.hostStartGame(io, room.code, playerB.id)
      ).rejects.toThrow("방장만 가능");
    });

    test("throws if not all human players are ready", async () => {
      const { room, hostPlayer, playerB } = await setupLobbyRoom();
      await playerB.update({ is_ready: false });
      const io = createMockIo();

      await expect(
        gameService.hostStartGame(io, room.code, hostPlayer.id)
      ).rejects.toThrow("준비");
    });

    test("throws if phase is not lobby", async () => {
      const { room, hostPlayer } = await setupLobbyRoom({ phase: "question_submit" });
      const io = createMockIo();

      await expect(
        gameService.hostStartGame(io, room.code, hostPlayer.id)
      ).rejects.toThrow("로비");
    });
  });

  // =========================================================
  // 3. submitQuestion
  // =========================================================
  describe("submitQuestion", () => {
    test("creates a new question for the current round", async () => {
      const { room, hostPlayer, io } = await setupQuestionSubmitPhase();

      await gameService.submitQuestion(io, {
        roomCode: room.code,
        playerId: hostPlayer.id,
        text: "테스트 질문",
        answer_type: "free",
      });

      const rt = getRoomRuntime(room.code);
      const questions = await Question.findAll({ where: { round_id: rt.game.roundId } });
      expect(questions).toHaveLength(1);
      expect(questions[0].text).toBe("테스트 질문");
      expect(questions[0].answer_type).toBe("free");
    });

    test("updates existing question if player re-submits", async () => {
      const { room, hostPlayer, io } = await setupQuestionSubmitPhase();

      await gameService.submitQuestion(io, {
        roomCode: room.code,
        playerId: hostPlayer.id,
        text: "첫 번째 질문",
        answer_type: "free",
      });

      await gameService.submitQuestion(io, {
        roomCode: room.code,
        playerId: hostPlayer.id,
        text: "수정된 질문",
        answer_type: "yesno",
      });

      const rt = getRoomRuntime(room.code);
      const questions = await Question.findAll({
        where: { round_id: rt.game.roundId, submitted_by_player_id: hostPlayer.id },
      });
      expect(questions).toHaveLength(1);
      expect(questions[0].text).toBe("수정된 질문");
      expect(questions[0].answer_type).toBe("yesno");
    });

    test("throws if question text exceeds 100 characters", async () => {
      const { room, hostPlayer, io } = await setupQuestionSubmitPhase();
      const longText = "가".repeat(101);

      await expect(
        gameService.submitQuestion(io, {
          roomCode: room.code,
          playerId: hostPlayer.id,
          text: longText,
          answer_type: "free",
        })
      ).rejects.toThrow("100");
    });

    test("throws if question text is empty", async () => {
      const { room, hostPlayer, io } = await setupQuestionSubmitPhase();

      await expect(
        gameService.submitQuestion(io, {
          roomCode: room.code,
          playerId: hostPlayer.id,
          text: "   ",
          answer_type: "free",
        })
      ).rejects.toThrow("질문을 입력");
    });

    test("throws if phase is not question_submit", async () => {
      const { room, hostPlayer } = await setupLobbyRoom({ phase: "ask", status: "playing" });
      const io = createMockIo();

      await expect(
        gameService.submitQuestion(io, {
          roomCode: room.code,
          playerId: hostPlayer.id,
          text: "질문",
          answer_type: "free",
        })
      ).rejects.toThrow("질문 입력 시간이 아님");
    });

    test("auto-advances to ask phase when all players submit", async () => {
      const { room, hostPlayer, playerB, io } = await setupQuestionSubmitPhase();

      await gameService.submitQuestion(io, {
        roomCode: room.code,
        playerId: hostPlayer.id,
        text: "질문A",
        answer_type: "free",
      });

      await gameService.submitQuestion(io, {
        roomCode: room.code,
        playerId: playerB.id,
        text: "질문B",
        answer_type: "free",
      });

      const updatedRoom = await Room.findByPk(room.id);
      // After all submit, endQuestionSubmit is called -> phase becomes ask
      expect(["ask", "preparing_ask"]).toContain(updatedRoom.phase);
    });
  });

  // =========================================================
  // 4. endQuestionSubmit
  // =========================================================
  describe("endQuestionSubmit", () => {
    test("shuffles questions and assigns order_no, moves to ask phase", async () => {
      const { room, hostPlayer, playerB, io } = await setupQuestionSubmitPhase();
      const rt = getRoomRuntime(room.code);

      // Manually create questions without auto-advance
      await Question.create({
        room_id: room.id,
        round_id: rt.game.roundId,
        text: "질문1",
        answer_type: "free",
        submitted_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
        order_no: 0,
        is_used: false,
      });
      await Question.create({
        room_id: room.id,
        round_id: rt.game.roundId,
        text: "질문2",
        answer_type: "yesno",
        submitted_by_player_id: playerB.id,
        submitted_at: new Date(),
        order_no: 0,
        is_used: false,
      });

      await gameService.endQuestionSubmit(io, room.code);

      const updatedRoom = await Room.findByPk(room.id);
      expect(updatedRoom.phase).toBe("ask");

      const questions = await Question.findAll({
        where: { round_id: rt.game.roundId },
        order: [["order_no", "ASC"]],
      });
      expect(questions).toHaveLength(2);
      // Each question should have a unique order_no (1 or 2)
      const orderNos = questions.map((q) => q.order_no).sort();
      expect(orderNos).toEqual([1, 2]);
    });

    test("emits game:ask with first question after shuffling", async () => {
      const { room, hostPlayer, io } = await setupQuestionSubmitPhase();
      const rt = getRoomRuntime(room.code);

      await Question.create({
        room_id: room.id,
        round_id: rt.game.roundId,
        text: "유일한 질문",
        answer_type: "free",
        submitted_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
        order_no: 0,
        is_used: false,
      });

      await gameService.endQuestionSubmit(io, room.code);

      const askEmissions = io.getEmissions("game:ask");
      expect(askEmissions.length).toBeGreaterThanOrEqual(1);
      expect(askEmissions[0].data.ok).toBe(true);
      expect(askEmissions[0].data.question.text).toBe("유일한 질문");
      expect(askEmissions[0].data.deadline_at).toBeDefined();
    });

    test("moves to round_end when zero questions submitted", async () => {
      const { room, io } = await setupQuestionSubmitPhase();

      await gameService.endQuestionSubmit(io, room.code);

      const updatedRoom = await Room.findByPk(room.id);
      expect(updatedRoom.phase).toBe("round_end");

      const roundEndEmissions = io.getEmissions("game:roundEnd");
      expect(roundEndEmissions.length).toBeGreaterThanOrEqual(1);
      expect(roundEndEmissions[0].data.ok).toBe(true);
    });

    test("sets game runtime questionIds after shuffling", async () => {
      const { room, hostPlayer, playerB, io } = await setupQuestionSubmitPhase();
      const rt = getRoomRuntime(room.code);

      await Question.create({
        room_id: room.id,
        round_id: rt.game.roundId,
        text: "Q1",
        answer_type: "free",
        submitted_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
        order_no: 0,
        is_used: false,
      });
      await Question.create({
        room_id: room.id,
        round_id: rt.game.roundId,
        text: "Q2",
        answer_type: "free",
        submitted_by_player_id: playerB.id,
        submitted_at: new Date(),
        order_no: 0,
        is_used: false,
      });

      await gameService.endQuestionSubmit(io, room.code);

      const updatedRt = getRoomRuntime(room.code);
      expect(updatedRt.game.questionIds).toHaveLength(2);
      expect(updatedRt.game.questionIndex).toBe(0);
      expect(updatedRt.game.currentQuestionId).toBe(updatedRt.game.questionIds[0]);
    });
  });

  // =========================================================
  // 5. submitAnswer
  // =========================================================
  describe("submitAnswer", () => {
    test("creates an answer for the current question", async () => {
      const ctx = await setupAskPhase();
      const { room, hostPlayer, io } = ctx;

      // Ensure we are in ask phase
      const askRoom = await Room.findByPk(room.id);
      if (askRoom.phase !== "ask") {
        await askRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
      }

      await gameService.submitAnswer(io, {
        roomCode: askRoom.code,
        playerId: hostPlayer.id,
        text: "나의 답변",
      });

      const rt = getRoomRuntime(askRoom.code);
      const answers = await Answer.findAll({ where: { question_id: rt.game.currentQuestionId } });
      expect(answers.length).toBeGreaterThanOrEqual(1);

      const myAnswer = answers.find((a) => a.answered_by_player_id === hostPlayer.id);
      expect(myAnswer).toBeDefined();
      expect(myAnswer.text).toBe("나의 답변");
    });

    test("updates existing answer on re-submit", async () => {
      const ctx = await setupAskPhase();
      const { room, hostPlayer, io } = ctx;

      const askRoom = await Room.findByPk(room.id);
      if (askRoom.phase !== "ask") {
        await askRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
      }

      await gameService.submitAnswer(io, {
        roomCode: askRoom.code,
        playerId: hostPlayer.id,
        text: "첫 답변",
      });

      // Re-submit to update
      const roomAgain = await Room.findByPk(room.id);
      if (roomAgain.phase !== "ask") {
        await roomAgain.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
      }

      await gameService.submitAnswer(io, {
        roomCode: askRoom.code,
        playerId: hostPlayer.id,
        text: "수정된 답변",
      });

      const rt = getRoomRuntime(askRoom.code);
      const answers = await Answer.findAll({
        where: { question_id: rt.game.currentQuestionId, answered_by_player_id: hostPlayer.id },
      });
      expect(answers).toHaveLength(1);
      expect(answers[0].text).toBe("수정된 답변");
    });

    test("throws if answer text exceeds 100 characters", async () => {
      const ctx = await setupAskPhase();
      const { room, hostPlayer, io } = ctx;

      const askRoom = await Room.findByPk(room.id);
      if (askRoom.phase !== "ask") {
        await askRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
      }

      const longText = "A".repeat(101);

      await expect(
        gameService.submitAnswer(io, {
          roomCode: askRoom.code,
          playerId: hostPlayer.id,
          text: longText,
        })
      ).rejects.toThrow("100");
    });

    test("throws if phase is not ask", async () => {
      const { room, hostPlayer } = await setupLobbyRoom({ phase: "reveal", status: "playing" });
      const io = createMockIo();

      await expect(
        gameService.submitAnswer(io, {
          roomCode: room.code,
          playerId: hostPlayer.id,
          text: "답변",
        })
      ).rejects.toThrow("답변 시간이 아님");
    });

    test("auto-advances to reveal when all players answer", async () => {
      const ctx = await setupAskPhase();
      const { room, hostPlayer, playerB, io } = ctx;

      const askRoom = await Room.findByPk(room.id);
      if (askRoom.phase !== "ask") {
        await askRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
      }

      await gameService.submitAnswer(io, {
        roomCode: askRoom.code,
        playerId: hostPlayer.id,
        text: "답1",
      });

      // Re-read room to check phase after first answer
      const midRoom = await Room.findByPk(room.id);
      if (midRoom.phase !== "ask") {
        // Already auto-advanced, skip second answer
        expect(["reveal", "preparing_reveal"]).toContain(midRoom.phase);
        return;
      }

      await gameService.submitAnswer(io, {
        roomCode: askRoom.code,
        playerId: playerB.id,
        text: "답2",
      });

      const finalRoom = await Room.findByPk(room.id);
      expect(["reveal", "preparing_reveal"]).toContain(finalRoom.phase);
    });
  });

  // =========================================================
  // 6. endAnswer
  // =========================================================
  describe("endAnswer", () => {
    test("moves to reveal phase and emits game:reveal", async () => {
      const ctx = await setupAskPhase();
      const { room, hostPlayer, playerB, io } = ctx;

      // Ensure ask phase and create answers manually
      let askRoom = await Room.findByPk(room.id);
      if (askRoom.phase !== "ask") {
        await askRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
      }

      const rt = getRoomRuntime(askRoom.code);
      const qid = rt.game.currentQuestionId;

      await Answer.create({
        room_id: askRoom.id,
        round_id: rt.game.roundId,
        question_id: qid,
        text: "답변A",
        answered_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
      });
      await Answer.create({
        room_id: askRoom.id,
        round_id: rt.game.roundId,
        question_id: qid,
        text: "답변B",
        answered_by_player_id: playerB.id,
        submitted_at: new Date(),
      });

      io.reset();
      await gameService.endAnswer(io, askRoom.code);

      const updatedRoom = await Room.findByPk(room.id);
      expect(updatedRoom.phase).toBe("reveal");

      const revealEmissions = io.getEmissions("game:reveal");
      expect(revealEmissions.length).toBeGreaterThanOrEqual(1);
      expect(revealEmissions[0].data.ok).toBe(true);
      expect(revealEmissions[0].data.question).toBeDefined();
      expect(revealEmissions[0].data.answers).toBeDefined();
      expect(revealEmissions[0].data.answers).toHaveLength(2);
    });

    test("shuffles answers in the reveal emission", async () => {
      const ctx = await setupAskPhase();
      const { room, hostPlayer, playerB, io } = ctx;

      let askRoom = await Room.findByPk(room.id);
      if (askRoom.phase !== "ask") {
        await askRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
      }

      const rt = getRoomRuntime(askRoom.code);
      const qid = rt.game.currentQuestionId;

      await Answer.create({
        room_id: askRoom.id,
        round_id: rt.game.roundId,
        question_id: qid,
        text: "답변Alpha",
        answered_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
      });
      await Answer.create({
        room_id: askRoom.id,
        round_id: rt.game.roundId,
        question_id: qid,
        text: "답변Beta",
        answered_by_player_id: playerB.id,
        submitted_at: new Date(),
      });

      io.reset();
      await gameService.endAnswer(io, askRoom.code);

      const revealEmissions = io.getEmissions("game:reveal");
      const answers = revealEmissions[0].data.answers;
      // Both answers should be present regardless of order
      expect(answers).toContain("답변Alpha");
      expect(answers).toContain("답변Beta");
    });

    test("does nothing if phase is not ask", async () => {
      const { room } = await setupLobbyRoom({ phase: "lobby" });
      const io = createMockIo();

      await gameService.endAnswer(io, room.code);

      const updatedRoom = await Room.findByPk(room.id);
      expect(updatedRoom.phase).toBe("lobby");
    });
  });

  // =========================================================
  // 7. hostRevealNext
  // =========================================================
  describe("hostRevealNext", () => {
    test("throws if caller is not the host", async () => {
      const ctx = await setupRevealPhase();
      const { room, playerB, io } = ctx;

      const revealRoom = await Room.findByPk(room.id);
      if (revealRoom.phase !== "reveal") {
        await revealRoom.update({ phase: "reveal" });
      }

      await expect(
        gameService.hostRevealNext(io, revealRoom.code, playerB.id)
      ).rejects.toThrow("방장만 가능");
    });

    test("throws if phase is not reveal", async () => {
      const { room, hostPlayer } = await setupLobbyRoom({ phase: "ask", status: "playing" });
      const io = createMockIo();

      await expect(
        gameService.hostRevealNext(io, room.code, hostPlayer.id)
      ).rejects.toThrow("정답 공개");
    });

    test("advances to next question or ends round", async () => {
      const ctx = await setupRevealPhase();
      const { room, hostPlayer, io } = ctx;

      let revealRoom = await Room.findByPk(room.id);
      if (revealRoom.phase !== "reveal") {
        await revealRoom.update({ phase: "reveal" });
      }

      io.reset();
      await gameService.hostRevealNext(io, revealRoom.code, hostPlayer.id);

      const updatedRoom = await Room.findByPk(room.id);
      // Should either go to ask (next question) or round_end (last question)
      expect(["ask", "round_end"]).toContain(updatedRoom.phase);
    });
  });

  // =========================================================
  // 8. hostEndGame
  // =========================================================
  describe("hostEndGame", () => {
    test("returns room to lobby and resets all ready states", async () => {
      const { room, hostPlayer, playerB } = await setupLobbyRoom({
        phase: "round_end",
        status: "playing",
        current_round_no: 2,
      });
      const io = createMockIo();
      setGameRuntime(room.code, { roundId: "fake-round-id" });

      await gameService.hostEndGame(io, room.code, hostPlayer.id);

      const updatedRoom = await Room.findByPk(room.id);
      expect(updatedRoom.status).toBe("lobby");
      expect(updatedRoom.phase).toBe("lobby");
      expect(updatedRoom.phase_deadline_at).toBeNull();

      // All players should have is_ready = false
      const players = await Player.findAll({ where: { room_id: room.id } });
      for (const p of players) {
        expect(p.is_ready).toBe(false);
      }
    });

    test("emits game:ended event", async () => {
      const { room, hostPlayer } = await setupLobbyRoom({
        phase: "round_end",
        status: "playing",
      });
      const io = createMockIo();
      setGameRuntime(room.code, { roundId: "fake-round-id" });

      await gameService.hostEndGame(io, room.code, hostPlayer.id);

      const endedEmissions = io.getEmissions("game:ended");
      expect(endedEmissions.length).toBeGreaterThanOrEqual(1);
      expect(endedEmissions[0].data.ok).toBe(true);
    });

    test("throws if caller is not the host", async () => {
      const { room, playerB } = await setupLobbyRoom({
        phase: "round_end",
        status: "playing",
      });
      const io = createMockIo();

      await expect(
        gameService.hostEndGame(io, room.code, playerB.id)
      ).rejects.toThrow("방장만 가능");
    });

    test("resets game runtime", async () => {
      const { room, hostPlayer } = await setupLobbyRoom({
        phase: "round_end",
        status: "playing",
      });
      const io = createMockIo();
      setGameRuntime(room.code, { roundId: "some-id", questionIds: ["q1", "q2"], questionIndex: 1 });

      await gameService.hostEndGame(io, room.code, hostPlayer.id);

      const rt = getRoomRuntime(room.code);
      expect(rt.game.roundId).toBeNull();
      expect(rt.game.questionIds).toEqual([]);
      expect(rt.game.questionIndex).toBe(0);
      expect(rt.game.currentQuestionId).toBeNull();
    });
  });

  // =========================================================
  // 9. heartQuestion
  // =========================================================
  describe("heartQuestion", () => {
    test("creates a heart and emits update", async () => {
      const ctx = await setupQuestionSubmitPhase();
      const { room, hostPlayer, io } = ctx;
      const rt = getRoomRuntime(room.code);

      const question = await Question.create({
        room_id: room.id,
        round_id: rt.game.roundId,
        text: "하트 질문",
        answer_type: "free",
        submitted_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
        order_no: 1,
        is_used: false,
      });

      io.reset();
      await gameService.heartQuestion(io, {
        roomCode: room.code,
        playerId: hostPlayer.id,
        question_id: question.id,
      });

      const hearts = await QuestionHeart.findAll({ where: { question_id: question.id } });
      expect(hearts).toHaveLength(1);

      const heartEmissions = io.getEmissions("game:heartQuestion:update");
      expect(heartEmissions.length).toBeGreaterThanOrEqual(1);
      expect(heartEmissions[0].data.count).toBe(1);
      expect(heartEmissions[0].data.hearted_by).toContain(hostPlayer.id);
    });

    test("toggles heart off when called again", async () => {
      const ctx = await setupQuestionSubmitPhase();
      const { room, hostPlayer, io } = ctx;
      const rt = getRoomRuntime(room.code);

      const question = await Question.create({
        room_id: room.id,
        round_id: rt.game.roundId,
        text: "토글 질문",
        answer_type: "free",
        submitted_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
        order_no: 1,
        is_used: false,
      });

      // First call: heart on
      await gameService.heartQuestion(io, {
        roomCode: room.code,
        playerId: hostPlayer.id,
        question_id: question.id,
      });

      // Second call: heart off (toggle)
      io.reset();
      await gameService.heartQuestion(io, {
        roomCode: room.code,
        playerId: hostPlayer.id,
        question_id: question.id,
      });

      const hearts = await QuestionHeart.findAll({ where: { question_id: question.id } });
      expect(hearts).toHaveLength(0);

      const heartEmissions = io.getEmissions("game:heartQuestion:update");
      expect(heartEmissions.length).toBeGreaterThanOrEqual(1);
      expect(heartEmissions[0].data.count).toBe(0);
    });

    test("does nothing if question_id is missing", async () => {
      const { room, hostPlayer } = await setupLobbyRoom();
      const io = createMockIo();

      await gameService.heartQuestion(io, {
        roomCode: room.code,
        playerId: hostPlayer.id,
        question_id: null,
      });

      // No emissions expected for heart update
      const heartEmissions = io.getEmissions("game:heartQuestion:update");
      expect(heartEmissions).toHaveLength(0);
    });
  });

  // =========================================================
  // 10. getGameStateForPlayer
  // =========================================================
  describe("getGameStateForPlayer", () => {
    test("returns null for lobby phase", async () => {
      const { room, hostPlayer } = await setupLobbyRoom();

      const state = await gameService.getGameStateForPlayer(room, hostPlayer.id);
      expect(state).toBeNull();
    });

    test("returns question_submit state with submission status", async () => {
      const { room, hostPlayer, playerB, io } = await setupQuestionSubmitPhase();
      const rt = getRoomRuntime(room.code);

      // Host submits a question
      await Question.create({
        room_id: room.id,
        round_id: rt.game.roundId,
        text: "내 질문",
        answer_type: "free",
        submitted_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
        order_no: 0,
        is_used: false,
      });

      const updatedRoom = await Room.findByPk(room.id);
      const hostState = await gameService.getGameStateForPlayer(updatedRoom, hostPlayer.id);
      expect(hostState.phase).toBe("question_submit");
      expect(hostState.question_submitted).toBe(true);
      expect(hostState.question_saved_text).toBe("내 질문");

      const playerBState = await gameService.getGameStateForPlayer(updatedRoom, playerB.id);
      expect(playerBState.phase).toBe("question_submit");
      expect(playerBState.question_submitted).toBe(false);
      expect(playerBState.question_saved_text).toBe("");
    });

    test("returns ask state with current question and answer status", async () => {
      const ctx = await setupAskPhase();
      const { room, hostPlayer, playerB, io } = ctx;

      let askRoom = await Room.findByPk(room.id);
      if (askRoom.phase !== "ask") {
        await askRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
      }

      const rt = getRoomRuntime(askRoom.code);
      const qid = rt.game.currentQuestionId;

      // Host answers
      await Answer.create({
        room_id: askRoom.id,
        round_id: rt.game.roundId,
        question_id: qid,
        text: "내 답변",
        answered_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
      });

      const hostState = await gameService.getGameStateForPlayer(askRoom, hostPlayer.id);
      expect(hostState.phase).toBe("ask");
      expect(hostState.current_question).toBeDefined();
      expect(hostState.answer_submitted).toBe(true);
      expect(hostState.answer_saved_text).toBe("내 답변");

      const playerBState = await gameService.getGameStateForPlayer(askRoom, playerB.id);
      expect(playerBState.answer_submitted).toBe(false);
      expect(playerBState.answer_saved_text).toBe("");
    });

    test("returns reveal state with question and answers", async () => {
      const ctx = await setupRevealPhase();
      const { room, hostPlayer, io } = ctx;

      let revealRoom = await Room.findByPk(room.id);
      if (revealRoom.phase !== "reveal") {
        await revealRoom.update({ phase: "reveal" });
      }

      const state = await gameService.getGameStateForPlayer(revealRoom, hostPlayer.id);
      expect(state.phase).toBe("reveal");
      expect(state.reveal).toBeDefined();
      expect(state.reveal.question).toBeDefined();
      expect(state.reveal.answers).toBeDefined();
      // deadline_at는 카드 까기 또는 감상 타이머 deadline (null이 아닐 수 있음)
      // reveal phase에서는 phase_deadline_at가 설정됨
    });

    test("returns round_end state with heart summary", async () => {
      const ctx = await setupQuestionSubmitPhase();
      const { room, hostPlayer, playerB, io } = ctx;
      const rt = getRoomRuntime(room.code);

      const question = await Question.create({
        room_id: room.id,
        round_id: rt.game.roundId,
        text: "좋은 질문",
        answer_type: "free",
        submitted_by_player_id: hostPlayer.id,
        submitted_at: new Date(),
        order_no: 1,
        is_used: false,
      });

      await QuestionHeart.create({ question_id: question.id, player_id: playerB.id });

      // Set room to round_end
      const updatedRoom = await Room.findByPk(room.id);
      await updatedRoom.update({ phase: "round_end", phase_deadline_at: null });

      const state = await gameService.getGameStateForPlayer(updatedRoom, hostPlayer.id);
      expect(state.phase).toBe("round_end");
      expect(state.round_end).toBeDefined();
      expect(state.round_end.heart_summary).toBeDefined();
      expect(state.round_end.heart_summary.length).toBeGreaterThanOrEqual(1);
      expect(state.round_end.heart_summary[0].text).toBe("좋은 질문");
      expect(state.round_end.heart_summary[0].hearts).toBe(1);
    });
  });

  // =========================================================
  // 11. broadcastRoom
  // =========================================================
  describe("broadcastRoom", () => {
    test("emits room:update with room and player data", async () => {
      const { room, hostPlayer, playerB } = await setupLobbyRoom();
      const io = createMockIo();

      await gameService.broadcastRoom(io, room.id);

      const updateEmissions = io.getEmissions("room:update");
      expect(updateEmissions.length).toBeGreaterThanOrEqual(1);

      const state = updateEmissions[0].data.state;
      expect(state.room.id).toBe(room.id);
      expect(state.room.code).toBe(room.code);
      expect(state.room.phase).toBe("lobby");
      expect(state.players).toHaveLength(2);
    });
  });

  // =========================================================
  // 12. hostNextRound
  // =========================================================
  describe("hostNextRound", () => {
    test("starts a new round from round_end phase", async () => {
      const { room, hostPlayer } = await setupLobbyRoom({
        phase: "round_end",
        status: "playing",
        current_round_no: 1,
      });
      const io = createMockIo();
      setGameRuntime(room.code, { roundId: "prev-round" });

      await gameService.hostNextRound(io, room.code, hostPlayer.id);

      const updatedRoom = await Room.findByPk(room.id);
      expect(updatedRoom.phase).toBe("question_submit");
      expect(updatedRoom.current_round_no).toBe(2);
    });

    test("throws if caller is not host", async () => {
      const { room, playerB } = await setupLobbyRoom({
        phase: "round_end",
        status: "playing",
      });
      const io = createMockIo();

      await expect(
        gameService.hostNextRound(io, room.code, playerB.id)
      ).rejects.toThrow("방장만 가능");
    });

    test("throws if phase is not round_end", async () => {
      const { room, hostPlayer } = await setupLobbyRoom({
        phase: "ask",
        status: "playing",
      });
      const io = createMockIo();

      await expect(
        gameService.hostNextRound(io, room.code, hostPlayer.id)
      ).rejects.toThrow("라운드 종료");
    });
  });

  // =========================================================
  // 13. editQuestion / editAnswer
  // =========================================================
  describe("editQuestion / editAnswer", () => {
    test("editQuestion tracks editing state in memory store", async () => {
      const { room, hostPlayer } = await setupLobbyRoom();

      await gameService.editQuestion(room.code, hostPlayer.id);

      const { getEditingCount } = require("../../../src/store/memoryStore");
      expect(getEditingCount(room.code, "question")).toBe(1);
    });

    test("editAnswer tracks editing state in memory store", async () => {
      const { room, hostPlayer } = await setupLobbyRoom();

      await gameService.editAnswer(room.code, hostPlayer.id);

      const { getEditingCount } = require("../../../src/store/memoryStore");
      expect(getEditingCount(room.code, "answer")).toBe(1);
    });
  });
});
