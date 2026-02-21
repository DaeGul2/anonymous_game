// src/services/reconnectService.js
const { Player, Room } = require("../models");

async function rejoinRoom({ code, user_id }) {
  const room = await Room.findOne({ where: { code } });
  if (!room) throw new Error("방을 찾을 수 없음");

  const player = await Player.findOne({ where: { room_id: room.id, user_id } });
  if (!player) throw new Error("재접속할 플레이어가 없음");

  player.is_connected = true;
  player.last_seen_at = new Date();
  await player.save();

  room.last_activity_at = new Date();
  await room.save();

  return { room, player };
}

module.exports = { rejoinRoom };
