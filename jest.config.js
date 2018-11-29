module.exports = {
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.{js,ts,tsx,jsx}'],
  coverageReporters: ['lcov'],
  coveragePathIgnorePatterns: ['\\.d\\.ts$'],
  testPathIgnorePatterns: [
    '<rootDir>[/\\\\](build|docs|node_modules|scripts)[/\\\\]',
    '\\.d\\.ts$'
  ],
  testURL: 'http://localhost:3000',
  transform: {
    '^.+\\.(scss|css)$': '<rootDir>/config/testing/style-mock.js',
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest'
  },
  setupFiles: ['<rootDir>/config/testing/jest-setup.js'],
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/config/testing/file-mock.js',
    '^.+\\.(scss|css)$': '<rootDir>/config/testing/style-mock.js',
    '^@[/](.*)': '<rootDir>/src/client/$1'
  },
  moduleDirectories: ['<rootDir>/src', 'node_modules'],
  testRegex: '\\.spec\\.(js|ts|jsx|tsx)$',
  globals: {
    'ts-jest': {
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
