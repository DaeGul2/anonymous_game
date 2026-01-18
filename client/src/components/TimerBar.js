// src/components/TimerBar.js
import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { formatMMSS, msLeft } from "../utils/time";

export default function TimerBar({ deadlineAt, totalSeconds }) {
  const totalMs = useMemo(
    () => Math.max(1, (totalSeconds || 1) * 1000),
    [totalSeconds]
  );
  const [left, setLeft] = useState(() => msLeft(deadlineAt));

  useEffect(() => {
    const id = setInterval(() => setLeft(msLeft(deadlineAt)), 250);
    return () => clearInterval(id);
  }, [deadlineAt]);

  const pct = Math.max(0, Math.min(100, (left / totalMs) * 100));
  const danger = left <= 10_000;

  return (
    <Box sx={{ mt: 1.3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
        <Typography className="subtle" sx={{ fontSize: 12 }}>
          남은시간
        </Typography>
        <Typography
          sx={{
            fontWeight: 950,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            color: danger ? "error.main" : "text.primary",
          }}
        >
          {formatMMSS(left)}
        </Typography>
      </Box>

      {/* pill progress */}
      <Box
        sx={{
          height: 12,
          borderRadius: 999,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.65)",
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Box
          sx={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: danger
              ? "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(245,158,11,0.9))"
              : "linear-gradient(135deg, rgba(236,72,153,0.85), rgba(139,92,246,0.85))",
            transition: "width 200ms linear",
          }}
        />
      </Box>

      <Typography className="subtle" sx={{ fontSize: 11, mt: 0.6 }}>
        기준은 서버. 클라는 그냥 보여주기만 함.
      </Typography>
    </Box>
  );
}
