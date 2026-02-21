// src/pages/LoginPage.js
import React from "react";
import { Box, Typography } from "@mui/material";

const SERVER = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        pb: "env(safe-area-inset-bottom)",
      }}
    >
      {/* 카드 */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 360,
          background: "rgba(255,255,255,0.72)",
          border: "1px solid rgba(255,255,255,0.90)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 8px 40px rgba(124,58,237,0.15), 0 2px 8px rgba(0,0,0,0.06)",
          p: 3.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2.5,
          animation: "popIn 0.6s var(--spring) both",
        }}
      >
        {/* 로고 아이콘 */}
        <Box
          sx={{
            width: 72, height: 72,
            borderRadius: "26px",
            background: "linear-gradient(135deg, #7C3AED, #EC4899, #3B82F6)",
            backgroundSize: "200% 200%",
            animation: "bgShift 4s ease infinite",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 28px rgba(124,58,237,0.40)",
            fontSize: 36,
          }}
        >
          🎭
        </Box>

        {/* 타이틀 */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            sx={{
              fontWeight: 950,
              fontSize: 28,
              letterSpacing: "-0.04em",
              background: "linear-gradient(135deg, #7C3AED, #EC4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.1,
            }}
          >
            익명게임
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", mt: 0.8, lineHeight: 1.5 }}>
            친구들과 익명으로 질문하고<br />솔직하게 답변해봐요
          </Typography>
        </Box>

        {/* 특징 뱃지 */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
          {["🎲 랜덤 순서", "🕵️ 완전 익명", "⚡ 실시간"].map((label) => (
            <Box
              key={label}
              sx={{
                px: 1.4, py: 0.5,
                borderRadius: 999,
                background: "rgba(124,58,237,0.10)",
                border: "1px solid rgba(124,58,237,0.18)",
                fontSize: 12, fontWeight: 700, color: "var(--c-primary)",
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        {/* Google 로그인 버튼 */}
        <Box
          component="a"
          href={`${SERVER}/auth/google`}
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            py: 1.6,
            px: 2,
            borderRadius: 999,
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,0.12)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            textDecoration: "none",
            color: "rgba(0,0,0,0.82)",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: "-0.01em",
            transition: "all 0.15s ease",
            WebkitTapHighlightColor: "transparent",
            "&:active": { transform: "scale(0.97)", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" },
          }}
        >
          {/* Google G 로고 */}
          <svg width="22" height="22" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.5 7.1 29 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c2.8 0 5.3 1 7.2 2.8l5.7-5.7C33.5 7.1 29 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 45c4.9 0 9.3-1.9 12.7-4.9l-5.9-5c-1.7 1.2-3.8 2-6.8 2-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.5 41.2 16.2 45 24 45z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.9 2.4-2.5 4.5-4.6 5.9l5.9 5C36 38.1 44 32 44 25c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          Google로 시작하기
        </Box>

        <Typography sx={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", fontWeight: 600 }}>
          로그인하면 연결이 끊겨도 자동으로 복구됩니다
        </Typography>
      </Box>
    </Box>
  );
}
