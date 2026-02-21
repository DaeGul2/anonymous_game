// src/components/CreateRoomModal.js
import React, { useMemo, useState } from "react";
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, TextField, Typography, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AvatarPicker from "./AvatarPicker";
import { loadSavedAvatar, saveAvatarChoice } from "../constants/avatars";

export default function CreateRoomModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [nickname, setNickname] = useState("");
  const [avatarIdx, setAvatarIdx] = useState(loadSavedAvatar);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const safeMaxPlayers = useMemo(() => {
    const n = Number(maxPlayers);
    if (!Number.isFinite(n)) return 8;
    return Math.max(2, Math.min(20, n));
  }, [maxPlayers]);

  const handleAvatarChange = (idx) => {
    setAvatarIdx(idx);
    saveAvatarChoice(idx);
  };

  const submit = () =>
    onSubmit({
      title: title.trim(),
      max_players: safeMaxPlayers || 8,
      nickname: nickname.trim(),
      avatar: avatarIdx,
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
        <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em", fontSize: 18 }}>
          방 만들기
        </Typography>
        <Typography className="subtle" sx={{ fontSize: 12, mt: 0.4 }}>
          방 정보와 닉네임, 캐릭터를 선택하세요
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, pb: 2 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* 아바타 선택 */}
          <AvatarPicker value={avatarIdx} onChange={handleAvatarChange} />

          {/* 방 제목 */}
          <TextField
            autoFocus
            label="방 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 40 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "var(--radius-lg)",
                fontWeight: 700,
                "& fieldset": { border: "1px solid rgba(124,58,237,0.25)" },
                "&:hover fieldset": { border: "1px solid rgba(124,58,237,0.45)" },
                "&.Mui-focused fieldset": { border: "1.5px solid rgba(124,58,237,0.7)" },
              },
            }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <TextField
              label="최대 인원"
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              fullWidth
              inputProps={{ min: 2, max: 20 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "var(--radius-lg)", fontWeight: 700,
                  "& fieldset": { border: "1px solid rgba(124,58,237,0.25)" },
                  "&.Mui-focused fieldset": { border: "1.5px solid rgba(124,58,237,0.7)" },
                },
              }}
            />
            <TextField
              label="방장 닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 20 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "var(--radius-lg)", fontWeight: 700,
                  "& fieldset": { border: "1px solid rgba(124,58,237,0.25)" },
                  "&.Mui-focused fieldset": { border: "1.5px solid rgba(124,58,237,0.7)" },
                },
              }}
            />
          </Stack>

          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", lineHeight: 1.6 }}>
            · 동일 방 내 닉네임 중복 불가&nbsp;&nbsp;· 제한 시간은 서버 기준&nbsp;&nbsp;· 비활성 방은 자동 종료
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            fontWeight: 800, fontSize: 14, borderRadius: 999, px: 2.5,
            color: "var(--text-2)",
          }}
        >
          닫기
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={!title.trim() || !nickname.trim()}
          sx={{
            fontWeight: 900, fontSize: 14, borderRadius: 999, px: 3, py: 1.2,
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
            "&:disabled": { opacity: 0.45 },
            "&:active": { transform: "scale(0.97)" },
            transition: "transform 0.12s ease",
          }}
        >
          방 만들기 🚀
        </Button>
      </DialogActions>
    </Dialog>
  );
}
