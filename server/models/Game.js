const mongoose = require('mongoose');
const { Schema } = mongoose;

// User 스키마
const userSchema = new Schema({
  info: { type: Map, of: String },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' } 
});

// Question 스키마
const questionSchema = new Schema({
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }
});

// Answer 스키마
const answerSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  answers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      response: { type: String, required: true }, // 'yes' or 'no'
      explanation: { type: String, required: false }
    }
  ]
});

// Room 스키마
const roomSchema = new Schema({
  roomName: { type: String, required: true, minlength: 1, maxlength: 100 },
  password: { type: String, required: true },
  maxParticipants: { type: Number, required: true, min: 2, max: 100 },
  currentParticipants: { type: Number, default: 0 }, // 현재 참여자 수를 관리하는 필드
  gameMode: { type: Number, required: true }, // 1: 익명 모드, 2: 벌칙 힌트 모드
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }], // 참여자 목록
  hintSettings: [
    {
      infoType: { type: String, required: false }, // ex) 'birthday', 'nationality', 'nickname', etc.
      punishment: { type: String, required: false }
    }
  ],
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }]
});

// 모델 생성
const User = mongoose.model('User', userSchema);
const Question = mongoose.model('Question', questionSchema);
const Answer = mongoose.model('Answer', answerSchema);
const Room = mongoose.model('Room', roomSchema);

module.exports = {
  User,
  Question,
  Answer,
  Room
};
