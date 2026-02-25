// src/store/memoryStore.js
const rooms = new Map(); // roomCode -> runtime
const sockets = new Map(); // socketId -> { guestId, roomCode, playerId }

function ensureRoomRuntime(roomCode) {
  let r = rooms.get(roomCode);
  if (!r) {
    r = {
      roomId: null,
      socketsByUserId: new Map(),
      timers: new Map(), // name -> timeoutId
      game: {
        roundId: null,
        questionIds: [],
        questionIndex: 0,
        currentQuestionId: null,
      },
      updatedAt: Date.now(),
    };
    rooms.set(roomCode, r);
  }
  return r;
}

function touchRoom(roomCode, roomId) {
  if (!roomCode) return;
  const r = ensureRoomRuntime(roomCode);
  if (roomId) r.roomId = roomId;
  r.updatedAt = Date.now();
}

function attachSocket({ socketId, userId, roomCode, playerId, roomId }) {
  sockets.set(socketId, { userId, roomCode, playerId });

  let prevSocketId = null;
  if (roomCode) {
    const r = ensureRoomRuntime(roomCode);
    if (roomId) r.roomId = roomId;
    const old = r.socketsByUserId.get(userId);
    if (old && old !== socketId) prevSocketId = old;
    r.socketsByUserId.set(userId, socketId);
    r.updatedAt = Date.now();
  }
  return prevSocketId;
}

function detachSocket(socketId) {
  const s = sockets.get(socketId);
  sockets.delete(socketId);
  if (!s) return;

  const { userId, roomCode } = s;
  if (roomCode && rooms.has(roomCode)) {
    const r = rooms.get(roomCode);
    if (r.socketsByUserId.get(userId) === socketId) r.socketsByUserId.delete(userId);
    r.updatedAt = Date.now();
  }
}

function getSocketSession(socketId) {
  return sockets.get(socketId) || null;
}

function getRoomRuntime(roomCode) {
  return rooms.get(roomCode) || null;
}

function removeRoomRuntime(roomCode) {
  const r = rooms.get(roomCode);
  if (r) {
    // 타이머 정리
    for (const id of r.timers.values()) clearTimeout(id);
  }
  rooms.delete(roomCode);
}

function clearRoomTimer(roomCode, name) {
  const r = rooms.get(roomCode);
  if (!r) return;
  const id = r.timers.get(name);
  if (id) clearTimeout(id);
  r.timers.delete(name);
}

function setRoomTimer(roomCode, name, timeoutId) {
  const r = ensureRoomRuntime(roomCode);
  clearRoomTimer(roomCode, name);
  r.timers.set(name, timeoutId);
}

function setGameRuntime(roomCode, patch) {
  const r = ensureRoomRuntime(roomCode);
  r.game = { ...r.game, ...patch };
  r.updatedAt = Date.now();
  return r.game;
}

module.exports = {
  touchRoom,
  attachSocket,
  detachSocket,
  getSocketSession,
  getRoomRuntime,
  removeRoomRuntime,
  clearRoomTimer,
  setRoomTimer,
  setGameRuntime,
};
