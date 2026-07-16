module.exports = {
  testEnvironment: "node",
  testTimeout: 15000,

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
  ],

  coverageReporters: [
    "text",
    "text-summary",
    "html",
    "lcov",
  ],

  // Evita que Jest ejecute las copias temporales creadas por Stryker
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.stryker-tmp/",
  ],
};