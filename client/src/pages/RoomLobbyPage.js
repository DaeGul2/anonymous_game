// src/pages/RoomLobbyPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ReadyPanel from "../components/ReadyPanel";
import AvatarPicker from "../components/AvatarPicker";
import { avatarUrl, loadSavedAvatar, saveAvatarChoice } from "../constants/avatars";
import ShareButton from "../components/ShareButton";
import { useRoomStore } from "../state/useRoomStore";

function PlayerRow({ player, myId, hostId, index }) {
  const isHost = player.id === hostId;
  const isMe = player.user_id === myId;
  const avatarIdx = player.avatar ?? index;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.1,
        px: 1.4,
        borderRadius: "var(--radius-md)",
        background: isMe
          ? "linear-gradient(135deg, rgba(124,58,237,0.09), rgba(236,72,153,0.05))"
          : "rgba(255,255,255,0.42)",
        border: isMe
          ? "1px solid rgba(124,58,237,0.22)"
          : "1px solid rgba(255,255,255,0.70)",
        transition: "all 0.2s ease",
        animation: "slideUp 0.4s var(--spring) both",
        animationDelay: `${index * 0.07}s`,
      }}
    >
      {/* 아바타 이미지 */}
      <Box
        sx={{
          position: "relative",
          width: 44,
          height: 44,
          borderRadius: "15px",
          background: "rgba(255,255,255,0.80)",
          border: "1.5px solid rgba(255,255,255,0.90)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
          overflow: "hidden",
        }}
      >
        <Box
          component="img"
          src={avatarUrl(avatarIdx)}
          alt="avatar"
          sx={{ width: "80%", height: "80%", objectFit: "contain" }}
        />
        {/* 준비 상태 도트 */}
        <Box
          sx={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: player.is_ready ? "#10B981" : "rgba(17,24,39,0.20)",
            border: "2.5px solid rgba(240,235,255,0.95)",
            transition: "background 0.3s ease",
            ...(player.is_ready ? { boxShadow: "0 0 7px rgba(16,185,129,0.65)" } : {}),
          }}
        />
      </Box>

      {/* 이름 + 뱃지 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {player.nickname}
          </Typography>
          {isHost && <Typography sx={{ fontSize: 16, lineHeight: 1 }}>👑</Typography>}
          {isMe && (
            <Box
              sx={{
                px: 0.9,
                py: 0.15,
                borderRadius: 999,
                background: "rgba(124,58,237,0.12)",
                border: "1px solid rgba(124,58,237,0.25)",
                fontSize: 10,
                fontWeight: 800,
                color: "var(--c-primary)",
                flexShrink: 0,
              }}
            >
              나
            </Box>
          )}
        </Stack>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", mt: 0.15 }}>
          {!player.is_connected
            ? "⚡ 재접속 중"
            : player.is_ready
            ? "✅ 준비완료"
            : "⏳ 준비 중"}
        </Typography>
      </Box>
    </Box>
  );
}

export default function RoomLobbyPage() {
  const { code } = useParams();
  const nav = useNavigate();
  const {
    initSocket, roomJoin, roomRejoin, roomReady, roomLeave, gameStart,
    state, user, error,
  } = useRoomStore();

  const [nickname, setNickname] = useState("");
  const [avatarIdx, setAvatarIdx] = useState(loadSavedAvatar);

  useEffect(() => { initSocket(); }, [initSocket]);

  useEffect(() => {
    if (!code) return;
    roomRejoin({ code: code.toUpperCase() });
  }, [code, roomRejoin]);

  useEffect(() => {
    if (!state?.room) return;
    if (state.room.phase && state.room.phase !== "lobby") {
      nav(`/game/${state.room.code}`);
    }
  }, [state, nav]);

  // 방 못 찾으면 홈으로
  useEffect(() => {
    if (error && !state?.room) {
      const t = setTimeout(() => nav("/", { replace: true }), 1500);
      return () => clearTimeout(t);
    }
  }, [error, state, nav]);

  const myPlayer = useMemo(() => {
    const players = state?.players || [];
    return players.find((p) => p.user_id === user?.id) || null;
  }, [state, user]);

  const players = state?.players || [];
  const allReady = players.length > 0 && players.every((p) => p.is_ready);
  const readyCount = players.filter((p) => p.is_ready).length;
  const isHostMe = myPlayer?.id === state?.room?.host_player_id;

  const handleAvatarChange = (idx) => {
    setAvatarIdx(idx);
    saveAvatarChoice(idx);
  };

  const doJoin = () => roomJoin({ code: code.toUpperCase(), nickname, avatar: avatarIdx });
  const onExit = () => { roomLeave(); nav("/"); };

  return (
    <Box className="appShell">
      {/* 헤더 */}
      <Box className="pageHeader">
        <Box sx={{ minWidth: 0 }}>
          <Typography className="pageTitle">
            🏠 로비{" "}
            <Typography component="span" className="subtle" sx={{ fontSize: 13 }}>
              {code?.toUpperCase()}
            </Typography>
          </Typography>
          <Typography className="subtle" sx={{ mt: 0.3, fontSize: 13 }}>
            준비 완료 후 방장이 게임을 시작합니다
          </Typography>
        </Box>
        <IconButton
          onClick={onExit}
          sx={{
            width: 40, height: 40,
            border: "1.5px solid rgba(255,255,255,0.65)",
            background: "rgba(255,255,255,0.52)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            fontSize: 15, color: "var(--text-2)", fontWeight: 900,
            "&:active": { transform: "scale(0.92)" },
          }}
        >
          ✕
        </IconButton>
      </Box>

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

      {/* 입장 전 */}
      {!state?.room && (
        <Paper
          className="glassCard section"
          sx={{ p: 2.5, animation: "slideUp 0.5s var(--spring) both" }}
        >
          <Box sx={{ textAlign: "center", mb: 2.2 }}>
            {/* 선택된 아바타 미리보기 */}
            <Box
              sx={{
                width: 80, height: 80, borderRadius: "24px",
                background: "rgba(255,255,255,0.80)",
                border: "2px solid rgba(124,58,237,0.22)",
                boxShadow: "0 8px 24px rgba(124,58,237,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                mx: "auto", mb: 1,
                overflow: "hidden",
                animation: "popIn 0.5s var(--spring) both",
              }}
            >
              <Box
                component="img"
                src={avatarUrl(avatarIdx)}
                alt="선택된 아바타"
                sx={{ width: "82%", height: "82%", objectFit: "contain" }}
              />
            </Box>
            <Typography sx={{ fontWeight: 950, fontSize: 17, letterSpacing: "-0.025em" }}>
              캐릭터를 골라봐요
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", mt: 0.3 }}>
              게임 내 익명 닉네임과 함께 표시돼요
            </Typography>
          </Box>

          <Stack spacing={2}>
            {/* 아바타 선택 그리드 */}
            <AvatarPicker value={avatarIdx} onChange={handleAvatarChange} />

            {/* 닉네임 입력 */}
            <TextField
              label="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && nickname.trim() && doJoin()}
              inputProps={{ maxLength: 20 }}
              fullWidth
              autoFocus
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "var(--radius-lg)",
                  fontWeight: 700, fontSize: 16,
                  "& fieldset": { border: "1px solid rgba(124,58,237,0.25)" },
                  "&:hover fieldset": { border: "1px solid rgba(124,58,237,0.45)" },
                  "&.Mui-focused fieldset": { border: "1.5px solid rgba(124,58,237,0.7)" },
                },
              }}
            />

            <Button
              variant="contained"
              onClick={doJoin}
              disabled={!nickname.trim() || !code}
              fullWidth
              sx={{
                fontWeight: 900, fontSize: 16, borderRadius: 999, py: 1.6,
                background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                boxShadow: "0 6px 22px rgba(124,58,237,0.36)",
                "&:active": { transform: "scale(0.97)" },
                "&:disabled": { opacity: 0.45 },
                transition: "transform 0.12s ease",
                letterSpacing: "-0.01em",
              }}
            >
              입장하기 →
            </Button>

            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textAlign: "center" }}>
              이전에 참여한 기기라면 자동으로 재접속됩니다
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* 입장 후 */}
      {state?.room && (
        <>
          {/* 방 정보 */}
          <Paper
            className="glassCard section"
            sx={{ p: 2, animation: "slideUp 0.45s var(--spring) both" }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: "16px",
                  background: "linear-gradient(135deg, rgba(236,72,153,0.60), rgba(139,92,246,0.60), rgba(59,130,246,0.40))",
                  border: "1.5px solid rgba(255,255,255,0.65)",
                  boxShadow: "0 8px 22px rgba(124,58,237,0.20)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, flex: "0 0 auto",
                }}
              >
                🎮
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 950, fontSize: 16, letterSpacing: "-0.02em",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {state.room.title}
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", mt: 0.3 }}>
                  방 코드:{" "}
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 900, fontSize: 13, fontFamily: "monospace",
                      letterSpacing: "0.06em", color: "var(--c-primary)",
                    }}
                  >
                    {state.room.code}
                  </Typography>
                  {" "}· 최대 {state.room.max_players}명
                </Typography>
              </Box>
              <Chip
                size="small" label="대기 중"
                sx={{ fontWeight: 900, borderRadius: 999, fontSize: 11, opacity: 0.8 }}
              />
            </Stack>
          </Paper>

          {/* 친구 초대 */}
          <Paper
            className="glassCard section"
            sx={{ p: 2, animation: "slideUp 0.48s var(--spring) both 0.03s" }}
          >
            <ShareButton
              url={`${window.location.origin}/room/${state.room.code}`}
              title="익명게임 - 같이 하자!"
              text={`익명게임에 초대합니다! 방 코드: ${state.room.code}`}
              label="친구 초대하기"
              icon="📨"
            />
          </Paper>

          {/* 참여자 목록 */}
          <Paper
            className="glassCard section"
            sx={{ p: 2, animation: "slideUp 0.5s var(--spring) both 0.05s" }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography sx={{ fontWeight: 950, fontSize: 15, letterSpacing: "-0.02em" }}>
                👥 참여자
              </Typography>
              <Box
                sx={{
                  px: 1.4, py: 0.4, borderRadius: 999,
                  background: allReady
                    ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.10))"
                    : "rgba(255,255,255,0.55)",
                  border: allReady ? "1px solid rgba(16,185,129,0.30)" : "1px solid rgba(0,0,0,0.10)",
                  transition: "all 0.3s ease",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12, fontWeight: 800,
                    color: allReady ? "#059669" : "var(--text-2)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {readyCount}/{players.length} 준비
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={0.8}>
              {players.map((p, i) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  myId={user?.id}
                  hostId={state.room.host_player_id}
                  index={i}
                />
              ))}
            </Stack>

            <Box sx={{ mt: 2 }}>
              <ReadyPanel isReady={!!myPlayer?.is_ready} onToggle={(v) => roomReady(v)} />
            </Box>

            {/* 게임 시작 영역 */}
            <Box sx={{ mt: 1.5 }}>
              {isHostMe ? (
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!allReady}
                  onClick={gameStart}
                  sx={{
                    fontWeight: 900, fontSize: 17, borderRadius: 999, py: 1.7,
                    letterSpacing: "-0.02em",
                    background: allReady
                      ? "linear-gradient(135deg, #7C3AED, #EC4899, #3B82F6)"
                      : "rgba(0,0,0,0.12)",
                    backgroundSize: allReady ? "200% 200%" : undefined,
                    boxShadow: allReady ? "0 8px 28px rgba(124,58,237,0.42)" : "none",
                    color: allReady ? "#fff" : "var(--text-3)",
                    animation: allReady ? "bgShift 3s ease infinite" : "none",
                    "&:active": { transform: "scale(0.97)" },
                    "&:disabled": { opacity: 0.55, background: "rgba(0,0,0,0.10)" },
                    transition: "transform 0.12s ease, box-shadow 0.3s ease",
                  }}
                >
                  {allReady ? "🚀 게임 시작!" : `⏳ 전원 준비 대기 중 (${readyCount}/${players.length})`}
                </Button>
              ) : (
                <Box
                  sx={{
                    py: 1.4, px: 2, borderRadius: 999,
                    background: allReady ? "rgba(16,185,129,0.10)" : "rgba(255,255,255,0.50)",
                    border: allReady ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(0,0,0,0.08)",
                    textAlign: "center", transition: "all 0.3s ease",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13, fontWeight: 700,
                      color: allReady ? "#059669" : "var(--text-2)",
                    }}
                  >
                    {allReady
                      ? "✅ 방장의 게임 시작을 기다리는 중..."
                      : "전원이 준비되면 방장이 시작합니다"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          <Box sx={{ py: 1.2, px: 1.5, textAlign: "center", animation: "fadeIn 0.6s ease both 0.3s" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>
              연결이 끊겨도 재입장하면 자동 복구됩니다
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
