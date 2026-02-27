// src/components/ShareButton.js
import React, { useState } from "react";
import { Box, Typography } from "@mui/material";

export default function ShareButton({ url, title, text, label = "친구 초대하기", icon = "🔗", fullWidth = true }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // 모바일: Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // 유저가 취소한 경우 — fallback으로 복사
      }
    }

    // 데스크톱 / fallback: 클립보드 복사
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Box
      onClick={handleShare}
      sx={{
        width: fullWidth ? "100%" : "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 1.4,
        px: 2.5,
        borderRadius: 999,
        background: copied
          ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(52,211,153,0.08))"
          : "rgba(255,255,255,0.55)",
        border: copied
          ? "1.5px solid rgba(16,185,129,0.35)"
          : "1.5px solid rgba(124,58,237,0.2)",
        cursor: "pointer",
        userSelect: "none",
        transition: "all 0.2s ease",
        "&:active": { transform: "scale(0.96)" },
      }}
    >
      <Typography sx={{ fontSize: 18, lineHeight: 1 }}>
        {copied ? "✅" : icon}
      </Typography>
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 800,
          color: copied ? "#059669" : "var(--c-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {copied ? "링크 복사됨!" : label}
      </Typography>
    </Box>
  );
}
