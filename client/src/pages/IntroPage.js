// src/pages/IntroPage.js
import React from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

/* ── 미니 목업: 방 목록 아이템 ── */
function MockRoomItem({ title, code, count, max, inGame, locked }) {
  return (
    <Paper className="glassCard" sx={{ p: 1.2, borderRadius: 3, opacity: inGame ? 0.55 : 1, filter: inGame ? "grayscale(0.15)" : "none" }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ width: 36, height: 36, borderRadius: 999, flex: "0 0 auto", background: "radial-gradient(circle at 30% 30%, rgba(236,72,153,0.55), rgba(139,92,246,0.55), rgba(59,130,246,0.35))", border: "1px solid rgba(255,255,255,0.55)" }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 950, fontSize: 12, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {locked && "🔒 "}{title} <Typography component="span" sx={{ fontSize: 10, color: "var(--text-3)" }}>({code})</Typography>
          </Typography>
          <Typography sx={{ fontSize: 10, color: "var(--text-3)", mt: 0.2 }}>인원 {count}/{max}{inGame ? " · 입장 불가" : ""}</Typography>
        </Box>
        <Stack spacing={0.4} alignItems="flex-end">
          <Chip size="small" label={inGame ? "진행 중" : "대기"} color={inGame ? "warning" : "default"} sx={{ fontWeight: 900, fontSize: 9, height: 20, borderRadius: 999 }} />
          <Chip size="small" label={`${count}/${max}`} sx={{ fontWeight: 900, fontSize: 9, height: 20, borderRadius: 999 }} />
        </Stack>
      </Stack>
    </Paper>
  );
}

