// tests/integration/sockets/gameHandlers.test.js
const { syncTestDb, clearTestDb, closeTestDb } = require("../../helpers/testDb");
const { createUser } = require("../../helpers/fixtures");
const { createMockIo } = require("../../helpers/mockIo");
const {
  _resetForTesting,
  attachSocket,
  touchRoom,
  setGameRuntime,
} = require("../../../src/store/memoryStore");
const { Room, Player, Round, Question, Answer, QuestionHeart } = require("../../../src/models");

// Mock aiService before requiring gameHandlers (it imports gameService which imports aiService)
jest.mock("../../../src/services/aiService", () => ({
  generateAIQuestion: jest.fn().mockResolvedValue({ text: "AI질문", answer_type: "free" }),
  generateAIAnswer: jest.fn().mockResolvedValue("AI답변"),
}));

const registerGameHandlers = require("../../../src/sockets/gameHandlers");

// ---------------------------------------------------------------------------
// Helper: create a test socket that captures registered event listeners
// ---------------------------------------------------------------------------
function createTestSocket(userId) {
  const listeners = {};
  const emitted = [];
  const socket = {
    id: `sock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    request: { session: { passport: { user: userId } } },
    on(event, handler) {
      listeners[event] = handler;
    },
    emit: jest.fn((event, data) => {
      emitted.push({ event, data });
    }),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    emitted,
    listeners,
    getLastEmission(event) {
      return emitted.filter((e) => e.event === event).pop();
    },
  };
  return socket;
}

// ---------------------------------------------------------------------------
// Helper: create a room with ready players via real services
// ---------------------------------------------------------------------------
async function createRoomWithReadyPlayers(hostUser, joinerUser) {
  const { createRoom, joinRoom, setReady } = require("../../../src/services/roomService");

  const { room, player: hostPlayer } = await createRoom({
    title: "Game Room",
    max_players: 8,
    hostNickname: "Host",
    user_id: hostUser.id,
    avatar: 0,
  });
  touchRoom(room.code, room.id);

  const { player: joinerPlayer } = await joinRoom({
    code: room.code,
    nickname: "Player2",
    user_id: joinerUser.id,
    avatar: 1,
  });

  await setReady({ roomId: room.id, playerId: hostPlayer.id, is_ready: true });
  await setReady({ roomId: room.id, playerId: joinerPlayer.id, is_ready: true });

  return { room, hostPlayer, joinerPlayer };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
beforeAll(async () => {
  await syncTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  _resetForTesting();
});

afterAll(async () => {
  await closeTestDb();
});

// ---------------------------------------------------------------------------
// game:start
// ---------------------------------------------------------------------------
describe("game:start", () => {
  test("host starts game with ready players", async () => {
    const hostUser = await createUser();
    const joinerUser = await createUser();
    const { room, hostPlayer } = await createRoomWithReadyPlayers(hostUser, joinerUser);

    const mockIo = createMockIo();
    const socket = createTestSocket(hostUser.id);
    registerGameHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: hostUser.id,
      roomCode: room.code,
      playerId: hostPlayer.id,
      roomId: room.id,
    });

    await socket.listeners["game:start"]();

    const res = socket.getLastEmission("game:start:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);

    // Verify room moved to playing / question_submit
    const updatedRoom = await Room.findByPk(room.id);
    expect(updatedRoom.status).toBe("playing");
    expect(updatedRoom.phase).toBe("question_submit");
    expect(updatedRoom.current_round_no).toBe(1);
  });

  test("fails without session", async () => {
    const mockIo = createMockIo();
    const socket = createTestSocket(null);
    registerGameHandlers(mockIo, socket);

    // No attachSocket -- no session
    await socket.listeners["game:start"]();

    const res = socket.getLastEmission("game:start:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(false);
    expect(res.data.message).toContain("세션");
  });
});

// ---------------------------------------------------------------------------
// game:submitQuestion
// ---------------------------------------------------------------------------
describe("game:submitQuestion", () => {
  test("submits question during question_submit phase", async () => {
    const hostUser = await createUser();
    const joinerUser = await createUser();
    const { room, hostPlayer, joinerPlayer } = await createRoomWithReadyPlayers(hostUser, joinerUser);

    // Start the game to enter question_submit phase
    const { hostStartGame } = require("../../../src/services/gameService");
    const startIo = createMockIo();

    // Attach host socket for game start
    const hostSocketId = `host_sock_${Date.now()}`;
    attachSocket({
      socketId: hostSocketId,
      userId: hostUser.id,
      roomCode: room.code,
      playerId: hostPlayer.id,
      roomId: room.id,
    });

    await hostStartGame(startIo, room.code, hostPlayer.id);

    // Now register game handlers for joiner
    const mockIo = createMockIo();
    const socket = createTestSocket(joinerUser.id);
    registerGameHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: joinerUser.id,
      roomCode: room.code,
      playerId: joinerPlayer.id,
      roomId: room.id,
    });

    await socket.listeners["game:submitQuestion"]({
      text: "What is your favorite color?",
      answer_type: "free",
    });

    const res = socket.getLastEmission("game:submitQuestion:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);

    // Verify question was saved in DB
    const questions = await Question.findAll({
      where: { submitted_by_player_id: joinerPlayer.id },
    });
    expect(questions).toHaveLength(1);
    expect(questions[0].text).toBe("What is your favorite color?");
  });
});

// ---------------------------------------------------------------------------
// game:submitAnswer
// ---------------------------------------------------------------------------
describe("game:submitAnswer", () => {
  test("submits answer during ask phase", async () => {
    const hostUser = await createUser();
    const joinerUser = await createUser();
    const { room, hostPlayer, joinerPlayer } = await createRoomWithReadyPlayers(hostUser, joinerUser);

    // Start game and advance to ask phase
    const { hostStartGame, submitQuestion, endQuestionSubmit } = require("../../../src/services/gameService");
    const svcIo = createMockIo();

    attachSocket({
      socketId: `host_sock_${Date.now()}`,
      userId: hostUser.id,
      roomCode: room.code,
      playerId: hostPlayer.id,
      roomId: room.id,
    });

    await hostStartGame(svcIo, room.code, hostPlayer.id);

    // Both players submit questions
    await submitQuestion(svcIo, { roomCode: room.code, playerId: hostPlayer.id, text: "Q1", answer_type: "free" });
    await submitQuestion(svcIo, { roomCode: room.code, playerId: joinerPlayer.id, text: "Q2", answer_type: "free" });

    // If auto-advance didn't happen (endQuestionSubmit may already have fired), force it
    const roomAfterQ = await Room.findByPk(room.id);
    if (roomAfterQ.phase === "question_submit") {
      await endQuestionSubmit(svcIo, room.code);
    }

    // Room should now be in ask phase
    const roomAsk = await Room.findByPk(room.id);
    expect(roomAsk.phase).toBe("ask");

    // Now test submitAnswer via socket handler
    const mockIo = createMockIo();
    const socket = createTestSocket(joinerUser.id);
    registerGameHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: joinerUser.id,
      roomCode: room.code,
      playerId: joinerPlayer.id,
      roomId: room.id,
    });

    await socket.listeners["game:submitAnswer"]({ text: "Blue" });

    const res = socket.getLastEmission("game:submitAnswer:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);

    // Verify answer was saved
    const answers = await Answer.findAll({
      where: { answered_by_player_id: joinerPlayer.id },
    });
    expect(answers).toHaveLength(1);
    expect(answers[0].text).toBe("Blue");
  });
});

// ---------------------------------------------------------------------------
// game:hostRevealNext
// ---------------------------------------------------------------------------
describe("game:hostRevealNext", () => {
  test("host advances from reveal", async () => {
    const hostUser = await createUser();
    const joinerUser = await createUser();
    const { room, hostPlayer, joinerPlayer } = await createRoomWithReadyPlayers(hostUser, joinerUser);

    // Fully advance to reveal phase
    const { hostStartGame, submitQuestion, endQuestionSubmit, submitAnswer, endAnswer } =
      require("../../../src/services/gameService");
    const svcIo = createMockIo();

    attachSocket({
      socketId: `host_sock_${Date.now()}`,
      userId: hostUser.id,
      roomCode: room.code,
      playerId: hostPlayer.id,
      roomId: room.id,
    });

    await hostStartGame(svcIo, room.code, hostPlayer.id);
    await submitQuestion(svcIo, { roomCode: room.code, playerId: hostPlayer.id, text: "Q1", answer_type: "free" });
    await submitQuestion(svcIo, { roomCode: room.code, playerId: joinerPlayer.id, text: "Q2", answer_type: "free" });

    const roomAfterQ = await Room.findByPk(room.id);
    if (roomAfterQ.phase === "question_submit") {
      await endQuestionSubmit(svcIo, room.code);
    }

    // Wait for ask phase to stabilize
    let roomAsk = await Room.findByPk(room.id);
    expect(roomAsk.phase).toBe("ask");

    await submitAnswer(svcIo, { roomCode: room.code, playerId: hostPlayer.id, text: "A1" });
    await submitAnswer(svcIo, { roomCode: room.code, playerId: joinerPlayer.id, text: "A2" });

    // Should be in reveal now (or preparing_reveal -> reveal)
    let roomReveal = await Room.findByPk(room.id);
    if (roomReveal.phase === "ask") {
      await endAnswer(svcIo, room.code);
      roomReveal = await Room.findByPk(room.id);
    }
    expect(roomReveal.phase).toBe("reveal");

    // Now test hostRevealNext via socket handler
    const mockIo = createMockIo();
    const socket = createTestSocket(hostUser.id);
    registerGameHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: hostUser.id,
      roomCode: room.code,
      playerId: hostPlayer.id,
      roomId: room.id,
    });

    await socket.listeners["game:hostRevealNext"]();

    const res = socket.getLastEmission("game:hostRevealNext:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);

    // Phase should have advanced (either to next question's ask, or round_end)
    const roomAfter = await Room.findByPk(room.id);
    expect(["ask", "round_end"]).toContain(roomAfter.phase);
  });
});

// ---------------------------------------------------------------------------
// game:hostEndGame
// ---------------------------------------------------------------------------
describe("game:hostEndGame", () => {
  test("host ends game", async () => {
    const hostUser = await createUser();
    const joinerUser = await createUser();
    const { room, hostPlayer } = await createRoomWithReadyPlayers(hostUser, joinerUser);

    // Start the game first
    const { hostStartGame } = require("../../../src/services/gameService");
    const svcIo = createMockIo();

    attachSocket({
      socketId: `host_sock_${Date.now()}`,
      userId: hostUser.id,
      roomCode: room.code,
      playerId: hostPlayer.id,
      roomId: room.id,
    });

    await hostStartGame(svcIo, room.code, hostPlayer.id);

    // Now end game via socket handler
    const mockIo = createMockIo();
    const socket = createTestSocket(hostUser.id);
    registerGameHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: hostUser.id,
      roomCode: room.code,
      playerId: hostPlayer.id,
      roomId: room.id,
    });

    await socket.listeners["game:hostEndGame"]();

    const res = socket.getLastEmission("game:hostEndGame:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);

    // Room should be back in lobby
    const updatedRoom = await Room.findByPk(room.id);
    expect(updatedRoom.status).toBe("lobby");
    expect(updatedRoom.phase).toBe("lobby");

    // All players should have is_ready reset to false
    const players = await Player.findAll({ where: { room_id: room.id } });
    expect(players.every((p) => p.is_ready === false)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// game:reaction
// ---------------------------------------------------------------------------
describe("game:reaction", () => {
  test("broadcasts reaction emoji", async () => {
    const user = await createUser();
    const { createRoom } = require("../../../src/services/roomService");
    const { room, player } = await createRoom({
      title: "Reaction Room",
      max_players: 8,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
    });
    touchRoom(room.code, room.id);

    const mockIo = createMockIo();
    const socket = createTestSocket(user.id);
    registerGameHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: user.id,
      roomCode: room.code,
      playerId: player.id,
      roomId: room.id,
    });

    // game:reaction is synchronous (no async)
    socket.listeners["game:reaction"]({ emoji: "thumbsup", text: "" });

    // Should broadcast to the room
    expect(mockIo.to).toHaveBeenCalledWith(room.code);
    const toReturn = mockIo.to(room.code);
    expect(toReturn.emit).toHaveBeenCalledWith(
      "game:reaction:broadcast",
      expect.objectContaining({
        ok: true,
        emoji: "thumbsup",
      })
    );
  });
});

// ---------------------------------------------------------------------------
// game:heartQuestion
// ---------------------------------------------------------------------------
describe("game:heartQuestion", () => {
  test("toggles heart on a question", async () => {
    const hostUser = await createUser();
    const joinerUser = await createUser();
    const { room, hostPlayer, joinerPlayer } = await createRoomWithReadyPlayers(hostUser, joinerUser);

    // Start game and create a question
    const { hostStartGame, submitQuestion } = require("../../../src/services/gameService");
    const svcIo = createMockIo();

    attachSocket({
      socketId: `host_sock_${Date.now()}`,
      userId: hostUser.id,
      roomCode: room.code,
      playerId: hostPlayer.id,
      roomId: room.id,
    });

    await hostStartGame(svcIo, room.code, hostPlayer.id);
    await submitQuestion(svcIo, {
      roomCode: room.code,
      playerId: hostPlayer.id,
      text: "Heartable Q",
      answer_type: "free",
    });

    // Get the question
    const question = await Question.findOne({
      where: { submitted_by_player_id: hostPlayer.id },
    });
    expect(question).not.toBeNull();

    // Now test heart via socket handler
    const mockIo = createMockIo();
    const socket = createTestSocket(joinerUser.id);
    registerGameHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: joinerUser.id,
      roomCode: room.code,
      playerId: joinerPlayer.id,
      roomId: room.id,
    });

    await socket.listeners["game:heartQuestion"]({ question_id: question.id });

    // Verify heart was created in DB
    const hearts = await QuestionHeart.findAll({
      where: { question_id: question.id, player_id: joinerPlayer.id },
    });
    expect(hearts).toHaveLength(1);

    // io.to should have broadcast heart update
    expect(mockIo.to).toHaveBeenCalledWith(room.code);

    // Toggle off: heart again
    await socket.listeners["game:heartQuestion"]({ question_id: question.id });

    const heartsAfter = await QuestionHeart.findAll({
      where: { question_id: question.id, player_id: joinerPlayer.id },
    });
    expect(heartsAfter).toHaveLength(0);
  });
});
