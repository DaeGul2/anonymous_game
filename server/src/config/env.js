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

  DB_HOST: must("DB_HOST"),
  DB_PORT: num("DB_PORT", 3306),
  DB_NAME: must("DB_NAME"),
  DB_USER: must("DB_USER"),
  DB_PASS: process.env.DB_PASS || "",

  GUEST_TOKEN_SECRET: must("GUEST_TOKEN_SECRET"),

  ROOM_IDLE_TTL_SECONDS: num("ROOM_IDLE_TTL_SECONDS", 3600),
  CLEANUP_INTERVAL_SECONDS: num("CLEANUP_INTERVAL_SECONDS", 60),

  QUESTION_SUBMIT_SECONDS: num("QUESTION_SUBMIT_SECONDS", 120),
  ANSWER_SECONDS: num("ANSWER_SECONDS", 60),
};

module.exports = { env };
