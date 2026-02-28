const { errorHandler } = require("../../../src/middlewares/errorHandler");

function callHandler(err, nodeEnv = "test") {
  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;

  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; },
  };

  // suppress console.error during test
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  errorHandler(err, {}, res, () => {});
  spy.mockRestore();

  process.env.NODE_ENV = origEnv;
  return res;
}

describe("errorHandler", () => {
  test("should return 500 status", () => {
    const res = callHandler(new Error("boom"));
    expect(res.statusCode).toBe(500);
  });

  test("should hide error details in production", () => {
    const res = callHandler(new Error("secret leak"), "production");
    expect(res.body.ok).toBe(false);
    expect(res.body.message).toBe("서버 오류가 발생했습니다");
    expect(res.body.message).not.toContain("secret");
  });

  test("should show error message in non-production", () => {
    const res = callHandler(new Error("detailed error"), "development");
    expect(res.body.ok).toBe(false);
    expect(res.body.message).toBe("detailed error");
  });
});
