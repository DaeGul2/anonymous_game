// src/sockets/systemHandlers.js
const { detachSocket, getSocketSession, removeEditing, getRoomRuntime } = require("../store/memoryStore");
const { markDisconnected } = require("../services/roomService");

module.exports = (io, socket) => {
  socket.on("ping", () => socket.emit("pong", { ts: Date.now() }));

  socket.on("disconnect", async (reason) => {
    const sess = getSocketSession(socket.id);
    detachSocket(socket.id);

    // 연결 끊김은 "퇴장"이 아니라 "비연결" 처리(재접속 요구사항)
    try {
      if (sess?.roomCode && sess?.playerId) {
        // 다시쓰기 editing 플래그 정리 (끊긴 채로 잔존 방지)
        removeEditing(sess.roomCode, "question", sess.playerId);
        removeEditing(sess.roomCode, "answer", sess.playerId);

        // 빠른 재연결 레이스 컨디션 방어:
        // 새 소켓이 이미 붙었으면 markDisconnected 안 함
        const rt = getRoomRuntime(sess.roomCode);
        const hasNewSocket = rt?.socketsByUserId?.get(sess.userId);
        if (!hasNewSocket && sess.roomId) {
          await markDisconnected({ roomId: sess.roomId, playerId: sess.playerId });
        }
      }
    } catch (e) {
      console.error("[disconnect]", e?.message || e);
    }

    console.log("socket disconnected:", socket.id, reason);
  });
};
