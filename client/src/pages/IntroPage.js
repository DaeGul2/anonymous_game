// src/pages/IntroPage.js
import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    emoji: "🎭",
    title: "완전 익명",
    desc: "누가 뭘 썼는지 아무도 몰라요. 솔직해질 수 있는 공간!",
    gradient: ["rgba(124,58,237,0.18)", "rgba(236,72,153,0.12)"],
    accent: "rgba(124,58,237,0.30)",
  },
  {
    emoji: "⚡",
    title: "실시간 멀티플레이",
    desc: "방 코드 하나면 친구들과 바로 시작. 실시간으로 함께 즐겨요.",
    gradient: ["rgba(59,130,246,0.18)", "rgba(96,165,250,0.12)"],
    accent: "rgba(59,130,246,0.30)",
  },
  {
    emoji: "🃏",
    title: "카드 까기",
    desc: "방장이 답변을 하나씩 포스트잇을 뜯어내듯 공개해요.",
    gradient: ["rgba(251,191,36,0.20)", "rgba(249,115,22,0.12)"],
    accent: "rgba(251,191,36,0.35)",
  },
  {
    emoji: "😂",
    title: "리액션 & 하트",
    desc: "재밌는 답변엔 이모지 리액션과 하트를 날려보세요.",
    gradient: ["rgba(244,114,182,0.18)", "rgba(236,72,153,0.12)"],
    accent: "rgba(244,114,182,0.30)",
  },
];

/** 이미지 슬롯 — public/images/intro/에 파일 넣으면 자동 표시 */
function ImageSlot({ src, alt, idx }) {
  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1.5px dashed rgba(124,58,237,0.25)",
        background: "rgba(124,58,237,0.04)",
        position: "relative",
        aspectRatio: "16/9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/images/intro/${src}`}
        alt={alt}
        onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
      />
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={0.5}
        sx={{ display: "none", position: "absolute", inset: 0 }}
      >
        <Typography sx={{ fontSize: 28, opacity: 0.3 }}>🖼️</Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", opacity: 0.6 }}>
          {src}
        </Typography>
      </Stack>
    </Box>
  );
}

export default function IntroPage() {
  const nav = useNavigate();

  return (
    <Box className="appShell" sx={{ pb: 6 }}>
      {/* 히어로 */}
      <Box sx={{ textAlign: "center", pt: 2, pb: 1, animation: "slideUp 0.5s var(--spring) both" }}>
        <Box
          sx={{
            width: 64, height: 64, borderRadius: "20px", mx: "auto", mb: 1.5,
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, boxShadow: "0 8px 32px rgba(124,58,237,0.40)",
            animation: "pulseBeat 2s ease-in-out infinite",
          }}
        >
          🎭
        </Box>
        <Typography
          sx={{
            fontWeight: 950, fontSize: { xs: 28, sm: 34 },
            letterSpacing: "-0.04em", lineHeight: 1.15,
            background: "linear-gradient(135deg, #7C3AED, #EC4899, #3B82F6)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "bgShift 5s ease infinite",
            mb: 1,
          }}
        >
          익명게임
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", letterSpacing: "-0.01em", lineHeight: 1.6, wordBreak: "keep-all" }}>
          친구들과 익명으로 질문하고<br />솔직하게 답변하는 파티 게임
        </Typography>
      </Box>

      {/* 메인 스크린샷 */}
      <Box sx={{ animation: "slideUp 0.5s var(--spring) both 0.05s" }}>
        <ImageSlot src="main.png" alt="메인 화면 스크린샷" idx={0} />
      </Box>

      {/* 특징 카드들 */}
      <Stack spacing={1.2} sx={{ mt: 2 }}>
        {FEATURES.map((f, i) => (
          <Paper
            key={i}
            className="glassCard"
            sx={{
              p: 2, overflow: "hidden",
              background: `linear-gradient(135deg, ${f.gradient[0]}, ${f.gradient[1]}) !important`,
              border: `1px solid ${f.accent} !important`,
              animation: "slideUp 0.5s var(--spring) both",
              animationDelay: `${0.1 + i * 0.06}s`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44, height: 44, borderRadius: "14px",
                  background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flex: "0 0 auto",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                {f.emoji}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", mb: 0.3 }}>
                  {f.title}
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, wordBreak: "keep-all" }}>
                  {f.desc}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* 추가 스크린샷 슬롯들 */}
      <Stack spacing={1.5} sx={{ mt: 2.5 }}>
        <ImageSlot src="gameplay-1.png" alt="게임 플레이 스크린샷 1" idx={1} />
        <ImageSlot src="gameplay-2.png" alt="게임 플레이 스크린샷 2" idx={2} />
        <ImageSlot src="gameplay-3.png" alt="게임 플레이 스크린샷 3" idx={3} />
      </Stack>

      {/* CTA */}
      <Stack spacing={1} sx={{ mt: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => nav("/")}
          sx={{
            fontWeight: 900, fontSize: 17, borderRadius: 999, py: 1.8,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #7C3AED, #EC4899, #3B82F6)",
            backgroundSize: "200% 200%",
            boxShadow: "0 8px 28px rgba(124,58,237,0.38)",
            "&:active": { transform: "scale(0.97)" },
            transition: "transform 0.12s ease",
            animation: "bgShift 4s ease infinite",
          }}
        >
          지금 시작하기 →
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => nav("/how-to-play")}
          sx={{
            fontWeight: 900, fontSize: 15, borderRadius: 999, py: 1.5,
            letterSpacing: "-0.02em",
            border: "1.5px solid rgba(124,58,237,0.30)",
            color: "var(--c-primary)",
            "&:active": { transform: "scale(0.97)" },
            transition: "transform 0.12s ease",
          }}
        >
          하는 방법 보기
        </Button>
      </Stack>
    </Box>
  );
}
