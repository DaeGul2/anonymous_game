// src/routes/auth.js
const express = require("express");
const passport = require("passport");
const { env } = require("../config/env");

const router = express.Router();

// Google OAuth 시작
router.get("/google", (req, res, next) => {
  // 로그인 후 돌아갈 경로를 쿠키에 저장 (세션 재생성에 영향받지 않도록)
  const returnTo = req.query.returnTo;
  if (returnTo && returnTo.startsWith("/")) {
    res.cookie("ag_return_to", returnTo, {
      maxAge: 5 * 60 * 1000, // 5분
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

// Google OAuth 콜백
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${env.CLIENT_URL}/login?error=1` }),
  (req, res) => {
    const returnTo = req.cookies?.ag_return_to || "";
    res.clearCookie("ag_return_to");

    if (returnTo && returnTo.startsWith("/")) {
      res.redirect(env.CLIENT_URL + returnTo);
    } else {
      res.redirect(env.CLIENT_URL);
    }
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
