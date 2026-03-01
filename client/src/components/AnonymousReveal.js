// src/components/AnonymousReveal.js
import React, { useRef } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

const CARD_GRADIENTS = [
  ["rgba(251,191,36,0.28)", "rgba(249,115,22,0.12)"],
  ["rgba(52,211,153,0.28)",  "rgba(16,185,129,0.12)"],
  ["rgba(96,165,250,0.28)",  "rgba(139,92,246,0.12)"],
  ["rgba(244,114,182,0.28)", "rgba(236,72,153,0.12)"],
  ["rgba(167,243,208,0.32)", "rgba(52,211,153,0.12)"],
  ["rgba(196,181,253,0.30)", "rgba(124,58,237,0.12)"],
];

const CARD_ACCENT_COLORS = [
  "rgba(251,191,36,0.7)",
  "rgba(52,211,153,0.7)",
  "rgba(96,165,250,0.7)",
  "rgba(244,114,182,0.7)",
  "rgba(167,243,208,0.7)",
  "rgba(196,181,253,0.7)",
];

const POSTIT_COLORS = [
  { bg: "rgba(254,240,138,0.93)", border: "rgba(250,204,21,0.40)", text: "rgba(161,98,7,0.60)" },
  { bg: "rgba(167,243,208,0.90)", border: "rgba(52,211,153,0.40)", text: "rgba(6,95,70,0.55)" },
  { bg: "rgba(191,219,254,0.90)", border: "rgba(96,165,250,0.40)", text: "rgba(30,64,175,0.55)" },
  { bg: "rgba(252,205,211,0.90)", border: "rgba(251,113,133,0.40)", text: "rgba(159,18,57,0.50)" },
  { bg: "rgba(221,214,254,0.90)", border: "rgba(167,139,250,0.40)", text: "rgba(91,33,182,0.55)" },
  { bg: "rgba(254,215,170,0.90)", border: "rgba(251,146,60,0.40)", text: "rgba(154,52,18,0.55)" },
];

const EMOJIS = ["🐻", "🦊", "🐼", "🐸", "🐯", "🦋", "🐧", "🐰", "🦄", "🐙"];

const PEEL_VARIANTS = [
  { anim: "postItTear1", dur: 1.6 },
  { anim: "postItTear2", dur: 2.0 },
  { anim: "postItTear3", dur: 2.6 },
];

