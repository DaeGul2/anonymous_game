// src/models/QaArchive.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const QaArchive = sequelize.define(
    "QaArchive",
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

      question_text: { type: DataTypes.STRING(500), allowNull: false },
      answer_text:   { type: DataTypes.STRING(1000), allowNull: false },

      // 벡터DB 동기화 추적 (Zilliz 연동 시 WHERE embedded_at IS NULL)
      embedded_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    },
    {
      tableName: "qa_archives",
      underscored: true,
      timestamps: true,
      updatedAt: false, // 아카이브는 수정 안 함
    }
  );

  return QaArchive;
};
