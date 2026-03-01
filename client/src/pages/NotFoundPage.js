// src/pages/NotFoundPage.js
import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "60dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        textAlign: "center",
        gap: 2,
        animation: "popIn 0.5s var(--spring) both",
      }}
    >
      <Typography sx={{ fontSize: 64, lineHeight: 1 }}>🔍</Typography>

      <Box>
        <Typography
          sx={{
            fontWeight: 950,
            fontSize: 28,
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: "var(--text-2)", mt: 0.5 }}>
          페이지를 찾을 수 없습니다
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 12, color: "var(--text-3)", mt: 0.5 }}>
          주소가 잘못되었거나, 삭제된 페이지예요
        </Typography>
      </Box>

      <Button
        variant="contained"
        onClick={() => navigate("/")}
        sx={{
          fontWeight: 900,
          fontSize: 15,
          borderRadius: 999,
          px: 4,
          py: 1.4,
          background: "linear-gradient(135deg, #7C3AED, #EC4899)",
          boxShadow: "0 6px 22px rgba(124,58,237,0.35)",
          "&:active": { transform: "scale(0.97)" },
          transition: "transform 0.12s ease",
          letterSpacing: "-0.01em",
        }}
      >
        홈으로 돌아가기
      </Button>
    </Box>
  );
}
