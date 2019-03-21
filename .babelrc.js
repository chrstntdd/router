// This is mainly for having proper transforms available for jest
module.exports = {
  env: {
    SSR: {
      plugins: ['dynamic-import-node']
    },
    test: {
      plugins: ['dynamic-import-node'],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            }
          }
        ]
      ]
    }
  },
  plugins: ['@babel/plugin-syntax-dynamic-import'],
  presets: ['@babel/typescript', '@babel/react']
}
