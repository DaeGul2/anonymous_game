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
  sockets.set(socketId, { userId, roomCode, playerId, roomId });

  let prevSocketId = null;
  if (roomCode) {
    const r = ensureRoomRuntime(roomCode);
    if (roomId) r.roomId = roomId;
    const old = r.socketsByUserId.get(userId);
    if (old && old !== socketId) prevSocketId = old;
    r.socketsByUserId.set(userId, socketId);
    // playerId → userId 매핑 (채팅 라우팅용)
    if (!r.userIdByPlayerId) r.userIdByPlayerId = new Map();
    if (playerId && userId) r.userIdByPlayerId.set(playerId, userId);
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

// ===== editing 상태 (다시쓰기) =====
function _ensureEditing(roomCode) {
  const r = ensureRoomRuntime(roomCode);
  if (!r.editing) r.editing = { question: new Set(), answer: new Set() };
  return r.editing;
}

function addEditing(roomCode, type, playerId) {
  const e = _ensureEditing(roomCode);
  if (type === "question") e.question.add(playerId);
  else if (type === "answer") e.answer.add(playerId);
}

function removeEditing(roomCode, type, playerId) {
  const r = rooms.get(roomCode);
  if (!r?.editing) return;
  if (type === "question") r.editing.question.delete(playerId);
  else if (type === "answer") r.editing.answer.delete(playerId);
}

function getEditingCount(roomCode, type) {
  const r = rooms.get(roomCode);
  if (!r?.editing) return 0;
  if (type === "question") return r.editing.question.size;
  if (type === "answer") return r.editing.answer.size;
  return 0;
}

function clearEditing(roomCode, type) {
  const r = rooms.get(roomCode);
  if (!r?.editing) return;
  if (type) {
    if (type === "question") r.editing.question.clear();
    else if (type === "answer") r.editing.answer.clear();
  } else {
    r.editing.question.clear();
    r.editing.answer.clear();
  }
}

// ===== 익명 채팅 =====
function _ensureChats(roomCode) {
  const r = ensureRoomRuntime(roomCode);
  if (!r.chats) r.chats = new Map();
  return r.chats;
}

function createChat(roomCode, chatData) {
  const chats = _ensureChats(roomCode);
  chats.set(chatData.chatId, { ...chatData, messages: [] });
  return chats.get(chatData.chatId);
}

function getChat(roomCode, chatId) {
  const r = rooms.get(roomCode);
  return r?.chats?.get(chatId) || null;
}

function getChatsForPlayer(roomCode, playerId) {
  const r = rooms.get(roomCode);
  if (!r?.chats) return [];
  const result = [];
  for (const c of r.chats.values()) {
    if (c.initiatorPlayerId === playerId || c.responderPlayerId === playerId) {
      result.push(c);
    }
  }
  return result;
}

function addChatMessage(roomCode, chatId, msg) {
  const chat = getChat(roomCode, chatId);
  if (!chat) return null;
  chat.messages.push(msg);
  return msg;
}

function clearChats(roomCode) {
  const r = rooms.get(roomCode);
  if (r?.chats) r.chats.clear();
}

function _resetForTesting() {
  rooms.clear();
  sockets.clear();
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
  addEditing,
  removeEditing,
  getEditingCount,
  clearEditing,
  createChat,
  getChat,
  getChatsForPlayer,
  addChatMessage,
  clearChats,
  _resetForTesting,
};
