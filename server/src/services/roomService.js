// src/services/roomService.js
const { Op } = require("sequelize");
const { Room, Player, sequelize } = require("../models");
const { normalizeNickname } = require("./nicknameService");

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
    updated_at: r.updated_at,
  }));
}

async function createRoom({ title, max_players, hostNickname, guest_id }) {
  const nickname = normalizeNickname(hostNickname);
  const code = await generateUniqueRoomCode();

  return await sequelize.transaction(async (t) => {
    const room = await Room.create(
      {
        code,
        title: (title || "").trim() || "익명게임 방",
        max_players: Number(max_players) || 8,
        status: "lobby",
        phase: "lobby",
        last_activity_at: new Date(),
      },
      { transaction: t }
    );

    const host = await Player.create(
      {
        room_id: room.id,
        guest_id,
        nickname,
        is_ready: false,
        joined_at: new Date(),
        last_seen_at: new Date(),
        is_connected: true,
      },
      { transaction: t }
    );

    room.host_player_id = host.id;
    await room.save({ transaction: t });

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
    },
    players: players.map((p) => ({
      id: p.id,
      guest_id: p.guest_id, // 클라로 내려도 큰 문제는 없지만, 원하면 제거 가능
      nickname: p.nickname,
      is_ready: p.is_ready,
      is_connected: p.is_connected,
      joined_at: p.joined_at,
    })),
  };
}

async function joinRoom({ code, nickname, guest_id }) {
  const nn = normalizeNickname(nickname);

  return await sequelize.transaction(async (t) => {
    const room = await Room.findOne({ where: { code }, transaction: t, lock: t.LOCK.UPDATE });
    if (!room) throw new Error("방을 찾을 수 없음");

    // 이미 같은 guest_id가 있으면 재접속 처리로 간주
    const existing = await Player.findOne({
      where: { room_id: room.id, guest_id },
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

    // 정원 체크
    const playerCount = await Player.count({ where: { room_id: room.id }, transaction: t });
    if (playerCount >= room.max_players) throw new Error("방이 꽉 찼음");

    // 닉네임 중복 불허
    const dup = await Player.findOne({ where: { room_id: room.id, nickname: nn }, transaction: t });
    if (dup) throw new Error("이미 사용 중인 닉네임임");

    const player = await Player.create(
      {
        room_id: room.id,
        guest_id,
        nickname: nn,
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
      await Room.destroy({ where: { id: roomId }, transaction: t });
      return null;
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

    if (remaining.length === 0) {
      await Room.destroy({ where: { id: roomId }, transaction: t });
      return { room: null, room_deleted: true };
    }

    if (wasHost) {
      room.host_player_id = remaining[0].id; // 오래된 사람
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
};
