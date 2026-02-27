// src/pages/HomePage.js
import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import RoomList from "../components/RoomList";
import CreateRoomModal from "../components/CreateRoomModal";
import { useRoomStore } from "../state/useRoomStore";

export default function HomePage() {
  const nav = useNavigate();
  const { initSocket, roomList, rooms, roomJoin, roomCreate, state, user, error, checkActiveRoom } =
    useRoomStore();

  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [q, setQ] = useState("");
  const [endedRoomMsg, setEndedRoomMsg] = useState(false);

  useEffect(() => { initSocket(); }, [initSocket]);
  useEffect(() => { roomList(); }, [roomList]);

  // 10초 간격 자동 갱신
  useEffect(() => {
    const id = setInterval(() => roomList(), 10000);
    return () => clearInterval(id);
  }, [roomList]);
  useEffect(() => {
    if (state?.room?.code) nav(`/room/${state.room.code}`);
  }, [state, nav]);

  // 로그인 후 기존 활성 방 자동 복귀 (세션당 1회만 — 루프 방지)
  useEffect(() => {
    if (!user) return;
    // 이미 이 세션에서 리다이렉트 시도했으면 스킵 (게임방 → 홈 → 또 리다이렉트 루프 방지)
    if (sessionStorage.getItem("ag:home_redirect_done")) return;

    let cancelled = false;
    (async () => {
      const res = await checkActiveRoom();
      if (cancelled) return;
      if (res?.ok && res?.room?.code) {
        sessionStorage.setItem("ag:home_redirect_done", "1");
        const dest = res.room.phase === "lobby"
          ? `/room/${res.room.code}`
          : `/game/${res.room.code}`;
        nav(dest, { replace: true });
      } else {
        try {
          const lastCode = localStorage.getItem("ag:last_room");
          if (lastCode) {
            localStorage.removeItem("ag:last_room");
            if (!cancelled) setEndedRoomMsg(true);
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = (payload) => { roomCreate(payload); setOpen(false); };

  const onJoin = () => {
    if (!joinCode.trim() || !nickname.trim()) return;
    roomJoin({ code: joinCode.trim().toUpperCase(), nickname });
  };

  const filteredRooms = useMemo(() => {
    const list = Array.isArray(rooms) ? rooms : [];
    const keyword = (q || "").trim().toLowerCase();
    if (!keyword) return list;
    return list.filter((r) => {
      const hay = `${r.title || ""} ${r.code || ""} ${r.status || ""} ${r.phase || ""}`.toLowerCase();
      return hay.includes(keyword);
    });
  }, [rooms, q]);

  return (
    <Box className="appShell">

      {/* ===== 히어로 섹션 ===== */}
      <Box
        sx={{
          textAlign: "center",
          pt: 1,
          pb: 0.5,
          mb: 1,
          animation: "slideUp 0.55s var(--spring) both",
        }}
      >
        <Typography
          sx={{
            fontWeight: 950,
            fontSize: { xs: 28, sm: 34 },
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            background: "linear-gradient(135deg, #7C3AED, #EC4899, #3B82F6)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "bgShift 5s ease infinite",
            mb: 0.8,
          }}
        >
          익명게임
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-2)",
            letterSpacing: "-0.01em",
            lineHeight: 1.5,
          }}
        >
          친구들과 익명으로 질문하고 솔직하게 답변해봐요
        </Typography>
      </Box>

      {/* 종료된 방 알림 */}
      {endedRoomMsg && (
        <Paper
          className="glassCard section"
          sx={{
            p: 1.8,
            border: "1px solid rgba(245,158,11,0.40) !important",
            background: "rgba(245,158,11,0.08) !important",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            animation: "slideUp 0.35s var(--spring) both",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#B45309" }}>
            🚪 이전에 참여했던 방이 종료됐습니다
          </Typography>
          <Button
            size="small"
            onClick={() => setEndedRoomMsg(false)}
            sx={{
              fontWeight: 900,
              fontSize: 12,
              minWidth: 0,
              px: 1.2,
              py: 0.4,
              borderRadius: 999,
              color: "#B45309",
              border: "1px solid rgba(245,158,11,0.40)",
              "&:active": { transform: "scale(0.95)" },
            }}
          >
            닫기
          </Button>
        </Paper>
      )}

      {error && (
        <Paper
          className="glassCard section"
          sx={{ p: 1.8, border: "1px solid rgba(239,68,68,0.35) !important" }}
        >
          <Typography sx={{ color: "var(--c-red)", fontWeight: 900, fontSize: 14 }}>
            ⚠️ {error}
          </Typography>
        </Paper>
      )}

      {/* ===== 방 만들기 버튼 ===== */}
      <Box sx={{ animation: "slideUp 0.5s var(--spring) both 0.05s" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{
            fontWeight: 900,
            fontSize: 17,
            borderRadius: 999,
            py: 1.8,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #7C3AED, #EC4899, #3B82F6)",
            backgroundSize: "200% 200%",
            boxShadow: "0 8px 28px rgba(124,58,237,0.38)",
            "&:active": { transform: "scale(0.97)" },
            transition: "transform 0.12s ease",
            animation: "bgShift 4s ease infinite",
          }}
        >
          🎮 방 만들기
        </Button>
      </Box>

      {/* ===== 코드로 입장 ===== */}
      <Paper
        className="glassCard section"
        sx={{ p: 2.2, animation: "slideUp 0.5s var(--spring) both 0.1s" }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.8 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.20))",
              border: "1px solid rgba(59,130,246,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flex: "0 0 auto",
            }}
          >
            🔑
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: 15, letterSpacing: "-0.02em" }}>
              코드로 입장
            </Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>
              방 코드와 닉네임을 입력하세요
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1.2}>
          <TextField
            fullWidth
            label="방 코드"
            value={joinCode}
            onChange={(e) => setJoinCode((e.target.value || "").toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && joinCode.trim() && nickname.trim() && onJoin()}
            inputProps={{ maxLength: 12, autoCapitalize: "characters" }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "var(--radius-lg)",
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "0.08em",
                "& fieldset": { border: "1px solid rgba(59,130,246,0.25)" },
                "&:hover fieldset": { border: "1px solid rgba(59,130,246,0.45)" },
                "&.Mui-focused fieldset": { border: "1.5px solid rgba(59,130,246,0.70)" },
              },
            }}
          />
          <TextField
            fullWidth
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinCode.trim() && nickname.trim() && onJoin()}
            inputProps={{ maxLength: 20 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "var(--radius-lg)",
                fontWeight: 700,
                "& fieldset": { border: "1px solid rgba(59,130,246,0.25)" },
                "&:hover fieldset": { border: "1px solid rgba(59,130,246,0.45)" },
                "&.Mui-focused fieldset": { border: "1.5px solid rgba(59,130,246,0.70)" },
              },
            }}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={onJoin}
            disabled={!joinCode.trim() || !nickname.trim()}
            sx={{
              fontWeight: 900,
              fontSize: 16,
              borderRadius: 999,
              py: 1.6,
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              boxShadow: "0 6px 22px rgba(59,130,246,0.32)",
              "&:active": { transform: "scale(0.97)" },
              "&:disabled": { opacity: 0.45 },
              transition: "transform 0.12s ease",
              letterSpacing: "-0.01em",
            }}
          >
            입장하기 →
          </Button>

          <Typography
            sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textAlign: "center" }}
          >
            같은 방 내 닉네임 중복 불가
          </Typography>
        </Stack>
      </Paper>

      {/* ===== 공개 방 목록 ===== */}
      <Paper
        className="glassCard section"
        sx={{ p: 2.2, animation: "slideUp 0.5s var(--spring) both 0.15s" }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontWeight: 950, fontSize: 15, letterSpacing: "-0.02em" }}>
              🏠 공개 방 목록
            </Typography>
            <Box
              sx={{
                px: 1.2,
                py: 0.25,
                borderRadius: 999,
                background: "rgba(124,58,237,0.10)",
                border: "1px solid rgba(124,58,237,0.18)",
              }}
            >
              <Typography
                sx={{ fontSize: 11, fontWeight: 800, color: "var(--c-primary)" }}
              >
                {rooms?.length || 0}개
              </Typography>
            </Box>
          </Stack>

          <Button
            size="small"
            onClick={roomList}
            sx={{
              fontWeight: 800,
              fontSize: 12,
              borderRadius: 999,
              px: 1.6,
              py: 0.6,
              minHeight: 32,
              color: "var(--text-2)",
              border: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(255,255,255,0.55)",
              "&:active": { transform: "scale(0.95)" },
            }}
          >
            ↻ 새로고침
          </Button>
        </Stack>

        <TextField
          fullWidth
          placeholder="🔍  제목, 코드로 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{
            mb: 1.5,
            "& .MuiOutlinedInput-root": {
              borderRadius: "var(--radius-lg)",
              fontWeight: 700,
              fontSize: 14,
              background: "rgba(255,255,255,0.55)",
              "& fieldset": { border: "1px solid rgba(0,0,0,0.10)" },
              "&:hover fieldset": { border: "1px solid rgba(124,58,237,0.30)" },
              "&.Mui-focused fieldset": { border: "1.5px solid rgba(124,58,237,0.55)" },
            },
          }}
        />

        <RoomList rooms={filteredRooms} onClick={(r) => nav(`/room/${r.code}`)} />
      </Paper>

      <CreateRoomModal open={open} onClose={() => setOpen(false)} onSubmit={onCreate} />
    </Box>
  );
}
