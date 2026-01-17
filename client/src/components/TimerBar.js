// src/components/TimerBar.js
import React, { useEffect, useMemo, useState } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import { formatMMSS, msLeft } from "../utils/time";

export default function TimerBar({ deadlineAt, totalSeconds }) {
  const totalMs = useMemo(() => Math.max(1, (totalSeconds || 1) * 1000), [totalSeconds]);
  const [left, setLeft] = useState(() => msLeft(deadlineAt));

  useEffect(() => {
    const id = setInterval(() => setLeft(msLeft(deadlineAt)), 250);
    return () => clearInterval(id);
  }, [deadlineAt]);

  const pct = Math.max(0, Math.min(100, (left / totalMs) * 100));

  return (
    <Box sx={{ mt: 1, mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2">남은시간</Typography>
        <Typography variant="body2" fontWeight={700}>{formatMMSS(left)}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} />
    </Box>
  );
}
