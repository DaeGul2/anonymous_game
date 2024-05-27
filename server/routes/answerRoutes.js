const express = require('express');
const { addAnswer, getAnswers } = require('../controllers/answerController');

const router = express.Router();

router.post('/add/:questionId', addAnswer);
router.get('/:questionId', getAnswers);

module.exports = router;
