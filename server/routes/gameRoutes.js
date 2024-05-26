const express = require('express');
const { createRoom, getRooms, isAvailable, joinRoom, deleteRoom, findRoomByCode } = require('../controllers/gameController');

const router = express.Router();

router.post('/create', createRoom);
router.get('/', getRooms);
router.post('/isAvailable/:roomId', isAvailable);
router.post('/join/:roomId', joinRoom);
router.delete('/delete/:roomId', deleteRoom); 
router.get('/findByCode/:code', findRoomByCode); // 새로운 라우트 추가

module.exports = router;
