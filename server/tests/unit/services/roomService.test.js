const bcrypt = require("bcrypt");
const { syncTestDb, clearTestDb, closeTestDb } = require("../../helpers/testDb");
const { createUser, createRoomDirect, createPlayerDirect } = require("../../helpers/fixtures");
const { _resetForTesting } = require("../../../src/store/memoryStore");
const { Room, Player, User } = require("../../../src/models");

const {
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
} = require("../../../src/services/roomService");

beforeAll(async () => {
  await syncTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  _resetForTesting();
});

afterAll(async () => {
  await closeTestDb();
});

// ---------------------------------------------------------------------------
// createRoom
// ---------------------------------------------------------------------------
describe("createRoom", () => {
  test("creates a room and host player", async () => {
    const user = await createUser();
    const { room, player } = await createRoom({
      title: "My Room",
      max_players: 6,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 3,
    });

    expect(room.title).toBe("My Room");
    expect(room.max_players).toBe(6);
    expect(room.status).toBe("lobby");
    expect(room.phase).toBe("lobby");
    expect(room.code).toHaveLength(6);
    expect(room.host_player_id).toBe(player.id);
    expect(room.has_password).toBe(false);
    expect(room.is_ai_room).toBe(false);

    expect(player.nickname).toBe("Host");
    expect(player.avatar).toBe(3);
    expect(player.is_ready).toBe(false);
    expect(player.is_connected).toBe(true);
    expect(player.user_id).toBe(user.id);
    expect(player.room_id).toBe(room.id);
  });

  test("truncates title to 30 characters", async () => {
    const user = await createUser();
    const longTitle = "A".repeat(50);
    const { room } = await createRoom({
      title: longTitle,
      max_players: 8,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
    });

    expect(room.title).toHaveLength(30);
  });

  test("uses default title when empty", async () => {
    const user = await createUser();
    const { room } = await createRoom({
      title: "",
      max_players: 8,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
    });

    expect(room.title).toBe("익명게임 방");
  });

  test("clamps max_players between 2 and 20", async () => {
    const user1 = await createUser();
    const user2 = await createUser();

    const { room: roomLow } = await createRoom({
      title: "Low",
      max_players: 1,
      hostNickname: "H1",
      user_id: user1.id,
      avatar: 0,
    });
    expect(roomLow.max_players).toBe(2);

    const { room: roomHigh } = await createRoom({
      title: "High",
      max_players: 100,
      hostNickname: "H2",
      user_id: user2.id,
      avatar: 0,
    });
    expect(roomHigh.max_players).toBe(20);
  });

  test("validates password format (digits 4-8)", async () => {
    const user = await createUser();
    const base = { title: "PW", max_players: 8, hostNickname: "H", user_id: user.id, avatar: 0 };

    await expect(createRoom({ ...base, password: "abc" })).rejects.toThrow("숫자 4~8자리");
    await expect(createRoom({ ...base, password: "12" })).rejects.toThrow("숫자 4~8자리");
    await expect(createRoom({ ...base, password: "123456789" })).rejects.toThrow("숫자 4~8자리");
  });

  test("hashes password with bcrypt", async () => {
    const user = await createUser();
    const { room } = await createRoom({
      title: "Secret",
      max_players: 8,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
      password: "1234",
    });

    expect(room.has_password).toBe(true);
    expect(room.password_hash).toBeTruthy();
    expect(room.password_hash).not.toBe("1234");
    const match = await bcrypt.compare("1234", room.password_hash);
    expect(match).toBe(true);
  });

  test("creates AI room with AI players", async () => {
    const user = await createUser();
    const { room, player } = await createRoom({
      title: "AI Room",
      max_players: 6,
      hostNickname: "Human",
      user_id: user.id,
      avatar: 0,
      ai_secret_key: "test-ai-secret",
      ai_player_count: 2,
    });

    expect(room.is_ai_room).toBe(true);
    expect(room.ai_player_count).toBe(2);

    const players = await Player.findAll({ where: { room_id: room.id } });
    expect(players).toHaveLength(3); // 1 human host + 2 AI

    const aiPlayers = players.filter((p) => p.is_ai);
    expect(aiPlayers).toHaveLength(2);
    expect(aiPlayers.every((p) => p.is_ready)).toBe(true);
    expect(aiPlayers.every((p) => p.is_connected)).toBe(true);

    const humanPlayers = players.filter((p) => !p.is_ai);
    expect(humanPlayers).toHaveLength(1);
    expect(humanPlayers[0].id).toBe(player.id);
  });

  test("rejects invalid AI secret key", async () => {
    const user = await createUser();
    await expect(
      createRoom({
        title: "Bad AI",
        max_players: 6,
        hostNickname: "H",
        user_id: user.id,
        avatar: 0,
        ai_secret_key: "wrong-key",
        ai_player_count: 1,
      })
    ).rejects.toThrow("AI 코드가 올바르지 않음");
  });

  test("rejects AI player count outside 1-3", async () => {
    const user = await createUser();
    const base = {
      title: "AI",
      max_players: 8,
      hostNickname: "H",
      user_id: user.id,
      avatar: 0,
      ai_secret_key: "test-ai-secret",
    };

    await expect(createRoom({ ...base, ai_player_count: 0 })).rejects.toThrow("AI 플레이어는 1~3명");
    await expect(createRoom({ ...base, ai_player_count: 4 })).rejects.toThrow("AI 플레이어는 1~3명");
  });
});

