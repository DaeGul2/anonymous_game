// src/components/ChatFAB.js
import React from "react";
import { Box, Typography } from "@mui/material";
import { useRoomStore } from "../state/useRoomStore";

const EMOJIS = ["🐻", "🦊", "🐼", "🐸", "🐯", "🦋", "🐧", "🐰", "🦄", "🐙"];

export default function ChatFAB() {
  const { game, chatToggleList, chatOpen } = useRoomStore();
  const chats = game.chats || {};
  const chatList = Object.values(chats);
  const chatListOpen = game.chatListOpen;

  // 채팅이 없으면 렌더링 안 함
  if (chatList.length === 0) return null;

  const totalUnread = chatList.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <>
      {/* 리스트 백드롭 */}
      {chatListOpen && (
        <Box
          onClick={chatToggleList}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1240,
            background: "rgba(0,0,0,0.15)",
          }}
        />
      )}

      {/* FAB + 리스트 영역 */}
      <Box
        sx={{
          position: "fixed",
          bottom: "calc(24px + env(safe-area-inset-bottom))",
          left: 18,
          zIndex: 1250,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1.2,
        }}
      >
        {/* 채팅 목록 팝업 */}
        {chatListOpen && (
          <Box
            sx={{
              width: 280,
              maxHeight: 360,
              borderRadius: "16px",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(124,58,237,0.10)",
              overflow: "hidden",
              animation: "reactionMenuIn 0.25s var(--spring) both",
            }}
          >
            {/* 헤더 */}
            <Box sx={{ px: 2, py: 1.4, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <Typography sx={{ fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em" }}>
                💬 대화
              </Typography>
            </Box>

            {/* 아이템 리스트 */}
            <Box sx={{ overflowY: "auto", maxHeight: 300 }}>
              {chatList.map((chat, i) => {
                const emoji = EMOJIS[(chat.cardIndex || i) % EMOJIS.length];
                const lastMsg = chat.messages?.[chat.messages.length - 1];
                const preview = chat.answerText?.length > 25
                  ? chat.answerText.slice(0, 25) + "..."
                  : chat.answerText || "";

                return (
                  <Box
                    key={chat.chatId}
                    onClick={() => chatOpen(chat.chatId)}
                    sx={{
                      px: 2,
                      py: 1.2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      cursor: "pointer",
                      transition: "background 0.12s ease",
                      "&:hover": { background: "rgba(124,58,237,0.06)" },
                      "&:active": { background: "rgba(124,58,237,0.10)" },
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* 아바타 */}
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(124,58,237,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flex: "0 0 auto",
                      }}
                    >
                      {emoji}
                    </Box>

                    {/* 텍스트 */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "rgba(17,24,39,0.80)",
                          letterSpacing: "-0.01em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {preview || "익명 답변"}
                      </Typography>
                      {lastMsg && (
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--text-3)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {lastMsg.isMine ? "나: " : ""}{lastMsg.text}
                        </Typography>
                      )}
                    </Box>

                    {/* unread 뱃지 */}
                    {chat.unreadCount > 0 && (
                      <Box
                        sx={{
                          minWidth: 18,
                          height: 18,
                          borderRadius: 9,
                          background: "#FF3B30",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          px: 0.5,
                          flex: "0 0 auto",
                          animation: "popIn 0.3s var(--spring) both",
                        }}
                      >
                        <Typography
                          sx={{ fontSize: 11, fontWeight: 800, color: "#fff", lineHeight: 1 }}
                        >
                          {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* FAB 버튼 */}
        <Box
          onClick={chatToggleList}
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: chatListOpen
              ? "rgba(17,24,39,0.85)"
              : "linear-gradient(135deg, #7C3AED, #EC4899)",
            boxShadow: chatListOpen
              ? "0 4px 20px rgba(0,0,0,0.25)"
              : "0 6px 24px rgba(124,58,237,0.40)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
            transition: "all 0.2s ease",
            position: "relative",
            "&:active": { transform: "scale(0.88)" },
            animation: "popIn 0.4s var(--spring) both",
          }}
        >
          <Typography
            sx={{
              fontSize: chatListOpen ? 16 : 22,
              lineHeight: 1,
              color: "#fff",
              transition: "font-size 0.15s ease",
            }}
          >
            {chatListOpen ? "✕" : "💬"}
          </Typography>

          {/* 뱃지 */}
          {totalUnread > 0 && !chatListOpen && (
            <Box
              sx={{
                position: "absolute",
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: "#FF3B30",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 0.5,
                animation: "popIn 0.3s var(--spring) both",
              }}
            >
              <Typography
                sx={{ fontSize: 11, fontWeight: 800, color: "#fff", lineHeight: 1 }}
              >
                {totalUnread > 9 ? "9+" : totalUnread}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}
