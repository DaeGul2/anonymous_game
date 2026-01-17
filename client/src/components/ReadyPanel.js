// src/components/ReadyPanel.js
import React from "react";
import { Box, Button, Typography } from "@mui/material";

export default function ReadyPanel({ isReady, onToggle }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
      <Typography variant="body2">
        내 상태: <b>{isReady ? "준비완료" : "대기"}</b>
      </Typography>
      <Button
        variant={isReady ? "outlined" : "contained"}
        onClick={() => onToggle(!isReady)}
      >
        {isReady ? "준비 취소" : "준비 완료"}
      </Button>
    </Box>
  );
}
