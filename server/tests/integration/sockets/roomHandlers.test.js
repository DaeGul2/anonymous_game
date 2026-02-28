// tests/integration/sockets/roomHandlers.test.js
const { syncTestDb, clearTestDb, closeTestDb } = require("../../helpers/testDb");
const { createUser, createRoomDirect, createPlayerDirect } = require("../../helpers/fixtures");
const { createMockIo } = require("../../helpers/mockIo");
const { _resetForTesting, attachSocket, touchRoom } = require("../../../src/store/memoryStore");
const { Room, Player } = require("../../../src/models");

const registerRoomHandlers = require("../../../src/sockets/roomHandlers");

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
// room:list
// ---------------------------------------------------------------------------
describe("room:list", () => {
  test("returns rooms list", async () => {
    // Seed a room so the list is non-empty
    const user = await createUser();
    const room = await createRoomDirect({ title: "Listed Room" });
    await createPlayerDirect(room.id, user.id);

    const mockIo = createMockIo();
    const socket = createTestSocket(user.id);
    registerRoomHandlers(mockIo, socket);

    await socket.listeners["room:list"]();

    const res = socket.getLastEmission("room:list:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);
    expect(Array.isArray(res.data.rooms)).toBe(true);
    expect(res.data.rooms.length).toBeGreaterThanOrEqual(1);
    expect(res.data.rooms[0].title).toBe("Listed Room");
  });
});

// ---------------------------------------------------------------------------
// room:create
// ---------------------------------------------------------------------------
describe("room:create", () => {
  test("creates room, emits room:create:res with ok:true, socket joins room", async () => {
    const user = await createUser();

    const mockIo = createMockIo();
    const socket = createTestSocket(user.id);
    registerRoomHandlers(mockIo, socket);

    await socket.listeners["room:create"]({
      title: "New Room",
      max_players: 6,
      nickname: "Host",
      avatar: 2,
    });

    const res = socket.getLastEmission("room:create:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);
    expect(res.data.state).toBeDefined();
    expect(res.data.state.room.title).toBe("New Room");
    expect(res.data.state.room.max_players).toBe(6);
    expect(res.data.state.players).toHaveLength(1);
    expect(res.data.state.players[0].nickname).toBe("Host");

    // socket.join should have been called with the room code
    expect(socket.join).toHaveBeenCalledWith(res.data.state.room.code);

    // io.to should have broadcast room:update
    expect(mockIo.to).toHaveBeenCalledWith(res.data.state.room.code);
  });

  test("fails without login (userId null)", async () => {
    const mockIo = createMockIo();
    const socket = createTestSocket(null);
    registerRoomHandlers(mockIo, socket);

    await socket.listeners["room:create"]({
      title: "Fail Room",
      max_players: 4,
      nickname: "Ghost",
      avatar: 0,
    });

    const res = socket.getLastEmission("room:create:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(false);
    expect(res.data.message).toContain("로그인");
  });
});

// ---------------------------------------------------------------------------
// room:join
// ---------------------------------------------------------------------------
describe("room:join", () => {
  test("joins existing room, emits room:join:res", async () => {
    const hostUser = await createUser();
    const { room, player: hostPlayer } = await createRoomViaService(hostUser);

    const joinerUser = await createUser();
    const mockIo = createMockIo();
    const socket = createTestSocket(joinerUser.id);
    registerRoomHandlers(mockIo, socket);

    await socket.listeners["room:join"]({
      code: room.code,
      nickname: "Joiner",
      avatar: 1,
    });

    const res = socket.getLastEmission("room:join:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);
    expect(res.data.state.players).toHaveLength(2);
    expect(socket.join).toHaveBeenCalledWith(room.code);
  });

  test("fails with wrong code", async () => {
    const user = await createUser();
    const mockIo = createMockIo();
    const socket = createTestSocket(user.id);
    registerRoomHandlers(mockIo, socket);

    await socket.listeners["room:join"]({
      code: "ZZZZZZ",
      nickname: "Nobody",
      avatar: 0,
    });

    const res = socket.getLastEmission("room:join:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(false);
    expect(res.data.message).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// room:ready
// ---------------------------------------------------------------------------
describe("room:ready", () => {
  test("toggles ready", async () => {
    const user = await createUser();
    const { room, player } = await createRoomViaService(user);

    const mockIo = createMockIo();
    const socket = createTestSocket(user.id);
    registerRoomHandlers(mockIo, socket);

    // Attach socket to memoryStore so getSocketSession works
    attachSocket({
      socketId: socket.id,
      userId: user.id,
      roomCode: room.code,
      playerId: player.id,
      roomId: room.id,
    });

    await socket.listeners["room:ready"]({ is_ready: true });

    const res = socket.getLastEmission("room:ready:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);
    expect(res.data.state.players[0].is_ready).toBe(true);
  });

  test("fails without session", async () => {
    const mockIo = createMockIo();
    const socket = createTestSocket(null);
    registerRoomHandlers(mockIo, socket);

    // Do NOT attach socket -- no session
    await socket.listeners["room:ready"]({ is_ready: true });

    const res = socket.getLastEmission("room:ready:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(false);
    expect(res.data.message).toContain("세션");
  });
});

// ---------------------------------------------------------------------------
// room:leave
// ---------------------------------------------------------------------------
describe("room:leave", () => {
  test("leaves room, emits room:leave:res", async () => {
    const hostUser = await createUser();
    const { room, player: hostPlayer } = await createRoomViaService(hostUser);

    const joinerUser = await createUser();
    const { joinRoom } = require("../../../src/services/roomService");
    const { player: joinerPlayer } = await joinRoom({
      code: room.code,
      nickname: "Joiner",
      user_id: joinerUser.id,
      avatar: 0,
    });

    const mockIo = createMockIo();
    const socket = createTestSocket(joinerUser.id);
    registerRoomHandlers(mockIo, socket);

    // Attach joiner socket to memoryStore
    attachSocket({
      socketId: socket.id,
      userId: joinerUser.id,
      roomCode: room.code,
      playerId: joinerPlayer.id,
      roomId: room.id,
    });

    await socket.listeners["room:leave"]();

    const res = socket.getLastEmission("room:leave:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);
    expect(res.data.left).toBe(true);
    expect(socket.leave).toHaveBeenCalledWith(room.code);
  });

  test("when last person leaves, emits room:destroyed", async () => {
    const user = await createUser();
    const { room, player } = await createRoomViaService(user);

    const mockIo = createMockIo();
    const socket = createTestSocket(user.id);
    registerRoomHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: user.id,
      roomCode: room.code,
      playerId: player.id,
      roomId: room.id,
    });

    await socket.listeners["room:leave"]();

    const res = socket.getLastEmission("room:leave:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);

    // io.to should have emitted room:destroyed
    const toReturn = mockIo.to(room.code);
    expect(mockIo.to).toHaveBeenCalledWith(room.code);

    // Room should be deleted from DB
    const deleted = await Room.findByPk(room.id);
    expect(deleted).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// room:rejoin
// ---------------------------------------------------------------------------
describe("room:rejoin", () => {
  test("reconnects player", async () => {
    const hostUser = await createUser();
    const { room, player } = await createRoomViaService(hostUser);

    // Mark player as disconnected
    player.is_connected = false;
    await player.save();

    const mockIo = createMockIo();
    const socket = createTestSocket(hostUser.id);
    registerRoomHandlers(mockIo, socket);

    await socket.listeners["room:rejoin"]({ code: room.code });

    const res = socket.getLastEmission("room:rejoin:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);
    expect(res.data.state).toBeDefined();
    expect(res.data.state.room.code).toBe(room.code);
    expect(socket.join).toHaveBeenCalledWith(room.code);

    // Player should now be connected again
    const updated = await Player.findByPk(player.id);
    expect(updated.is_connected).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// room:updatePassword
// ---------------------------------------------------------------------------
describe("room:updatePassword", () => {
  test("host updates password", async () => {
    const user = await createUser();
    const { room, player } = await createRoomViaService(user);

    const mockIo = createMockIo();
    const socket = createTestSocket(user.id);
    registerRoomHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: user.id,
      roomCode: room.code,
      playerId: player.id,
      roomId: room.id,
    });

    await socket.listeners["room:updatePassword"]({ password: "1234" });

    const res = socket.getLastEmission("room:updatePassword:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(true);

    // Verify DB
    const updated = await Room.findByPk(room.id);
    expect(updated.has_password).toBe(true);
    expect(updated.password_hash).toBeTruthy();
  });

  test("non-host fails", async () => {
    const hostUser = await createUser();
    const { room, player: hostPlayer } = await createRoomViaService(hostUser);

    const joinerUser = await createUser();
    const { joinRoom } = require("../../../src/services/roomService");
    const { player: joinerPlayer } = await joinRoom({
      code: room.code,
      nickname: "Joiner",
      user_id: joinerUser.id,
      avatar: 0,
    });

    const mockIo = createMockIo();
    const socket = createTestSocket(joinerUser.id);
    registerRoomHandlers(mockIo, socket);

    attachSocket({
      socketId: socket.id,
      userId: joinerUser.id,
      roomCode: room.code,
      playerId: joinerPlayer.id,
      roomId: room.id,
    });

    await socket.listeners["room:updatePassword"]({ password: "5678" });

    const res = socket.getLastEmission("room:updatePassword:res");
    expect(res).toBeDefined();
    expect(res.data.ok).toBe(false);
    expect(res.data.message).toContain("방장");
  });
});

// ---------------------------------------------------------------------------
// Helper: create a room via the actual service (for realistic setup)
// ---------------------------------------------------------------------------
async function createRoomViaService(user) {
  const { createRoom } = require("../../../src/services/roomService");
  const { room, player } = await createRoom({
    title: "Test Room",
    max_players: 8,
    hostNickname: "Host",
    user_id: user.id,
    avatar: 0,
  });
  touchRoom(room.code, room.id);
  return { room, player };
}
