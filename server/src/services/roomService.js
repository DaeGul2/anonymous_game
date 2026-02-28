// src/services/roomService.js
const { randomUUID } = require("crypto");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const { Room, Player, User, sequelize } = require("../models");
const { normalizeNickname } = require("./nicknameService");
const { archiveHumanQa } = require("./qaArchiveService");
const { env } = require("../config/env");

// AI 플레이어용 한국 닉네임 풀
const AI_NICKNAME_POOL = [
  "감자", "고구마", "낙지", "문어", "오이", "두부", "라면",
  "호떡", "파전", "하루", "달달", "쫀쫀", "맑음", "새벽",
  "노을", "구름", "바람", "봄봄", "솜사탕", "모모",
  "두리", "몽글", "초코", "사탕", "도넛",
];

function randomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 문자 제거
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function generateUniqueRoomCode() {
  for (let i = 0; i < 20; i++) {
    const code = randomCode(6);
    const exists = await Room.findOne({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("방 코드 생성 실패(운이 나쁨)");
}

async function listRooms() {
  const rooms = await Room.findAll({
    where: { status: { [Op.in]: ["lobby", "playing"] } },
    order: [["updated_at", "DESC"]],
    limit: 200,
  });

  // 플레이어 수는 대충 카운트. 친구들 게임이라 최적화 안 함.
  const roomIds = rooms.map((r) => r.id);
  const counts = await Player.findAll({
    attributes: ["room_id", [sequelize.fn("COUNT", sequelize.col("id")), "cnt"]],
    where: { room_id: { [Op.in]: roomIds } },
    group: ["room_id"],
    raw: true,
  });
  const map = new Map(counts.map((c) => [c.room_id, Number(c.cnt)]));

  return rooms.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    max_players: r.max_players,
    status: r.status,
    phase: r.phase,
    current_round_no: r.current_round_no,
    player_count: map.get(r.id) || 0,
    has_password: r.has_password,
    updated_at: r.updated_at,
  }));
}

async function createRoom({ title, max_players, hostNickname, user_id, avatar, ai_secret_key, ai_player_count, password }) {
  const nickname = normalizeNickname(hostNickname);
  const code = await generateUniqueRoomCode();

  // AI 포함 방 검증
  const aiCount = ai_secret_key ? Math.max(0, Number(ai_player_count) || 0) : 0;
  const isAiRoom = aiCount > 0;
  if (ai_secret_key) {
    if (!env.AI_SECRET_KEY) throw new Error("서버에 AI_SECRET_KEY가 설정되지 않음");
    if (ai_secret_key !== env.AI_SECRET_KEY) throw new Error("AI 코드가 올바르지 않음");
    if (aiCount < 1 || aiCount > 3) throw new Error("AI 플레이어는 1~3명");
  }

  // 비밀번호 검증: 숫자 4~8자리
  let hasPassword = false;
  let passwordHash = null;
  if (password) {
    if (!/^\d{4,8}$/.test(password)) throw new Error("비밀번호는 숫자 4~8자리여야 합니다");
    hasPassword = true;
    passwordHash = await bcrypt.hash(password, 10);
  }

  // 총 인원 = 유저 설정값 (AI가 그 안에서 자리 차지), 2~20명 클램프
  const rawMax = Math.min(Math.max(Number(max_players) || 8, 2), 20);
  const effectiveMax = isAiRoom ? Math.max(rawMax, aiCount + 2) : rawMax;

  return await sequelize.transaction(async (t) => {
    const room = await Room.create(
      {
        code,
        title: (title || "").trim().slice(0, 30) || "익명게임 방",
        max_players: effectiveMax,
        is_ai_room: isAiRoom,
        ai_player_count: aiCount,
        has_password: hasPassword,
        password_hash: passwordHash,
        status: "lobby",
        phase: "lobby",
        last_activity_at: new Date(),
      },
      { transaction: t }
    );

    const host = await Player.create(
      {
        room_id: room.id,
        user_id,
        nickname,
        avatar: Number.isInteger(Number(avatar)) ? Number(avatar) : 0,
        is_ready: false,
        is_ai: false,
        joined_at: new Date(),
        last_seen_at: new Date(),
        is_connected: true,
      },
      { transaction: t }
    );

    room.host_player_id = host.id;
    await room.save({ transaction: t });

    // AI 플레이어 생성
    if (isAiRoom) {
      const usedNicknames = new Set([nickname]);
      const availablePool = AI_NICKNAME_POOL.filter((n) => !usedNicknames.has(n));
      // 풀이 부족하면 숫자를 붙여 확장
      while (availablePool.length < aiCount) {
        availablePool.push(`익명${availablePool.length + 1}`);
      }

      for (let i = 0; i < aiCount; i++) {
        const aiNickname = availablePool[i];
        // AI 플레이어용 가짜 User 레코드 생성 (FK 만족용)
        const aiUser = await User.create(
          {
            google_id: `ai_bot_${randomUUID()}`,
            email: `ai@bot.internal`,
            display_name: aiNickname,
            avatar_url: null,
          },
          { transaction: t }
        );

        await Player.create(
          {
            room_id: room.id,
            user_id: aiUser.id,
            nickname: aiNickname,
            avatar: Math.floor(Math.random() * 12), // AVATARS 길이 12
            is_ready: true,   // AI는 항상 준비완료
            is_ai: true,
            joined_at: new Date(Date.now() + i + 1), // joined_at 순서 보장
            last_seen_at: new Date(),
            is_connected: true,
          },
          { transaction: t }
        );
      }
    }

    return { room, player: host };
  });
}

