const { Room, Question } = require('../models/Game');

const createQuestion = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.session.user_id; // 세션에서 userId 가져오기
    console.log(roomId, content);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user session found' });
    }

    if (content.length >= 50) {
      return res.status(400).json({ message: 'Question content must be less than 50 characters' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const newQuestion = new Question({ creatorId: userId, roomId, content });
    await newQuestion.save();

    room.questions.push(newQuestion._id);
    await room.save();

    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createQuestion
};
