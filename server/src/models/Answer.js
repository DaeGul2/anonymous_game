// src/models/Answer.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Answer = sequelize.define(
    "Answer",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

      room_id: { type: DataTypes.UUID, allowNull: false },
      round_id: { type: DataTypes.UUID, allowNull: false },
      question_id: { type: DataTypes.UUID, allowNull: false },

      text: { type: DataTypes.STRING(1000), allowNull: false, defaultValue: "" },

      answered_by_player_id: { type: DataTypes.UUID, allowNull: true },

      submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "answers",
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ["room_id", "round_id", "question_id"] },
        // ✅ 질문당 플레이어 1개 답변
        { unique: true, fields: ["question_id", "answered_by_player_id"] },
      ],
    }
  );

  return Answer;
};
