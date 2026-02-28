// server/src/sockets/gameHandlers.js
const { getSocketSession } = require("../store/memoryStore");
const game = require("../services/gameService");

function ok(socket, event, data) {
  socket.emit(event, { ok: true, ...data });
}
function fail(socket, event, message) {
  socket.emit(event, { ok: false, message });
}

module.exports = (io, socket) => {
  // 방장이 전원 준비 후 직접 게임 시작
  socket.on("game:start", async () => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return fail(socket, "game:start:res", "세션 없음");

      await game.hostStartGame(io, sess.roomCode, sess.playerId);
      ok(socket, "game:start:res", {});
    } catch (e) {
      fail(socket, "game:start:res", e?.message || "game start failed");
    }
  });

  socket.on("game:submitQuestion", async ({ text, answer_type } = {}) => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return fail(socket, "game:submitQuestion:res", "세션 없음");

      await game.submitQuestion(io, { roomCode: sess.roomCode, playerId: sess.playerId, text, answer_type });
      ok(socket, "game:submitQuestion:res", {});
    } catch (e) {
      fail(socket, "game:submitQuestion:res", e?.message || "submitQuestion failed");
    }
  });

  socket.on("game:submitAnswer", async ({ text } = {}) => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return fail(socket, "game:submitAnswer:res", "세션 없음");

      await game.submitAnswer(io, { roomCode: sess.roomCode, playerId: sess.playerId, text });
      ok(socket, "game:submitAnswer:res", {});
    } catch (e) {
      fail(socket, "game:submitAnswer:res", e?.message || "submitAnswer failed");
    }
  });

  // ✅ reveal에서 방장이 눌러서 다음 단계로
  socket.on("game:hostRevealNext", async () => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return fail(socket, "game:hostRevealNext:res", "세션 없음");

      await game.hostRevealNext(io, sess.roomCode, sess.playerId);
      ok(socket, "game:hostRevealNext:res", {});
    } catch (e) {
      fail(socket, "game:hostRevealNext:res", e?.message || "hostRevealNext failed");
    }
  });

  socket.on("game:hostNextRound", async () => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return fail(socket, "game:hostNextRound:res", "세션 없음");

      await game.hostNextRound(io, sess.roomCode, sess.playerId);
      ok(socket, "game:hostNextRound:res", {});
    } catch (e) {
      fail(socket, "game:hostNextRound:res", e?.message || "hostNextRound failed");
    }
  });

  socket.on("game:hostEndGame", async () => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return fail(socket, "game:hostEndGame:res", "세션 없음");

      await game.hostEndGame(io, sess.roomCode, sess.playerId);
      ok(socket, "game:hostEndGame:res", {});
    } catch (e) {
      fail(socket, "game:hostEndGame:res", e?.message || "hostEndGame failed");
    }
  });

  // ===== 다시쓰기 알림 =====
  socket.on("game:editQuestion", async () => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return;
      await game.editQuestion(sess.roomCode, sess.playerId);
    } catch (e) {
      console.error("[editQuestion]", e?.message || e);
    }
  });

  socket.on("game:editAnswer", async () => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return;
      await game.editAnswer(sess.roomCode, sess.playerId);
    } catch (e) {
      console.error("[editAnswer]", e?.message || e);
    }
  });

  // ===== 익명 감정표현 =====
  socket.on("game:reaction", ({ emoji, text } = {}) => {
    const sess = getSocketSession(socket.id);
    if (!sess?.roomCode) return;
    const safeEmoji = (emoji || "").slice(0, 10);
    const safeText = (text || "").slice(0, 50);
    if (!safeEmoji && !safeText) return;
    io.to(sess.roomCode).emit("game:reaction:broadcast", {
      ok: true,
      id: Date.now() + Math.random(),
      emoji: safeEmoji || null,
      text: safeText || null,
    });
  });

  // ===== 질문 하트 토글 =====
  socket.on("game:heartQuestion", async ({ question_id } = {}) => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return;
      await game.heartQuestion(io, { roomCode: sess.roomCode, playerId: sess.playerId, question_id });
    } catch (e) {
      console.error("[heartQuestion]", e?.message || e);
    }
  });
};
