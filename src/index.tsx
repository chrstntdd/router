import * as React from 'react'

import {
  insertParams,
  invariant,
  pick,
  Route,
  shouldNavigate,
  startsWith,
  stripSlashes,
  validateRedirect,
  __DEV__
} from './helpers'
import { History, HistoryLocation, NavigateFn } from './types'
import { createHistory, createMemorySource, globalHistory, navigate } from './history'

// Sets baseuri and basepath for nested routers and links

interface RouterProps {
  history?: History
  component?: React.ReactElement<any>
  primary?: boolean
  children: React.ReactElement<
    { default?: never; path: string } | { default: boolean; path?: never }
  >[]
}

/**
 * @description Main Router component that connects the matched Component to
 * the contexts.
 */
const Router: React.FC<RouterProps> = ({ children, history = globalHistory }) => {
  const unmounted = React.useRef(null)
  const listener = React.useRef(null)

  const getContext = () => ({
    navigate: history.navigate,
    location: history.location
  })

  const [locationState, setLocationState] = React.useState(() => getContext())

  React.useEffect(() => {
    listener.current = history.listen(() => {
      if (!unmounted.current) {
        setLocationState(getContext())
      }
    })

    // unlisten & cleanup
    return () => {
      unmounted.current = true
      listener.current()
    }
  }, [])

  // Called to complete a route transition
  React.useEffect(() => {
    history.onTransitionComplete()
  }, [locationState.location.pathname])

  const routes = React.Children.map(children, createRoute())

  const match = pick(routes, locationState.location.pathname)

  if (match) {
    const {
      route: { value: element }
    } = match

    return <LocationContext.Provider value={locationState}>{element}</LocationContext.Provider>
  }

  return null
}

type ContextValue = {
  location: HistoryLocation | { pathname: string }
  navigate: NavigateFn
}

const LocationContext = React.createContext<ContextValue>({
  location: globalHistory.location,
  navigate: globalHistory.navigate
})

/**
 * @description When you render a <Redirect/> a redirect request is thrown,
 * preventing react from rendering the whole tree when we don’t want to do
 * that work anyway.
 *
 * To enable SSR, wrap the top level <App /> component with this component
 * and pass it the url that exists on the request object of whichever node
 * framework is being used.
 */
const ServerLocation: React.FC<{ url: string }> = ({ url, children }) => (
  <LocationContext.Provider
    value={{
      location: { pathname: url },
      navigate: () => {}
    }}
  >
    {children}
  </LocationContext.Provider>
)

interface RedirectProps {
  from?: string
  replace?: boolean
  state?: unknown
  to: string
}

const Redirect: React.FC<RedirectProps> = ({ to, from, replace = true, ...props }) => {
  const { navigate } = React.useContext(LocationContext)

  React.useEffect(() => {
    Promise.resolve().then(() => {
      navigate(insertParams(to, props), { replace })
    })
  }, [])

  return null
}

interface LinkPropGetter {
  isCurrent: boolean
  isPartiallyCurrent: boolean
  location: any
}

interface LinkProps {
  to: string
  replace?: boolean
  /* To support hooking into location data for applying your own props */
  getProps?: (props: LinkPropGetter) => void
}

const Link: React.FC<LinkProps & React.HTMLProps<HTMLAnchorElement>> = props => {
  const linkRef = React.useRef(null)
  const { location } = React.useContext(LocationContext)

  const { to, replace, getProps, ...anchorProps } = props
  const isCurrent = location.pathname == to

  const handleClick = React.useCallback(
    event => {
      if (anchorProps.onClick) anchorProps.onClick(event)
      if (isCurrent) {
        event.preventDefault()
        return
      }
      if (shouldNavigate(event)) {
        event.preventDefault()
        navigate(to, { replace })
      }
    },
    [location.pathname, to]
  )

  return (
    <a
      ref={linkRef}
      aria-current={isCurrent ? 'page' : undefined}
      {...anchorProps}
      {...typeof getProps == 'function' &&
        getProps({
          isCurrent,
          isPartiallyCurrent: startsWith(location.pathname, to),
          location
        })}
      href={to}
      onClick={handleClick}
    />
  )
}

const createRoute = (basepath = '/') => (element: React.ReactElement<any>): Route | null => {
  if (!element) return null

  if (__DEV__) {
    invariant(
      element.props.path || element.props.default || element.type == Redirect,
      `<Router>: Children of <Router> must have a \`path\` or \`default\` prop, or be a \`<Redirect>\`. None found on element type \`${
        element.type
      }\``
    )

    invariant(
      !(element.type == Redirect && (!element.props.from || !element.props.to)),
      `<Redirect from="${element.props.from} to="${
        element.props.to
      }"/> requires both "from" and "to" props when inside a <Router>.`
    )

    invariant(
      !(element.type == Redirect && !validateRedirect(element.props.from, element.props.to)),
      `<Redirect from="${element.props.from} to="${
        element.props.to
      }"/> has mismatched dynamic segments, ensure both paths have the exact same dynamic segments.`
    )
  }

  if (element.props.default) return { value: element, default: true }

  const elementPath = element.type == Redirect ? element.props.from : element.props.path

  const path =
    elementPath == '/' ? basepath : `${stripSlashes(basepath)}/${stripSlashes(elementPath)}`

  return {
    value: element,
    default: element.props.default,
    path: element.props.children ? `${stripSlashes(path)}/*` : path
  }
}

export {
  createHistory,
  createMemorySource,
  globalHistory,
  Link,
  navigate,
  Redirect,
  Router,
  ServerLocation
}
