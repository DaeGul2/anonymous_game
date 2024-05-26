const { Room } = require('../models/Game');

const startGame = async (req, res) => {
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
    await room.save();

    res.status(200).json({ message: 'Game started successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  startGame
};
