const express = require('express');
const { createRoom, getRooms, isAvailable, joinRoom, leaveRoom } = require('../controllers/gameController');

const router = express.Router();

router.post('/create', createRoom);
router.get('/', getRooms);
router.post('/isAvailable/:roomId', isAvailable);
router.post('/join/:roomId', joinRoom);
router.post('/leave/:roomId', leaveRoom);

module.exports = router;