async function getRoomByCode(code) {
  const room = await Room.findOne({ where: { code } });
  if (!room) throw new Error("방을 찾을 수 없음");
  return room;
}

async function getRoomState(roomId) {
  const room = await Room.findByPk(roomId);
  if (!room) throw new Error("방을 찾을 수 없음");

  const players = await Player.findAll({
    where: { room_id: roomId },
    order: [["joined_at", "ASC"]],
  });

  return {
    room: {
      id: room.id,
      code: room.code,
      title: room.title,
      max_players: room.max_players,
      status: room.status,
      phase: room.phase,
      current_round_no: room.current_round_no,
      host_player_id: room.host_player_id,
      phase_deadline_at: room.phase_deadline_at,
      has_password: room.has_password,
    },
    players: players.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      nickname: p.nickname,
      avatar: p.avatar ?? 0,
      is_ready: p.is_ready,
      is_connected: p.is_connected,
      joined_at: p.joined_at,
    })),
  };
}

async function joinRoom({ code, nickname, user_id, avatar, password }) {
  const nn = normalizeNickname(nickname);

  return await sequelize.transaction(async (t) => {
    const room = await Room.findOne({ where: { code }, transaction: t, lock: t.LOCK.UPDATE });
    if (!room) throw new Error("방을 찾을 수 없음");

    // 이미 같은 user_id가 있으면 재접속 처리로 간주
    const existing = await Player.findOne({
      where: { room_id: room.id, user_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (existing) {
      // 닉네임 변경 요청이면 중복 체크 후 변경
      if (nn && nn !== existing.nickname) {
        // 같은 방 내 닉네임 중복 불허(요구사항)
        const dup = await Player.findOne({
          where: { room_id: room.id, nickname: nn, id: { [Op.ne]: existing.id } },
          transaction: t,
        });
        if (dup) throw new Error("이미 사용 중인 닉네임임");
        existing.nickname = nn;
      }

      existing.is_connected = true;
      existing.last_seen_at = new Date();
      await existing.save({ transaction: t });

      room.last_activity_at = new Date();
      await room.save({ transaction: t });

      return { room, player: existing, is_rejoin: true };
    }

    // 비밀번호 방: 신규 입장 시 검증 (재접속은 위에서 이미 return됨)
    if (room.has_password) {
      if (!password) throw new Error("비밀번호가 필요합니다");
      const match = await bcrypt.compare(password, room.password_hash);
      if (!match) throw new Error("비밀번호가 올바르지 않습니다");
    }

    // 게임 진행 중이면 새 플레이어 입장 차단 (재접속은 위에서 처리됨)
    if (room.status === "playing") throw new Error("게임 진행 중에는 참여할 수 없습니다");

    // 정원 체크 (AI 방은 인간 플레이어만 카운트)
    const humanCount = await Player.count({ where: { room_id: room.id, is_ai: false }, transaction: t });
    const humanMax = room.is_ai_room ? (room.max_players - room.ai_player_count) : room.max_players;
    if (humanCount >= humanMax) throw new Error("방이 꽉 찼음");

    // 닉네임 중복 불허
    const dup = await Player.findOne({ where: { room_id: room.id, nickname: nn }, transaction: t });
    if (dup) throw new Error("이미 사용 중인 닉네임임");

    const player = await Player.create(
      {
        room_id: room.id,
        user_id,
        nickname: nn,
        avatar: Number.isInteger(Number(avatar)) ? Number(avatar) : 0,
        is_ready: false,
        joined_at: new Date(),
        last_seen_at: new Date(),
        is_connected: true,
      },
      { transaction: t }
    );

    room.last_activity_at = new Date();
    await room.save({ transaction: t });

    return { room, player, is_rejoin: false };
  });
}

async function setReady({ roomId, playerId, is_ready }) {
  return await sequelize.transaction(async (t) => {
    const room = await Room.findByPk(roomId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!room) throw new Error("방을 찾을 수 없음");

    const player = await Player.findOne({
      where: { id: playerId, room_id: roomId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!player) throw new Error("플레이어를 찾을 수 없음");

    player.is_ready = !!is_ready;
    player.last_seen_at = new Date();
    await player.save({ transaction: t });

    room.last_activity_at = new Date();
    await room.save({ transaction: t });

    const players = await Player.findAll({ where: { room_id: roomId }, transaction: t });
    const allReady = players.length > 0 && players.every((p) => p.is_ready);

    return { room, player, allReady };
  });
}

async function transferHostIfNeeded(roomId) {
  return await sequelize.transaction(async (t) => {
    const room = await Room.findByPk(roomId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!room) return null;

    const host = room.host_player_id
      ? await Player.findOne({ where: { id: room.host_player_id, room_id: roomId }, transaction: t })
      : null;

    if (host) return room; // host 존재

    // 가장 오래된 플레이어에게 위임
    const nextHost = await Player.findOne({
      where: { room_id: roomId },
      order: [["joined_at", "ASC"]],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!nextHost) {
      // 아무도 없으면 방 폭파
      await archiveHumanQa(roomId);
      await Room.destroy({ where: { id: roomId }, transaction: t });
      return null;
    }

    // AI가 아닌 플레이어에게 방장 위임 시도
    const nextHumanHost = await Player.findOne({
      where: { room_id: roomId, is_ai: false },
      order: [["joined_at", "ASC"]],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (nextHumanHost) {
      room.host_player_id = nextHumanHost.id;
      await room.save({ transaction: t });
      return room;
    }

    room.host_player_id = nextHost.id;
    await room.save({ transaction: t });
    return room;
  });
}

async function leaveRoom({ roomId, playerId }) {
  return await sequelize.transaction(async (t) => {
    const room = await Room.findByPk(roomId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!room) return { room: null, room_deleted: true };

    const player = await Player.findOne({
      where: { id: playerId, room_id: roomId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!player) return { room, room_deleted: false };

    const wasHost = room.host_player_id === player.id;

    await Player.destroy({ where: { id: player.id }, transaction: t });

    const remaining = await Player.findAll({
      where: { room_id: roomId },
      order: [["joined_at", "ASC"]],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // 인간 플레이어가 없으면 방 폭파 (AI만 남은 경우 포함)
    const humanRemaining = remaining.filter((p) => !p.is_ai);
    if (humanRemaining.length === 0) {
      // AI 유저 ID 수집 (CASCADE 전에)
      const aiUserIds = remaining.filter((p) => p.is_ai).map((p) => p.user_id);

      await archiveHumanQa(roomId);
      await Room.destroy({ where: { id: roomId }, transaction: t });

      // 고아 AI User 삭제 (Player CASCADE 후)
      if (aiUserIds.length > 0) {
        await User.destroy({ where: { id: { [Op.in]: aiUserIds } }, transaction: t });
      }

      return { room: null, room_deleted: true };
    }

    if (wasHost) {
      // AI가 아닌 플레이어에게 방장 위임
      room.host_player_id = (humanRemaining[0] || remaining[0]).id;
    }

    // 로비로 돌아갈 때 ready reset은 “라운드 종료”에서 할 거라 여기서는 안 건드림
    room.last_activity_at = new Date();
    await room.save({ transaction: t });

    return { room, room_deleted: false };
  });
}

async function markDisconnected({ roomId, playerId }) {
  const player = await Player.findOne({ where: { id: playerId, room_id: roomId } });
  if (!player) return;
  player.is_connected = false;
  player.last_seen_at = new Date();
  await player.save();

  const room = await Room.findByPk(roomId);
  if (room) {
    room.last_activity_at = new Date();
    await room.save();
  }
}

async function markConnected({ roomId, playerId }) {
  const player = await Player.findOne({ where: { id: playerId, room_id: roomId } });
  if (!player) return;
  player.is_connected = true;
  player.last_seen_at = new Date();
  await player.save();

  const room = await Room.findByPk(roomId);
  if (room) {
    room.last_activity_at = new Date();
    await room.save();
  }
}

/** 유저가 현재 참여 중인 활성 방 반환 (없으면 null) */
async function getMyActiveRoom(userId) {
  const player = await Player.findOne({
    where: { user_id: userId },
    include: [{
      model: Room,
      as: "room",
      where: { status: { [Op.in]: ["lobby", "playing"] } },
      required: true,
    }],
  });

  if (!player) return { room: null };

  return {
    room: {
      code: player.room.code,
      phase: player.room.phase,
      title: player.room.title,
    },
  };
}

async function updateRoomPassword({ roomId, playerId, password }) {
  const room = await Room.findByPk(roomId);
  if (!room) throw new Error("방을 찾을 수 없음");
  if (room.host_player_id !== playerId) throw new Error("방장만 비밀번호를 변경할 수 있습니다");
  if (room.status !== "lobby") throw new Error("게임 중에는 비밀번호를 변경할 수 없습니다");

  if (password) {
    if (!/^\d{4,8}$/.test(password)) throw new Error("비밀번호는 숫자 4~8자리여야 합니다");
    room.has_password = true;
    room.password_hash = await bcrypt.hash(password, 10);
  } else {
    room.has_password = false;
    room.password_hash = null;
  }
  await room.save();
  return room;
}

module.exports = {
  listRooms,
  createRoom,
  getRoomByCode,
  getRoomState,
  joinRoom,
  setReady,
  leaveRoom,
  transferHostIfNeeded,
  markDisconnected,
  markConnected,
  getMyActiveRoom,
  updateRoomPassword,
};
