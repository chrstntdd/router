import fs from 'fs-extra'
import webpack from 'webpack'
import { promisify } from 'util'
import { readFile, writeFile } from 'fs'

const writeFileAsync = promisify(readFile)

import chalk from 'chalk'
import formatWebpackMessages from 'react-dev-utils/formatWebpackMessages'

import config, { Target, Environment } from '../webpack.config'

export function compile(config, cb) {
  let compiler
  try {
    compiler = webpack(config)
  } catch (e) {
    console.log('Failed to compile: ', e)
    process.exit(1)
  }
  compiler.run(cb)
}

function buildExampleApp() {
  return new Promise((res, rej) => {
    const clientConfig = config(Target.Client, Environment.Production)

    compile(clientConfig, async (clientError, clientStats) => {
      if (clientError) {
        rej(clientError)
      }

      await writeFileAsync(
        `${clientConfig.output.path}/stats.json`,
        JSON.stringify(clientStats.toJson())
      )

      const clientMessages = formatWebpackMessages(clientStats.toJson({}, true))

      if (clientMessages.errors.length) {
        return rej(new Error(clientMessages.errors.join('\n\n')))
      }

      console.log(chalk.green('Compiled client successfully.'))

      const serverConfig = config(Target.Server, Environment.Production)

      compile(serverConfig, (serverError, serverStats) => {
        if (serverError) rej(serverError)

        const serverMessages = formatWebpackMessages(serverStats.toJson({}, true))

        if (serverMessages.errors.length) {
          return rej(new Error(serverMessages.errors.join('\n\n')))
        }

        console.log(chalk.green('Compiled server successfully.'))

        return res({
          clientStats,
          serverStats
        })
      })
    })
  })
}

buildExampleApp().then(() => {
  console.log('ALL BUNDLED!')
})
