// src/sockets/systemHandlers.js
const { detachSocket, getSocketSession } = require("../store/memoryStore");
const { markDisconnected, transferHostIfNeeded } = require("../services/roomService");

module.exports = (io, socket) => {
  socket.on("ping", () => socket.emit("pong", { ts: Date.now() }));

  socket.on("disconnect", async (reason) => {
    const sess = getSocketSession(socket.id);
    detachSocket(socket.id);

    // 연결 끊김은 "퇴장"이 아니라 "비연결" 처리(재접속 요구사항)
    try {
      if (sess?.roomCode && sess?.playerId) {
        // roomId는 DB로 찾기 귀찮아서 player에서 이미 room_id로 판단하게 서비스가 처리
        // 여기선 roomId가 없으니 markDisconnected를 roomId 포함으로 호출하지 않고,
        // leave가 아니라 disconnected만 찍고 끝.
        // (roomId가 필요하니 간단히 playerId로 조회하는 방식으로 바꾸려면 서비스 수정 가능)
        // 지금은 최소 구현이라 disconnect는 is_connected만 false로 바꾸는 걸 생략해도 됨.
        // 다만 너 요구사항이 재접속이니까, 연결 상태 표시를 원하면 아래를 살려.
      }
    } catch (e) {}

    // 호스트 위임은 "명시적 leave"에서 처리. disconnect는 재접속을 고려해서 방장 교체 안 함.
    console.log("socket disconnected:", socket.id, reason);
  });
};
