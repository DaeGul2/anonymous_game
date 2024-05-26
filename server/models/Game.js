const mongoose = require('mongoose');
const { Schema } = mongoose;

// User 스키마
const userSchema = new Schema({
  user_id: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Question 스키마
const questionSchema = new Schema({
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  content: { type: String, required: true, maxlength: 50 }
});

// Answer 스키마
const answerSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  answers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      response: { type: String, required: true },
      explanation: { type: String, required: false }
    }
  ]
});

// Room 스키마
const roomSchema = new Schema({
  roomName: { type: String, required: true, minlength: 1, maxlength: 100 },
  password: { type: String, required: true },
  maxParticipants: { type: Number, required: true, min: 2, max: 100 },
  currentParticipants: { type: Number, default: 0 },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hintSettings: [
    {
      infoType: { type: String, required: false },
      punishment: { type: String, required: false }
    }
  ],
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  userInfo: [
    {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      info: { type: Map, of: String }
    }
  ],
  isPlaying: { type: Boolean, default: false } // 게임 진행 중 여부를 나타내는 필드
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
