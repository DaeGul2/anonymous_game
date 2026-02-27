// src/server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { Server } = require("socket.io");

const { env } = require("./config/env");
const { initDb } = require("./config/db");
const { User } = require("./models");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const { errorHandler } = require("./middlewares/errorHandler");
const { globalLimiter, authLimiter } = require("./middlewares/rateLimit");

const { touchRoomByCode } = require("./services/cleanupService");
const { getSocketSession } = require("./store/memoryStore");

// ===== Passport 설정 =====
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || "";
        const displayName = profile.displayName || email;
        const avatarUrl = profile.photos?.[0]?.value || null;

        let user = await User.findOne({ where: { google_id: googleId } });
        if (!user) {
          user = await User.create({ google_id: googleId, email, display_name: displayName, avatar_url: avatarUrl });
        } else {
          // 프로필 동기화
          user.display_name = displayName;
          user.avatar_url = avatarUrl;
          await user.save();
        }

        return done(null, user);
      } catch (e) {
        return done(e, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user || false);
  } catch (e) {
    done(e, null);
  }
});

async function main() {
  const app = express();

  // Nginx 리버스 프록시 뒤에 있을 때 X-Forwarded-* 신뢰
  app.set("trust proxy", 1);

  // CORS: 클라이언트 origin만 허용 + credentials
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // ===== 세션 =====
  const sessionMiddleware = session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // HTTPS 환경에서 자동 true
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일 (로그아웃 안 하면 유지)
    },
  });

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  // ===== Rate Limiting =====
  app.use(globalLimiter);
  app.use("/auth", authLimiter);

  // ===== 라우트 =====
  app.use("/health", healthRoutes);
  app.use("/auth", authRoutes);

  // 현재 유저의 활성 방 조회 (홈화면 자동 복귀용)
  app.get("/room/my-active", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ ok: false });
      const { getMyActiveRoom } = require("./services/roomService");
      const result = await getMyActiveRoom(req.user.id);
      res.json({ ok: true, ...result });
    } catch (e) {
      res.json({ ok: true, room: null });
    }
  });

  app.use((req, res) => {
    // 브라우저 직접 접근(GET + HTML 요청)이면 클라이언트로 리다이렉트
    if (req.method === "GET" && req.accepts("html")) {
      return res.redirect(env.CLIENT_URL || "/");
    }
    res.status(404).json({ ok: false, message: "Not Found" });
  });
  app.use(errorHandler);

  const server = http.createServer(app);

  // ===== Socket.io =====
  const io = new Server(server, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  // Socket.io에 express-session 공유
  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
  });

  // 미인증 소켓 차단
  io.use((socket, next) => {
    const user = socket.request.session?.passport?.user;
    if (!user) return next(new Error("UNAUTHORIZED"));
    next();
  });

  // packet 미들웨어: room last_activity_at 갱신 + 소켓 이벤트 rate limit
  const SOCKET_COOLDOWNS = {
    "game:submitQuestion": 3000,
    "game:submitAnswer": 3000,
    "game:heartQuestion": 1000,
    "room:create": 5000,
    "game:editQuestion": 2000,
    "game:editAnswer": 2000,
    "game:reaction": 1000,
  };
  const DEFAULT_COOLDOWN = 500;

  io.on("connection", (socket) => {
    const lastEmit = {};

    socket.use(async (packet, next) => {
      // rate limit
      const event = packet[0];
      const cooldown = SOCKET_COOLDOWNS[event] ?? DEFAULT_COOLDOWN;
      const now = Date.now();
      if (lastEmit[event] && now - lastEmit[event] < cooldown) return; // 조용히 drop
      lastEmit[event] = now;

      // room activity touch
      try {
        const sess = getSocketSession(socket.id);
        if (sess?.roomCode) await touchRoomByCode(sess.roomCode);
      } catch (_) {}
      next();
    });
  });

  const { registerSockets } = require("./sockets");
  const { startCleanupJob } = require("./jobs/cleanup.job");

  registerSockets(io);

  await initDb();
  startCleanupJob(io);

  server.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

main().catch((e) => {
  console.error("Boot failed:", e);
  process.exit(1);
});
