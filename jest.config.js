module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.js'],

  // Module paths
  roots: ['<rootDir>/src/main/frontend', '<rootDir>/src/test'],

  // Test match patterns
  testMatch: [
    '<rootDir>/src/main/frontend/**/__tests__/**/*.js',
    '<rootDir>/src/main/frontend/**/*.{test,spec}.js',
    '<rootDir>/src/test/**/*.{test,spec}.js'
  ],

  // Module name mapping for CSS and static assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
  },

  // Transform files
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'classic' }]
      ]
    }]
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/main/frontend/**/*.js',
    '!src/main/frontend/**/index.js',
    '!src/main/frontend/**/__tests__/**',
    '!src/main/frontend/**/*.test.js',
    '!src/main/frontend/**/*.spec.js'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Coverage reporters
  coverageReporters: ['html', 'text', 'lcov'],

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true
};