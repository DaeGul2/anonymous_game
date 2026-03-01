// src/components/Footer.js
import React from "react";
import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 2.5,
        px: 2,
        textAlign: "center",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
        <Typography
          component="a"
          href="/privacy"
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-3)",
            textDecoration: "none",
            "&:hover": { color: "var(--c-primary)", textDecoration: "underline" },
          }}
        >
          개인정보처리방침
        </Typography>
        <Typography sx={{ fontSize: 11, color: "var(--text-3)" }}>|</Typography>
        <Typography
          component="a"
          href="/terms"
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-3)",
            textDecoration: "none",
            "&:hover": { color: "var(--c-primary)", textDecoration: "underline" },
          }}
        >
          이용약관
        </Typography>
        <Typography sx={{ fontSize: 11, color: "var(--text-3)" }}>|</Typography>
        <Typography
          component="a"
          href="mailto:min@insabr.kr"
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-3)",
            textDecoration: "none",
            "&:hover": { color: "var(--c-primary)", textDecoration: "underline" },
          }}
        >
          문의
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", mt: 0.8, opacity: 0.6 }}>
        &copy; 2026 익명게임
      </Typography>
    </Box>
  );
}
