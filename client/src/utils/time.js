// src/utils/time.js
export function msLeft(deadlineIso) {
  if (!deadlineIso) return 0;
  const t = new Date(deadlineIso).getTime();
  return Math.max(0, t - Date.now());
}

export function formatMMSS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
