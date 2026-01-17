// src/sockets/roomHandlers.js
const { issueGuestToken, verifyGuestToken } = require("../services/authService");
const {
    listRooms,
    createRoom,
    joinRoom,
    getRoomState,
    setReady,
    leaveRoom,
} = require("../services/roomService");
const { rejoinRoom } = require("../services/reconnectService");

const { touchRoom, attachSocket, getSocketSession, detachSocket } = require("../store/memoryStore");

function ok(socket, event, data) {
    socket.emit(event, { ok: true, ...data });
}
function fail(socket, event, message) {
    socket.emit(event, { ok: false, message });
}

module.exports = (io, socket) => {
    // 0) 게스트 토큰 발급/검증 (클라가 guest_id 없으면 여기서 받으면 됨)
    socket.on("guest:ensure", ({ guest_id, guest_token } = {}) => {
        try {
            if (!guest_id) {
                // 클라는 UUID 생성해도 되는데, 서버에서 발급해도 됨.
                // 여기서는 간단히 랜덤 UUID 생성 대신, 클라에서 만들게 하고(다음 스텝에서),
                // guest_id가 없으면 에러로 처리.
                return fail(socket, "guest:ensure:res", "guest_id 필요(클라에서 UUID 생성해서 보내)");
            }

            const v = verifyGuestToken(guest_id, guest_token);
            if (v.ok) return ok(socket, "guest:ensure:res", { guest_id, guest_token });

            const token = issueGuestToken(guest_id);
            return ok(socket, "guest:ensure:res", { guest_id, guest_token: token });
        } catch (e) {
            return fail(socket, "guest:ensure:res", e?.message || "guest ensure failed");
        }
    });

    // 1) 방 목록
    socket.on("room:list", async () => {
        try {
            const rooms = await listRooms();
            ok(socket, "room:list:res", { rooms });
        } catch (e) {
            fail(socket, "room:list:res", e?.message || "room list failed");
        }
    });

    // 2) 방 만들기
    socket.on("room:create", async ({ guest_id, guest_token, title, max_players, nickname } = {}) => {
        try {
            const v = verifyGuestToken(guest_id, guest_token);
            if (!v.ok) return fail(socket, "room:create:res", "인증 실패(guest_token)");

            const { room, player } = await createRoom({
                title,
                max_players,
                hostNickname: nickname,
                guest_id,
            });

            // 소켓 룸 join + 세션 attach
            socket.join(room.code);
            touchRoom(room.code, room.id);
            attachSocket({
                socketId: socket.id,
                guestId: guest_id,
                roomCode: room.code,
                playerId: player.id,
                roomId: room.id,
            });

            const state = await getRoomState(room.id);
            ok(socket, "room:create:res", { state });

            // 방 전체에 브로드캐스트
            io.to(room.code).emit("room:update", { ok: true, state });
        } catch (e) {
            fail(socket, "room:create:res", e?.message || "room create failed");
        }
    });

    // 3) 방 입장
    socket.on("room:join", async ({ guest_id, guest_token, code, nickname } = {}) => {
        try {
            const v = verifyGuestToken(guest_id, guest_token);
            if (!v.ok) return fail(socket, "room:join:res", "인증 실패(guest_token)");

            const { room, player } = await joinRoom({ code, nickname, guest_id });

            socket.join(room.code);
            touchRoom(room.code, room.id);
            attachSocket({
                socketId: socket.id,
                guestId: guest_id,
                roomCode: room.code,
                playerId: player.id,
                roomId: room.id,
            });

            const state = await getRoomState(room.id);
            ok(socket, "room:join:res", { state });

            io.to(room.code).emit("room:update", { ok: true, state });
        } catch (e) {
            fail(socket, "room:join:res", e?.message || "room join failed");
        }
    });

    // 4) 재접속(같은 guest_id로 방 상태 복구)
    socket.on("room:rejoin", async ({ guest_id, guest_token, code } = {}) => {
        try {
            const v = verifyGuestToken(guest_id, guest_token);
            if (!v.ok) return fail(socket, "room:rejoin:res", "인증 실패(guest_token)");

            const { room, player } = await rejoinRoom({ code, guest_id });

            socket.join(room.code);
            touchRoom(room.code, room.id);
            attachSocket({
                socketId: socket.id,
                guestId: guest_id,
                roomCode: room.code,
                playerId: player.id,
                roomId: room.id,
            });

            const state = await getRoomState(room.id);
            ok(socket, "room:rejoin:res", { state });

            io.to(room.code).emit("room:update", { ok: true, state });
        } catch (e) {
            fail(socket, "room:rejoin:res", e?.message || "room rejoin failed");
        }
    });

    // 5) 준비완료 토글
    socket.on("room:ready", async ({ is_ready } = {}) => {
        try {
            const sess = getSocketSession(socket.id);
            if (!sess?.roomCode || !sess?.playerId) {
                return fail(socket, "room:ready:res", "방 세션 없음");
            }

            // roomId는 state에서 찾기 귀찮으니 DB 조회 1번 더: getRoomState가 roomId 필요함
            // 여기서는 간단히 code로 room 찾고 처리
            const { getRoomByCode } = require("../services/roomService");
            const room = await getRoomByCode(sess.roomCode);

            const { allReady } = await setReady({
                roomId: room.id,
                playerId: sess.playerId,
                is_ready: !!is_ready,
            });

            const state = await getRoomState(room.id);

            ok(socket, "room:ready:res", { allReady, state });
            io.to(room.code).emit("room:update", { ok: true, state });

            // allReady면 "게임 시작"은 다음 스텝에서(타이머/라운드/페이즈).
            // 여기서는 이벤트만 쏴둠.
            if (allReady) {
                const game = require("../services/gameService");
                await game.startRound(io, room.code);
            }
        } catch (e) {
            fail(socket, "room:ready:res", e?.message || "ready failed");
        }
    });

    // 6) 방 나가기(명시적) + 호스트 위임
    socket.on("room:leave", async () => {
        try {
            const sess = getSocketSession(socket.id);
            if (!sess?.roomCode || !sess?.playerId) {
                detachSocket(socket.id);
                return ok(socket, "room:leave:res", { left: true });
            }

            const { getRoomByCode } = require("../services/roomService");
            const room = await getRoomByCode(sess.roomCode);

            const res = await leaveRoom({ roomId: room.id, playerId: sess.playerId });

            // 소켓 룸 탈퇴 + 세션 제거
            socket.leave(sess.roomCode);
            detachSocket(socket.id);

            ok(socket, "room:leave:res", { left: true });

            if (res.room_deleted) {
                // 방 폭파됨
                io.to(sess.roomCode).emit("room:destroyed", { ok: true });
                return;
            }

            const state = await getRoomState(room.id);
            io.to(room.code).emit("room:update", { ok: true, state });
        } catch (e) {
            fail(socket, "room:leave:res", e?.message || "leave failed");
        }
    });

    // 7) 현재 내가 누군지(디버깅)
    socket.on("session:me", () => {
        const sess = getSocketSession(socket.id);
        ok(socket, "session:me:res", { session: sess });
    });
};
