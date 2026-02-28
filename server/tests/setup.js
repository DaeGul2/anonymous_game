// tests/setup.js — 모든 테스트 파일 실행 전 환경변수 세팅
process.env.DB_DIALECT = "sqlite";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "3306";
process.env.DB_NAME = "test";
process.env.DB_USER = "test";
process.env.DB_PASS = "";
process.env.SESSION_SECRET = "test-secret";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_CALLBACK_URL = "http://localhost:5000/auth/google/callback";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.OPENAI_API_KEY = "";
process.env.AI_SECRET_KEY = "test-ai-secret";
process.env.NODE_ENV = "test";
