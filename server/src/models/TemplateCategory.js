// src/models/TemplateCategory.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TemplateCategory = sequelize.define(
    "TemplateCategory",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },

      description: { type: DataTypes.STRING(200), allowNull: true, defaultValue: null },

      order_no: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: "template_categories",
      underscored: true,
      timestamps: true,
    }
  );

  return TemplateCategory;
};
