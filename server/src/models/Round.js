// src/models/Round.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Round = sequelize.define(
    "Round",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      room_id: { type: DataTypes.UUID, allowNull: false },

      round_no: { type: DataTypes.INTEGER, allowNull: false },

      started_at: { type: DataTypes.DATE, allowNull: true },
      ended_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "rounds",
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ["room_id", "round_no"] }],
    }
  );

  return Round;
};
