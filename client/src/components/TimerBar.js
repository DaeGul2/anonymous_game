// src/components/TimerBar.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { formatMMSS, msLeft } from "../utils/time";

export default function TimerBar({ deadlineAt, totalSeconds }) {
  const totalMs = useMemo(() => Math.max(1, (totalSeconds || 1) * 1000), [totalSeconds]);
  const [left, setLeft] = useState(() => msLeft(deadlineAt));
  const wrapRef = useRef(null);
  const prevDangerRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setLeft(msLeft(deadlineAt)), 200);
    return () => clearInterval(id);
  }, [deadlineAt]);

  const pct       = Math.max(0, Math.min(100, (left / totalMs) * 100));
  const isDanger  = left <= 15_000;
  const isWarning = left <= 30_000 && !isDanger;

  // 15초 진입 시 한 번만 shake 트리거
  useEffect(() => {
    if (isDanger && !prevDangerRef.current && wrapRef.current) {
      wrapRef.current.style.animation = "none";
      void wrapRef.current.offsetHeight; // reflow
      wrapRef.current.style.animation = "shake 0.55s ease";
    }
    prevDangerRef.current = isDanger;
  }, [isDanger]);

  const barColor = isDanger
    ? "linear-gradient(90deg, #EF4444, #F97316, #EF4444)"
    : isWarning
    ? "linear-gradient(90deg, #F59E0B, #EF4444)"
    : "linear-gradient(90deg, #7C3AED, #EC4899, #3B82F6)";

  const timeColor = isDanger ? "#EF4444" : isWarning ? "#D97706" : "var(--text-1)";

  return (
    <Box sx={{ mt: 1.5 }} ref={wrapRef}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
          남은 시간
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          {isDanger && (
            <Box sx={{
              width: 8, height: 8, borderRadius: "50%", background: "#EF4444",
              animation: "pulseBeat 0.65s ease-in-out infinite",
            }} />
          )}
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: "-0.04em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              color: timeColor,
              transition: "color 0.4s ease",
              ...(isDanger && { animation: "pulseBeat 0.65s ease-in-out infinite" }),
            }}
          >
            {formatMMSS(left)}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          height: 10,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0, top: 0, bottom: 0,
            width: `${pct}%`,
            borderRadius: 999,
            background: barColor,
            backgroundSize: "200% 100%",
            transition: "width 0.22s linear, background 0.5s ease",
            ...(isDanger && { animation: "bgShift 1.2s linear infinite" }),
          }}
        />
      </Box>

      {isDanger && (
        <Typography
          sx={{
            fontSize: 12, fontWeight: 900, color: "#EF4444",
            mt: 0.8, textAlign: "center", letterSpacing: "0.04em",
            animation: "pulseBeat 0.5s ease-in-out infinite",
          }}
        >
          ⚡ 마감 임박! 서두르세요!
        </Typography>
      )}
    </Box>
  );
}
