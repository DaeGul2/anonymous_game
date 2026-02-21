// src/routes/auth.js
const express = require("express");
const passport = require("passport");
const { env } = require("../config/env");

const router = express.Router();

// Google OAuth 시작
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth 콜백
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${env.CLIENT_URL}/login?error=1` }),
  (req, res) => {
    // 로그인 성공 → 클라이언트 홈으로
    res.redirect(env.CLIENT_URL);
  }
);

// 현재 로그인 유저 정보
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ ok: false, user: null });
  }
  const { id, google_id, email, display_name, avatar_url } = req.user;
  res.json({ ok: true, user: { id, google_id, email, display_name, avatar_url } });
});

// 로그아웃
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });
});

module.exports = router;
