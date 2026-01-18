// src/pages/HomePage.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import RoomList from "../components/RoomList";
import CreateRoomModal from "../components/CreateRoomModal";
import { useRoomStore } from "../state/useRoomStore";

export default function HomePage() {
  const nav = useNavigate();
  const { initSocket, roomList, rooms, roomJoin, roomCreate, state, error } =
    useRoomStore();

  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [q, setQ] = useState("");

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

  const filteredRooms = useMemo(() => {
    const list = Array.isArray(rooms) ? rooms : [];
    const keyword = (q || "").trim().toLowerCase();
    if (!keyword) return list;
    return list.filter((r) => {
      const hay = `${r.title || ""} ${r.code || ""} ${r.status || ""} ${
        r.phase || ""
      }`.toLowerCase();
      return hay.includes(keyword);
    });
  }, [rooms, q]);

  return (
    <Box className="appShell">
      {/* Header */}
      <Box className="pageHeader">
        <Box>
          <Typography className="pageTitle">익명 게임</Typography>
          <Typography className="subtle" sx={{ mt: 0.25 }}>
            로그인 없이 방 코드를 통해 익명으로 참여합니다.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="outlined" className="tap" onClick={roomList}>
            새로고침
          </Button>
          <Button
            variant="contained"
            className="tap"
            onClick={() => setOpen(true)}
          >
            방 만들기
          </Button>
        </Stack>
      </Box>

      {/* Error */}
      {error && (
        <Paper className="glassCard section" sx={{ p: 2 }}>
          <Typography color="error" fontWeight={800}>
            {error}
          </Typography>
        </Paper>
      )}

      {/* Quick Join */}
      <Paper className="glassCard section" sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
            방 코드로 입장
          </Typography>
          <Chip
            size="small"
            label="빠른 입장"
            sx={{ fontWeight: 900, opacity: 0.85 }}
          />
        </Stack>

        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          <TextField
            fullWidth
            label="방 코드"
            value={joinCode}
            onChange={(e) => setJoinCode((e.target.value || "").toUpperCase())}
            inputProps={{ maxLength: 12, autoCapitalize: "characters" }}
          />
          <TextField
            fullWidth
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            inputProps={{ maxLength: 20 }}
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              className="tap grow"
              onClick={onJoin}
              disabled={!joinCode.trim() || !nickname.trim()}
            >
              입장하기
            </Button>
          </Stack>

          <Typography className="subtle" sx={{ fontSize: 12 }}>
            같은 방에서는 닉네임이 중복될 수 없습니다.
          </Typography>
        </Stack>
      </Paper>

      {/* Room List */}
      <Paper className="glassCard section" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ mb: 1.25 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={950} sx={{ letterSpacing: "-0.02em" }}>
              공개 방 목록
            </Typography>
            <Chip
              size="small"
              label={`${rooms?.length || 0}개`}
              sx={{ fontWeight: 900, opacity: 0.85 }}
            />
          </Stack>

          <TextField
            fullWidth
            placeholder="검색: 제목 / 코드 / 상태"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Stack>

        <RoomList rooms={filteredRooms} onClick={(r) => nav(`/room/${r.code}`)} />
      </Paper>

      <CreateRoomModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onCreate}
      />
    </Box>
  );
}
