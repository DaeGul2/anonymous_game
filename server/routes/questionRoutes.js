const express = require('express');
const { createQuestion, getQuestions, finishQuestion } = require('../controllers/questionController');

const router = express.Router();

router.post('/create/:roomId', createQuestion);
router.get('/:roomId', getQuestions);
router.post('/finish/:questionId', finishQuestion);

module.exports = router;
