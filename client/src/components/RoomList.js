// src/components/RoomList.js
import React from "react";
import { List, ListItemButton, ListItemText, Chip, Stack } from "@mui/material";

export default function RoomList({ rooms, onClick }) {
  return (
    <List dense>
      {rooms.map((r) => (
        <ListItemButton key={r.code} onClick={() => onClick(r)}>
          <ListItemText
            primary={`${r.title} (${r.code})`}
            secondary={`인원: ${r.player_count}/${r.max_players} · 상태: ${r.phase || r.status}`}
          />
          <Stack direction="row" spacing={1}>
            <Chip size="small" label={r.status} />
          </Stack>
        </ListItemButton>
      ))}
      {rooms.length === 0 && (
        <ListItemText primary="방 없음. 누가 좀 만들어라." />
      )}
    </List>
  );
}
