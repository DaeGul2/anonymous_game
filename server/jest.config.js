module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  setupFiles: ["<rootDir>/tests/setup.js"],
  testTimeout: 15000,
};
