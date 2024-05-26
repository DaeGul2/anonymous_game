const express = require('express');
const router = express.Router();
const { createRoom, getRooms, isAvailable, joinRoom, deleteRoom, findRoomByCode, getRoomById } = require('../controllers/gameController');

router.post('/create', createRoom);
router.get('/', getRooms);
router.post('/isAvailable/:roomId', isAvailable);
router.post('/join/:roomId', (req, res) => joinRoom(req, res, req.io));
router.delete('/:roomId', deleteRoom);
router.get('/find/:code', findRoomByCode);
router.get('/:roomId', getRoomById);

module.exports = router;
