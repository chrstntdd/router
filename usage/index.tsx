import React from 'react'
import { createRoot } from 'react-dom'

import { Router, Link } from '../dist'

import './styles.css'

function Loading() {
  return <div>Loading...</div>
}

function FallbackRoute() {
  return (
    <div>
      Route not found
      <br />
      <Link to="/">Back home</Link>
    </div>
  )
}

const Home = React.lazy(() => import('./Home'))
const Dashboard = React.lazy(() => import('./Dashboard'))

function App() {
  return (
    <React.Fragment>
      <React.Suspense maxDuration={2000} fallback={<Loading />}>
        <Router>
          <Home path="/" />
          <Dashboard path="/dashboard" />
          <FallbackRoute default />
        </Router>
      </React.Suspense>
    </React.Fragment>
  )
}

createRoot(document.getElementById('🤔')).render(<App />)
