// src/components/ReactionFAB.js
import React, { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useRoomStore } from "../state/useRoomStore";

const EMOJIS = ["😂", "😱", "🤔", "❤️", "👏", "😭"];

const TEXTS = [
  "질문 센스 좋아요",
  "👏 이건 명질문",
  "답변 미쳤다 ㅋㅋ",
  "솔직해서 좋아요",
  "수위가 너무 높아요",
  "이상한 질문 하지 마세요",
  "노잼 질문",
  "TMI임 ㅋㅋ",
  "그건 좀...",
  "지금 그게 맞아?",
];

// ===== 떠오르는 버블 =====
function FloatingBubble({ reaction, onDone }) {
  const varsRef = useRef({
    x: 15 + Math.random() * 70,             // 시작 X (15%~85%)
    size: reaction.emoji ? 32 + Math.random() * 18 : 14,
    duration: 2.8 + Math.random() * 1.4,    // 2.8~4.2초 (버블마다 다른 속도)
    wobble: 12 + Math.random() * 18,         // 좌우 흔들림 크기 (12~30px)
    wobbleDir: Math.random() > 0.5 ? 1 : -1, // 처음 방향 랜덤
    rise: 55 + Math.random() * 15,           // 올라가는 높이 (55~70vh)
  });

  const v = varsRef.current;

  useEffect(() => {
    const t = setTimeout(onDone, v.duration * 1000 + 200);
    return () => clearTimeout(t);
  }, [onDone, v.duration]);

  const isEmoji = !!reaction.emoji;

  return (
    <Box
      sx={{
        position: "absolute",
        left: `${v.x}%`,
        bottom: 60,
        pointerEvents: "none",
        // 수직 상승 (ease-out → 위에서 감속)
        animation: `reactionRise ${v.duration}s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        "--rise-h": `${v.rise}vh`,
      }}
    >
      {/* 좌우 흔들림 (별도 래퍼, 다른 타이밍) */}
      <Box
        sx={{
          animation: `reactionWobble ${v.duration * 0.45}s ease-in-out infinite alternate`,
          "--wobble": `${v.wobble * v.wobbleDir}px`,
        }}
      >
        {/* 페이드 + 스케일 (마지막에 사라짐) */}
        <Box
          sx={{
            animation: `reactionFade ${v.duration}s ease-in forwards`,
            transform: "translateX(-50%)",
          }}
        >
          {isEmoji ? (
            <Typography
              sx={{
                fontSize: v.size,
                lineHeight: 1,
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.12))",
                userSelect: "none",
              }}
            >
              {reaction.emoji}
            </Typography>
          ) : (
            <Box
              sx={{
                px: 1.6,
                py: 0.8,
                borderRadius: 999,
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(124,58,237,0.18)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                whiteSpace: "nowrap",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "rgba(17,24,39,0.80)",
                  letterSpacing: "-0.01em",
                }}
              >
                {reaction.text}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ===== 메인 컴포넌트 =====
const COOLDOWN_MS = 1000;

export default function ReactionFAB() {
  const { game, gameReaction, removeReaction } = useRoomStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0); // 0=이모지, 1=한마디
  const [cooldownMsg, setCooldownMsg] = useState(false);
  const lastSentRef = useRef(0);
  const cooldownTimerRef = useRef(null);

  const phase = game.phase;
  const reactions = game.reactions || [];

  // 게임 중이 아니면 숨김
  if (!phase || phase === "lobby") return null;

  const handleSelect = (emoji, text) => {
    const now = Date.now();
    if (now - lastSentRef.current < COOLDOWN_MS) {
      setCooldownMsg(true);
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = setTimeout(() => setCooldownMsg(false), 800);
      return;
    }
    lastSentRef.current = now;
    gameReaction(emoji, text);
    // 한마디 탭만 메뉴 닫기, 이모지는 열어둠
    if (text) setOpen(false);
  };

  return (
    <>
      {/* 버블 오버레이 */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1200,
          overflow: "hidden",
        }}
      >
        {reactions.map((r) => (
          <FloatingBubble
            key={r.id}
            reaction={r}
            onDone={() => removeReaction(r.id)}
          />
        ))}
      </Box>

      {/* 메뉴 백드롭 */}
      {open && (
        <Box
          onClick={() => setOpen(false)}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1240,
            background: "rgba(0,0,0,0.15)",
          }}
        />
      )}

      {/* FAB + 메뉴 영역 */}
      <Box
        sx={{
          position: "fixed",
          bottom: "calc(24px + env(safe-area-inset-bottom))",
          right: 18,
          zIndex: 1250,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 1.2,
        }}
      >
        {/* 팝업 메뉴 */}
        {open && (
          <Box
            sx={{
              width: 260,
              borderRadius: "var(--radius-xl)",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(124,58,237,0.10)",
              overflow: "hidden",
              animation: "reactionMenuIn 0.25s var(--spring) both",
            }}
          >
            {/* 탭 헤더 */}
            <Box
              sx={{
                display: "flex",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {["😆 이모지", "💬 한마디"].map((label, i) => (
                <Box
                  key={i}
                  onClick={() => setTab(i)}
                  sx={{
                    flex: 1,
                    py: 1.2,
                    textAlign: "center",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: 13,
                    color: tab === i ? "var(--c-primary)" : "var(--text-3)",
                    borderBottom: tab === i ? "2px solid var(--c-primary)" : "2px solid transparent",
                    transition: "all 0.15s ease",
                    userSelect: "none",
                  }}
                >
                  {label}
                </Box>
              ))}
            </Box>

            {/* 쿨다운 메시지 */}
            {cooldownMsg && (
              <Box
                sx={{
                  px: 1.4,
                  py: 0.6,
                  textAlign: "center",
                  background: "rgba(239,68,68,0.08)",
                  animation: "fadeIn 0.15s ease both",
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#EF4444" }}>
                  1초 후 다시 사용할 수 있어요
                </Typography>
              </Box>
            )}

            {/* 이모지 탭 */}
            {tab === 0 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 0.5,
                  p: 1.2,
                }}
              >
                {EMOJIS.map((e) => (
                  <Box
                    key={e}
                    onClick={() => handleSelect(e, null)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 52,
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      fontSize: 28,
                      transition: "all 0.12s ease",
                      userSelect: "none",
                      "&:hover": { background: "rgba(124,58,237,0.08)" },
                      "&:active": { transform: "scale(0.85)" },
                    }}
                  >
                    {e}
                  </Box>
                ))}
              </Box>
            )}

            {/* 한마디 탭 */}
            {tab === 1 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  p: 1.2,
                  maxHeight: 280,
                  overflowY: "auto",
                }}
              >
                {TEXTS.map((t) => (
                  <Box
                    key={t}
                    onClick={() => handleSelect(null, t)}
                    sx={{
                      px: 1.4,
                      py: 1,
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                      userSelect: "none",
                      "&:hover": { background: "rgba(124,58,237,0.08)" },
                      "&:active": { transform: "scale(0.97)" },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "rgba(17,24,39,0.75)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {t}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* FAB 버튼 */}
        <Box
          onClick={() => setOpen((v) => !v)}
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: open
              ? "rgba(17,24,39,0.85)"
              : "linear-gradient(135deg, rgba(124,58,237,0.90), rgba(236,72,153,0.85))",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: open
              ? "0 4px 20px rgba(0,0,0,0.25)"
              : "0 6px 24px rgba(124,58,237,0.40)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
            transition: "all 0.2s ease",
            "&:active": { transform: "scale(0.88)" },
            animation: "popIn 0.4s var(--spring) both",
          }}
        >
          <Typography
            sx={{
              fontSize: open ? 18 : 24,
              lineHeight: 1,
              color: open ? "#fff" : undefined,
              transition: "font-size 0.15s ease",
            }}
          >
            {open ? "✕" : "😆"}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
