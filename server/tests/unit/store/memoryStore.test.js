const {
  touchRoom, attachSocket, detachSocket, getSocketSession,
  getRoomRuntime, removeRoomRuntime, setGameRuntime,
  addEditing, removeEditing, getEditingCount, clearEditing,
  _resetForTesting,
} = require("../../../src/store/memoryStore");

beforeEach(() => {
  _resetForTesting();
});

describe("touchRoom", () => {
  test("should create room runtime if not exists", () => {
    touchRoom("ROOM01", "room-id-1");
    const r = getRoomRuntime("ROOM01");
    expect(r).not.toBeNull();
    expect(r.roomId).toBe("room-id-1");
  });

  test("should update updatedAt timestamp", () => {
    touchRoom("ROOM01");
    const t1 = getRoomRuntime("ROOM01").updatedAt;
    touchRoom("ROOM01");
    expect(getRoomRuntime("ROOM01").updatedAt).toBeGreaterThanOrEqual(t1);
  });

  test("should do nothing when roomCode is falsy", () => {
    touchRoom(null);
    touchRoom("");
    expect(getRoomRuntime(null)).toBeNull();
  });
});

describe("attachSocket / detachSocket", () => {
  test("should store socket session data", () => {
    attachSocket({ socketId: "s1", userId: "u1", roomCode: "R1", playerId: "p1", roomId: "rid1" });
    const sess = getSocketSession("s1");
    expect(sess.userId).toBe("u1");
    expect(sess.roomCode).toBe("R1");
    expect(sess.playerId).toBe("p1");
  });

  test("should return null when no previous socket", () => {
    const prev = attachSocket({ socketId: "s1", userId: "u1", roomCode: "R1", playerId: "p1", roomId: "rid1" });
    expect(prev).toBeNull();
  });

  test("should return previous socketId when user reconnects", () => {
    attachSocket({ socketId: "s1", userId: "u1", roomCode: "R1", playerId: "p1", roomId: "rid1" });
    const prev = attachSocket({ socketId: "s2", userId: "u1", roomCode: "R1", playerId: "p1", roomId: "rid1" });
    expect(prev).toBe("s1");
  });

  test("should update socketsByUserId in room runtime", () => {
    attachSocket({ socketId: "s1", userId: "u1", roomCode: "R1", playerId: "p1", roomId: "rid1" });
    const r = getRoomRuntime("R1");
    expect(r.socketsByUserId.get("u1")).toBe("s1");
  });

  test("should remove socket on detach", () => {
    attachSocket({ socketId: "s1", userId: "u1", roomCode: "R1", playerId: "p1", roomId: "rid1" });
    detachSocket("s1");
    expect(getSocketSession("s1")).toBeNull();
    expect(getRoomRuntime("R1").socketsByUserId.get("u1")).toBeUndefined();
  });

  test("detachSocket should do nothing for unknown socket", () => {
    expect(() => detachSocket("unknown")).not.toThrow();
  });
});

describe("getSocketSession", () => {
  test("should return null for unknown socket", () => {
    expect(getSocketSession("nope")).toBeNull();
  });
});

describe("getRoomRuntime / removeRoomRuntime", () => {
  test("should return null for non-existent room", () => {
    expect(getRoomRuntime("NOPE")).toBeNull();
  });

  test("should return runtime after touchRoom", () => {
    touchRoom("R1", "rid1");
    expect(getRoomRuntime("R1")).not.toBeNull();
  });

  test("should remove runtime on removeRoomRuntime", () => {
    touchRoom("R1", "rid1");
    removeRoomRuntime("R1");
    expect(getRoomRuntime("R1")).toBeNull();
  });
});

describe("setGameRuntime", () => {
  test("should merge patch into game state", () => {
    touchRoom("R1");
    setGameRuntime("R1", { roundId: "round-1", questionIds: ["q1", "q2"] });
    const r = getRoomRuntime("R1");
    expect(r.game.roundId).toBe("round-1");
    expect(r.game.questionIds).toEqual(["q1", "q2"]);
    expect(r.game.questionIndex).toBe(0); // default preserved
  });

  test("should create runtime if room does not exist", () => {
    setGameRuntime("R2", { roundId: "r1" });
    expect(getRoomRuntime("R2")).not.toBeNull();
  });
});

describe("editing functions", () => {
  test("should add player to editing set", () => {
    addEditing("R1", "question", "p1");
    expect(getEditingCount("R1", "question")).toBe(1);
  });

  test("should remove player from editing set", () => {
    addEditing("R1", "question", "p1");
    removeEditing("R1", "question", "p1");
    expect(getEditingCount("R1", "question")).toBe(0);
  });

  test("should return correct count", () => {
    addEditing("R1", "answer", "p1");
    addEditing("R1", "answer", "p2");
    expect(getEditingCount("R1", "answer")).toBe(2);
  });

  test("should clear all editing for a type", () => {
    addEditing("R1", "question", "p1");
    addEditing("R1", "question", "p2");
    clearEditing("R1", "question");
    expect(getEditingCount("R1", "question")).toBe(0);
  });

  test("should return 0 for non-existent room", () => {
    expect(getEditingCount("NOPE", "question")).toBe(0);
  });
});