// ---------------------------------------------------------------------------
// joinRoom
// ---------------------------------------------------------------------------
describe("joinRoom", () => {
  test("joins a room normally", async () => {
    const host = await createUser();
    const { room } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "Host",
      user_id: host.id,
      avatar: 0,
    });

    const joiner = await createUser();
    const result = await joinRoom({
      code: room.code,
      nickname: "Joiner",
      user_id: joiner.id,
      avatar: 1,
    });

    expect(result.is_rejoin).toBe(false);
    expect(result.player.nickname).toBe("Joiner");
    expect(result.player.user_id).toBe(joiner.id);
    expect(result.player.is_connected).toBe(true);
    expect(result.room.id).toBe(room.id);
  });

  test("allows rejoin for same user_id without password", async () => {
    const host = await createUser();
    const { room } = await createRoom({
      title: "PW Room",
      max_players: 4,
      hostNickname: "Host",
      user_id: host.id,
      avatar: 0,
      password: "5678",
    });

    const joiner = await createUser();
    // First join with password
    await joinRoom({
      code: room.code,
      nickname: "Joiner",
      user_id: joiner.id,
      avatar: 1,
      password: "5678",
    });

    // Rejoin without password — should succeed
    const result = await joinRoom({
      code: room.code,
      nickname: "Joiner",
      user_id: joiner.id,
      avatar: 1,
    });

    expect(result.is_rejoin).toBe(true);
    expect(result.player.is_connected).toBe(true);
  });

  test("requires password for password-protected room", async () => {
    const host = await createUser();
    const { room } = await createRoom({
      title: "PW",
      max_players: 4,
      hostNickname: "Host",
      user_id: host.id,
      avatar: 0,
      password: "9999",
    });

    const joiner = await createUser();
    await expect(
      joinRoom({ code: room.code, nickname: "J", user_id: joiner.id, avatar: 0 })
    ).rejects.toThrow("비밀번호가 필요합니다");
  });

  test("rejects wrong password", async () => {
    const host = await createUser();
    const { room } = await createRoom({
      title: "PW",
      max_players: 4,
      hostNickname: "Host",
      user_id: host.id,
      avatar: 0,
      password: "1111",
    });

    const joiner = await createUser();
    await expect(
      joinRoom({ code: room.code, nickname: "J", user_id: joiner.id, avatar: 0, password: "2222" })
    ).rejects.toThrow("비밀번호가 올바르지 않습니다");
  });

  test("rejects duplicate nickname in the same room", async () => {
    const host = await createUser();
    const { room } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "SameName",
      user_id: host.id,
      avatar: 0,
    });

    const joiner = await createUser();
    await expect(
      joinRoom({ code: room.code, nickname: "SameName", user_id: joiner.id, avatar: 0 })
    ).rejects.toThrow("이미 사용 중인 닉네임임");
  });

  test("rejects join when room is full", async () => {
    const host = await createUser();
    const { room } = await createRoom({
      title: "Tiny",
      max_players: 2,
      hostNickname: "Host",
      user_id: host.id,
      avatar: 0,
    });

    const u2 = await createUser();
    await joinRoom({ code: room.code, nickname: "P2", user_id: u2.id, avatar: 0 });

    const u3 = await createUser();
    await expect(
      joinRoom({ code: room.code, nickname: "P3", user_id: u3.id, avatar: 0 })
    ).rejects.toThrow("방이 꽉 찼음");
  });

  test("blocks new join when room is playing", async () => {
    const host = await createUser();
    const { room } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "Host",
      user_id: host.id,
      avatar: 0,
    });

    // Manually set room to playing
    await Room.update({ status: "playing" }, { where: { id: room.id } });

    const joiner = await createUser();
    await expect(
      joinRoom({ code: room.code, nickname: "Late", user_id: joiner.id, avatar: 0 })
    ).rejects.toThrow("게임 진행 중에는 참여할 수 없습니다");
  });

  test("throws when room code does not exist", async () => {
    const user = await createUser();
    await expect(
      joinRoom({ code: "ZZZZZZ", nickname: "N", user_id: user.id, avatar: 0 })
    ).rejects.toThrow("방을 찾을 수 없음");
  });
});

