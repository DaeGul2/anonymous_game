// src/models/Player.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Player = sequelize.define(
    "Player",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

      room_id: { type: DataTypes.UUID, allowNull: false },

      // 로그인 없는 고정 식별자(클라 localStorage에 저장된 UUID)
      guest_id: { type: DataTypes.STRING(64), allowNull: false },

      nickname: { type: DataTypes.STRING(30), allowNull: false },
      is_ready: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      joined_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      last_seen_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      is_connected: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: "players",
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ["room_id"] },
        { fields: ["guest_id"] },
        // 같은 방에서 닉네임 중복 불허(요구사항)
        { unique: true, fields: ["room_id", "nickname"] },
        // 같은 방에서 같은 guest_id는 1명(재접속 복구용)
        { unique: true, fields: ["room_id", "guest_id"] },
      ],
    }
  );

  return Player;
};
