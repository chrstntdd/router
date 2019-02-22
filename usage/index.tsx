import React from 'react'
import ReactDOM from 'react-dom'

import { Router, Link, Redirect } from '../dist/index'

import * as S from './styles.css'

import { MainNav } from './MainNav'

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

const Home = React.lazy(() => import(/* webpackChunkName: "home" */ './Home'))
const Dashboard = React.lazy(() => import(/* webpackChunkName: "dashboard" */ './Dashboard'))

const AuthenticatedPage = ({ isAuthenticated }) => {
  return isAuthenticated ? (
    <div>
      <MainNav />
      Welcome!
    </div>
  ) : (
    <Redirect to="/" />
  )
}

function App() {
  const [routerIsMounted, setRouterIsMounted] = React.useState(true)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)

  return (
    <React.unstable_ConcurrentMode>
      <main className={S.main}>
        <React.Suspense fallback={<Loading />}>
          <button
            className={S.mountRouterButton}
            onClick={_ => !routerIsMounted && setRouterIsMounted(true)}
          >
            Mount main router
          </button>
          <button
            className={S.mountRouterButton}
            onClick={_ => setIsAuthenticated(!isAuthenticated)}
          >
            Become {isAuthenticated ? 'a normie' : 'a part of the elite 1%'}
          </button>
          {routerIsMounted && (
            <div className={S.routerContainer}>
              <Router>
                <Home path="/" />
                <Dashboard path="/dashboard" />
                <AuthenticatedPage path="/secret" isAuthenticated={isAuthenticated} />
                <FallbackRoute default />
              </Router>
            </div>
          )}
        </React.Suspense>
      </main>
    </React.unstable_ConcurrentMode>
  )
}

const root = document.getElementById('🤔')

ReactDOM.unstable_createRoot(root).render(<App />)
