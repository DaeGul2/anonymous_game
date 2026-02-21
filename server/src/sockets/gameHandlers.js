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
};
