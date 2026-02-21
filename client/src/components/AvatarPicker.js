// src/components/AvatarPicker.js
import React from "react";
import { Box, Typography } from "@mui/material";
import { AVATARS, avatarUrl } from "../constants/avatars";

/**
 * AvatarPicker
 * @param {number}   value    - 현재 선택된 아바타 인덱스 (0-11)
 * @param {function} onChange - (idx: number) => void
 */
export default function AvatarPicker({ value, onChange }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text-2)",
          mb: 1.2,
          letterSpacing: "-0.01em",
        }}
      >
        캐릭터 선택
      </Typography>

      {/* 4×3 그리드 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 1,
        }}
      >
        {AVATARS.map((av, idx) => {
          const selected = idx === value;
          return (
            <Box
              key={idx}
              onClick={() => onChange(idx)}
              title={av.label}
              sx={{
                position: "relative",
                borderRadius: "14px",
                cursor: "pointer",
                border: selected
                  ? "2.5px solid var(--c-primary)"
                  : "2px solid rgba(255,255,255,0.70)",
                boxShadow: selected
                  ? "0 0 0 3px rgba(124,58,237,0.22), 0 4px 14px rgba(124,58,237,0.28)"
                  : "0 2px 8px rgba(0,0,0,0.07)",
                background: selected
                  ? "rgba(124,58,237,0.08)"
                  : "rgba(255,255,255,0.55)",
                transition: "all 0.18s var(--spring)",
                overflow: "hidden",
                "&:active": { transform: "scale(0.92)" },
                ...(selected && { animation: "popIn 0.3s var(--spring) both" }),
                aspectRatio: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={avatarUrl(idx)}
                alt={av.label}
                draggable={false}
                sx={{
                  width: "78%",
                  height: "78%",
                  objectFit: "contain",
                  display: "block",
                  userSelect: "none",
                }}
              />
              {selected && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "var(--c-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: "#fff",
                    fontWeight: 900,
                    animation: "checkPop 0.4s var(--spring) both",
                  }}
                >
                  ✓
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
