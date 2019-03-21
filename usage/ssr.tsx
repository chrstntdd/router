import * as React from 'react'
import { Request, Response } from 'express'
import { renderToNodeStream, renderToStaticMarkup } from 'react-dom/server'

import { getHeader, getFooter } from './html-template'
import { ServerLocation } from '../dist/index.js'
import { App } from './App'

const renderer = (req: Request, res: Response) => {
  const body = renderToStaticMarkup(
    <ServerLocation url={req.url}>
      <App />
    </ServerLocation>
  )

  console.log(body)

  const all = getHeader() + body + getFooter()

  res.send(all)
}

const streamRenderer = (req: Request, res: Response) => {
  res.write(getHeader())

  // const statsFile = exampleOutDirServer + '/' + 'loadable-stats.json'
  // const chunkExtractor = new ChunkExtractor({ statsFile })
  // const jsx = chunkExtractor.collectChunks(<App />)

  // TODO: determine which route bundle to resolve (replace loadable-components)

  const stream = renderToNodeStream(
    <ServerLocation url={req.url}>
      <App />
    </ServerLocation>
  )

  stream.pipe(
    res,
    { end: false }
  )

  stream.on('end', () => {
    res.end(getFooter())
  })
}

export { renderer, streamRenderer }
