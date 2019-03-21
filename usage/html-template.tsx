import fs from 'fs'
import path from 'path'

import { exampleOutDirClient } from '../paths'

// Match main.asdf123.js in production mode or bundle.js in dev mode
const mainBundleRegex = /(main|bundle|client)\.(?:.*\.)?js$/
const vendorBundleRegex = /(vendors~main)\.(?:.*\.)?js$/

/**
 * @description
 * Synchronously walk a directory with a generator for reduced space
 * complexity `O(n) -> O(1)`
 */
function* walkSync(dir: string) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const pathToFile = path.join(dir, file)
    const isDirectory = fs.statSync(pathToFile).isDirectory()
    if (isDirectory) {
      yield* walkSync(pathToFile)
    } else {
      yield pathToFile
    }
  }
}

let jsBundles: string[]
let cssFiles: string[]

const makePathRelative = (p: string) => {
  const clone = p

  const matches = /static.+/.exec(clone)

  if (matches && matches.length) {
    const thing = matches[0]
    return thing
  }
}

try {
  let allFiles = []

  for (const file of walkSync(exampleOutDirClient)) {
    const relativePath = path.relative(process.cwd(), file)

    const rel = makePathRelative(relativePath)

    if (file.endsWith('.js') || file.endsWith('.css')) {
      allFiles.push(rel)
    }
  }

  jsBundles = allFiles.filter(f => f.endsWith('.js'))
  cssFiles = allFiles.filter(f => f.endsWith('.css'))
} catch (error) {
  console.log('no jsBundles found :(')
}

export const createScriptTag = (src: string) =>
  `<script defer="defer" type="text/javascript" src="/${src}"></script>`

export const createLinkTag = (href: string) => `<link rel="stylesheet" href="${href}" />`

const mainBundle = jsBundles.find(b => mainBundleRegex.test(b))
const vendorBundles = jsBundles.find(b => vendorBundleRegex.test(b))

const getHeader = () => {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <title>SSR!</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        *,
        *::after,
        *::before {
          box-sizing: border-box;
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        }
        html * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        html,
        body {
          min-height: 100vh;
          min-width: 100vw;
          text-rendering: optimizeLegibility;
          font: 16px/1.8 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
          scroll-behavior: smooth;
          color: #444;
        }
      </style>
      ${cssFiles.map(href => createLinkTag(href))}
    </head>
    <body>
      <div id="root">`
}

const getFooter = (bundles?: string[]) => {
  return `</div>
    ${createScriptTag(vendorBundles)}
    ${createScriptTag(mainBundle)}
    ${bundles && bundles.length ? bundles.map(b => createScriptTag(b)).join('\n') : ''}
    </body>
  </html>
  `
}

export { getHeader, getFooter }
