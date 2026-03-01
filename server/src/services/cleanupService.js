// src/services/cleanupService.js
const { Op } = require("sequelize");
const { env } = require("../config/env");
const { Room, Player, User } = require("../models");
const { clearTimers } = require("./timerService");
const { removeRoomRuntime } = require("../store/memoryStore");
const { archiveHumanQa, accumulateTemplateStats } = require("./qaArchiveService");

async function touchRoomByCode(roomCode) {
  if (!roomCode) return;
  await Room.update(
    { last_activity_at: new Date() },
    { where: { code: roomCode } }
  );
}

async function cleanupExpiredRooms(io) {
  const ttlMs = (env.ROOM_IDLE_TTL_SECONDS || 600) * 1000;
  const cutoff = new Date(Date.now() - ttlMs);

  const expired = await Room.findAll({
    where: { last_activity_at: { [Op.lt]: cutoff } },
    attributes: ["id", "code"],
  });

  for (const r of expired) {
    try {
      // 클라에 방 폭파 알림
      if (io) io.to(r.code).emit("room:destroyed", { ok: true, code: r.code });

      // 타이머 정리
      clearTimers(r.code, ["question_submit_end", "answer_end", "reveal_end", "host_timeout"]);

      // AI 유저 ID 수집 (CASCADE 전에)
      const aiPlayers = await Player.findAll({
        where: { room_id: r.id, is_ai: true },
        attributes: ["user_id"],
      });
      const aiUserIds = aiPlayers.map((p) => p.user_id);

      // 템플릿 통계 누적 + 인간 Q&A 아카이브 (CASCADE 전에)
      await accumulateTemplateStats(r.id);
      await archiveHumanQa(r.id);

      // DB 삭제 (연관 CASCADE로 players/rounds/questions/answers 같이 날아감)
      await Room.destroy({ where: { id: r.id } });

      // 고아 AI User 삭제 (Player CASCADE 후)
      if (aiUserIds.length > 0) {
        await User.destroy({ where: { id: { [Op.in]: aiUserIds } } });
      }

      // 메모리 런타임 정리 (rooms Map에서 제거)
      removeRoomRuntime(r.code);

      // 방에 붙어있던 소켓들 강제 out
      if (io) {
        const sockets = await io.in(r.code).fetchSockets();
        for (const s of sockets) {
          try {
            s.leave(r.code);
          } catch (_) {}
        }
      }

      console.log(`[cleanup] room expired deleted: ${r.code}`);
    } catch (e) {
      console.error(`[cleanup] failed room=${r.code}`, e?.message || e);
    }
  }
}

module.exports = {
  touchRoomByCode,
  cleanupExpiredRooms,
};
