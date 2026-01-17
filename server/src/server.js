// src/server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { env } = require("./config/env");
const { initDb } = require("./config/db");
const healthRoutes = require("./routes/health");
const { errorHandler } = require("./middlewares/errorHandler");

// ✅ idle cleanup 관련
const { touchRoomByCode } = require("./services/cleanupService");
const { getSocketSession } = require("./store/memoryStore");

async function main() {
  const app = express();

  // 친구들끼리 쓸 거라며? 그럼 다 열어. (나중에 울지 말고)
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  app.use("/health", healthRoutes);

  app.use((req, res) => {
    res.status(404).json({ ok: false, message: "Not Found" });
  });

  app.use(errorHandler);

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // ✅ 모든 socket 이벤트가 오면(=행동) 해당 room last_activity_at 갱신
  // - socket session에 roomCode가 들어간 뒤부터 유효
  io.use(async (socket, next) => {
    // socket.id는 connection 이후 생성되므로, 여기서는 session 접근이 아직 없을 수도 있음
    next();
  });

  io.on("connection", (socket) => {
    // packet 단위 미들웨어: 실제 이벤트마다 실행됨
    socket.use(async (packet, next) => {
      try {
        const sess = getSocketSession(socket.id);
        if (sess?.roomCode) await touchRoomByCode(sess.roomCode);
      } catch (_) {}
      next();
    });
  });

  // sockets & jobs
  const { registerSockets } = require("./sockets");
  const { startCleanupJob } = require("./jobs/cleanup.job");

  registerSockets(io);

  // DB 먼저 붙고 job 돌리는 게 깔끔함 (Room 쿼리 쓰니까)
  await initDb();

  // ✅ 10분 idle 방 자동 삭제 job 시작
  startCleanupJob(io);

  server.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

main().catch((e) => {
  console.error("Boot failed:", e);
  process.exit(1);
});
