const { Room, Question } = require('../models/Game');

const createQuestion = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.session.user_id; // 세션에서 userId 가져오기
    

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

const getQuestions = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId).populate('questions');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json(room.questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const finishQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const io = req.app.get('io'); // 소켓 IO 인스턴스를 가져옴

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.isFinished = true;
    await question.save();

    io.to(question.roomId.toString()).emit('updateQuestion', question);

    res.status(200).json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getUserInfosForQuestion = async (req, res) => {
  try {
    const { roomId, questionId, infoType } = req.params;

    // 해당 방의 정보 가져오기
    const room = await Room.findById(roomId).populate('userInfo.user');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // 해당 질문의 정보 가져오기
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // 해당 질문에 답변한 userId 목록 가져오기
    const userIds = question.answers.map(answer => answer.userId);

    // 각 userId에 대해 해당 방의 userInfo에서 특정 infoType 값을 가져오기
    const userInfos = userIds.map(userId => {
      const userInfo = room.userInfo.find(info => info.user.equals(userId));
      return { userId, infoValue: userInfo ? userInfo.info.get(infoType) : null };
    });

    // 질문 생성자의 userInfo에서 특정 infoType 값을 가져오기
    const creatorInfo = room.userInfo.find(info => info.user.equals(question.creatorId));
    const creatorInfoValue = creatorInfo ? creatorInfo.info.get(infoType) : null;

    res.status(200).json({ userInfos, creatorInfo: { userId: question.creatorId, infoValue: creatorInfoValue } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  finishQuestion,
  getUserInfosForQuestion 
};
