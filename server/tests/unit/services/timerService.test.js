const { _resetForTesting, getRoomRuntime, touchRoom } = require("../../../src/store/memoryStore");
const { scheduleAt, clearTimers } = require("../../../src/services/timerService");

beforeEach(() => {
  _resetForTesting();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("scheduleAt", () => {
  test("should execute callback after delay", () => {
    touchRoom("R1");
    const cb = jest.fn();
    scheduleAt("R1", "test-timer", Date.now() + 3000, cb);

    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3000);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test("should execute immediately when whenMs is in the past", () => {
    touchRoom("R1");
    const cb = jest.fn();
    scheduleAt("R1", "test-timer", Date.now() - 1000, cb);

    jest.advanceTimersByTime(0);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test("should store timer in room runtime", () => {
    touchRoom("R1");
    scheduleAt("R1", "my-timer", Date.now() + 5000, () => {});
    const r = getRoomRuntime("R1");
    expect(r.timers.get("my-timer")).toBeDefined();
  });

  test("should overwrite previous timer with same name", () => {
    touchRoom("R1");
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    scheduleAt("R1", "dup", Date.now() + 1000, cb1);
    scheduleAt("R1", "dup", Date.now() + 1000, cb2);

    jest.advanceTimersByTime(1000);
    expect(cb1).not.toHaveBeenCalled(); // cleared
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});

describe("clearTimers", () => {
  test("should cancel scheduled timers", () => {
    touchRoom("R1");
    const cb = jest.fn();
    scheduleAt("R1", "t1", Date.now() + 2000, cb);
    clearTimers("R1", ["t1"]);

    jest.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });
});
