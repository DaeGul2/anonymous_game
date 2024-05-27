const express = require('express');
const { addAnswer } = require('../controllers/answerController');

const router = express.Router();

router.post('/add/:questionId', addAnswer);

module.exports = router;
