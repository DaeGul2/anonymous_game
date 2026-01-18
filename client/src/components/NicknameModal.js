// src/components/NicknameModal.js
import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function NicknameModal({
  open,
  onClose,
  onSubmit,
  initialNickname = "",
  title = "닉네임 입력",
  helper = "같은 방에서는 닉네임이 중복될 수 없습니다.",
}) {
  const [nickname, setNickname] = useState(initialNickname || "");

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (open) setNickname(initialNickname || "");
  }, [open, initialNickname]);

  const submit = () => onSubmit?.(nickname.trim());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      PaperProps={{
        className: "glassCard",
        sx: { borderRadius: fullScreen ? 0 : 4, overflow: "hidden" },
      }}
    >
      <DialogTitle sx={{ pb: 1.2 }}>
        <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
          {title}
        </Typography>
        <Typography className="subtle" sx={{ fontSize: 12, mt: 0.4 }}>
          {helper}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            inputProps={{ maxLength: 20 }}
          />

          <Paper
            sx={{
              p: 1.4,
              borderRadius: 3,
              background: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.55)",
            }}
          >
            <Typography className="subtle" sx={{ fontSize: 12 }}>
              - 20자 이내 권장<br />
              - 특수문자는 일부 환경에서 표시가 제한될 수 있음
            </Typography>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions className="modalActions" sx={{ p: 2 }}>
        <Button onClick={onClose} className="tap">
          닫기
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          className="tap"
          disabled={!nickname.trim()}
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
}
