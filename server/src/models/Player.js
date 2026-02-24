// src/models/Player.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Player = sequelize.define(
    "Player",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

      room_id: { type: DataTypes.UUID, allowNull: false },

      // Google 로그인 유저 FK (AI 플레이어는 NULL)
      user_id: { type: DataTypes.UUID, allowNull: true },

      nickname: { type: DataTypes.STRING(30), allowNull: false },
      avatar:   { type: DataTypes.TINYINT,   allowNull: true,  defaultValue: 0 },
      is_ready: { type: DataTypes.BOOLEAN,   allowNull: false, defaultValue: false },

      joined_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      last_seen_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      is_connected: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

      // AI 플레이어 여부
      is_ai: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: "players",
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ["room_id"] },
        { fields: ["user_id"] },
        // 같은 방에서 닉네임 중복 불허(요구사항)
        { unique: true, fields: ["room_id", "nickname"] },
        // 같은 방에서 같은 user_id는 1명(재접속 복구용)
        { unique: true, fields: ["room_id", "user_id"] },
      ],
    }
  );

  return Player;
};
