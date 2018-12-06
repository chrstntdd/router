module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['\\.d\\.ts$'],
  coverageReporters: ['lcov'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/config/testing/file-mock.js',
    '^.+\\.(scss|css)$': '<rootDir>/config/testing/style-mock.js',
    '^@[/](.*)': '<rootDir>/src/client/$1'
  },
  moduleDirectories: ['<rootDir>/src', 'node_modules'],
  setupFiles: ['<rootDir>/config/testing/jest-setup.js'],
  testPathIgnorePatterns: [
    '<rootDir>[/\\\\](build|docs|node_modules|scripts)[/\\\\]',
    '\\.d\\.ts$'
  ],
  testRegex: '\\.spec\\.(ts|tsx)$',
  testURL: 'http://localhost:3000',
  transform: {
    '^.+\\.(scss|css)$': '<rootDir>/config/testing/style-mock.js',
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
