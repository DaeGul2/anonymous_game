// src/components/CreateRoomModal.js
import React, { useMemo, useState } from "react";
import {
  Box, Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle,
  Slider, Stack, TextField, Typography, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AvatarPicker from "./AvatarPicker";
import { loadSavedAvatar, saveAvatarChoice } from "../constants/avatars";

export default function CreateRoomModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [nickname, setNickname] = useState("");
  const [avatarIdx, setAvatarIdx] = useState(loadSavedAvatar);

  // AI 포함 방 옵션
  const [aiSectionOpen, setAiSectionOpen] = useState(false);
  const [aiCode, setAiCode] = useState("");
  const [aiCount, setAiCount] = useState(1);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const isAiMode = aiSectionOpen && aiCode.trim().length > 0;

  const safeMaxPlayers = useMemo(() => {
    const n = Number(maxPlayers);
    if (!Number.isFinite(n)) return 8;
    if (isAiMode) return Math.max(aiCount + 2, Math.min(20, n));
    return Math.max(2, Math.min(20, n));
  }, [maxPlayers, isAiMode, aiCount]);

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
      ...(isAiMode && {
        ai_secret_key: aiCode.trim(),
        ai_player_count: aiCount,
      }),
    });

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "var(--radius-lg)",
      fontWeight: 700,
      "& fieldset": { border: "1px solid rgba(124,58,237,0.25)" },
      "&:hover fieldset": { border: "1px solid rgba(124,58,237,0.45)" },
      "&.Mui-focused fieldset": { border: "1.5px solid rgba(124,58,237,0.7)" },
    },
  };

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
            sx={inputSx}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <TextField
              label={isAiMode ? `총 인원 (인간 ${safeMaxPlayers - aiCount}명 + AI ${aiCount}명)` : "최대 인원"}
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              fullWidth
              inputProps={{ min: isAiMode ? aiCount + 2 : 2, max: 20 }}
              sx={inputSx}
            />
            <TextField
              label="방장 닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 20 }}
              sx={inputSx}
            />
          </Stack>

          {/* AI 포함 방 섹션 토글 */}
          <Box>
            <Button
              size="small"
              onClick={() => setAiSectionOpen((v) => !v)}
              sx={{
                fontWeight: 800,
                fontSize: 12,
                borderRadius: 999,
                px: 1.8,
                py: 0.6,
                color: aiSectionOpen ? "var(--c-primary)" : "var(--text-2)",
                background: aiSectionOpen
                  ? "rgba(124,58,237,0.10)"
                  : "rgba(0,0,0,0.04)",
                border: aiSectionOpen
                  ? "1px solid rgba(124,58,237,0.30)"
                  : "1px solid rgba(0,0,0,0.10)",
                transition: "all 0.15s ease",
              }}
            >
              {aiSectionOpen ? "▲ AI 포함 옵션 닫기" : "🤖 AI 포함 방으로 만들기"}
            </Button>
          </Box>

          {/* AI 옵션 펼침 */}
          <Collapse in={aiSectionOpen}>
            <Box
              sx={{
                p: 1.8,
                borderRadius: "var(--radius-lg)",
                background: "rgba(124,58,237,0.06)",
                border: "1px solid rgba(124,58,237,0.18)",
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", mb: 0.8 }}>
                    AI 코드를 입력하면 AI 포함 방이 생성됩니다.
                    <br />
                    총 인원 중 AI가 자리를 차지하고, 나머지가 인간 자리입니다.
                  </Typography>
                  <TextField
                    label="AI 코드"
                    type="password"
                    value={aiCode}
                    onChange={(e) => setAiCode(e.target.value)}
                    fullWidth
                    inputProps={{ maxLength: 80 }}
                    placeholder="AI 코드를 입력하세요"
                    sx={inputSx}
                  />
                </Box>

                {/* AI 수 슬라이더 (코드 입력 시에만 표시) */}
                {aiCode.trim().length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.5 }}>
                      AI 플레이어 수: <span style={{ color: "var(--c-primary)" }}>{aiCount}명</span>
                    </Typography>
                    <Slider
                      value={aiCount}
                      onChange={(_, v) => setAiCount(v)}
                      min={1}
                      max={3}
                      step={1}
                      marks={[
                        { value: 1, label: "1명" },
                        { value: 2, label: "2명" },
                        { value: 3, label: "3명" },
                      ]}
                      sx={{
                        color: "var(--c-primary)",
                        "& .MuiSlider-markLabel": { fontSize: 11, fontWeight: 700 },
                      }}
                    />
                    <Typography sx={{ fontSize: 11, color: "var(--text-3)", mt: 0.5 }}>
                      총 {safeMaxPlayers}명 중 인간 {safeMaxPlayers - aiCount}명 + AI {aiCount}명
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Collapse>

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
          {isAiMode ? "🤖 AI 방 만들기" : "방 만들기 🚀"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
