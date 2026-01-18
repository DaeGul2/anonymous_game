// src/components/ReadyPanel.js
import React from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";

export default function ReadyPanel({ isReady, onToggle }) {
  return (
    <Paper
      sx={{
        mt: 2,
        p: 1.5,
        borderRadius: 3,
        background: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(255,255,255,0.55)",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Box>
          <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
            내 상태
          </Typography>
          <Typography className="subtle" sx={{ fontSize: 12, mt: 0.25 }}>
            준비 상태는 서버 기준으로 반영됩니다.
          </Typography>
        </Box>

        <Chip
          size="small"
          label={isReady ? "준비 완료" : "대기"}
          sx={{ fontWeight: 900, borderRadius: 999, opacity: 0.9 }}
        />
      </Stack>

      <Box sx={{ mt: 1.2 }}>
        <Button
          fullWidth
          className="tap"
          variant={isReady ? "outlined" : "contained"}
          onClick={() => onToggle(!isReady)}
        >
          {isReady ? "준비 취소" : "준비 완료"}
        </Button>
      </Box>
    </Paper>
  );
}
