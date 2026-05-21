export default {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testPathIgnorePatterns: ['<rootDir>/tests/playwright/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-jsdom.js'],
  collectCoverageFrom: [
    'main/public/scripts/**/*.js',
    '!main/public/scripts/**/*.min.js'
  ]
};
