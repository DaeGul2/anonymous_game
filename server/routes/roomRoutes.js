const express = require('express');
const router = express.Router();
const { startGame } = require('../controllers/roomController');

router.post('/start/:roomId', startGame);

module.exports = router;
