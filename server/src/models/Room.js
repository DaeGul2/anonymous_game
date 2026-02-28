// src/models/Room.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Room = sequelize.define(
    "Room",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

      code: { type: DataTypes.STRING(12), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(100), allowNull: false },
      max_players: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 8 },

      status: {
        type: DataTypes.ENUM("lobby", "playing"),
        allowNull: false,
        defaultValue: "lobby",
      },

      host_player_id: { type: DataTypes.UUID, allowNull: true },

      last_activity_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

      current_round_no: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

      // ✅ round_end 추가
      phase: {
        type: DataTypes.ENUM("lobby", "question_submit", "ask", "reveal", "round_end", "preparing_ask", "preparing_reveal"),
        allowNull: false,
        defaultValue: "lobby",
      },

      phase_deadline_at: { type: DataTypes.DATE, allowNull: true },

      // AI 포함 방
      is_ai_room:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ai_player_count:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

      // 비밀번호 방
      has_password:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      password_hash:  { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: "rooms",
      underscored: true,
      timestamps: true,
    }
  );

  return Room;
};
