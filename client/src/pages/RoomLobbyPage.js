// src/pages/RoomLobbyPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Container, Paper, Stack, TextField, Typography } from "@mui/material";
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
    // guest_id는 서버 state에서 안 내려도 되지만 현재는 내려오고 있음
    return players.find((p) => p.guest_id === guest_id) || null;
  }, [state, guest_id]);

  const doJoin = () => {
    roomJoin({ code: code.toUpperCase(), nickname });
  };

  return (
    <Container sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          로비 {code ? `(${code.toUpperCase()})` : ""}
        </Typography>
        <Button color="error" variant="outlined" onClick={() => { roomLeave(); nav("/"); }}>
          나가기
        </Button>
      </Stack>

      {error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {!state?.room && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>입장(닉네임 필요)</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField label="내 닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <Button variant="contained" onClick={doJoin}>입장</Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            재접속이면 닉네임 없이도 붙어야 정상.
          </Typography>
        </Paper>
      )}

      {state?.room && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>{state.room.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              인원 {state.players?.length || 0}/{state.room.max_players} · phase: {state.room.phase}
            </Typography>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>참여자</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {(state.players || []).map((p) => (
                <Chip
                  key={p.id}
                  label={`${p.nickname}${p.id === state.room.host_player_id ? " (방장)" : ""}${p.is_ready ? " ✅" : ""}`}
                  variant={p.is_connected ? "filled" : "outlined"}
                />
              ))}
            </Stack>

            <ReadyPanel
              isReady={!!myPlayer?.is_ready}
              onToggle={(v) => roomReady(v)}
            />

            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                전원 준비완료면 서버가 자동으로 게임 시작함.
              </Typography>
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
}
