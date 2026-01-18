// src/components/CreateRoomModal.js
import React, { useMemo, useState } from "react";
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

export default function CreateRoomModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [nickname, setNickname] = useState("");

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const safeMaxPlayers = useMemo(() => {
    const n = Number(maxPlayers);
    if (!Number.isFinite(n)) return 8;
    return Math.max(2, Math.min(20, n));
  }, [maxPlayers]);

  const submit = () =>
    onSubmit({
      title: title.trim(),
      max_players: safeMaxPlayers || 8,
      nickname: nickname.trim(),
    });

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
          방 만들기
        </Typography>
        <Typography className="subtle" sx={{ fontSize: 12, mt: 0.4 }}>
          방장 닉네임은 바꾸기 어렵다. 보통 인생도 그렇다.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, pb: 2 }}>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="방 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 40 }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <TextField
              label="최대 인원"
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              fullWidth
              inputProps={{ min: 2, max: 20 }}
            />
            <TextField
              label="내 닉네임(방장)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 20 }}
            />
          </Stack>

          <Paper
            sx={{
              p: 1.4,
              borderRadius: 3,
              background: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.55)",
            }}
          >
            <Typography className="subtle" sx={{ fontSize: 12 }}>
              - 같은 방 내 닉네임 중복 불가<br />
              - 서버 타이머 기준<br />
              - 방치 방 자동 삭제
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
          disabled={!title.trim() || !nickname.trim()}
        >
          생성 →
        </Button>
      </DialogActions>
    </Dialog>
  );
}
