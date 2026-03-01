// src/pages/HowToPlayPage.js
import React from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

/* ── 미니 목업: 방 만들기 + 방 목록 ── */
function MockStep1() {
  return (
    <Stack spacing={0.8}>
      {/* 방 만들기 버튼 */}
      <Box sx={{ borderRadius: 999, py: 1, textAlign: "center", background: "linear-gradient(135deg, #7C3AED, #EC4899, #3B82F6)", backgroundSize: "200% 200%" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>🎮 방 만들기</Typography>
      </Box>
      {/* 코드로 입장 */}
      <Paper className="glassCard" sx={{ p: 1 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 10, mb: 0.6 }}>코드로 입장</Typography>
        <Stack direction="row" spacing={0.5}>
          <Box sx={{ flex: 1, borderRadius: "8px", border: "1px solid rgba(59,130,246,0.25)", px: 1, py: 0.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.06em", color: "var(--text-3)" }}>ABC123</Typography>
          </Box>
          <Box sx={{ flex: 1, borderRadius: "8px", border: "1px solid rgba(59,130,246,0.25)", px: 1, py: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 11, color: "var(--text-3)" }}>닉네임</Typography>
          </Box>
        </Stack>
      </Paper>
      {/* 방 아이템 */}
      <Paper className="glassCard" sx={{ p: 1 }}>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Box sx={{ width: 28, height: 28, borderRadius: 999, flex: "0 0 auto", background: "radial-gradient(circle at 30% 30%, rgba(236,72,153,0.55), rgba(139,92,246,0.55), rgba(59,130,246,0.35))", border: "1px solid rgba(255,255,255,0.55)" }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950, fontSize: 10 }}>금요일 회식 후 <Typography component="span" sx={{ fontSize: 8, color: "var(--text-3)" }}>(ABC123)</Typography></Typography>
            <Typography sx={{ fontSize: 8, color: "var(--text-3)" }}>인원 4/8</Typography>
          </Box>
          <Chip size="small" label="대기" sx={{ fontWeight: 900, fontSize: 8, height: 16, borderRadius: 999 }} />
        </Stack>
      </Paper>
    </Stack>
  );
}

/* ── 미니 목업: 질문 제출 ── */
function MockStep2() {
  return (
    <Stack spacing={0.8}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontWeight: 900, fontSize: 11 }}>✏️ 내 질문 작성</Typography>
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)" }}>18/100</Typography>
      </Stack>
      {/* 템플릿 칩 */}
      <Stack direction="row" spacing={0.5} sx={{ overflow: "hidden" }}>
        {["이 중에 ___한 사람?", "가장 ___한 사람은?", "솔직히 ___한 적 있는 사람?"].map((t, i) => (
          <Box key={i} sx={{ flex: "0 0 auto", px: 1, py: 0.4, borderRadius: 999, background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)", fontSize: 9, fontWeight: 700, color: "var(--c-primary)", whiteSpace: "nowrap" }}>{t}</Box>
        ))}
      </Stack>
      {/* 텍스트 영역 */}
      <Box sx={{ borderRadius: "10px", border: "1.5px solid rgba(124,58,237,0.4)", p: 1, background: "rgba(255,255,255,0.55)", minHeight: 40 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 11, color: "var(--text-1)" }}>이 중에 전 애인한테 연락한 사람?</Typography>
      </Box>
      {/* 답변 형식 */}
      <Stack direction="row" spacing={0.5}>
        <Box sx={{ flex: 1, py: 0.5, borderRadius: 999, textAlign: "center", fontSize: 10, fontWeight: 800, background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.12))", border: "1.5px solid rgba(124,58,237,0.40)", color: "var(--c-primary)" }}>자유 답변</Box>
        <Box sx={{ flex: 1, py: 0.5, borderRadius: 999, textAlign: "center", fontSize: 10, fontWeight: 800, background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.08)", color: "var(--text-2)" }}>예 · 아니오</Box>
      </Stack>
      {/* 제출 버튼 */}
      <Box sx={{ borderRadius: 999, py: 0.8, textAlign: "center", background: "linear-gradient(135deg, #7C3AED, #EC4899)", boxShadow: "0 2px 12px rgba(124,58,237,0.25)" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 11, color: "#fff" }}>제출하기 →</Typography>
      </Box>
    </Stack>
  );
}

/* ── 미니 목업: 답변 작성 ── */
function MockStep3() {
  return (
    <Stack spacing={0.8}>
      {/* 질문 카드 */}
      <Paper className="glassCard" sx={{ p: 1, background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(236,72,153,0.18)) !important", border: "1.5px solid rgba(124,58,237,0.30) !important" }}>
        <Stack direction="row" spacing={0.6} alignItems="center">
          <Box sx={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 8 }}>Q</span>
          </Box>
          <Typography sx={{ fontWeight: 900, fontSize: 11, letterSpacing: "-0.02em" }}>이 중에 전 애인한테 연락한 사람?</Typography>
        </Stack>
      </Paper>
      {/* 답변 입력 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontWeight: 900, fontSize: 11 }}>💬 내 답변 작성</Typography>
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)" }}>14/100</Typography>
      </Stack>
      <Box sx={{ borderRadius: "10px", border: "1.5px solid rgba(59,130,246,0.4)", p: 1, background: "rgba(255,255,255,0.55)", minHeight: 36 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 11 }}>솔직히 지난 주에 했음 ㅋㅋ</Typography>
      </Box>
      <Box sx={{ borderRadius: 999, py: 0.8, textAlign: "center", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", boxShadow: "0 2px 12px rgba(59,130,246,0.25)" }}>
        <Typography sx={{ fontWeight: 900, fontSize: 11, color: "#fff" }}>제출하기 →</Typography>
      </Box>
    </Stack>
  );
}

/* ── 미니 목업: 답변 공개 (포스트잇) ── */
function MockStep4() {
  const postits = [
    { bg: "rgba(254,240,138,0.93)", border: "rgba(250,204,21,0.40)", text: "rgba(161,98,7,0.60)" },
    { bg: "rgba(167,243,208,0.90)", border: "rgba(52,211,153,0.40)", text: "rgba(6,95,70,0.55)" },
  ];
  const revealed = { from: "rgba(96,165,250,0.28)", to: "rgba(139,92,246,0.12)", accent: "rgba(96,165,250,0.7)" };
  return (
    <Stack spacing={0.6}>
      {/* 공개된 카드 */}
      <Paper className="glassCard" sx={{ p: 1.2, background: `linear-gradient(135deg, ${revealed.from}, ${revealed.to}) !important`, border: `1px solid ${revealed.accent} !important` }}>
        <Stack direction="row" spacing={0.8} alignItems="flex-start">
          <Box sx={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flex: "0 0 auto" }}>🐻</Box>
          <Box>
            <Typography sx={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)" }}>익명 1</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 11 }}>솔직히 지난 주에 했음 ㅋㅋ</Typography>
          </Box>
        </Stack>
      </Paper>
      {/* 미공개 포스트잇 카드들 */}
      {postits.map((p, i) => (
        <Paper key={i} className="glassCard" sx={{ p: 0, overflow: "hidden", background: `${p.bg} !important`, border: `1.5px solid ${p.border} !important` }}>
          <Stack direction="row" alignItems="center" sx={{ minHeight: 44 }}>
            <Box sx={{ alignSelf: "stretch", borderRight: `2px dashed ${p.text}`, opacity: 0.25, ml: 1 }} />
            <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center" sx={{ flex: 1, py: 1, px: 1 }}>
              <Typography sx={{ fontSize: 16 }}>🃏</Typography>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 10, color: p.text }}>터치하여 공개</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 8, color: p.text, opacity: 0.55 }}>답변 #{i + 2}</Typography>
              </Box>
            </Stack>
            <Box sx={{ alignSelf: "stretch", borderLeft: `1.5px dashed ${p.text}`, opacity: 0.25, mr: 1, display: "flex", alignItems: "center", pl: 0.5, pr: 0.3 }}>
              <Typography sx={{ fontSize: 8, fontWeight: 800, color: p.text, opacity: 0.65, whiteSpace: "nowrap" }}>← 뜯기</Typography>
            </Box>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

/* ── 미니 목업: 리액션 ── */
function MockStep5() {
  return (
    <Box sx={{ position: "relative", minHeight: 100 }}>
      {/* 떠다니는 이모지 */}
      <Typography sx={{ position: "absolute", fontSize: 20, left: "10%", bottom: 8, opacity: 0.9 }}>😂</Typography>
      <Typography sx={{ position: "absolute", fontSize: 18, left: "40%", bottom: 35, opacity: 0.7 }}>😱</Typography>
      <Typography sx={{ position: "absolute", fontSize: 22, left: "65%", bottom: 15, opacity: 0.85 }}>❤️</Typography>
      <Typography sx={{ position: "absolute", fontSize: 16, left: "25%", bottom: 60, opacity: 0.5 }}>👏</Typography>
      <Box sx={{ position: "absolute", left: "50%", bottom: 70, px: 1, py: 0.4, borderRadius: 999, background: "rgba(255,255,255,0.88)", border: "1px solid rgba(124,58,237,0.18)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", whiteSpace: "nowrap", opacity: 0.7 }}>
        <Typography sx={{ fontSize: 9, fontWeight: 800, color: "rgba(17,24,39,0.75)" }}>답변 미쳤다 ㅋㅋ</Typography>
      </Box>
      {/* FAB */}
      <Box sx={{ position: "absolute", right: 6, bottom: 6, width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, rgba(124,58,237,0.90), rgba(236,72,153,0.85))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(124,58,237,0.35)" }}>
        <Typography sx={{ fontSize: 16, lineHeight: 1 }}>😆</Typography>
      </Box>
    </Box>
  );
}

const STEPS = [
  {
    num: 1, title: "방 만들기 & 입장", emoji: "🏠",
    desc: "방을 만들거나 방 코드를 입력해서 친구들과 함께 입장하세요. 비밀번호 설정도 가능!",
    gradient: ["rgba(59,130,246,0.18)", "rgba(96,165,250,0.10)"],
    accent: "rgba(59,130,246,0.30)",
    Mock: MockStep1,
  },
  {
    num: 2, title: "질문 제출", emoji: "❓",
    desc: "각자 익명으로 재밌는 질문을 하나씩 제출해요. AI가 자동으로 질문을 추가해주기도 해요!",
    gradient: ["rgba(124,58,237,0.18)", "rgba(139,92,246,0.10)"],
    accent: "rgba(124,58,237,0.30)",
    Mock: MockStep2,
  },
  {
    num: 3, title: "답변 작성", emoji: "✍️",
    desc: "랜덤으로 선택된 질문에 솔직하게 답변해요. 누가 뭘 썼는지는 비밀!",
    gradient: ["rgba(236,72,153,0.18)", "rgba(244,114,182,0.10)"],
    accent: "rgba(236,72,153,0.30)",
    Mock: MockStep3,
  },
  {
    num: 4, title: "답변 공개", emoji: "🃏",
    desc: "방장이 포스트잇을 뜯어내며 답변을 하나씩 공개!",
    gradient: ["rgba(251,191,36,0.20)", "rgba(249,115,22,0.10)"],
    accent: "rgba(251,191,36,0.35)",
    Mock: MockStep4,
  },
  {
    num: 5, title: "리액션 & 다음 라운드", emoji: "🎉",
    desc: "재밌는 답변에 이모지와 하트를 날려요! 다음 질문으로 넘어가며 계속 즐기세요.",
    gradient: ["rgba(52,211,153,0.18)", "rgba(16,185,129,0.10)"],
    accent: "rgba(52,211,153,0.30)",
    Mock: MockStep5,
  },
];

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
        {STEPS.map((step, i) => {
          const MockComponent = step.Mock;
          return (
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
              <Box sx={{ height: 3, background: `linear-gradient(90deg, transparent, ${step.accent}, transparent)`, opacity: 0.5 }} />
              <Box sx={{ p: 2, pb: 1.2 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ width: 40, height: 40, borderRadius: "12px", flex: "0 0 auto", background: "rgba(255,255,255,0.75)", border: "1.5px solid rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", position: "relative" }}>
                    <Typography sx={{ fontSize: 20 }}>{step.emoji}</Typography>
                    <Box sx={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(124,58,237,0.30)" }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#fff" }}>{step.num}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em", mb: 0.4 }}>{step.title}</Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, wordBreak: "keep-all" }}>{step.desc}</Typography>
                  </Box>
                </Stack>
              </Box>
              {/* 미니 목업 프리뷰 */}
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <Box sx={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.35)", p: 1.2 }}>
                  <MockComponent />
                </Box>
              </Box>
            </Paper>
          );
        })}
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
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", lineHeight: 1.5 }}>{tip}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>

      {/* CTA */}
      <Stack spacing={1} sx={{ mt: 3 }}>
        <Button
          fullWidth variant="contained"
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
          fullWidth variant="outlined"
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
