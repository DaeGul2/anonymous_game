const express = require('express');
const { createQuestion, getQuestions, finishQuestion, getUserInfosForQuestion } = require('../controllers/questionController');

const router = express.Router();

router.post('/create/:roomId', createQuestion);
router.get('/:roomId', getQuestions);
router.post('/finish/:questionId', finishQuestion);
router.get('/getUserInfosForQuestion/:roomId/:questionId/:infoType', getUserInfosForQuestion); // 새로운 라우트 추가

module.exports = router;
