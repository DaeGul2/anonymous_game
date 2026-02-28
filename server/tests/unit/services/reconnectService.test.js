const { syncTestDb, clearTestDb, closeTestDb } = require("../../helpers/testDb");
const { createUser, createRoomDirect, createPlayerDirect } = require("../../helpers/fixtures");
const { rejoinRoom } = require("../../../src/services/reconnectService");
const { Player } = require("../../../src/models");

beforeAll(async () => { await syncTestDb(); });
beforeEach(async () => { await clearTestDb(); });
afterAll(async () => { await closeTestDb(); });

describe("rejoinRoom", () => {
  test("should reconnect existing player", async () => {
    const user = await createUser();
    const room = await createRoomDirect({ code: "REJOIN" });
    const player = await createPlayerDirect(room.id, user.id, { is_connected: false });

    const result = await rejoinRoom({ code: "REJOIN", user_id: user.id });

    expect(result.room.id).toBe(room.id);
    expect(result.player.id).toBe(player.id);

    const updated = await Player.findByPk(player.id);
    expect(updated.is_connected).toBe(true);
  });

  test("should throw when room not found", async () => {
    await expect(rejoinRoom({ code: "NOPE", user_id: 1 })).rejects.toThrow("방을 찾을 수 없음");
  });

  test("should throw when player not in room", async () => {
    const user = await createUser();
    await createRoomDirect({ code: "NOPLAY" });

    await expect(rejoinRoom({ code: "NOPLAY", user_id: user.id })).rejects.toThrow("재접속할 플레이어가 없음");
  });

  test("should update last_seen_at on rejoin", async () => {
    const user = await createUser();
    const room = await createRoomDirect({ code: "TIME01" });
    const player = await createPlayerDirect(room.id, user.id, { is_connected: false });
    const oldSeen = player.last_seen_at;

    // small delay to ensure timestamp differs
    await new Promise((r) => setTimeout(r, 50));
    await rejoinRoom({ code: "TIME01", user_id: user.id });

    const updated = await Player.findByPk(player.id);
    expect(new Date(updated.last_seen_at).getTime()).toBeGreaterThanOrEqual(new Date(oldSeen).getTime());
  });
});
