import React from 'react'
import ReactDOM from 'react-dom'

import { App } from './App'

const IS_SSR = process.env.SSR

if (module.hot) {
  module.hot.accept()
}

try {
  const root = document.getElementById('root')

  if (IS_SSR) {
    ReactDOM.hydrate(<App />, root)
  } else {
    ReactDOM.unstable_createRoot(root).render(<App />)
  }
} catch (error) {
  console.log(error)
}
