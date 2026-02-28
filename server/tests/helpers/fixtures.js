// tests/helpers/fixtures.js — 테스트 데이터 팩토리
const { randomUUID } = require("crypto");
const { User, Room, Player } = require("../../src/models");

function randomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function createUser(overrides = {}) {
  return User.create({
    google_id: `google_${randomUUID().slice(0, 8)}`,
    email: `test${Date.now()}@test.com`,
    display_name: "TestUser",
    avatar_url: null,
    ...overrides,
  });
}

async function createRoomDirect(overrides = {}) {
  return Room.create({
    code: randomCode(),
    title: "Test Room",
    max_players: 8,
    status: "lobby",
    phase: "lobby",
    last_activity_at: new Date(),
    current_round_no: 0,
    is_ai_room: false,
    ai_player_count: 0,
    has_password: false,
    password_hash: null,
    ...overrides,
  });
}

async function createPlayerDirect(roomId, userId, overrides = {}) {
  return Player.create({
    room_id: roomId,
    user_id: userId,
    nickname: `Player_${randomUUID().slice(0, 4)}`,
    avatar: 0,
    is_ready: false,
    is_ai: false,
    joined_at: new Date(),
    last_seen_at: new Date(),
    is_connected: true,
    ...overrides,
  });
}

module.exports = { randomCode, createUser, createRoomDirect, createPlayerDirect };
