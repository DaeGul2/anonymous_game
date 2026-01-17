// src/jobs/cleanup.job.js
const { env } = require("../config/env");
const { cleanupIdleRooms } = require("../services/cleanupService");
const { removeRoomRuntime } = require("../store/memoryStore");

function startCleanupJob(io) {
  setInterval(async () => {
    try {
      const res = await cleanupIdleRooms();
      if (res.deleted > 0) {
        // 메모리 런타임도 정리
        for (const code of res.codes) removeRoomRuntime(code);
        // 해당 방에 붙어있던 소켓들에게 알릴 필요가 있으면 이벤트 쏘면 됨(지금은 생략)
        console.log(`[cleanup] deleted=${res.deleted} rooms`);
      }
    } catch (e) {
      console.error("[cleanup] failed:", e?.message || e);
    }
  }, env.CLEANUP_INTERVAL_SECONDS * 1000);
}

module.exports = { startCleanupJob };