/* ── 미니 목업: 익명 답변 카드 ── */
function MockAnswerCard({ emoji, text, idx, color }) {
  const colors = [
    { from: "rgba(251,191,36,0.28)", to: "rgba(249,115,22,0.12)", accent: "rgba(251,191,36,0.7)" },
    { from: "rgba(52,211,153,0.28)", to: "rgba(16,185,129,0.12)", accent: "rgba(52,211,153,0.7)" },
    { from: "rgba(96,165,250,0.28)", to: "rgba(139,92,246,0.12)", accent: "rgba(96,165,250,0.7)" },
  ];
  const c = colors[idx % 3];
  return (
    <Paper className="glassCard" sx={{ p: 1.5, background: `linear-gradient(135deg, ${c.from}, ${c.to}) !important`, border: `1px solid ${c.accent} !important` }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flex: "0 0 auto" }}>{emoji}</Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", mb: 0.2 }}>익명 {idx + 1}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 12, letterSpacing: "-0.02em", lineHeight: 1.4 }}>{text}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

/* ── 미니 목업: 리액션 버블 ── */
function MockBubble({ emoji, style }) {
  return (
    <Typography sx={{ position: "absolute", fontSize: 22, lineHeight: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.10))", pointerEvents: "none", ...style }}>
      {emoji}
    </Typography>
  );
}

/* ── 미니 목업: 텍스트 버블 ── */
function MockTextBubble({ text, style }) {
  return (
    <Box sx={{ position: "absolute", px: 1.2, py: 0.5, borderRadius: 999, background: "rgba(255,255,255,0.88)", border: "1px solid rgba(124,58,237,0.18)", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", whiteSpace: "nowrap", pointerEvents: "none", ...style }}>
      <Typography sx={{ fontSize: 10, fontWeight: 800, color: "rgba(17,24,39,0.75)" }}>{text}</Typography>
    </Box>
  );
}

/* ── 섹션 래퍼 ── */
function FeatureSection({ emoji, title, desc, gradient, accent, children, idx }) {
  return (
    <Paper
      className="glassCard"
      sx={{
        p: 0, overflow: "hidden",
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]}) !important`,
        border: `1px solid ${accent} !important`,
        animation: "slideUp 0.5s var(--spring) both",
        animationDelay: `${0.1 + idx * 0.06}s`,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2, pb: 1.2 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: "14px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flex: "0 0 auto", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          {emoji}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", mb: 0.3 }}>{title}</Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, wordBreak: "keep-all" }}>{desc}</Typography>
        </Box>
      </Stack>
      {/* 미니 목업 프리뷰 */}
      <Box sx={{ px: 1.5, pb: 1.5 }}>
        <Box sx={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.35)", p: 1.2 }}>
          {children}
        </Box>
      </Box>
    </Paper>
  );
}

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
    emoji: "😂",
    title: "리액션 & 하트",
    desc: "재밌는 답변엔 이모지 리액션과 하트를 날려보세요.",
    gradient: ["rgba(244,114,182,0.18)", "rgba(236,72,153,0.12)"],
    accent: "rgba(244,114,182,0.30)",
  },
];

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

      {/* 특징 카드 + 미니 목업 */}
      <Stack spacing={1.2} sx={{ mt: 1.5 }}>
        {/* 1. 완전 익명 — 답변 공개 목업 */}
        <FeatureSection {...FEATURES[0]} idx={0}>
          <Stack spacing={0.8}>
            <Paper className="glassCard" sx={{ p: 1.2, background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(236,72,153,0.18), rgba(96,165,250,0.14)) !important", border: "1.5px solid rgba(124,58,237,0.30) !important" }}>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box sx={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontWeight: 900, fontSize: 10 }}>Q</span>
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: 12, letterSpacing: "-0.02em" }}>이 중에 전 애인한테 연락한 사람?</Typography>
              </Stack>
            </Paper>
            <MockAnswerCard emoji="🐻" text="솔직히 지난 주에 했음 ㅋㅋ" idx={0} />
            <MockAnswerCard emoji="🦊" text="절대 안 함. 자존심이 있지" idx={1} />
            <MockAnswerCard emoji="🐼" text="...카톡 프사만 봤어요" idx={2} />
          </Stack>
        </FeatureSection>

        {/* 2. 실시간 멀티플레이 — 방 목록 목업 */}
        <FeatureSection {...FEATURES[1]} idx={1}>
          <Stack spacing={0.6}>
            <MockRoomItem title="금요일 회식 후" code="ABC123" count={4} max={8} />
            <MockRoomItem title="대학 동기 모임" code="XYZ789" count={6} max={6} inGame />
            <MockRoomItem title="우리반 단톡방" code="QWE456" count={2} max={10} locked />
          </Stack>
        </FeatureSection>

        {/* 3. 리액션 & 하트 — 리액션 버블 목업 */}
        <FeatureSection {...FEATURES[2]} idx={2}>
          <Box sx={{ position: "relative", height: 120, overflow: "hidden" }}>
            <MockBubble emoji="😂" style={{ left: "15%", bottom: 10, opacity: 0.9 }} />
            <MockBubble emoji="😱" style={{ left: "45%", bottom: 40, opacity: 0.7 }} />
            <MockBubble emoji="❤️" style={{ left: "70%", bottom: 20, opacity: 0.85 }} />
            <MockBubble emoji="👏" style={{ left: "30%", bottom: 70, opacity: 0.5 }} />
            <MockBubble emoji="😭" style={{ left: "80%", bottom: 65, opacity: 0.6 }} />
            <MockTextBubble text="답변 미쳤다 ㅋㅋ" style={{ left: "8%", bottom: 50, opacity: 0.8 }} />
            <MockTextBubble text="솔직해서 좋아요" style={{ left: "50%", bottom: 85, opacity: 0.55 }} />
            {/* FAB 미니 */}
            <Box sx={{ position: "absolute", right: 8, bottom: 8, width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, rgba(124,58,237,0.90), rgba(236,72,153,0.85))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>
              <Typography sx={{ fontSize: 18, lineHeight: 1 }}>😆</Typography>
            </Box>
          </Box>
        </FeatureSection>
      </Stack>

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
