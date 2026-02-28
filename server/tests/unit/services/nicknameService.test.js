const { normalizeNickname } = require("../../../src/services/nicknameService");

describe("normalizeNickname", () => {
  test("should trim whitespace and return nickname", () => {
    expect(normalizeNickname("  홍길동  ")).toBe("홍길동");
  });

  test("should return trimmed nickname as-is", () => {
    expect(normalizeNickname("TestUser")).toBe("TestUser");
  });

  test("should throw when nickname is empty string", () => {
    expect(() => normalizeNickname("")).toThrow();
  });

  test("should throw when nickname is whitespace only", () => {
    expect(() => normalizeNickname("   ")).toThrow();
  });

  test("should throw when nickname is null/undefined", () => {
    expect(() => normalizeNickname(null)).toThrow();
    expect(() => normalizeNickname(undefined)).toThrow();
  });
});
