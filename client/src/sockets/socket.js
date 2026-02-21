// client/src/sockets/socket.js
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  if (socket) return socket;

  // ✅ 같은 도메인으로 붙기 (https면 자동으로 wss로 감)
  const SERVER = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

  socket = io(SERVER, {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true,   // 세션 쿠키 전송
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 400,
    reconnectionDelayMax: 2000,
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
