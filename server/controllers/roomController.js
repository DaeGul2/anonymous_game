const { Room } = require('../models/Game');

const startGame = async (req, res, io) => {
  try {
    const { roomId } = req.params;
    const userId = req.session.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user session found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Only the room owner can start the game' });
    }

    room.isPlaying = true;
    room.currentStage = 1;
    await room.save();

    io.to(roomId).emit('gameStarted', room.currentStage);

    res.status(200).json({ message: 'Game started successfully', stage: room.currentStage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const changeStage = async (req, res, io) => {
  try {
    const { roomId } = req.params;
    const userId = req.session.user_id;
    

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user session found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: You are not the owner of this room' });
    }
    
    const next_stage = (room.currentStage+1)%7;

    room.currentStage = next_stage;
    await room.save();

    // 소켓을 통해 클라이언트에 단계 변경을 알림
    io.to(roomId).emit('stageChanged', next_stage);

    res.status(200).json({ message: 'Stage changed to : ', next_stage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  startGame,
  changeStage
};
