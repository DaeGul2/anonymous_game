// src/pages/HomePage.js
import React, { useEffect, useState } from "react";
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import RoomList from "../components/RoomList";
import CreateRoomModal from "../components/CreateRoomModal";
import { useRoomStore } from "../state/useRoomStore";

export default function HomePage() {
  const nav = useNavigate();
  const {
    initSocket, roomList, rooms, roomJoin, roomCreate, state, error
  } = useRoomStore();

  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    roomList();
  }, [roomList]);

  useEffect(() => {
    if (state?.room?.code) nav(`/room/${state.room.code}`);
  }, [state, nav]);

  const onCreate = (payload) => {
    roomCreate(payload);
    setOpen(false);
  };

  const onJoin = () => {
    roomJoin({ code: joinCode.trim().toUpperCase(), nickname });
  };

  return (
    <Container sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>익명게임</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={roomList}>새로고침</Button>
          <Button variant="contained" onClick={() => setOpen(true)}>방 만들기</Button>
        </Stack>
      </Stack>

      {error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>방 코드로 입장</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField label="방 코드" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
          <TextField label="내 닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <Button variant="contained" onClick={onJoin}>입장</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>방 목록</Typography>
        <RoomList rooms={rooms} onClick={(r) => nav(`/room/${r.code}`)} />
      </Paper>

      <CreateRoomModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onCreate}
      />
    </Container>
  );
}
