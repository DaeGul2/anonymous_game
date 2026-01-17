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
        type: DataTypes.ENUM("lobby", "question_submit", "ask", "reveal", "round_end"),
        allowNull: false,
        defaultValue: "lobby",
      },

      phase_deadline_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "rooms",
      underscored: true,
      timestamps: true,
    }
  );

  return Room;
};
