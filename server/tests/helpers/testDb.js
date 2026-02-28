// tests/helpers/testDb.js — SQLite 인메모리 DB 초기화
const { sequelize, Room, Player, Round, Question, Answer, User, QuestionHeart, QaArchive } = require("../../src/models");

async function syncTestDb() {
  await sequelize.sync({ force: true });
}

async function clearTestDb() {
  await Answer.destroy({ where: {}, force: true });
  await QuestionHeart.destroy({ where: {}, force: true });
  await Question.destroy({ where: {}, force: true });
  await Round.destroy({ where: {}, force: true });
  await Player.destroy({ where: {}, force: true });
  await Room.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
  await QaArchive.destroy({ where: {}, force: true });
}

async function closeTestDb() {
  await sequelize.close();
}

module.exports = { syncTestDb, clearTestDb, closeTestDb };
