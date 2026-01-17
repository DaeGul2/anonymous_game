// src/jobs/cleanup.job.js
const { env } = require("../config/env");
const { cleanupExpiredRooms } = require("../services/cleanupService");

let timer = null;

function startCleanupJob(io) {
  if (timer) return;

  const intervalMs = (env.CLEANUP_INTERVAL_SECONDS || 10) * 1000;

  timer = setInterval(() => {
    cleanupExpiredRooms(io).catch((e) => {
      console.error("[cleanupJob]", e?.message || e);
    });
  }, intervalMs);

  timer.unref?.(); // 있으면 프로세스 종료 방해 안 하게
  console.log(`[cleanupJob] started interval=${intervalMs}ms ttl=${env.ROOM_IDLE_TTL_SECONDS}s`);
}

function stopCleanupJob() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

module.exports = { startCleanupJob, stopCleanupJob };
