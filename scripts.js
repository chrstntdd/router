const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const pkg = require('./package.json')

;(async () => {
  const builds = [
    { name: pkg.module, content: readFile(pkg.module, 'UTF-8') },
    { name: pkg.main, content: readFile(pkg.main, 'UTF-8') }
  ]

  builds.forEach(async ({ name, content }) => {
    const fileContent = await content
    const comment = /(\/\*[^]*\*\/)|(\/\/[^*]*)/gm.exec(fileContent)[0]

    if (comment) {
      const newContent = fileContent.replace(comment, '')

      await writeFile(name, newContent, 'UTF-8')
    }
  })

  console.log('🧹 Removed that pesky code comment  🧹')
})()
