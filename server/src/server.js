// src/server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { env } = require("./config/env");
const { initDb } = require("./config/db");
const healthRoutes = require("./routes/health");
const { errorHandler } = require("./middlewares/errorHandler");

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

    // src/server.js (io 생성 후)
    const { registerSockets } = require("./sockets");
    const { startCleanupJob } = require("./jobs/cleanup.job");

    registerSockets(io);
    startCleanupJob(io);

    await initDb();

    server.listen(env.PORT, () => {
        console.log(`Server listening on port ${env.PORT}`);
    });
}

main().catch((e) => {
    console.error("Boot failed:", e);
    process.exit(1);
});
