// tests/e2e/fullGameFlow.test.js — 전체 게임 라이프사이클 E2E 테스트

jest.mock("../../src/services/aiService", () => ({
  generateAIQuestion: jest.fn().mockResolvedValue({ text: "AI질문", answer_type: "free" }),
  generateAIAnswer: jest.fn().mockResolvedValue("AI답변"),
}));

const { syncTestDb, clearTestDb, closeTestDb } = require("../helpers/testDb");
const { createUser } = require("../helpers/fixtures");
const { createMockIo } = require("../helpers/mockIo");
const { createRoom, joinRoom, setReady } = require("../../src/services/roomService");
const { hostStartGame, submitQuestion, submitAnswer, hostRevealNext, hostEndGame, heartQuestion } = require("../../src/services/gameService");
const { setGameRuntime, getRoomRuntime, _resetForTesting } = require("../../src/store/memoryStore");
const { Room, Player, Round, Question, Answer, QuestionHeart } = require("../../src/models");

beforeAll(async () => { await syncTestDb(); });

beforeEach(async () => {
  jest.useFakeTimers({ legacyFakeTimers: true });
  await clearTestDb();
  _resetForTesting();
});

afterEach(() => { jest.useRealTimers(); });

afterAll(async () => { await closeTestDb(); });

// ===== 헬퍼 =====

/** 2명의 유저 생성 + 방 생성 + 입장 + 모두 준비 → lobby 상태 반환 */
async function setupReadyLobby() {
  const userA = await createUser({ display_name: "Alice" });
  const userB = await createUser({ display_name: "Bob" });

  const { room, player: hostPlayer } = await createRoom({
    title: "E2E 방",
    max_players: 8,
    hostNickname: "Alice",
    user_id: userA.id,
    avatar: 0,
  });

  const { player: playerB } = await joinRoom({
    code: room.code,
    nickname: "Bob",
    user_id: userB.id,
    avatar: 1,
  });

  // 방장은 is_ready 안 해도 되지만, setReady 는 가능
  await setReady({ roomId: room.id, playerId: hostPlayer.id, is_ready: true });
  await setReady({ roomId: room.id, playerId: playerB.id, is_ready: true });

  return { userA, userB, room, hostPlayer, playerB };
}

/** reveal 단계까지 한 번에 진행하는 헬퍼 (question → answer → reveal) */
async function advanceToReveal(io, room, hostPlayer, playerB) {
  // 질문 제출 (2명 전원 → 자동 endQuestionSubmit → ask phase)
  await submitQuestion(io, { roomCode: room.code, playerId: hostPlayer.id, text: "Q-from-host", answer_type: "free" });
  await submitQuestion(io, { roomCode: room.code, playerId: playerB.id, text: "Q-from-B", answer_type: "yesno" });

  // ask phase 확인 및 답변
  let askRoom = await Room.findByPk(room.id);
  if (askRoom.phase !== "ask") {
    await askRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
  }

  await submitAnswer(io, { roomCode: askRoom.code, playerId: hostPlayer.id, text: "A-from-host" });

  // 재조회 (첫 답변으로 자동 진행됐을 수 있음)
  askRoom = await Room.findByPk(room.id);
  if (askRoom.phase === "ask") {
    await submitAnswer(io, { roomCode: askRoom.code, playerId: playerB.id, text: "A-from-B" });
  }

  // reveal phase 확인
  const revealRoom = await Room.findByPk(room.id);
  if (revealRoom.phase !== "reveal") {
    await revealRoom.update({ phase: "reveal" });
  }

  return revealRoom;
}

