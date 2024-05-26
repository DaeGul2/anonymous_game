const express = require('express');
const { register, login, checkLoginStatus, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/status', checkLoginStatus); // 로그인 상태 확인
router.post('/logout', logout); // 로그아웃

module.exports = router;
