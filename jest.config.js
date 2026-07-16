module.exports = {
  testEnvironment: "node",
  testTimeout: 15000,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
  ],
  coverageReporters: ["text", "text-summary", "html", "lcov"],
};
