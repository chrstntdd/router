import * as React from 'react'
import 'jest-dom/extend-expect'
import { render, cleanup, fireEvent, wait } from 'react-testing-library'

import { createHistory, createMemorySource, LocationProvider, Router, Link } from '../src'

jest.useFakeTimers()

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

const NotFound = () => <div>404 page</div>
const Home = () => (
  <div>
    Home
    <br />
    <Link to="/">Current page</Link>
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
    <Link to="/dash">Current page</Link>
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

describe('sus-router', () => {
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

    it('renders a fallback route', () => {
      const {
        wrapper: { getByText }
      } = runWithNavigation({
        pathname: '/notfoundroute',
        element: (
          <Router>
            <Home path="/" />
            <Dash path="/dash" />
            <NotFound default />
          </Router>
        )
      })

      expect(getByText(/404 page/i)).toBeInTheDocument()
    })

    it('renders a lazy component', async () => {
      const TestAsyncComponent = React.lazy(() => import('./FakeLazy'))

      const {
        wrapper: { getByText }
      } = runWithNavigation({
        pathname: '/lazy',
        element: (
          <React.Suspense fallback={<div />}>
            <Router>
              <Home path="/" />
              <Dash path="/dash" />
              <TestAsyncComponent path="/lazy" />
              <NotFound default />
            </Router>
          </React.Suspense>
        )
      })

      await wait()
      expect(getByText(/lazy/i)).toBeInTheDocument()
    })
  })

  describe('using links', () => {
    it('should have functioning links, lol', async () => {
      const {
        history,
        wrapper: { getByTestId, getByText, debug }
      } = runWithNavigation({
        pathname: '/',
        element: (
          <Router>
            <Home path="/" />
            <Dash path="/dash" />
          </Router>
        )
      })

      expect(getByText(/home/i)).toBeInTheDocument()
      expect(history.location.pathname).toEqual('/')

      fireEvent.click(getByTestId('dash-anchor'))

      // TODO find way of asserting that the page has changed without inspecting the history
      // const dashboardPage = await waitForElement(() => getByTestId('home-anchor'))

      expect(history.location.pathname).toEqual('/dash')
    })

    it('should **NOT** update anything when clicking on a link to the current url', () => {
      const {
        history,
        wrapper: { getByText }
      } = runWithNavigation({
        pathname: '/',
        element: (
          <Router>
            <Home path="/" />
            <Dash path="/dash" />
          </Router>
        )
      })

      const initialHistory = history.location

      expect(history.location.pathname).toEqual('/')
      expect(getByText(/home/i)).toBeInTheDocument()

      fireEvent.click(getByText(/current page/i))

      expect(initialHistory).toEqual(history.location)
      expect(getByText(/home/i)).toBeInTheDocument()
      expect(history.location.pathname).toEqual('/')
    })
  })
})
