// src/components/AnonymousReveal.js
import React from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

const CARD_GRADIENTS = [
  ["rgba(251,191,36,0.28)", "rgba(249,115,22,0.12)"],
  ["rgba(52,211,153,0.28)",  "rgba(16,185,129,0.12)"],
  ["rgba(96,165,250,0.28)",  "rgba(139,92,246,0.12)"],
  ["rgba(244,114,182,0.28)", "rgba(236,72,153,0.12)"],
  ["rgba(167,243,208,0.32)", "rgba(52,211,153,0.12)"],
  ["rgba(196,181,253,0.30)", "rgba(124,58,237,0.12)"],
];

const EMOJIS = ["🐻", "🦊", "🐼", "🐸", "🐯", "🦋", "🐧", "🐰", "🦄", "🐙"];

export default function AnonymousReveal({ question, answers }) {
  const list = Array.isArray(answers) ? answers : [];

  return (
    <Box className="section" sx={{ animation: "slideUp 0.4s var(--ease-out) both" }}>
      {/* 질문 카드 */}
      <Paper
        className="glassCard"
        sx={{
          p: 2.5,
          mb: 1.5,
          background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.14)) !important",
          border: "1px solid rgba(124,58,237,0.25) !important",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
          <Box
            sx={{
              width: 28, height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7C3AED, #EC4899)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>Q</span>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 13, color: "var(--text-2)", letterSpacing: "-0.01em" }}>
            이 라운드의 질문
          </Typography>
        </Stack>

        <Typography
          sx={{
            fontWeight: 900,
            fontSize: { xs: 18, sm: 20 },
            letterSpacing: "-0.03em",
            lineHeight: 1.28,
            color: "var(--text-1)",
            wordBreak: "keep-all",
          }}
        >
          {question?.text || "-"}
        </Typography>
      </Paper>

      {/* 답변 헤더 */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5, mb: 1 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>
          🎭 익명의 답변들
        </Typography>
        <Chip
          size="small"
          label={`${list.length}개`}
          sx={{
            fontWeight: 900, borderRadius: 999, fontSize: 12,
            background: "rgba(124,58,237,0.12)", color: "var(--c-primary)",
          }}
        />
      </Stack>

      {/* 답변 카드들 */}
      <Stack spacing={1.2}>
        {list.length === 0 && (
          <Paper
            className="glassCard"
            sx={{ p: 2.5, textAlign: "center", animation: "popIn 0.5s var(--spring) both" }}
          >
            <Typography sx={{ fontSize: 32 }}>🦗</Typography>
            <Typography sx={{ fontWeight: 700, color: "var(--text-2)", mt: 0.8 }}>
              제출된 답변이 없어요
            </Typography>
          </Paper>
        )}

        {list.map((text, idx) => {
          const [from, to] = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
          const emoji = EMOJIS[idx % EMOJIS.length];

          return (
            <Paper
              key={idx}
              className="glassCard"
              sx={{
                p: 2,
                background: `linear-gradient(135deg, ${from}, ${to}) !important`,
                animation: "revealCard 0.55s var(--spring) both",
                animationDelay: `${idx * 0.13}s`,
                opacity: 0,
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 36, height: 36,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(255,255,255,0.88)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flex: "0 0 auto",
                    fontSize: 18,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}
                >
                  {emoji}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", mb: 0.3, letterSpacing: "0.02em" }}>
                    익명 {idx + 1}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: 15, sm: 16 },
                      letterSpacing: "-0.02em",
                      lineHeight: 1.45,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {text || "(내용 없음)"}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