// ---------------------------------------------------------------------------
// leaveRoom
// ---------------------------------------------------------------------------
describe("leaveRoom", () => {
  test("transfers host to next human player when host leaves", async () => {
    const hostUser = await createUser();
    const { room, player: hostPlayer } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "Host",
      user_id: hostUser.id,
      avatar: 0,
    });

    const u2 = await createUser();
    const { player: p2 } = await joinRoom({
      code: room.code,
      nickname: "P2",
      user_id: u2.id,
      avatar: 0,
    });

    const result = await leaveRoom({ roomId: room.id, playerId: hostPlayer.id });

    expect(result.room_deleted).toBe(false);
    expect(result.room).not.toBeNull();

    const updatedRoom = await Room.findByPk(room.id);
    expect(updatedRoom.host_player_id).toBe(p2.id);
  });

  test("deletes room when last human leaves", async () => {
    const hostUser = await createUser();
    const { room, player: hostPlayer } = await createRoom({
      title: "Solo",
      max_players: 4,
      hostNickname: "Solo",
      user_id: hostUser.id,
      avatar: 0,
    });

    const result = await leaveRoom({ roomId: room.id, playerId: hostPlayer.id });

    expect(result.room_deleted).toBe(true);
    expect(result.room).toBeNull();

    const deleted = await Room.findByPk(room.id);
    expect(deleted).toBeNull();
  });

  test("deletes room and cleans up AI users when last human leaves AI room", async () => {
    const hostUser = await createUser();
    const { room, player: hostPlayer } = await createRoom({
      title: "AI Room",
      max_players: 6,
      hostNickname: "Human",
      user_id: hostUser.id,
      avatar: 0,
      ai_secret_key: "test-ai-secret",
      ai_player_count: 2,
    });

    // Collect AI user IDs before leaving
    const aiPlayers = await Player.findAll({ where: { room_id: room.id, is_ai: true } });
    const aiUserIds = aiPlayers.map((p) => p.user_id);
    expect(aiUserIds).toHaveLength(2);

    const result = await leaveRoom({ roomId: room.id, playerId: hostPlayer.id });

    expect(result.room_deleted).toBe(true);

    // AI users should be cleaned up
    for (const aiUserId of aiUserIds) {
      const aiUser = await User.findByPk(aiUserId);
      expect(aiUser).toBeNull();
    }
  });

  test("returns room_deleted true when room does not exist", async () => {
    const result = await leaveRoom({ roomId: 99999, playerId: 99999 });
    expect(result.room_deleted).toBe(true);
    expect(result.room).toBeNull();
  });

  test("returns room_deleted false when player not found", async () => {
    const user = await createUser();
    const room = await createRoomDirect();
    const player = await createPlayerDirect(room.id, user.id);
    room.host_player_id = player.id;
    await room.save();

    const result = await leaveRoom({ roomId: room.id, playerId: 99999 });
    expect(result.room_deleted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setReady
// ---------------------------------------------------------------------------
describe("setReady", () => {
  test("toggles player ready status", async () => {
    const user = await createUser();
    const { room, player } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
    });

    // Set ready
    const result1 = await setReady({ roomId: room.id, playerId: player.id, is_ready: true });
    expect(result1.player.is_ready).toBe(true);

    // Unset ready
    const result2 = await setReady({ roomId: room.id, playerId: player.id, is_ready: false });
    expect(result2.player.is_ready).toBe(false);
  });

  test("returns allReady true when all players are ready", async () => {
    const u1 = await createUser();
    const { room, player: p1 } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "H",
      user_id: u1.id,
      avatar: 0,
    });

    const u2 = await createUser();
    const { player: p2 } = await joinRoom({
      code: room.code,
      nickname: "P2",
      user_id: u2.id,
      avatar: 0,
    });

    await setReady({ roomId: room.id, playerId: p1.id, is_ready: true });
    const result = await setReady({ roomId: room.id, playerId: p2.id, is_ready: true });

    expect(result.allReady).toBe(true);
  });

  test("returns allReady false when not all players are ready", async () => {
    const u1 = await createUser();
    const { room, player: p1 } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "H",
      user_id: u1.id,
      avatar: 0,
    });

    const u2 = await createUser();
    const { player: p2 } = await joinRoom({
      code: room.code,
      nickname: "P2",
      user_id: u2.id,
      avatar: 0,
    });

    const result = await setReady({ roomId: room.id, playerId: p1.id, is_ready: true });
    expect(result.allReady).toBe(false);
  });

  test("throws when room does not exist", async () => {
    await expect(
      setReady({ roomId: 99999, playerId: 99999, is_ready: true })
    ).rejects.toThrow("방을 찾을 수 없음");
  });

  test("throws when player does not exist", async () => {
    const user = await createUser();
    const { room } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "H",
      user_id: user.id,
      avatar: 0,
    });

    await expect(
      setReady({ roomId: room.id, playerId: 99999, is_ready: true })
    ).rejects.toThrow("플레이어를 찾을 수 없음");
  });
});

