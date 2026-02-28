// src/pages/HowToPlayPage.js
import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    num: 1,
    title: "방 만들기 & 입장",
    desc: "방을 만들거나 방 코드를 입력해서 친구들과 함께 입장하세요. 비밀번호 설정도 가능!",
    emoji: "🏠",
    image: "step-1.png",
    gradient: ["rgba(59,130,246,0.18)", "rgba(96,165,250,0.10)"],
    accent: "rgba(59,130,246,0.30)",
  },
  {
    num: 2,
    title: "질문 제출",
    desc: "각자 익명으로 재밌는 질문을 하나씩 제출해요. AI가 자동으로 질문을 추가해주기도 해요!",
    emoji: "❓",
    image: "step-2.png",
    gradient: ["rgba(124,58,237,0.18)", "rgba(139,92,246,0.10)"],
    accent: "rgba(124,58,237,0.30)",
  },
  {
    num: 3,
    title: "답변 작성",
    desc: "랜덤으로 선택된 질문에 솔직하게 답변해요. 누가 뭘 썼는지는 비밀!",
    emoji: "✍️",
    image: "step-3.png",
    gradient: ["rgba(236,72,153,0.18)", "rgba(244,114,182,0.10)"],
    accent: "rgba(236,72,153,0.30)",
  },
  {
    num: 4,
    title: "카드 까기",
    desc: "방장이 포스트잇을 뜯어내며 답변을 하나씩 공개!",
    emoji: "🃏",
    image: "step-4.png",
    gradient: ["rgba(251,191,36,0.20)", "rgba(249,115,22,0.10)"],
    accent: "rgba(251,191,36,0.35)",
  },
  {
    num: 5,
    title: "리액션 & 다음 라운드",
    desc: "재밌는 답변에 이모지와 하트를 날려요! 다음 질문으로 넘어가며 계속 즐기세요.",
    emoji: "🎉",
    image: "step-5.png",
    gradient: ["rgba(52,211,153,0.18)", "rgba(16,185,129,0.10)"],
    accent: "rgba(52,211,153,0.30)",
  },
];

/** 이미지 슬롯 — public/images/guide/에 파일 넣으면 자동 표시 */
function ImageSlot({ src, alt }) {
  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1.5px dashed rgba(124,58,237,0.20)",
        background: "rgba(124,58,237,0.03)",
        position: "relative",
        aspectRatio: "16/10",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mt: 1.2,
      }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/images/guide/${src}`}
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
        <Typography sx={{ fontSize: 24, opacity: 0.3 }}>🖼️</Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", opacity: 0.5 }}>
          {src}
        </Typography>
      </Stack>
    </Box>
  );
}

export default function HowToPlayPage() {
  const nav = useNavigate();

  return (
    <Box className="appShell" sx={{ pb: 6 }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: "center", pt: 1.5, pb: 0.5, mb: 1, animation: "slideUp 0.5s var(--spring) both" }}>
        <Typography
          sx={{
            fontWeight: 950, fontSize: { xs: 24, sm: 28 },
            letterSpacing: "-0.04em", lineHeight: 1.2,
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            mb: 0.6,
          }}
        >
          하는 방법
        </Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", letterSpacing: "-0.01em" }}>
          5단계로 쉽게 시작할 수 있어요
        </Typography>
      </Box>

      {/* 단계별 카드 */}
      <Stack spacing={1.5}>
        {STEPS.map((step, i) => (
          <Paper
            key={step.num}
            className="glassCard"
            sx={{
              p: 0, overflow: "hidden",
              background: `linear-gradient(135deg, ${step.gradient[0]}, ${step.gradient[1]}) !important`,
              border: `1px solid ${step.accent} !important`,
              animation: "slideUp 0.5s var(--spring) both",
              animationDelay: `${i * 0.07}s`,
            }}
          >
            {/* 상단 악센트 바 */}
            <Box sx={{ height: 3, background: `linear-gradient(90deg, transparent, ${step.accent}, transparent)`, opacity: 0.5 }} />

            <Box sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                {/* 번호 뱃지 */}
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: "12px", flex: "0 0 auto",
                    background: "rgba(255,255,255,0.75)", border: "1.5px solid rgba(255,255,255,0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    position: "relative",
                  }}
                >
                  <Typography sx={{ fontSize: 20 }}>{step.emoji}</Typography>
                  <Box
                    sx={{
                      position: "absolute", top: -6, right: -6,
                      width: 20, height: 20, borderRadius: "50%",
                      background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(124,58,237,0.30)",
                    }}
                  >
                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#fff" }}>{step.num}</Typography>
                  </Box>
                </Box>

                {/* 텍스트 */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em", mb: 0.4 }}>
                    {step.title}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, wordBreak: "keep-all" }}>
                    {step.desc}
                  </Typography>
                </Box>
              </Stack>

              {/* 이미지 슬롯 */}
              <ImageSlot src={step.image} alt={`${step.title} 스크린샷`} />
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* 팁 카드 */}
      <Paper
        className="glassCard"
        sx={{
          p: 2, mt: 2,
          background: "rgba(124,58,237,0.06) !important",
          border: "1px solid rgba(124,58,237,0.20) !important",
          animation: "slideUp 0.5s var(--spring) both",
          animationDelay: "0.4s",
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1, letterSpacing: "-0.02em" }}>
          💡 꿀팁
        </Typography>
        <Stack spacing={0.8}>
          {[
            "질문은 재미있을수록 좋아요! 센스 있는 질문이 분위기를 살려요.",
            "답변은 솔직할수록 웃겨요. 어차피 익명이니까!",
            "카드 까기 순간이 하이라이트! 다 같이 모여서 보면 더 재밌어요.",
            "하트를 많이 받은 답변은 MVP! 베스트 답변을 노려보세요.",
          ].map((tip, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
              <Typography sx={{ fontSize: 11, color: "var(--c-primary)", fontWeight: 900, mt: 0.1 }}>•</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", lineHeight: 1.5 }}>
                {tip}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>

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
          onClick={() => nav("/intro")}
          sx={{
            fontWeight: 900, fontSize: 15, borderRadius: 999, py: 1.5,
            letterSpacing: "-0.02em",
            border: "1.5px solid rgba(124,58,237,0.30)",
            color: "var(--c-primary)",
            "&:active": { transform: "scale(0.97)" },
            transition: "transform 0.12s ease",
          }}
        >
          게임 소개 보기
        </Button>
      </Stack>
    </Box>
  );
}
