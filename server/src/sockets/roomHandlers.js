// src/sockets/roomHandlers.js
const {
  listRooms,
  createRoom,
  joinRoom,
  getRoomState,
  setReady,
  leaveRoom,
} = require("../services/roomService");
const { rejoinRoom } = require("../services/reconnectService");
const { touchRoom, attachSocket, getSocketSession, detachSocket } = require("../store/memoryStore");

function ok(socket, event, data) {
  socket.emit(event, { ok: true, ...data });
}
function fail(socket, event, message) {
  socket.emit(event, { ok: false, message });
}

// 소켓 세션에서 로그인 유저 ID 가져오기
function getUserId(socket) {
  return socket.request.session?.passport?.user || null;
}

module.exports = (io, socket) => {
  // 1) 방 목록
  socket.on("room:list", async () => {
    try {
      const rooms = await listRooms();
      ok(socket, "room:list:res", { rooms });
    } catch (e) {
      fail(socket, "room:list:res", e?.message || "room list failed");
    }
  });

  // 2) 방 만들기
  socket.on("room:create", async ({ title, max_players, nickname, avatar } = {}) => {
    try {
      const userId = getUserId(socket);
      if (!userId) return fail(socket, "room:create:res", "로그인이 필요합니다");

      const { room, player } = await createRoom({ title, max_players, hostNickname: nickname, user_id: userId, avatar });

      socket.join(room.code);
      touchRoom(room.code, room.id);
      attachSocket({ socketId: socket.id, userId, roomCode: room.code, playerId: player.id, roomId: room.id });

      const state = await getRoomState(room.id);
      ok(socket, "room:create:res", { state });
      io.to(room.code).emit("room:update", { ok: true, state });
    } catch (e) {
      fail(socket, "room:create:res", e?.message || "room create failed");
    }
  });

  // 3) 방 입장
  socket.on("room:join", async ({ code, nickname, avatar } = {}) => {
    try {
      const userId = getUserId(socket);
      if (!userId) return fail(socket, "room:join:res", "로그인이 필요합니다");

      const { room, player } = await joinRoom({ code, nickname, user_id: userId, avatar });

      socket.join(room.code);
      touchRoom(room.code, room.id);
      attachSocket({ socketId: socket.id, userId, roomCode: room.code, playerId: player.id, roomId: room.id });

      const state = await getRoomState(room.id);
      ok(socket, "room:join:res", { state });
      io.to(room.code).emit("room:update", { ok: true, state });
    } catch (e) {
      fail(socket, "room:join:res", e?.message || "room join failed");
    }
  });

  // 4) 재접속
  socket.on("room:rejoin", async ({ code } = {}) => {
    try {
      const userId = getUserId(socket);
      if (!userId) return fail(socket, "room:rejoin:res", "로그인이 필요합니다");

      const { room, player } = await rejoinRoom({ code, user_id: userId });

      socket.join(room.code);
      touchRoom(room.code, room.id);
      attachSocket({ socketId: socket.id, userId, roomCode: room.code, playerId: player.id, roomId: room.id });

      const state = await getRoomState(room.id);
      ok(socket, "room:rejoin:res", { state });
      io.to(room.code).emit("room:update", { ok: true, state });
    } catch (e) {
      fail(socket, "room:rejoin:res", e?.message || "room rejoin failed");
    }
  });

  // 5) 준비완료 토글
  socket.on("room:ready", async ({ is_ready } = {}) => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) {
        return fail(socket, "room:ready:res", "방 세션 없음");
      }

      const { getRoomByCode } = require("../services/roomService");
      const room = await getRoomByCode(sess.roomCode);

      const { allReady } = await setReady({ roomId: room.id, playerId: sess.playerId, is_ready: !!is_ready });

      const state = await getRoomState(room.id);
      ok(socket, "room:ready:res", { allReady, state });
      io.to(room.code).emit("room:update", { ok: true, state });
    } catch (e) {
      fail(socket, "room:ready:res", e?.message || "ready failed");
    }
  });

  // 6) 방 나가기
  socket.on("room:leave", async () => {
    try {
      const sess = getSocketSession(socket.id);
      if (!sess?.roomCode || !sess?.playerId) {
        detachSocket(socket.id);
        return ok(socket, "room:leave:res", { left: true });
      }

      const { getRoomByCode } = require("../services/roomService");
      const room = await getRoomByCode(sess.roomCode);

      const res = await leaveRoom({ roomId: room.id, playerId: sess.playerId });

      socket.leave(sess.roomCode);
      detachSocket(socket.id);

      ok(socket, "room:leave:res", { left: true });

      if (res.room_deleted) {
        io.to(sess.roomCode).emit("room:destroyed", { ok: true });
        return;
      }

      const state = await getRoomState(room.id);
      io.to(room.code).emit("room:update", { ok: true, state });
    } catch (e) {
      fail(socket, "room:leave:res", e?.message || "leave failed");
    }
  });
};