// ---------------------------------------------------------------------------
// listRooms
// ---------------------------------------------------------------------------
describe("listRooms", () => {
  test("returns rooms with player counts", async () => {
    const u1 = await createUser();
    const { room } = await createRoom({
      title: "Room1",
      max_players: 4,
      hostNickname: "H1",
      user_id: u1.id,
      avatar: 0,
    });

    const u2 = await createUser();
    await joinRoom({ code: room.code, nickname: "P2", user_id: u2.id, avatar: 0 });

    const rooms = await listRooms();

    expect(rooms).toHaveLength(1);
    expect(rooms[0].id).toBe(room.id);
    expect(rooms[0].player_count).toBe(2);
    expect(rooms[0].title).toBe("Room1");
    expect(rooms[0].has_password).toBe(false);
  });

  test("returns empty array when no rooms exist", async () => {
    const rooms = await listRooms();
    expect(rooms).toEqual([]);
  });

  test("excludes finished rooms", async () => {
    const u1 = await createUser();
    await createRoom({
      title: "Active",
      max_players: 4,
      hostNickname: "H",
      user_id: u1.id,
      avatar: 0,
    });

    // Create a finished room directly
    await createRoomDirect({ status: "finished", title: "Done" });

    const rooms = await listRooms();
    expect(rooms).toHaveLength(1);
    expect(rooms[0].title).toBe("Active");
  });
});

