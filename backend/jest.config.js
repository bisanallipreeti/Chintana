export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  verbose: true,
  collectCoverageFrom: [
    "src/modules/**/*.js",
    "src/infrastructure/**/*.js",
    "src/core/**/*.js",
  ],
  coveragePathIgnorePatterns: ["/node_modules/"],
};
