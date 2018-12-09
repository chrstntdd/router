module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['\\.d\\.ts$'],
  coverageReporters: ['lcov'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['<rootDir>/src', 'node_modules'],
  testPathIgnorePatterns: [
    '<rootDir>[/\\\\](build|docs|node_modules|scripts)[/\\\\]',
    '\\.d\\.ts$'
  ],
  testRegex: '\\.spec\\.(ts|tsx)$',
  testURL: 'http://localhost:3000',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest'
  },
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  globals: {
    'ts-jest': {
      // disable typechecking
      isolatedModules: true,
      babelConfig: {
        env: {
          test: {
            plugins: ['dynamic-import-node']
          }
        }
      }
    }
  }
}
