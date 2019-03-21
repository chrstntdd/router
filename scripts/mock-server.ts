import fs from 'fs'
import express from 'express'
import bodyParser from 'body-parser'
import compression from 'compression'
import morgan from 'morgan'

import { exampleOutDirClient } from '../paths'
import { streamRenderer } from '../usage/ssr'

const app = express()

function ignoreFavicon(req, res, next) {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({ nope: true })
  } else {
    next()
  }
}

app.use(ignoreFavicon)
app.use(compression())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(morgan('dev'))

const PORT = process.env.PORT || 3000
const SSR = process.env.SSR
const env = app.get('env')

app.use(express.static(exampleOutDirClient, SSR ? { index: false } : undefined))

app.get(
  '*',
  SSR
    ? streamRenderer
    : (req, res) => {
        const src = fs.createReadStream(exampleOutDirClient + '/index.html')
        src.pipe(res)
      }
)

let server

const runServer = async (port = PORT) => {
  try {
    await new Promise((resolve, reject) => {
      server = app
        .listen(port, () => {
          console.info(`Your app is listening on port ${port} in a ${env} environment.`)
          resolve()
        })
        .on('error', err => {
          reject(err)
        })
    })
  } catch (error) {
    console.error(error)
  }
}

const closeServer = async () =>
  new Promise((resolve, reject) => {
    console.info('Closing the server. Farewell.')
    server.close(err => (err ? reject(err) : resolve()))
  })

process.on('SIGINT', closeServer)

require.main === module && runServer().catch(err => console.error(err))