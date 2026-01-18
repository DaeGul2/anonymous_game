// src/pages/RoomLobbyPage.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ReadyPanel from "../components/ReadyPanel";
import { useRoomStore } from "../state/useRoomStore";

export default function RoomLobbyPage() {
  const { code } = useParams();
  const nav = useNavigate();
  const {
    initSocket,
    roomJoin,
    roomRejoin,
    roomReady,
    roomLeave,
    state,
    guest_id,
    error,
  } = useRoomStore();

  const [nickname, setNickname] = useState("");

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // 우선 재접속 시도 → 없으면 조인 시도(닉네임 필요)
  useEffect(() => {
    if (!code) return;
    roomRejoin({ code: code.toUpperCase() });
  }, [code, roomRejoin]);

  // phase가 lobby가 아니면 game 화면으로
  useEffect(() => {
    if (!state?.room) return;
    if (state.room.phase && state.room.phase !== "lobby") {
      nav(`/game/${state.room.code}`);
    }
  }, [state, nav]);

  const myPlayer = useMemo(() => {
    const players = state?.players || [];
    return players.find((p) => p.guest_id === guest_id) || null;
  }, [state, guest_id]);

  const doJoin = () => {
    roomJoin({ code: code.toUpperCase(), nickname });
  };

  const onExit = () => {
    roomLeave();
    nav("/");
  };

  return (
    <Box className="appShell">
      {/* Header */}
      <Box className="pageHeader">
        <Box>
          <Typography className="pageTitle">
            로비{" "}
            <Typography component="span" className="subtle" sx={{ fontSize: 14 }}>
              {code ? `(${code.toUpperCase()})` : ""}
            </Typography>
          </Typography>
          <Typography className="subtle" sx={{ mt: 0.25 }}>
            준비 상태를 설정하고 시작을 기다립니다.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            onClick={onExit}
            className="tap"
            sx={{
              border: "1px solid rgba(255,255,255,0.65)",
              background: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(12px)",
            }}
          >
            ✕
          </IconButton>
        </Stack>
      </Box>

      {/* Error */}
      {error && (
        <Paper className="glassCard section" sx={{ p: 2 }}>
          <Typography color="error" fontWeight={900}>
            {error}
          </Typography>
        </Paper>
      )}

      {/* Not joined yet */}
      {!state?.room && (
        <Paper className="glassCard section" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
              입장 정보 입력
            </Typography>
            <Chip size="small" label="입장" sx={{ fontWeight: 900, opacity: 0.85 }} />
          </Stack>

          <Stack spacing={1.25} sx={{ mt: 1.5 }}>
            <TextField
              label="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              inputProps={{ maxLength: 20 }}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={doJoin}
              className="tap"
              disabled={!nickname.trim() || !code}
              fullWidth
            >
              입장하기
            </Button>

            <Typography className="subtle" sx={{ fontSize: 12 }}>
              이전에 참여한 기기라면 자동으로 재접속될 수 있습니다.
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* Joined */}
      {state?.room && (
        <>
          {/* Room info */}
          <Paper className="glassCard section" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(236,72,153,0.55), rgba(139,92,246,0.55), rgba(59,130,246,0.35))",
                  border: "1px solid rgba(255,255,255,0.55)",
                  boxShadow: "0 10px 24px rgba(17,24,39,0.08)",
                  flex: "0 0 auto",
                }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
                  {state.room.title}
                </Typography>
                <Typography className="subtle" sx={{ fontSize: 12, mt: 0.4 }}>
                  인원 {state.players?.length || 0}/{state.room.max_players} · 상태{" "}
                  {state.room.phase}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={state.room.phase || "lobby"}
                sx={{ fontWeight: 900, opacity: 0.85, borderRadius: 999 }}
              />
            </Stack>
          </Paper>

          {/* Players */}
          <Paper className="glassCard section" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
                참여자
              </Typography>
              <Chip
                size="small"
                label={`${state.players?.length || 0}명`}
                sx={{ fontWeight: 900, opacity: 0.85 }}
              />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.25 }}>
              {(state.players || []).map((p) => {
                const isHost = p.id === state.room.host_player_id;
                const isMe = p.guest_id === guest_id;
                return (
                  <Chip
                    key={p.id}
                    label={`${p.nickname}${isHost ? " (방장)" : ""}${
                      p.is_ready ? " · 준비" : ""
                    }${isMe ? " · 나" : ""}`}
                    variant={p.is_connected ? "filled" : "outlined"}
                    sx={{
                      fontWeight: 900,
                      borderRadius: 999,
                      opacity: p.is_connected ? 1 : 0.7,
                    }}
                  />
                );
              })}
            </Stack>

            <ReadyPanel isReady={!!myPlayer?.is_ready} onToggle={(v) => roomReady(v)} />

            <Typography className="subtle" sx={{ fontSize: 12, mt: 1 }}>
              전원이 준비 완료되면 게임이 자동으로 시작됩니다.
            </Typography>
          </Paper>

          <Box className="bottomBar section">
            <Typography className="subtle" sx={{ fontSize: 12 }}>
              연결이 끊겨도 다시 입장하면 진행 상태가 복구될 수 있습니다.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
