// src/sockets/systemHandlers.js
const { detachSocket, getSocketSession, removeEditing } = require("../store/memoryStore");
const { markDisconnected, transferHostIfNeeded } = require("../services/roomService");

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
      }
    } catch (e) {}

    // 호스트 위임은 "명시적 leave"에서 처리. disconnect는 재접속을 고려해서 방장 교체 안 함.
    console.log("socket disconnected:", socket.id, reason);
  });
};
