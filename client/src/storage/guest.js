// src/storage/guest.js
const KEY_ID = "ag_guest_id";
const KEY_TOKEN = "ag_guest_token";

function makeGuestId() {
  // 최신 브라우저면 이게 제일 깔끔
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  // fallback: 대충 유니크
  return "g_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getOrCreateGuestId() {
  let id = localStorage.getItem(KEY_ID);
  if (!id) {
    id = makeGuestId();
    localStorage.setItem(KEY_ID, id);
  }
  return id;
}

export function getGuestToken() {
  return localStorage.getItem(KEY_TOKEN) || "";
}

export function setGuestToken(token) {
  if (!token) return;
  localStorage.setItem(KEY_TOKEN, token);
}

export function clearGuest() {
  localStorage.removeItem(KEY_ID);
  localStorage.removeItem(KEY_TOKEN);
}
