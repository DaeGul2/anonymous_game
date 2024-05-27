const express = require('express');
const router = express.Router();
const { startGame, changeStage, togglePending } = require('../controllers/roomController');

router.post('/start/:roomId', (req, res) => {
    
    startGame(req, res, req.io);
  });
router.post('/changeStage/:roomId', (req, res) => {
    changeStage(req, res, req.io);
  });
  router.post('/togglePending/:roomId', (req, res) => {
    togglePending(req, res, req.io);
  });
module.exports = router;
