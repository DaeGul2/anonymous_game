// tests/integration/sockets/systemHandlers.test.js
const { syncTestDb, clearTestDb, closeTestDb } = require("../../helpers/testDb");
const { createUser } = require("../../helpers/fixtures");
const { createMockIo } = require("../../helpers/mockIo");
const {
  _resetForTesting,
  attachSocket,
  touchRoom,
  addEditing,
  getEditingCount,
  getSocketSession,
  getRoomRuntime,
} = require("../../../src/store/memoryStore");
const { Player } = require("../../../src/models");

const registerSystemHandlers = require("../../../src/sockets/systemHandlers");

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
// ping
// ---------------------------------------------------------------------------
describe("ping", () => {
  test("responds with pong and timestamp", () => {
    const mockIo = createMockIo();
    const socket = createTestSocket(null);
    registerSystemHandlers(mockIo, socket);

    const before = Date.now();
    socket.listeners["ping"]();
    const after = Date.now();

    const res = socket.getLastEmission("pong");
    expect(res).toBeDefined();
    expect(res.data.ts).toBeGreaterThanOrEqual(before);
    expect(res.data.ts).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
// disconnect
// ---------------------------------------------------------------------------
describe("disconnect", () => {
  test("calls markDisconnected for connected player", async () => {
    const user = await createUser();
    const { createRoom } = require("../../../src/services/roomService");
    const { room, player } = await createRoom({
      title: "Disconnect Room",
      max_players: 8,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
    });
    touchRoom(room.code, room.id);

    const mockIo = createMockIo();
    const socket = createTestSocket(user.id);
    registerSystemHandlers(mockIo, socket);

    // Attach the socket so getSocketSession will find it
    attachSocket({
      socketId: socket.id,
      userId: user.id,
      roomCode: room.code,
      playerId: player.id,
      roomId: room.id,
    });

    // Trigger disconnect
    await socket.listeners["disconnect"]("transport close");

    // Socket session should be detached
    const sess = getSocketSession(socket.id);
    expect(sess).toBeNull();

    // Player should be marked as disconnected
    const updated = await Player.findByPk(player.id);
    expect(updated.is_connected).toBe(false);
  });

  test("does nothing for unknown socket", async () => {
    const mockIo = createMockIo();
    const socket = createTestSocket(null);
    registerSystemHandlers(mockIo, socket);

    // Do NOT attach -- unknown socket
    // Should not throw
    await socket.listeners["disconnect"]("transport close");

    const sess = getSocketSession(socket.id);
    expect(sess).toBeNull();
  });

  test("removes editing state on disconnect", async () => {
    const user = await createUser();
    const { createRoom } = require("../../../src/services/roomService");
    const { room, player } = await createRoom({
      title: "Edit Room",
      max_players: 8,
      hostNickname: "Editor",
      user_id: user.id,
      avatar: 0,
    });
    touchRoom(room.code, room.id);

    const mockIo = createMockIo();
    const socket = createTestSocket(user.id);
    registerSystemHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: user.id,
      roomCode: room.code,
      playerId: player.id,
      roomId: room.id,
    });

    // Add editing state
    addEditing(room.code, "question", player.id);
    addEditing(room.code, "answer", player.id);
    expect(getEditingCount(room.code, "question")).toBe(1);
    expect(getEditingCount(room.code, "answer")).toBe(1);

    // Trigger disconnect
    await socket.listeners["disconnect"]("transport close");

    // Editing state should be cleared for this player
    expect(getEditingCount(room.code, "question")).toBe(0);
    expect(getEditingCount(room.code, "answer")).toBe(0);
  });
});
