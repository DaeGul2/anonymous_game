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

  // 친구들 게임이니까 일단 자동 생성. 나중에 안정되면 migration으로 바꿔.
  await sequelize.sync({ alter: true }); // avatar 컬럼 추가 후 다시 주석 처리
}

module.exports = { sequelize, initDb };
