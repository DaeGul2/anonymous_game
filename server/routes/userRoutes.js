const express = require('express');
const { getUsersInRoom } = require('../controllers/userController');

const router = express.Router();

router.get('/inRoom/:roomId', getUsersInRoom);

module.exports = router;
