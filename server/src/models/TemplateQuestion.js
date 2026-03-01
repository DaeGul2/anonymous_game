// src/models/TemplateQuestion.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TemplateQuestion = sequelize.define(
    "TemplateQuestion",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

      text: { type: DataTypes.STRING(500), allowNull: false },

      category_id: { type: DataTypes.UUID, allowNull: true, defaultValue: null },

      answer_type: { type: DataTypes.ENUM("free", "yesno"), allowNull: false, defaultValue: "free" },

      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

      // 누적 통계 (방 파괴 시 flush)
      usage_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      heart_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "template_questions",
      underscored: true,
      timestamps: true,
    }
  );

  return TemplateQuestion;
};
