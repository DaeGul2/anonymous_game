// src/components/RoomList.js
import React from "react";
import {
  Box,
  ButtonBase,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

function statusChip(r) {
  const phase = r?.phase || r?.status || "UNKNOWN";
  const isInGame = phase !== "lobby";

  return (
    <Chip
      size="small"
      label={isInGame ? "게임중" : phase}
      sx={{
        fontWeight: 900,
        opacity: 0.9,
        borderRadius: 999,
      }}
      color={isInGame ? "warning" : "default"}
    />
  );
}

export default function RoomList({ rooms, onClick }) {
  const list = Array.isArray(rooms) ? rooms : [];

  if (list.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography fontWeight={900} sx={{ opacity: 0.75 }}>
          방 없음. 누가 좀 만들어라.
        </Typography>
        <Typography className="subtle" sx={{ mt: 0.5 }}>
          (대부분 아무도 안 만들지. 인간이라서.)
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.1}>
      {list.map((r) => {
        const phase = r?.phase || r?.status || "UNKNOWN";
        const isInGame = phase !== "lobby"; // lobby 아니면 입장 금지

        return (
          <ButtonBase
            key={r.code}
            disabled={isInGame}
            onClick={() => {
              if (!isInGame) onClick(r);
            }}
            style={{ width: "100%", textAlign: "left" }}
            sx={{
              width: "100%",
              textAlign: "left",
              opacity: isInGame ? 0.55 : 1,
              cursor: isInGame ? "not-allowed" : "pointer",
            }}
          >
            <Paper
              className="glassCard"
              sx={{
                width: "100%",
                p: 1.5,
                borderRadius: 3,
                transition: "transform 120ms ease, box-shadow 120ms ease",
                "&:active": { transform: isInGame ? "none" : "scale(0.99)" },
                ...(isInGame
                  ? { filter: "grayscale(0.15)" }
                  : {}),
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                {/* Avatar-ish bubble */}
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    flex: "0 0 auto",
                    background:
                      "radial-gradient(circle at 30% 30%, rgba(236,72,153,0.55), rgba(139,92,246,0.55), rgba(59,130,246,0.35))",
                    border: "1px solid rgba(255,255,255,0.55)",
                    boxShadow: "0 10px 24px rgba(17,24,39,0.08)",
                  }}
                />

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    fontWeight={950}
                    sx={{
                      letterSpacing: "-0.02em",
                      lineHeight: 1.15,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.title || "Untitled Room"}{" "}
                    <Typography component="span" className="subtle" sx={{ fontSize: 12 }}>
                      ({r.code})
                    </Typography>
                  </Typography>

                  <Typography className="subtle" sx={{ fontSize: 12, mt: 0.4 }}>
                    인원 {r.player_count}/{r.max_players} · 상태 {phase}
                    {isInGame ? " · 입장 불가" : ""}
                  </Typography>
                </Box>

                <Stack spacing={0.6} alignItems="flex-end">
                  {statusChip(r)}
                  <Chip
                    size="small"
                    label={`${r.player_count}/${r.max_players}`}
                    sx={{ fontWeight: 900, opacity: 0.85, borderRadius: 999 }}
                  />
                </Stack>
              </Stack>
            </Paper>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}
