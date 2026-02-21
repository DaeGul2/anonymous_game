// src/models/User.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      google_id: { type: DataTypes.STRING(128), allowNull: false, unique: true },
      email: { type: DataTypes.STRING(255), allowNull: false },
      display_name: { type: DataTypes.STRING(100), allowNull: false },
      avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: true,
    }
  );

  return User;
};
