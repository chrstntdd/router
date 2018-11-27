import typescript from 'rollup-plugin-typescript'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const input = 'src/index.tsx'

const shared = {
  plugins: [
    resolve({
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    }),
    typescript()
    // terser()
  ],
  external: ['react', 'scheduler', 'invariant']
}

export default [
  // ESM build
  {
    input,
    output: {
      file: pkg.module,
      format: 'esm'
    },
    ...shared
  },
  // CommonJS build
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs'
    },
    ...shared
  }
]
