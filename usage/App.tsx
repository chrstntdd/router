import React from 'react'

import { Router, Link, Redirect } from '../dist/index'

if (!process.env.SSR) {
  require('./styles.css')
}

import { MainNav } from './MainNav'

interface PLazyComponent {
  path?: string
  default?: boolean
}

const generateLazyComponent = loader => {
  let Component = null

  return class AsyncRouteComponent extends React.Component<PLazyComponent, {}> {
    static displayName = 'AsyncComponent'

    state = { Component }

    componentDidMount() {
      AsyncRouteComponent.load().then(() => {
        if (this.state.Component !== Component) {
          this.setState({ Component })
        }
      })
    }

    static load() {
      return loader().then(ResolvedComponent => {
        Component = ResolvedComponent.default || ResolvedComponent
      })
    }

    render() {
      const { Component: ComponentFromState } = this.state

      if (ComponentFromState) return <ComponentFromState {...this.props} />

      return null
    }
  }
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

const Home = generateLazyComponent(() => import('./Home'))
const Dashboard = generateLazyComponent(() => import('./Dashboard'))

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
      <main className="main">
        <button
          className={'mountRouterButton'}
          onClick={_ => !routerIsMounted && setRouterIsMounted(true)}
        >
          Mount main router
        </button>
        <button className={'mountRouterButton'} onClick={_ => setIsAuthenticated(!isAuthenticated)}>
          Become {isAuthenticated ? 'a normie' : 'a part of the elite 1%'}
        </button>
        {routerIsMounted && (
          <div className="routerContainer">
            <Router>
              <Home path="/" />
              <Dashboard path="/dashboard" />
              <AuthenticatedPage path="/secret" isAuthenticated={isAuthenticated} />
              <FallbackRoute default />
            </Router>
          </div>
        )}
      </main>
    </React.unstable_ConcurrentMode>
  )
}

export { App }
