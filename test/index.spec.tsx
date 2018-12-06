import * as React from 'react'
import 'jest-dom/extend-expect'
import { render, cleanup, fireEvent } from 'react-testing-library'

import { createHistory, createMemorySource, LocationProvider, Router, Link } from '../src'

const runWithNavigation = ({ element, pathname = '/' }) => {
  const history = createHistory(createMemorySource(pathname))
  const wrapper = render(<LocationProvider history={history}>{element}</LocationProvider>)
  const snapshot = () => {
    expect(wrapper.container.firstChild).toMatchSnapshot()
  }

  return { history, snapshot, wrapper }
}

const snapshot = ({ pathname, element }) => {
  const testHistory = createHistory(createMemorySource(pathname))
  const wrapper = render(<LocationProvider history={testHistory}>{element}</LocationProvider>)

  expect(wrapper.container.firstChild).toMatchSnapshot()
}

const Home = () => (
  <div>
    Home
    <br />
    <Link data-testid="dash-anchor" to="/dash">
      dash
    </Link>
  </div>
)
const Dash = ({ children }) => (
  <div>
    Dash
    <br />
    {children}
    <br />
    <Link data-testid="home-anchor" to="/">
      Home
    </Link>
  </div>
)
const Group = ({ groupId, children }) => (
  <div>
    Group: {groupId}
    {children}
  </div>
)
const PropsPrinter = props => <pre>{JSON.stringify(props, null, 2)}</pre>
const Reports = ({ children }) => <div>Reports {children}</div>
const AnnualReport = () => <div>Annual Report</div>

describe('A-Router', () => {
  afterEach(cleanup)

  describe('smoke', () => {
    it(`renders the root component at "/"`, () => {
      snapshot({
        pathname: '/',
        element: (
          <Router>
            <Home path="/" />
            <Dash path="/dash" />
          </Router>
        )
      })
    })

    it('renders at a path', () => {
      snapshot({
        pathname: '/dash',
        element: (
          <Router>
            <Home path="/" />
            <Dash path="/dash" />
          </Router>
        )
      })
    })
  })

  describe('using links', () => {
    it('should have functioning links, lol', () => {
      const {
        history,
        wrapper: { getByTestId }
      } = runWithNavigation({
        pathname: '/',
        element: (
          <Router>
            <Home path="/" />
            <Dash path="/dash" />
          </Router>
        )
      })

      expect(history.location.pathname).toEqual('/')

      fireEvent.click(getByTestId('dash-anchor'))

      // TODO find way of asserting that the page has changed without inspecting the history
      // const dashboardPage = await waitForElement(() => getByTestId('home-anchor'))

      expect(history.location.pathname).toEqual('/dash')
    })
  })
})
