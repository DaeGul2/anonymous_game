// src/models/QuestionHeart.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const QuestionHeart = sequelize.define(
    "QuestionHeart",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      question_id: { type: DataTypes.UUID, allowNull: false },
      player_id:   { type: DataTypes.UUID, allowNull: false },
    },
    {
      tableName: "question_hearts",
      underscored: true,
      timestamps: true,
      indexes: [
        { unique: true, fields: ["question_id", "player_id"] }, // 질문당 플레이어 1하트
      ],
    }
  );

  return QuestionHeart;
};
