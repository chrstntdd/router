import { resolve } from 'path'
import { realpathSync } from 'fs'

const appDirectory = realpathSync(process.cwd())
const resolveApp = relativePath => resolve(appDirectory, relativePath)

export const exampleOutDir = resolveApp('example')
export const exampleSource = resolveApp('usage')
export const exampleEntry = resolveApp('usage/index.tsx')
export const libOutDir = resolveApp('dist')
export const libSource = resolveApp('src')
export const appPath = resolveApp('.')
export const packageJson = resolveApp('package.json')
