const { globalLimiter, authLimiter } = require("../../../src/middlewares/rateLimit");

describe("rateLimit exports", () => {
  test("globalLimiter should be a function (middleware)", () => {
    expect(typeof globalLimiter).toBe("function");
  });

  test("authLimiter should be a function (middleware)", () => {
    expect(typeof authLimiter).toBe("function");
  });
});
