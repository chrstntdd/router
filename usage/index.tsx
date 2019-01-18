import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { Router, Link } from '../dist'

import * as S from './styles.css'

function Loading() {
  return <div>Loading...</div>
}

function FallbackRoute() {
  return (
    <div className="page-container">
      <h1>Route not found</h1>
      <br />
      <Link to="/">Back home</Link>
    </div>
  )
}

const Home = React.lazy(() => import('./Home'))
const Dashboard = React.lazy(() => import('./Dashboard'))

function App() {
  const [routerIsMounted, setRouterIsMounted] = React.useState(false)

  return (
    <main className={S.main}>
      <React.Suspense fallback={<Loading />}>
        <button
          className={S.mountRouterButton}
          onClick={_ => !routerIsMounted && setRouterIsMounted(true)}
        >
          Mount main router
        </button>
        {routerIsMounted && (
          <div className={S.routerContainer}>
            <Router>
              <Home path="/" />
              <Dashboard path="/dashboard" />
              <FallbackRoute default />
            </Router>
          </div>
        )}
      </React.Suspense>
    </main>
  )
}

const root = document.getElementById('🤔')

// ReactDOM.createRoot(root).render(<App />)
ReactDOM.render(<App />, root)
