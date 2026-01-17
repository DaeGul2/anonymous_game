// src/sockets/gameHandlers.js
const { getSocketSession } = require("../store/memoryStore");
const game = require("../services/gameService");

function ok(socket, event, data) {
  socket.emit(event, { ok: true, ...data });
}
function fail(socket, event, message) {
  socket.emit(event, { ok: false, message });
}

module.exports = (io, socket) => {
  // 질문 제출
  socket.on("game:submitQuestion", async ({ text } = {}) => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) return fail(socket, "game:submitQuestion:res", "세션 없음");

      await game.submitQuestion(io, { roomCode: sess.roomCode, playerId: sess.playerId, text });
      ok(socket, "game:submitQuestion:res", {});
    } catch (e) {
      fail(socket, "game:submitQuestion:res", e?.message || "submitQuestion failed");
    }
  });

  // 답변 제출(현재 질문에 대한 답변)
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

  // 방장: 다음 라운드
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

  // 방장: 게임 종료(로비 복귀 + ready reset)
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
};
