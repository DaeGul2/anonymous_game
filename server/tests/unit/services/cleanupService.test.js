const { syncTestDb, clearTestDb, closeTestDb } = require("../../helpers/testDb");
const { createUser, createRoomDirect, createPlayerDirect } = require("../../helpers/fixtures");
const { createMockIo } = require("../../helpers/mockIo");
const { touchRoomByCode, cleanupExpiredRooms } = require("../../../src/services/cleanupService");
const { _resetForTesting } = require("../../../src/store/memoryStore");
const { Room, Player } = require("../../../src/models");

beforeAll(async () => { await syncTestDb(); });
beforeEach(async () => {
  await clearTestDb();
  _resetForTesting();
});
afterAll(async () => { await closeTestDb(); });

describe("touchRoomByCode", () => {
  test("should update last_activity_at", async () => {
    const old = new Date(Date.now() - 60000);
    await createRoomDirect({ code: "TOUCH1", last_activity_at: old });

    await touchRoomByCode("TOUCH1");

    const room = await Room.findOne({ where: { code: "TOUCH1" } });
    expect(new Date(room.last_activity_at).getTime()).toBeGreaterThan(old.getTime());
  });

  test("should do nothing for falsy code", async () => {
    await expect(touchRoomByCode(null)).resolves.not.toThrow();
    await expect(touchRoomByCode("")).resolves.not.toThrow();
  });
});

describe("cleanupExpiredRooms", () => {
  test("should delete expired rooms", async () => {
    const expired = new Date(Date.now() - 7200 * 1000); // 2 hours ago (TTL is 3600s in test)
    await createRoomDirect({ code: "EXP001", last_activity_at: expired });

    const io = createMockIo();
    await cleanupExpiredRooms(io);

    const room = await Room.findOne({ where: { code: "EXP001" } });
    expect(room).toBeNull();
  });

  test("should NOT delete active rooms", async () => {
    await createRoomDirect({ code: "ACTIVE", last_activity_at: new Date() });

    const io = createMockIo();
    await cleanupExpiredRooms(io);

    const room = await Room.findOne({ where: { code: "ACTIVE" } });
    expect(room).not.toBeNull();
  });

  test("should emit room:destroyed to expired room", async () => {
    const expired = new Date(Date.now() - 7200 * 1000);
    await createRoomDirect({ code: "EXPNOT", last_activity_at: expired });

    const io = createMockIo();
    await cleanupExpiredRooms(io);

    expect(io.to).toHaveBeenCalledWith("EXPNOT");
    const emissions = io.getEmissions("room:destroyed");
    expect(emissions.length).toBe(1);
    expect(emissions[0].data.code).toBe("EXPNOT");
  });

  test("should delete AI users when cleaning AI room", async () => {
    const expired = new Date(Date.now() - 7200 * 1000);
    const humanUser = await createUser();
    const aiUser = await createUser({ google_id: "ai_bot_cleanup" });
    const room = await createRoomDirect({
      code: "AICLEAN", last_activity_at: expired,
      is_ai_room: true, ai_player_count: 1,
    });
    await createPlayerDirect(room.id, humanUser.id, { is_ai: false });
    await createPlayerDirect(room.id, aiUser.id, { is_ai: true });

    const io = createMockIo();
    await cleanupExpiredRooms(io);

    const room2 = await Room.findByPk(room.id);
    expect(room2).toBeNull();
  });

  test("should work when io is null", async () => {
    const expired = new Date(Date.now() - 7200 * 1000);
    await createRoomDirect({ code: "NOIO01", last_activity_at: expired });

    await expect(cleanupExpiredRooms(null)).resolves.not.toThrow();
    const room = await Room.findOne({ where: { code: "NOIO01" } });
    expect(room).toBeNull();
  });
});