/** 포스트잇 내부 (가로 레이아웃: 절취선 | 본문 | 손잡이→) */
function PostItInner({ postit, isHost, idx, isOverlay }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ height: "100%", minHeight: 64 }}>
      {/* 왼쪽 절취선 */}
      <Box sx={{ alignSelf: "stretch", borderRight: `2px dashed ${postit.text}`, opacity: 0.25, ml: 1.2 }} />

      {/* 가운데 본문 */}
      <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="center" sx={{ flex: 1, py: 1.6, px: 1.5 }}>
        <Typography sx={{ fontSize: 22 }}>🃏</Typography>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 14, color: postit.text, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            {isOverlay ? "공개 중..." : isHost ? "터치하여 공개" : "방장이 공개 중..."}
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 11, color: postit.text, opacity: 0.55, letterSpacing: "0.02em" }}>
            답변 #{idx + 1}
          </Typography>
        </Box>
      </Stack>

      {/* 오른쪽 손잡이 (← 방향으로 뜯기) */}
      <Box
        sx={{
          alignSelf: "stretch",
          borderLeft: `1.5px dashed ${postit.text}`,
          opacity: 0.25,
          mr: 1.2,
          display: "flex",
          alignItems: "center",
          pl: 0.8, pr: 0.5,
          ...(!isOverlay && isHost ? { animation: "handlePull 1.5s ease-in-out infinite" } : {}),
        }}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 800, color: postit.text, opacity: 0.65, whiteSpace: "nowrap" }}>
          {isOverlay ? "←" : isHost ? "← 뜯기" : "←"}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function AnonymousReveal({ question, answers, revealedCards = [], isHost, onRevealCard }) {
  const list = Array.isArray(answers) ? answers : [];
  const revealedSet = new Set(revealedCards);

  const initialRevealedRef = useRef(null);
  if (initialRevealedRef.current === null) {
    initialRevealedRef.current = new Set(revealedCards);
  }

  return (
    <Box className="section" sx={{ animation: "slideUp 0.4s var(--ease-out) both" }}>
      {/* 질문 카드 */}
      <Paper
        className="glassCard"
        sx={{
          p: 0, mb: 1.5, overflow: "hidden", position: "relative",
          background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(236,72,153,0.18), rgba(96,165,250,0.14)) !important",
          border: "1.5px solid rgba(124,58,237,0.30) !important",
          animation: "questionPulse 3s ease-in-out infinite",
        }}
      >
        <Box sx={{ height: 3, background: "linear-gradient(90deg, #7C3AED, #EC4899, #3B82F6, #7C3AED)", backgroundSize: "200% 100%", animation: "bgShift 3s linear infinite" }} />
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(124,58,237,0.35)", animation: "pulseBeat 2s ease-in-out infinite" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>Q</span>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 13, color: "var(--text-2)", letterSpacing: "-0.01em" }}>이 라운드의 질문</Typography>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", animation: "pulseBeat 1.5s ease-in-out infinite", opacity: 0.6 }} />
          </Stack>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: 19, sm: 22 }, letterSpacing: "-0.03em", lineHeight: 1.32, color: "var(--text-1)", wordBreak: "keep-all" }}>
            {question?.text || "-"}
          </Typography>
        </Box>
      </Paper>

      {/* 답변 헤더 */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5, mb: 1 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>🎭 익명의 답변들</Typography>
        <Chip size="small" label={`${revealedSet.size}/${list.length}`} sx={{ fontWeight: 900, borderRadius: 999, fontSize: 12, background: "rgba(124,58,237,0.12)", color: "var(--c-primary)" }} />
      </Stack>

      {/* 답변 카드들 */}
      <Stack spacing={1.2}>
        {list.length === 0 && (
          <Paper className="glassCard" sx={{ p: 2.5, textAlign: "center", animation: "popIn 0.5s var(--spring) both" }}>
            <Typography sx={{ fontSize: 32 }}>🦗</Typography>
            <Typography sx={{ fontWeight: 700, color: "var(--text-2)", mt: 0.8 }}>제출된 답변이 없어요</Typography>
          </Paper>
        )}

        {list.map((text, idx) => {
          const isRevealed = revealedSet.has(idx);
          const [from, to] = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
          const accent = CARD_ACCENT_COLORS[idx % CARD_ACCENT_COLORS.length];
          const postit = POSTIT_COLORS[idx % POSTIT_COLORS.length];
          const emoji = EMOJIS[idx % EMOJIS.length];

          /* ── 미공개: 포스트잇이 카드를 가림 ── */
          if (!isRevealed) {
            return (
              <Paper
                key={idx}
                className="glassCard"
                onClick={isHost && onRevealCard ? () => onRevealCard(idx) : undefined}
                sx={{
                  p: 0, overflow: "hidden", display: "flex", flexDirection: "column",
                  background: `${postit.bg} !important`,
                  border: `1.5px solid ${postit.border} !important`,
                  cursor: isHost ? "pointer" : "default",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  animation: "revealCard 0.55s var(--spring) both",
                  animationDelay: `${idx * 0.08}s`,
                  opacity: 0, userSelect: "none",
                  "&:hover": isHost ? { transform: "scale(1.02) translateY(-2px)", boxShadow: "0 8px 28px rgba(0,0,0,0.10) !important", border: `1.5px solid ${postit.text} !important` } : {},
                  "&:active": isHost ? { transform: "scale(0.97)", transition: "all 0.1s ease" } : {},
                }}
              >
                <PostItInner postit={postit} isHost={isHost} idx={idx} isOverlay={false} />
              </Paper>
            );
          }

          /* ── 공개됨: 카드 앞면 + 포스트잇 우→좌 뜯기 ── */
          const isFreshReveal = !initialRevealedRef.current.has(idx);
          const peel = PEEL_VARIANTS[(idx * 17 + 13) % 3];

          return (
            <Paper
              key={idx}
              className="glassCard"
              sx={{
                p: 2, position: "relative", overflow: "hidden",
                background: `linear-gradient(135deg, ${from}, ${to}) !important`,
                border: `1px solid ${accent} !important`,
                zIndex: isFreshReveal ? 5 : 1,
              }}
            >
              {/* 상단 악센트 */}
              <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.6 }} />

              {/* 글로우 플래시 — 텍스트 공개 시점에 카드 뒤에서 번쩍 */}
              {isFreshReveal && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: "inherit",
                    background: `radial-gradient(ellipse at center, ${accent}, transparent 70%)`,
                    opacity: 0,
                    animation: `cardFlash 0.6s ease ${peel.dur * 0.76}s both`,
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* 앞면 내용 — 다 뜯긴 후에만 보임 */}
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="flex-start"
                sx={{
                  ...(isFreshReveal ? {
                    opacity: 0,
                    animation: `contentReveal 0.5s var(--spring) ${peel.dur * 0.78}s forwards`,
                  } : {}),
                }}
              >
                <Box
                  sx={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "rgba(255,255,255,0.72)",
                    border: "1.5px solid rgba(255,255,255,0.92)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flex: "0 0 auto", fontSize: 19,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    ...(isFreshReveal ? { animation: `checkPop 0.5s var(--spring) ${peel.dur * 0.82}s both` } : {}),
                  }}
                >
                  {emoji}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", mb: 0.3, letterSpacing: "0.02em" }}>
                    익명 {idx + 1}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 16 }, letterSpacing: "-0.02em", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {text || "(내용 없음)"}
                  </Typography>
                </Box>
              </Stack>

              {/* ── 포스트잇 오버레이 (우→좌 뜯기) ── */}
              {isFreshReveal && (
                <Box
                  sx={{
                    position: "absolute", inset: 0,
                    borderRadius: "inherit",
                    background: postit.bg,
                    border: `1.5px solid ${postit.border}`,
                    animation: `${peel.anim} ${peel.dur}s ease-in-out forwards`,
                    zIndex: 3,
                    overflow: "hidden",
                    display: "flex", flexDirection: "column",
                    willChange: "transform, opacity",
                  }}
                >
                  <PostItInner postit={postit} isHost={false} idx={idx} isOverlay />
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