// =========================================================
// 1. Full game cycle
// =========================================================
describe("Full game lifecycle", () => {
  test("create → join → ready → start → question → answer → reveal → next → end → lobby", async () => {
    const { room, hostPlayer, playerB } = await setupReadyLobby();
    const io = createMockIo();

    // --- 게임 시작 ---
    await hostStartGame(io, room.code, hostPlayer.id);
    let currentRoom = await Room.findByPk(room.id);
    expect(currentRoom.status).toBe("playing");
    expect(currentRoom.phase).toBe("question_submit");
    expect(currentRoom.current_round_no).toBe(1);

    // --- 질문 제출 (2명 전원 → 자동 ask) ---
    await submitQuestion(io, { roomCode: room.code, playerId: hostPlayer.id, text: "질문A", answer_type: "free" });
    await submitQuestion(io, { roomCode: room.code, playerId: playerB.id, text: "질문B", answer_type: "yesno" });

    currentRoom = await Room.findByPk(room.id);
    expect(["ask", "preparing_ask"]).toContain(currentRoom.phase);

    // ask phase 보장
    if (currentRoom.phase !== "ask") {
      await currentRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
    }

    // --- 답변 제출 (2명 전원 → 자동 reveal) ---
    await submitAnswer(io, { roomCode: currentRoom.code, playerId: hostPlayer.id, text: "답변A" });

    currentRoom = await Room.findByPk(room.id);
    if (currentRoom.phase === "ask") {
      await submitAnswer(io, { roomCode: currentRoom.code, playerId: playerB.id, text: "답변B" });
    }

    currentRoom = await Room.findByPk(room.id);
    expect(["reveal", "preparing_reveal"]).toContain(currentRoom.phase);

    // reveal 보장
    if (currentRoom.phase !== "reveal") {
      await currentRoom.update({ phase: "reveal" });
    }

    // --- reveal → 방장이 다음 질문으로 (또는 round_end) ---
    await hostRevealNext(io, currentRoom.code, hostPlayer.id);

    currentRoom = await Room.findByPk(room.id);
    // 질문 2개이므로 아직 ask 가 올 수도, 1개만 남았으면 round_end
    const phaseAfterFirst = currentRoom.phase;
    expect(["ask", "round_end"]).toContain(phaseAfterFirst);

    // 두 번째 질문이 있는 경우 마저 진행
    if (phaseAfterFirst === "ask") {
      await submitAnswer(io, { roomCode: currentRoom.code, playerId: hostPlayer.id, text: "답변C" });
      currentRoom = await Room.findByPk(room.id);
      if (currentRoom.phase === "ask") {
        await submitAnswer(io, { roomCode: currentRoom.code, playerId: playerB.id, text: "답변D" });
      }
      currentRoom = await Room.findByPk(room.id);
      if (currentRoom.phase !== "reveal") {
        await currentRoom.update({ phase: "reveal" });
      }
      await hostRevealNext(io, currentRoom.code, hostPlayer.id);
      currentRoom = await Room.findByPk(room.id);
    }

    expect(currentRoom.phase).toBe("round_end");

    // --- 게임 종료 → 로비 복귀 ---
    await hostEndGame(io, currentRoom.code, hostPlayer.id);

    currentRoom = await Room.findByPk(room.id);
    expect(currentRoom.status).toBe("lobby");
    expect(currentRoom.phase).toBe("lobby");

    // 모든 플레이어 ready 해제
    const players = await Player.findAll({ where: { room_id: room.id } });
    for (const p of players) {
      expect(p.is_ready).toBe(false);
    }
  });
});

// =========================================================
// 2. Heart during reveal
// =========================================================
describe("Heart during reveal", () => {
  test("heartQuestion toggles on/off during reveal phase", async () => {
    const { room, hostPlayer, playerB } = await setupReadyLobby();
    const io = createMockIo();

    await hostStartGame(io, room.code, hostPlayer.id);

    // 질문 제출 → ask → 답변 → reveal
    await advanceToReveal(io, room, hostPlayer, playerB);

    // 현재 질문 ID 가져오기
    const rt = getRoomRuntime(room.code);
    const questionId = rt.game.currentQuestionId;
    expect(questionId).toBeDefined();

    io.reset();

    // 하트 추가
    await heartQuestion(io, { roomCode: room.code, playerId: playerB.id, question_id: questionId });
    let hearts = await QuestionHeart.findAll({ where: { question_id: questionId } });
    expect(hearts).toHaveLength(1);

    let heartEmissions = io.getEmissions("game:heartQuestion:update");
    expect(heartEmissions.length).toBeGreaterThanOrEqual(1);
    expect(heartEmissions[heartEmissions.length - 1].data.count).toBe(1);

    // 하트 토글 (제거)
    io.reset();
    await heartQuestion(io, { roomCode: room.code, playerId: playerB.id, question_id: questionId });
    hearts = await QuestionHeart.findAll({ where: { question_id: questionId } });
    expect(hearts).toHaveLength(0);

    heartEmissions = io.getEmissions("game:heartQuestion:update");
    expect(heartEmissions.length).toBeGreaterThanOrEqual(1);
    expect(heartEmissions[heartEmissions.length - 1].data.count).toBe(0);
  });
});

