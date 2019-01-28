// This is mainly for having proper transforms available for jest
module.exports = {
  env: {
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
  presets: ['@babel/typescript', '@babel/react']
}
