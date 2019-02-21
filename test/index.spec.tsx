import React from 'react'
import { render, fireEvent, wait, act } from 'react-testing-library'

import { createHistory, createMemorySource, Router, Link, Redirect } from '../src'

const makeTestHistory = (pathname: string) => createHistory(createMemorySource(pathname))

const NotFound = () => <div>404 page</div>
const Home = () => (
  <div data-testid="home-page">
    Home
    <br />
    <Link to="/">Current page</Link>
    <Link data-testid="dash-anchor" to="/dash">
      dash
    </Link>
  </div>
)
const Dash = ({ children }) => (
  <div data-testid="dashboard-page">
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
  beforeEach(() => {
    window.requestAnimationFrame = jest.fn(fn => fn())
  })

  describe('smoke', () => {
    it(`renders the root component at "/"`, () => {
      const history = makeTestHistory('/')
      const { container } = render(
        <Router history={history}>
          <Home path="/" />
          <Dash path="/dash" />
        </Router>
      )

      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders at a path', () => {
      const history = makeTestHistory('/dash')
      const { container } = render(
        <Router history={history}>
          <Home path="/" />
          <Dash path="/dash" />
        </Router>
      )

      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders a fallback route', () => {
      const history = makeTestHistory('/nonsense')

      const { getByText } = render(
        <Router history={history}>
          <Home path="/" />
          <Dash path="/dash" />
          <NotFound default />
        </Router>
      )

      expect(getByText(/404 page/i)).toBeInTheDocument()
    })

    it('renders a lazy component', async () => {
      const history = makeTestHistory('/lazy')
      const TestAsyncComponent = React.lazy(() => import('./FakeLazy'))

      const { getByText } = render(
        <React.Suspense fallback={<div />}>
          <Router history={history}>
            <Home path="/" />
            <Dash path="/dash" />
            <TestAsyncComponent path="/lazy" />
            <NotFound default />
          </Router>
        </React.Suspense>
      )

      await wait()
      expect(getByText(/lazy/i)).toBeInTheDocument()
    })
  })

  describe('rendering a Redirect component', () => {
    it('should redirect!', async () => {
      const history = makeTestHistory('/secret')
      const CurrentPage = ({ isAuthenticated }) =>
        isAuthenticated ? <div>{'Welcome'}</div> : <Redirect to="/home" />

      const { getByTestId } = render(
        <Router history={history}>
          <CurrentPage path="secret" isAuthenticated={false} />
          <Home path="home" />
        </Router>
      )

      expect(history.location.pathname).toEqual('/secret')

      await wait()

      expect(getByTestId('home-page')).toBeInTheDocument()
      expect(history.location.pathname).toEqual('/home')
    })
  })

  describe('using links', () => {
    it.skip('should have functioning links, lol', async () => {
      const history = makeTestHistory('/')
      const { getByTestId } = render(
        <Router history={history}>
          <Home path="/" />
          <Dash path="/dash" />
        </Router>
      )

      expect(getByTestId('home-page')).toBeInTheDocument()
      expect(history.location.pathname).toEqual('/')

      fireEvent.click(getByTestId('dash-anchor'))

      // TODO find way of asserting that the page has changed without ONLY inspecting the history
      // expect(getByTestId('dashboard-page')).toBeInTheDocument()
      expect(history.location.pathname).toEqual('/dash')
    })

    it('should **NOT** update anything when clicking on a link to the current url', () => {
      const history = makeTestHistory('/')
      const { getByText } = render(
        <Router history={history}>
          <Home path="/" />
          <Dash path="/dash" />
        </Router>
      )

      const initialHistory = history.location

      expect(history.location.pathname).toEqual('/')
      expect(getByText(/home/i)).toBeInTheDocument()

      fireEvent.click(getByText(/current page/i))

      expect(initialHistory).toEqual(history.location)
      expect(getByText(/home/i)).toBeInTheDocument()
      expect(history.location.pathname).toEqual('/')
    })

    it('should support a prop getter', async () => {
      const history = makeTestHistory('/')
      const getThemProps = props => {
        expect(props).toMatchInlineSnapshot(`
Object {
  "isCurrent": true,
  "isPartiallyCurrent": true,
  "location": Object {
    "key": "initial",
    "pathname": "/",
    "search": "",
    "state": undefined,
  },
}
`)
        return props.isCurrent ? { className: 'active' } : null
      }
      const HomePage = () => {
        return (
          <div data-testid="home-page">
            <Link to="/" getProps={getThemProps}>
              Current Page
            </Link>
          </div>
        )
      }

      const { getByText } = render(
        <Router history={history}>
          <HomePage path="/" />
        </Router>
      )

      await wait()

      expect(getByText(/Current Page/i)).toHaveClass('active')
    })
  })
})
