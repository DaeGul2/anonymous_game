// src/config/env.js
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function num(name, def) {
  const v = process.env[name];
  if (v == null || v === "") return def;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Env must be a number: ${name}=${v}`);
  return n;
}

const env = {
  PORT: num("PORT", 5000),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  DB_HOST: must("DB_HOST"),
  DB_PORT: num("DB_PORT", 3306),
  DB_NAME: must("DB_NAME"),
  DB_USER: must("DB_USER"),
  DB_PASS: process.env.DB_PASS || "",

  SESSION_SECRET: must("SESSION_SECRET"),
  GOOGLE_CLIENT_ID: must("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: must("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback",

  ROOM_IDLE_TTL_SECONDS: num("ROOM_IDLE_TTL_SECONDS", 3600),
  CLEANUP_INTERVAL_SECONDS: num("CLEANUP_INTERVAL_SECONDS", 60),

  QUESTION_SUBMIT_SECONDS: num("QUESTION_SUBMIT_SECONDS", 120),
  ANSWER_SECONDS: num("ANSWER_SECONDS", 60),
};

module.exports = { env };
