import React from 'react'
import 'jest-dom/extend-expect'
import { render, cleanup, fireEvent } from 'react-testing-library'

import { createHistory, createMemorySource, LocationProvider, Router } from '../src'

let runWithNavigation = (element, pathname = '/') => {
  let history = createHistory(createMemorySource(pathname))
  let wrapper = render(<LocationProvider history={history}>{element}</LocationProvider>)
  const snapshot = () => {
    expect(wrapper.container.firstChild).toMatchSnapshot()
  }

  return { history, snapshot, wrapper }
}

let snapshot = ({ pathname, element }) => {
  let testHistory = createHistory(createMemorySource(pathname))
  let wrapper = render(<LocationProvider history={testHistory}>{element}</LocationProvider>)

  expect(wrapper.container.firstChild).toMatchSnapshot()

  return wrapper.container.firstChild
}

let Home = () => <div>Home</div>
let Dash = ({ children }) => <div>Dash {children}</div>
let Group = ({ groupId, children }) => (
  <div>
    Group: {groupId}
    {children}
  </div>
)
let PropsPrinter = props => <pre>{JSON.stringify(props, null, 2)}</pre>
let Reports = ({ children }) => <div>Reports {children}</div>
let AnnualReport = () => <div>Annual Report</div>

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
})
