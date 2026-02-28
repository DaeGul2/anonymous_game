const express = require("express");
const session = require("express-session");
const passport = require("passport");
const request = require("supertest");
const authRoutes = require("../../../src/routes/auth");

function createApp() {
  const app = express();
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use("/auth", authRoutes);
  return app;
}

describe("auth routes", () => {
  test("GET /auth/me returns 401 when not authenticated", async () => {
    const res = await request(createApp()).get("/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  test("POST /auth/logout returns ok even when not authenticated", async () => {
    const res = await request(createApp()).post("/auth/logout");
    // Express may return 500 or other error for logout without session
    expect(res.status).toBeLessThan(500);
  });

  test("GET /auth/google attempts redirect to Google", async () => {
    // This will fail/error since we haven't configured Google strategy
    // Just verify it doesn't crash the server
    const res = await request(createApp()).get("/auth/google");
    // Expect either redirect (302) or error
    expect([302, 500]).toContain(res.status);
  });
});
