// src/config/db.js
const { Sequelize } = require("sequelize");
const { env } = require("./env");

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "mysql",
  logging: false,
  timezone: "+09:00",
  dialectOptions: { dateStrings: true, typeCast: true },
});

async function initDb() {
  await sequelize.authenticate();

  // 모델/관계 로드(이거 안 하면 sync 때 관계 반영이 안 됨)
  require("../models");

  // AI 포함 방 컬럼 추가 등 신규 컬럼을 자동으로 반영.
  // 신규 컬럼이 안정화되면 alter: false 로 되돌리고 수동 마이그레이션 사용.
  // await sequelize.sync({ alter: true });
}

module.exports = { sequelize, initDb };
