const express = require("express");
const request = require("supertest");
const healthRoutes = require("../../../src/routes/health");

const app = express();
app.use("/health", healthRoutes);

describe("GET /health", () => {
  test("returns ok and timestamp", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.ts).toBeDefined();
  });
});
