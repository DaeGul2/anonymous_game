// src/models/Question.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Question = sequelize.define(
    "Question",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

      room_id: { type: DataTypes.UUID, allowNull: false },
      round_id: { type: DataTypes.UUID, allowNull: false },

      text: { type: DataTypes.STRING(500), allowNull: false },

      submitted_by_player_id: { type: DataTypes.UUID, allowNull: true },

      submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

      order_no: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

      is_used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: "questions",
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ["room_id", "round_id"] },
        // ✅ 라운드당 플레이어 1개 질문
        { unique: true, fields: ["round_id", "submitted_by_player_id"] },
      ],
    }
  );

  return Question;
};
