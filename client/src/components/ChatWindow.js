// src/components/ChatWindow.js
import React, { useEffect, useRef, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { useRoomStore } from "../state/useRoomStore";

export default function ChatWindow() {
  const { game, chatSend, chatClose } = useRoomStore();
  const activeChatId = game.activeChatId;
  const chat = activeChatId ? game.chats?.[activeChatId] : null;
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 새 메시지 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages?.length]);

  // 열릴 때 input 포커스
  useEffect(() => {
    if (chat) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [!!chat]);

  if (!chat) return null;

  const messages = chat.messages || [];
  const questionPreview = chat.questionText || "";
  const answerPreview = chat.answerText || "";

  const handleSend = () => {
    const trimmed = text.trim().slice(0, 200);
    if (!trimmed) return;
    chatSend(activeChatId, trimmed);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 연속 메시지 그룹핑 (같은 방향 연속이면 간격 좁히기)
  const getRadius = (msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const samePrev = prev?.isMine === msg.isMine;
    const sameNext = next?.isMine === msg.isMine;

    if (msg.isMine) {
      if (samePrev && sameNext) return "18px 4px 4px 18px";
      if (samePrev) return "18px 4px 18px 18px";
      if (sameNext) return "18px 18px 4px 18px";
      return "18px 18px 4px 18px";
    } else {
      if (samePrev && sameNext) return "4px 18px 18px 4px";
      if (samePrev) return "4px 18px 18px 18px";
      if (sameNext) return "18px 18px 18px 4px";
      return "18px 18px 18px 4px";
    }
  };

  return (
    <>
      {/* 배경 딤 */}
      <Box
        onClick={chatClose}
        sx={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 1300,
          animation: "fadeIn 0.2s ease both",
        }}
      />

      {/* 채팅 시트 */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "70vh",
          maxHeight: 500,
          zIndex: 1310,
          display: "flex",
          flexDirection: "column",
          borderRadius: "20px 20px 0 0",
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          animation: "chatSheetUp 0.3s ease-out both",
          overflow: "hidden",
        }}
      >
        {/* 헤더 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.4,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            flex: "0 0 auto",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={chatClose} sx={{ p: 0.5 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--text-2)" }}>←</Typography>
            </IconButton>
            <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>
              익명 대화
            </Typography>
          </Box>
          <IconButton size="small" onClick={chatClose} sx={{ p: 0.5 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--text-3)" }}>✕</Typography>
          </IconButton>
        </Box>

        {/* 고정 질문 + 답변 텍스트 */}
        <Box
          sx={{
            px: 2,
            py: 1.2,
            background: "rgba(124,58,237,0.05)",
            borderBottom: "1px solid rgba(124,58,237,0.08)",
            flex: "0 0 auto",
          }}
        >
          {questionPreview && (
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 800,
                color: "var(--c-primary)",
                mb: 0.4,
                letterSpacing: "-0.01em",
              }}
            >
              Q. {questionPreview}
            </Typography>
          )}
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(17,24,39,0.70)",
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
            }}
          >
            💬 "{answerPreview}"
          </Typography>
        </Box>

        {/* 메시지 영역 */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2,
            py: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 0.3,
          }}
        >
          {messages.length === 0 && (
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", textAlign: "center" }}>
                대화를 시작해보세요!
              </Typography>
            </Box>
          )}

          {messages.map((msg, i) => {
            const prevMsg = messages[i - 1];
            const showGap = prevMsg && prevMsg.isMine !== msg.isMine;
            const borderRadius = getRadius(msg, i);

            return (
              <Box
                key={msg.id || i}
                sx={{
                  display: "flex",
                  justifyContent: msg.isMine ? "flex-end" : "flex-start",
                  mt: showGap ? 1 : 0,
                }}
              >
                <Box
                  sx={{
                    maxWidth: "75%",
                    px: 1.6,
                    py: 0.8,
                    borderRadius,
                    background: msg.isMine
                      ? "linear-gradient(135deg, #7C3AED, #EC4899)"
                      : "rgba(0,0,0,0.05)",
                    color: msg.isMine ? "#fff" : "var(--text-1)",
                    animation: "popIn 0.2s var(--spring) both",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: 1.45,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {msg.text}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          <div ref={messagesEndRef} />
        </Box>

        {/* 입력 영역 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.2,
            borderTop: "1px solid rgba(0,0,0,0.06)",
            flex: "0 0 auto",
            background: "rgba(255,255,255,0.98)",
            pb: "calc(12px + env(safe-area-inset-bottom))",
          }}
        >
          <Box
            component="input"
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력..."
            sx={{
              flex: 1,
              border: "none",
              outline: "none",
              borderRadius: 20,
              background: "rgba(0,0,0,0.05)",
              px: 2,
              py: 1.2,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
              color: "var(--text-1)",
              "&::placeholder": { color: "var(--text-3)", fontWeight: 500 },
            }}
          />

          {/* 전송 버튼 */}
          <Box
            onClick={handleSend}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: text.trim()
                ? "linear-gradient(135deg, #7C3AED, #EC4899)"
                : "rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: text.trim() ? "pointer" : "default",
              transition: "all 0.15s ease",
              flex: "0 0 auto",
              "&:active": text.trim() ? { transform: "scale(0.88)" } : {},
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                color: text.trim() ? "#fff" : "var(--text-3)",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              ▶
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}
