// src/services/cleanupService.js
const { Op } = require("sequelize");
const { Room } = require("../models");
const { env } = require("../config/env");

async function cleanupIdleRooms() {
  const cutoff = new Date(Date.now() - env.ROOM_IDLE_TTL_SECONDS * 1000);

  const rooms = await Room.findAll({
    where: { last_activity_at: { [Op.lt]: cutoff } },
    limit: 200,
  });

  if (rooms.length === 0) return { deleted: 0, codes: [] };

  const codes = rooms.map((r) => r.code);
  const ids = rooms.map((r) => r.id);

  await Room.destroy({ where: { id: { [Op.in]: ids } } }); // CASCADE로 player/question/answer도 같이 삭제됨
  return { deleted: ids.length, codes };
}

module.exports = { cleanupIdleRooms };
