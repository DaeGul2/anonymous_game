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

  await sequelize.sync({ alter: false });
}

module.exports = { sequelize, initDb };