// =========================================================
// 3. Multi-round
// =========================================================
describe("Multi-round game", () => {
  test("playing 2 rounds increments round_no correctly", async () => {
    const { room, hostPlayer, playerB } = await setupReadyLobby();
    const io = createMockIo();

    // ===== 라운드 1 =====
    await hostStartGame(io, room.code, hostPlayer.id);
    let currentRoom = await Room.findByPk(room.id);
    expect(currentRoom.current_round_no).toBe(1);

    // 질문 → 답변 → reveal → round_end 까지
    await advanceToReveal(io, room, hostPlayer, playerB);

    // reveal에서 모든 질문 소진 → round_end
    currentRoom = await Room.findByPk(room.id);
    if (currentRoom.phase === "reveal") {
      await hostRevealNext(io, currentRoom.code, hostPlayer.id);
      currentRoom = await Room.findByPk(room.id);
    }

    // 두 번째 질문이 남아있으면 마저 진행
    while (currentRoom.phase === "ask" || currentRoom.phase === "reveal") {
      if (currentRoom.phase === "ask") {
        await submitAnswer(io, { roomCode: currentRoom.code, playerId: hostPlayer.id, text: "R1-extra-A" });
        currentRoom = await Room.findByPk(room.id);
        if (currentRoom.phase === "ask") {
          await submitAnswer(io, { roomCode: currentRoom.code, playerId: playerB.id, text: "R1-extra-B" });
          currentRoom = await Room.findByPk(room.id);
        }
      }
      if (currentRoom.phase !== "reveal") {
        await currentRoom.update({ phase: "reveal" });
      }
      if (currentRoom.phase === "reveal") {
        await hostRevealNext(io, currentRoom.code, hostPlayer.id);
        currentRoom = await Room.findByPk(room.id);
      }
    }

    expect(currentRoom.phase).toBe("round_end");

    // 라운드 1 종료 확인
    const round1 = await Round.findOne({ where: { room_id: room.id, round_no: 1 } });
    expect(round1).toBeDefined();
    expect(round1.ended_at).not.toBeNull();

    // ===== 라운드 2 =====
    // hostNextRound 대신 hostEndGame 후 다시 시작할 수도 있지만,
    // hostNextRound 를 사용하여 라운드 2 시작
    const { hostNextRound } = require("../../src/services/gameService");
    await hostNextRound(io, currentRoom.code, hostPlayer.id);

    currentRoom = await Room.findByPk(room.id);
    expect(currentRoom.current_round_no).toBe(2);
    expect(currentRoom.phase).toBe("question_submit");

    // 라운드 2 질문 → 답변 → reveal → round_end
    await submitQuestion(io, { roomCode: currentRoom.code, playerId: hostPlayer.id, text: "R2-질문A", answer_type: "free" });
    await submitQuestion(io, { roomCode: currentRoom.code, playerId: playerB.id, text: "R2-질문B", answer_type: "free" });

    currentRoom = await Room.findByPk(room.id);
    if (currentRoom.phase !== "ask") {
      await currentRoom.update({ phase: "ask", phase_deadline_at: new Date(Date.now() + 60000) });
    }

    await submitAnswer(io, { roomCode: currentRoom.code, playerId: hostPlayer.id, text: "R2-답A" });
    currentRoom = await Room.findByPk(room.id);
    if (currentRoom.phase === "ask") {
      await submitAnswer(io, { roomCode: currentRoom.code, playerId: playerB.id, text: "R2-답B" });
    }

    currentRoom = await Room.findByPk(room.id);
    if (currentRoom.phase !== "reveal") {
      await currentRoom.update({ phase: "reveal" });
    }

    // 모든 질문 소진할 때까지 reveal → next 반복
    while (currentRoom.phase !== "round_end") {
      if (currentRoom.phase === "reveal") {
        await hostRevealNext(io, currentRoom.code, hostPlayer.id);
      } else if (currentRoom.phase === "ask") {
        await submitAnswer(io, { roomCode: currentRoom.code, playerId: hostPlayer.id, text: "R2-extra-A" });
        currentRoom = await Room.findByPk(room.id);
        if (currentRoom.phase === "ask") {
          await submitAnswer(io, { roomCode: currentRoom.code, playerId: playerB.id, text: "R2-extra-B" });
        }
        currentRoom = await Room.findByPk(room.id);
        if (currentRoom.phase !== "reveal" && currentRoom.phase !== "round_end") {
          await currentRoom.update({ phase: "reveal" });
        }
      } else {
        break;
      }
      currentRoom = await Room.findByPk(room.id);
    }

    expect(currentRoom.phase).toBe("round_end");
    expect(currentRoom.current_round_no).toBe(2);

    // 라운드 2 종료 확인
    const round2 = await Round.findOne({ where: { room_id: room.id, round_no: 2 } });
    expect(round2).toBeDefined();
    expect(round2.ended_at).not.toBeNull();

    // 게임 종료 → 로비 복귀
    await hostEndGame(io, currentRoom.code, hostPlayer.id);
    currentRoom = await Room.findByPk(room.id);
    expect(currentRoom.status).toBe("lobby");
    expect(currentRoom.phase).toBe("lobby");
  });
});