// ---------------------------------------------------------------------------
// getRoomByCode
// ---------------------------------------------------------------------------
describe("getRoomByCode", () => {
  test("returns room by code", async () => {
    const user = await createUser();
    const { room } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "H",
      user_id: user.id,
      avatar: 0,
    });

    const found = await getRoomByCode(room.code);
    expect(found.id).toBe(room.id);
    expect(found.code).toBe(room.code);
  });

  test("throws when code not found", async () => {
    await expect(getRoomByCode("NONEXIST")).rejects.toThrow("방을 찾을 수 없음");
  });
});

// ---------------------------------------------------------------------------
// getRoomState
// ---------------------------------------------------------------------------
describe("getRoomState", () => {
  test("returns room and players", async () => {
    const u1 = await createUser();
    const { room, player: p1 } = await createRoom({
      title: "State Room",
      max_players: 4,
      hostNickname: "Host",
      user_id: u1.id,
      avatar: 2,
    });

    const u2 = await createUser();
    await joinRoom({ code: room.code, nickname: "Guest", user_id: u2.id, avatar: 5 });

    const state = await getRoomState(room.id);

    expect(state.room.id).toBe(room.id);
    expect(state.room.title).toBe("State Room");
    expect(state.room.host_player_id).toBe(p1.id);
    expect(state.room.has_password).toBe(false);
    expect(state.players).toHaveLength(2);
    expect(state.players[0].nickname).toBe("Host");
    expect(state.players[1].nickname).toBe("Guest");
  });

  test("throws when room does not exist", async () => {
    await expect(getRoomState(99999)).rejects.toThrow("방을 찾을 수 없음");
  });
});

// ---------------------------------------------------------------------------
// updateRoomPassword
// ---------------------------------------------------------------------------
describe("updateRoomPassword", () => {
  test("host can set a password", async () => {
    const user = await createUser();
    const { room, player } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
    });

    const updated = await updateRoomPassword({ roomId: room.id, playerId: player.id, password: "4567" });

    expect(updated.has_password).toBe(true);
    expect(updated.password_hash).toBeTruthy();
    const match = await bcrypt.compare("4567", updated.password_hash);
    expect(match).toBe(true);
  });

  test("host can remove password by passing falsy value", async () => {
    const user = await createUser();
    const { room, player } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
      password: "1234",
    });

    const updated = await updateRoomPassword({ roomId: room.id, playerId: player.id, password: "" });

    expect(updated.has_password).toBe(false);
    expect(updated.password_hash).toBeNull();
  });

  test("non-host cannot change password", async () => {
    const hostUser = await createUser();
    const { room } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "Host",
      user_id: hostUser.id,
      avatar: 0,
    });

    const joinerUser = await createUser();
    const { player: joinerPlayer } = await joinRoom({
      code: room.code,
      nickname: "J",
      user_id: joinerUser.id,
      avatar: 0,
    });

    await expect(
      updateRoomPassword({ roomId: room.id, playerId: joinerPlayer.id, password: "9999" })
    ).rejects.toThrow("방장만 비밀번호를 변경할 수 있습니다");
  });

  test("cannot change password when room is playing", async () => {
    const user = await createUser();
    const { room, player } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
    });

    await Room.update({ status: "playing" }, { where: { id: room.id } });

    await expect(
      updateRoomPassword({ roomId: room.id, playerId: player.id, password: "1234" })
    ).rejects.toThrow("게임 중에는 비밀번호를 변경할 수 없습니다");
  });

  test("rejects invalid password format", async () => {
    const user = await createUser();
    const { room, player } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "Host",
      user_id: user.id,
      avatar: 0,
    });

    await expect(
      updateRoomPassword({ roomId: room.id, playerId: player.id, password: "abc" })
    ).rejects.toThrow("숫자 4~8자리");
  });
});

