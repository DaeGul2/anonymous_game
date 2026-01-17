// src/components/CreateRoomModal.js
import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack
} from "@mui/material";

export default function CreateRoomModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [nickname, setNickname] = useState("");

  const submit = () => onSubmit({ title, max_players: Number(maxPlayers) || 8, nickname });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>방 만들기</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="방 제목" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField
            label="최대 인원"
            type="number"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            inputProps={{ min: 2, max: 20 }}
          />
          <TextField label="내 닉네임(방장)" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        <Button variant="contained" onClick={submit}>생성</Button>
      </DialogActions>
    </Dialog>
  );
}
