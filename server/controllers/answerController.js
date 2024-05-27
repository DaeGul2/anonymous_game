const { Question } = require('../models/Game');

const addAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { response, explanation } = req.body;
    const userId = req.session.user_id; // 세션에서 userId 가져오기
    console.log("addAnswer 실행", response, explanation)

    if (!userId || response===undefined) {
      return res.status(400).json({ message: 'User ID and response are required' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const newAnswer = { userId, response, explanation };
    console.log("newAnswer : ", newAnswer);
    question.answers.push(newAnswer);
    await question.save();

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addAnswer,
};