// ---------------------------------------------------------------------------
// markConnected / markDisconnected
// ---------------------------------------------------------------------------
describe("markConnected / markDisconnected", () => {
  test("markDisconnected sets is_connected to false", async () => {
    const user = await createUser();
    const { room, player } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "H",
      user_id: user.id,
      avatar: 0,
    });

    await markDisconnected({ roomId: room.id, playerId: player.id });

    const updated = await Player.findByPk(player.id);
    expect(updated.is_connected).toBe(false);
  });

  test("markConnected sets is_connected to true", async () => {
    const user = await createUser();
    const { room, player } = await createRoom({
      title: "R",
      max_players: 4,
      hostNickname: "H",
      user_id: user.id,
      avatar: 0,
    });

    // Disconnect first
    await markDisconnected({ roomId: room.id, playerId: player.id });
    let updated = await Player.findByPk(player.id);
    expect(updated.is_connected).toBe(false);

    // Reconnect
    await markConnected({ roomId: room.id, playerId: player.id });
    updated = await Player.findByPk(player.id);
    expect(updated.is_connected).toBe(true);
  });

  test("markDisconnected is no-op for nonexistent player", async () => {
    // Should not throw
    await markDisconnected({ roomId: 99999, playerId: 99999 });
  });

  test("markConnected is no-op for nonexistent player", async () => {
    // Should not throw
    await markConnected({ roomId: 99999, playerId: 99999 });
  });
});

// ---------------------------------------------------------------------------
// getMyActiveRoom
// ---------------------------------------------------------------------------
describe("getMyActiveRoom", () => {
  test("returns active room for user", async () => {
    const user = await createUser();
    const { room } = await createRoom({
      title: "Active Room",
      max_players: 4,
      hostNickname: "H",
      user_id: user.id,
      avatar: 0,
    });

    const result = await getMyActiveRoom(user.id);

    expect(result.room).not.toBeNull();
    expect(result.room.code).toBe(room.code);
    expect(result.room.title).toBe("Active Room");
    expect(result.room.phase).toBe("lobby");
  });

  test("returns null when user has no active room", async () => {
    const user = await createUser();
    const result = await getMyActiveRoom(user.id);
    expect(result.room).toBeNull();
  });

  test("returns null for user in finished room", async () => {
    const user = await createUser();
    const room = await createRoomDirect({ status: "finished" });
    await createPlayerDirect(room.id, user.id);

    const result = await getMyActiveRoom(user.id);
    expect(result.room).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// transferHostIfNeeded
// ---------------------------------------------------------------------------
describe("transferHostIfNeeded", () => {
  test("transfers host to next human player when host is missing", async () => {
    const u1 = await createUser();
    const u2 = await createUser();
    const room = await createRoomDirect();
    const p1 = await createPlayerDirect(room.id, u1.id, { nickname: "P1" });
    const p2 = await createPlayerDirect(room.id, u2.id, {
      nickname: "P2",
      joined_at: new Date(Date.now() + 1000),
    });

    // Set host to a nonexistent player ID to simulate missing host
    room.host_player_id = 99999;
    await room.save();

    const result = await transferHostIfNeeded(room.id);

    expect(result).not.toBeNull();
    expect(result.host_player_id).toBe(p1.id);
  });

  test("deletes room when no players remain", async () => {
    const room = await createRoomDirect();
    room.host_player_id = 99999; // nonexistent
    await room.save();

    const result = await transferHostIfNeeded(room.id);

    expect(result).toBeNull();
    const deleted = await Room.findByPk(room.id);
    expect(deleted).toBeNull();
  });

  test("returns room unchanged when host exists", async () => {
    const user = await createUser();
    const room = await createRoomDirect();
    const player = await createPlayerDirect(room.id, user.id);
    room.host_player_id = player.id;
    await room.save();

    const result = await transferHostIfNeeded(room.id);

    expect(result).not.toBeNull();
    expect(result.host_player_id).toBe(player.id);
  });
});
