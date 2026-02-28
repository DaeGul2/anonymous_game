const express = require("express");
const request = require("supertest");
const { syncTestDb, clearTestDb, closeTestDb } = require("../../helpers/testDb");
const { createUser, createRoomDirect, createPlayerDirect } = require("../../helpers/fixtures");
const { getMyActiveRoom } = require("../../../src/services/roomService");

function createApp(user = null) {
  const app = express();
  // Fake authentication middleware
  app.use((req, res, next) => {
    if (user) {
      req.isAuthenticated = () => true;
      req.user = user;
    } else {
      req.isAuthenticated = () => false;
    }
    next();
  });

  app.get("/room/my-active", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ ok: false });
      const result = await getMyActiveRoom(req.user.id);
      res.json({ ok: true, ...result });
    } catch (e) {
      res.json({ ok: true, room: null });
    }
  });

  return app;
}

beforeAll(async () => { await syncTestDb(); });
beforeEach(async () => { await clearTestDb(); });
afterAll(async () => { await closeTestDb(); });

describe("GET /room/my-active", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await request(createApp()).get("/room/my-active");
    expect(res.status).toBe(401);
  });

  test("returns room when user has active room", async () => {
    const user = await createUser();
    const room = await createRoomDirect({ code: "MYACT1", status: "lobby" });
    await createPlayerDirect(room.id, user.id);

    const res = await request(createApp(user)).get("/room/my-active");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.room).not.toBeNull();
    expect(res.body.room.code).toBe("MYACT1");
  });

  test("returns null when user has no active room", async () => {
    const user = await createUser();

    const res = await request(createApp(user)).get("/room/my-active");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.room).toBeNull();
  });
});
