// src/middlewares/rateLimit.js
const rateLimit = require("express-rate-limit");

// 전역: 분당 100 요청/IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many requests" },
});

// 인증 경로: 분당 20 요청/IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many auth requests" },
});

module.exports = { globalLimiter, authLimiter };
