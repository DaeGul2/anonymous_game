// src/constants/avatars.js
// DiceBear bottts-neutral 스타일 아바타 (CDN, 설치 불필요)
// https://www.dicebear.com/styles/bottts-neutral

export const AVATARS = [
  { seed: "Felix",   bg: "b6e3f4", label: "블루봇" },
  { seed: "Aneka",   bg: "ffd5dc", label: "핑크봇" },
  { seed: "Max",     bg: "d1d4f9", label: "퍼플봇" },
  { seed: "Mia",     bg: "c0aede", label: "라벤더봇" },
  { seed: "Charlie", bg: "ffdfbf", label: "오렌지봇" },
  { seed: "Luna",    bg: "b6f4d4", label: "그린봇" },
  { seed: "Oscar",   bg: "f4d4b6", label: "옐로봇" },
  { seed: "Bella",   bg: "f4b6d4", label: "로즈봇" },
  { seed: "Leo",     bg: "b6d4f4", label: "스카이봇" },
  { seed: "Sophie",  bg: "d4f4b6", label: "민트봇" },
  { seed: "Milo",    bg: "f4f4b6", label: "레몬봇" },
  { seed: "Chloe",   bg: "d4b6f4", label: "바이올렛봇" },
];

/** 아바타 인덱스 → DiceBear CDN URL */
export function avatarUrl(idx) {
  const av = AVATARS[Number(idx) % AVATARS.length] || AVATARS[0];
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${av.seed}&radius=50&backgroundColor=${av.bg}`;
}

/** localStorage에 아바타 인덱스 저장/로드 */
const LS_KEY = "ag:avatar";
export function loadSavedAvatar() {
  try {
    const v = localStorage.getItem(LS_KEY);
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 && n < AVATARS.length ? n : 0;
  } catch {
    return 0;
  }
}
export function saveAvatarChoice(idx) {
  try { localStorage.setItem(LS_KEY, String(idx)); } catch {}
}
