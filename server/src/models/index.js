// src/models/index.js
const { sequelize } = require("../config/db");

const RoomModel = require("./Room");
const PlayerModel = require("./Player");
const RoundModel = require("./Round");
const QuestionModel = require("./Question");
const AnswerModel = require("./Answer");
const UserModel = require("./User");
const QuestionHeartModel = require("./QuestionHeart");
const QaArchiveModel = require("./QaArchive");

const Room = RoomModel(sequelize);
const Player = PlayerModel(sequelize);
const Round = RoundModel(sequelize);
const Question = QuestionModel(sequelize);
const Answer = AnswerModel(sequelize);
const User = UserModel(sequelize);
const QuestionHeart = QuestionHeartModel(sequelize);
const QaArchive = QaArchiveModel(sequelize);

// ===== Associations =====
User.hasMany(Player, { foreignKey: "user_id", as: "players", onDelete: "CASCADE" });
Player.belongsTo(User, { foreignKey: "user_id", as: "user" });

Room.hasMany(Player, { foreignKey: "room_id", as: "players", onDelete: "CASCADE" });
Player.belongsTo(Room, { foreignKey: "room_id", as: "room" });

Room.hasMany(Round, { foreignKey: "room_id", as: "rounds", onDelete: "CASCADE" });
Round.belongsTo(Room, { foreignKey: "room_id", as: "room" });

Round.hasMany(Question, { foreignKey: "round_id", as: "questions", onDelete: "CASCADE" });
Question.belongsTo(Round, { foreignKey: "round_id", as: "round" });

Room.hasMany(Question, { foreignKey: "room_id", as: "questions", onDelete: "CASCADE" });
Question.belongsTo(Room, { foreignKey: "room_id", as: "room" });

Question.hasMany(Answer, { foreignKey: "question_id", as: "answers", onDelete: "CASCADE" });
Answer.belongsTo(Question, { foreignKey: "question_id", as: "question" });

Room.hasMany(Answer, { foreignKey: "room_id", as: "answers", onDelete: "CASCADE" });
Answer.belongsTo(Room, { foreignKey: "room_id", as: "room" });

Round.hasMany(Answer, { foreignKey: "round_id", as: "answers", onDelete: "CASCADE" });
Answer.belongsTo(Round, { foreignKey: "round_id", as: "round" });

// Player -> Question/Answer (내부 추적용, 익명 출력엔 안 씀)
Player.hasMany(Question, { foreignKey: "submitted_by_player_id", as: "submitted_questions" });
Question.belongsTo(Player, { foreignKey: "submitted_by_player_id", as: "submitted_by" });

Player.hasMany(Answer, { foreignKey: "answered_by_player_id", as: "submitted_answers" });
Answer.belongsTo(Player, { foreignKey: "answered_by_player_id", as: "answered_by" });

// QuestionHeart
Question.hasMany(QuestionHeart, { foreignKey: "question_id", as: "hearts", onDelete: "CASCADE" });
QuestionHeart.belongsTo(Question, { foreignKey: "question_id", as: "question" });

module.exports = {
  sequelize,
  Room,
  Player,
  Round,
  Question,
  Answer,
  User,
  QuestionHeart,
  QaArchive,
};
