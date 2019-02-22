import webpack from 'webpack'

import config from '../webpack.config'

process.env.NODE_ENV = 'production'

function buildExampleApp() {
  const compiler = webpack(config)

  return new Promise((res, rej) => {
    compiler.run((err, stats) => {
      if (err) return rej(err)

      return res()
    })
  })
}

buildExampleApp()
