// src/components/ReadyPanel.js
import React from "react";
import { Box, Typography } from "@mui/material";

export default function ReadyPanel({ isReady, onToggle }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Box
        onClick={() => onToggle(!isReady)}
        sx={{
          width: "100%",
          minHeight: 58,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.2,
          cursor: "pointer",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          fontWeight: 900,
          fontSize: 17,
          letterSpacing: "-0.02em",
          transition: "all 0.22s var(--spring)",
          border: "2px solid",
          ...(isReady
            ? {
                background: "linear-gradient(135deg, #10B981, #34D399)",
                borderColor: "rgba(16,185,129,0.4)",
                color: "#fff",
                boxShadow: "0 6px 24px rgba(16,185,129,0.40)",
                transform: "scale(1.02)",
              }
            : {
                background: "rgba(255,255,255,0.55)",
                borderColor: "rgba(124,58,237,0.25)",
                color: "var(--text-2)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                animation: "pulseBeat 2.5s ease-in-out infinite",
              }),
          "&:active": { transform: isReady ? "scale(0.97)" : "scale(0.98)" },
        }}
      >
        <Typography component="span" sx={{ fontSize: 22 }}>
          {isReady ? "✅" : "⬜"}
        </Typography>
        <Typography
          component="span"
          sx={{ fontWeight: 900, fontSize: 17, letterSpacing: "-0.02em" }}
        >
          {isReady ? "준비 완료!" : "준비하기"}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: 11, fontWeight: 600, color: "var(--text-3)",
          textAlign: "center", mt: 0.9,
        }}
      >
        {isReady ? "탭하면 준비 취소" : "탭하면 준비 완료"}
      </Typography>
    </Box>
  );
}
