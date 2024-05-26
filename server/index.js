// dotenv 설정
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const session = require('express-session');
const socketIo = require('socket.io');
const cors = require('cors');
const MongoStore = require('connect-mongo');

/** routes---  */
const gameRoutes = require('./routes/gameRoutes'); // gameRoutes 가져오기
const userRoutes = require('./routes/userRoutes'); // 추가된 부분
const questionRoutes = require('./routes/questionRoutes'); // 추가된 부분
const authRoutes = require('./routes/authRoutes');
/** routes--- end */

const apiKey = process.env.API_KEY; // 안전한 API 키를 설정하세요

// API 키 검증 미들웨어
function validateApiKey(req, res, next) {
  const clientApiKey = req.header('x-api-key'); // 헤더에서 API 키 추출
  if (clientApiKey === apiKey) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Invalid API Key' });
  }
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL, // 이 설정은 모든 도메인에서 소켓 접속을 허용합니다. 실제 배포시에는 지정된 도메인을 설정해야 합니다.
    methods: ["GET", "POST", "PUT"],
    credentials: true
  }
});

// 소켓 객체를 애플리케이션 전역에 설정
app.set('io', io);

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB와의 연결
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB에 연결되었습니다.');

    // Express JSON 미들웨어
    app.use(express.json());

    app.use(cors(
      {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true
      }
    ));
    app.use(
      session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: MONGODB_URI }),
        cookie: { maxAge: 86400000 } // 24시간
      })
    );

    // API 키 검증 미들웨어를 /api/로 시작하는 모든 경로에 적용
    // app.use('/api', validateApiKey);

    // 라우터 인스턴스화 및 소켓 전달
    app.use('/api/games', gameRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/questions', questionRoutes); // 추가된 부분
    app.use('/api/auth', authRoutes); // 추가된 부분

    // socket.io 연결 설정
    io.on('connection', (socket) => {
      console.log('새로운 소켓 연결:', socket.id);
    
      socket.on('disconnect', () => {
        console.log('소켓 연결 종료:', socket.id);
      });
    
      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });
    
      socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
      });
    
      socket.on('startGame', (roomId) => {
        io.to(roomId).emit('gameStarted');
        console.log(`Game started in room ${roomId}`);
      });
    
      socket.on('updateChecklist', (data) => {
        console.log('데이터 업데이트:', data);
        io.emit('checklistUpdated', data);
      });
    });

    server.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  })
  .catch((err) => console.error('MongoDB 연결 오류:', err));
