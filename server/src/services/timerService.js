// src/services/timerService.js
const { setRoomTimer, clearRoomTimer } = require("../store/memoryStore");

function scheduleAt(roomCode, name, whenMs, fn) {
  const delay = Math.max(0, whenMs - Date.now());
  const id = setTimeout(fn, delay);
  setRoomTimer(roomCode, name, id);
  return id;
}

function clearTimers(roomCode, names) {
  for (const n of names) clearRoomTimer(roomCode, n);
}

module.exports = {
  scheduleAt,
  clearTimers,
};
