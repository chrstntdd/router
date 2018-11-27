const express = require('express')
const { join } = require('path')
const bodyParser = require('body-parser')
const compression = require('compression')
const morgan = require('morgan')

const app = express()

app.use(compression())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(morgan('dev'))

const PORT = process.env.PORT || 3000
const env = app.get('env')

app.use(express.static(join(__dirname, '../build')))

app.get('*', (_, res) => {
  res.sendFile(join(__dirname, '../build/index.html'))
})

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
