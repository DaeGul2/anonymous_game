// src/sockets/chatHandlers.js
const { v4: uuidv4 } = require("uuid");
const {
  getSocketSession,
  getRoomRuntime,
  createChat,
  getChat,
  addChatMessage,
} = require("../store/memoryStore");

module.exports = (io, socket) => {
  // ===== chat:start — 답변 카드에서 익명 대화 시작 =====
  socket.on("chat:start", ({ cardIndex } = {}, ack) => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) {
        return ack?.({ ok: false, message: "세션 없음" });
      }

      const rt = getRoomRuntime(sess.roomCode);
      const game = rt?.game;
      if (!game?.revealAnswerMap || !game?.revealAnswerTexts) {
        return ack?.({ ok: false, message: "답변 매핑 없음" });
      }

      if (cardIndex == null || cardIndex < 0 || cardIndex >= game.revealAnswerMap.length) {
        return ack?.({ ok: false, message: "잘못된 카드 인덱스" });
      }

      const responderPlayerId = game.revealAnswerMap[cardIndex];
      if (!responderPlayerId) {
        return ack?.({ ok: false, message: "답변자를 찾을 수 없음" });
      }

      // self-chat 방지
      if (responderPlayerId === sess.playerId) {
        return ack?.({ ok: false, message: "자신의 답변에는 대화할 수 없어요" });
      }

      const answerText = game.revealAnswerTexts[cardIndex] || "";
      const questionText = game.revealQuestionText || "";
      const chatId = `chat:${game.currentQuestionId}:${cardIndex}:${sess.playerId}`;

      // 중복 체크 — 이미 같은 대화가 있으면 기존 반환
      const existing = getChat(sess.roomCode, chatId);
      if (existing) {
        return ack?.({
          ok: true,
          chatId,
          questionText: existing.questionText || questionText,
          answerText: existing.answerText,
          cardIndex,
          messages: existing.messages.map((m) => ({
            id: m.id,
            text: m.text,
            sentAt: m.sentAt,
            isMine: m.senderPlayerId === sess.playerId,
          })),
        });
      }

      // 답변자의 userId 조회 (소켓 라우팅용)
      const responderUserId = rt.userIdByPlayerId?.get(responderPlayerId);

      createChat(sess.roomCode, {
        chatId,
        cardIndex,
        questionId: game.currentQuestionId,
        questionText,
        answerText,
        initiatorPlayerId: sess.playerId,
        initiatorUserId: sess.userId,
        responderPlayerId,
        responderUserId: responderUserId || null,
      });

      // 개시자에게 응답
      ack?.({
        ok: true,
        chatId,
        questionText,
        answerText,
        cardIndex,
        messages: [],
      });

      // 답변자에게 알림 (FAB 뱃지용)
      if (responderUserId) {
        const responderSocketId = rt.socketsByUserId?.get(responderUserId);
        if (responderSocketId) {
          io.to(responderSocketId).emit("chat:started", {
            chatId,
            questionText,
            answerText,
            cardIndex,
          });
        }
      }
    } catch (e) {
      console.error("[chat:start]", e?.message || e);
      ack?.({ ok: false, message: "채팅 시작 실패" });
    }
  });

  // ===== chat:send — 메시지 전송 =====
  socket.on("chat:send", ({ chatId, text } = {}, ack) => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) {
        return ack?.({ ok: false, message: "세션 없음" });
      }

      const chat = getChat(sess.roomCode, chatId);
      if (!chat) {
        return ack?.({ ok: false, message: "채팅방을 찾을 수 없음" });
      }

      // 참여자 검증
      const isInitiator = chat.initiatorPlayerId === sess.playerId;
      const isResponder = chat.responderPlayerId === sess.playerId;
      if (!isInitiator && !isResponder) {
        return ack?.({ ok: false, message: "채팅 참여자가 아님" });
      }

      const trimmed = String(text || "").trim().slice(0, 200);
      if (!trimmed) {
        return ack?.({ ok: false, message: "빈 메시지" });
      }

      const msg = {
        id: uuidv4(),
        senderPlayerId: sess.playerId,
        text: trimmed,
        sentAt: new Date().toISOString(),
      };

      addChatMessage(sess.roomCode, chatId, msg);

      // 발신자에게 확인 + 메시지
      ack?.({ ok: true });
      socket.emit("chat:receive", {
        chatId,
        message: { id: msg.id, text: msg.text, sentAt: msg.sentAt, isMine: true },
      });

      // 상대방에게 전달
      const rt = getRoomRuntime(sess.roomCode);
      const otherUserId = isInitiator ? chat.responderUserId : chat.initiatorUserId;
      if (otherUserId && rt?.socketsByUserId) {
        const otherSocketId = rt.socketsByUserId.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit("chat:receive", {
            chatId,
            message: { id: msg.id, text: msg.text, sentAt: msg.sentAt, isMine: false },
          });
        }
      }
    } catch (e) {
      console.error("[chat:send]", e?.message || e);
      ack?.({ ok: false, message: "메시지 전송 실패" });
    }
  });
};
