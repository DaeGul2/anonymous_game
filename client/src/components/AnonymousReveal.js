// src/components/AnonymousReveal.js
import React from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

export default function AnonymousReveal({ question, answers }) {
  const list = Array.isArray(answers) ? answers : [];

  return (
    <Box className="section">
      <Paper className="glassCard" sx={{ p: 2 }}>
        <Typography className="subtle" sx={{ fontSize: 12 }}>
          질문
        </Typography>

        <Box
          sx={{
            mt: 1,
            p: 1.4,
            borderRadius: 4,
            background:
              "linear-gradient(135deg, rgba(236,72,153,0.20), rgba(139,92,246,0.20))",
            border: "1px solid rgba(255,255,255,0.65)",
          }}
        >
          <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
            {question?.text || "-"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
          <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
            익명 답변
          </Typography>
          <Chip
            size="small"
            label={`${list.length}개`}
            sx={{ fontWeight: 900, borderRadius: 999, opacity: 0.85 }}
          />
        </Stack>

        <Stack spacing={1.1} sx={{ mt: 1.25 }}>
          {list.map((a, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.25,
                borderRadius: 4,
                background: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.65)",
              }}
            >
              <Typography className="subtle" sx={{ fontSize: 11, mb: 0.5 }}>
                익명 {idx + 1}
              </Typography>
              <Typography fontWeight={800} sx={{ whiteSpace: "pre-wrap" }}>
                {a || "(내용 없음)"}
              </Typography>
            </Box>
          ))}

          {list.length === 0 && (
            <Box
              sx={{
                p: 1.25,
                borderRadius: 4,
                background: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.65)",
              }}
            >
              <Typography fontWeight={800}>제출된 답변이 없습니다.</Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
