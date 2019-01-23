import * as React from 'react'

import {
  insertParams,
  invariant,
  isProduction,
  match,
  pick,
  resolve,
  Route,
  shouldNavigate,
  startsWith,
  stripSlashes,
  validateRedirect
} from './helpers'
import { RouteComponentProps, NavigateFn, NavigateOptions } from './types'
import { createHistory, createMemorySource, globalHistory, navigate } from './history'

// Sets baseuri and basepath for nested routers and links
const BaseContext = React.createContext({ baseuri: '/', basepath: '/' })

/**
 * @description Main Router component that connects the matched Component to
 * the contexts.
 */
const Router = props => {
  const baseContext = React.useContext(BaseContext)

  return (
    <Location>
      {locationContext => <RouterImpl {...baseContext} {...locationContext} {...props} />}
    </Location>
  )
}

interface PRouterImpl {
  basepath: string
  baseuri: string
  component: any
  location: any
  navigate: NavigateFn
  children: RouteComponentProps[]
  primary?: boolean
}

const RouterImpl = ({
  basepath,
  baseuri,
  children,
  component,
  location,
  navigate,
  primary = true,
  ...domProps
}: PRouterImpl) => {
  const routes = React.Children.map(children, createRoute(basepath))

  const match = pick(routes, location.pathname)

  if (match) {
    const {
      params,
      uri,
      route,
      route: { value: element }
    } = match

    // remove the /* from the end for child routes relative paths
    basepath = route.default ? basepath : route.path.replace(/\*$/, '')

    const props = {
      ...params,
      uri,
      location,
      navigate: (to: string, options: NavigateOptions<any>) => navigate(resolve(to, uri), options)
    }

    const clone = React.cloneElement(
      element,
      props,
      element.props.children ? (
        <Router primary={primary}>{element.props.children}</Router>
      ) : (
        undefined
      )
    )

    return (
      <BaseContext.Provider value={{ basepath, baseuri: uri }}>
        <FocusHandler uri={uri} location={location} component={component} {...domProps}>
          {clone}
        </FocusHandler>
      </BaseContext.Provider>
    )
  }

  return null
}

const FocusContext = React.createContext((el: HTMLElement) => {})

interface FocusHandlerProps {
  children: any
  component: any
  location: any
  uri: string
}

const FocusHandler = ({ uri, location, component, ...domProps }: FocusHandlerProps) => {
  const requestFocus = React.useContext<(el: HTMLElement) => void>(FocusContext)

  return (
    <FocusHandlerImpl
      {...domProps}
      component={component}
      requestFocus={requestFocus}
      uri={uri}
      location={location}
    />
  )
}

interface PFocusHandlerImpl {
  component: any
  children: any
  requestFocus: (el: HTMLElement) => void
  uri: any
  location: any
  role?: string
  style?: object
}

// don't focus on initial render
let initialRender = true
let focusHandlerCount = 0

const FocusHandlerImpl = ({
  children,
  component,
  location,
  requestFocus,
  role = 'group',
  uri,
  ...domProps
}: PFocusHandlerImpl) => {
  const [shouldFocus, setShouldFocus] = React.useState(() => true)
  const compEl = React.useRef(null)

  // cDM && cWU
  React.useEffect(() => {
    focus()
    focusHandlerCount++
    setShouldFocus(true)

    return () => {
      focusHandlerCount--
      if (focusHandlerCount === 0) initialRender = true
    }
  }, [])

  // cDU
  React.useEffect(() => {
    shouldFocus && focus()
  }, [location])

  const focus = React.useCallback(() => {
    requestFocus
      ? requestFocus(compEl.current)
      : initialRender
      ? (initialRender = false)
      : !compEl.current.contains(document.activeElement) && compEl.current.focus()
  }, [requestFocus])

  const internalRequestFocus = React.useCallback(
    node => {
      !shouldFocus && node.focus()
    },
    [shouldFocus]
  )

  return (
    <div ref={compEl} role={role} tabIndex={-1} {...domProps}>
      <FocusContext.Provider value={internalRequestFocus}>{children}</FocusContext.Provider>
    </div>
  )
}

const Match = ({ path, children }) => {
  const { baseuri } = React.useContext(BaseContext)

  return (
    <Location>
      {({ navigate, location }) => {
        const resolvedPath = resolve(path, baseuri)
        const result = match(resolvedPath, location.pathname)

        return children({
          navigate,
          location,
          match: result
            ? {
                ...result.params,
                path,
                uri: result.uri
              }
            : null
        })
      }}
    </Location>
  )
}

// @ts-ignore
const LocationContext = React.createContext()

/**
 * @description
 * Sets up a listener if there isn't one already so apps don't need to be
 * wrapped a top level provider
 */
const Location = ({ children }) => {
  const locationContext = React.useContext(LocationContext)

  return locationContext ? (
    children(locationContext)
  ) : (
    <LocationProvider>{children}</LocationProvider>
  )
}

interface PLocationProvider {
  history?: any
  children?: (any1: any) => React.ReactNode
}

const LocationProvider = ({ history, children }: PLocationProvider) => {
  const unmounted = React.useRef(null)
  const listener = React.useRef(null)

  history = history || globalHistory

  const getContext = () => ({
    navigate: history.navigate,
    location: history.location
  })

  const [locationState, setLocationState] = React.useState(() => getContext())

  React.useEffect(() => {
    listener.current = history.listen(() => {
      Promise.resolve().then(() => {
        requestAnimationFrame(() => {
          if (!unmounted.current) setLocationState(getContext())
        })
      })
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
  }, [locationState.location])

  try {
    return (
      <LocationContext.Provider value={locationState}>
        {typeof children === 'function' ? children(locationState) : children || null}
      </LocationContext.Provider>
    )
  } catch (error) {
    // componentDidCatch...?
    if (isRedirect(error)) {
      history.navigate(error.uri, { replace: true })
    } else {
      throw error
    }
  }
}

type ServerLocationProps = {
  url: string
  children: React.ReactElement<any>
}

/**
 * @description When you render a <Redirect/> a redirect request is thrown,
 * preventing react from rendering the whole tree when we don’t want to do
 * that work anyway.
 *
 * To enable SSR, wrap the top level <App /> component with this component
 * and pass it the url that exists on the request object of whichever node
 * framework is being used.
 */
const ServerLocation = ({ url, children }: ServerLocationProps) => (
  <LocationContext.Provider
    value={{
      location: { pathname: url },
      navigate: () => {}
    }}
  >
    {children}
  </LocationContext.Provider>
)

interface IRedirectRequest {
  uri: string
}

function RedirectRequest(this: IRedirectRequest, uri: string) {
  this.uri = uri
}

const isRedirect = (o: any) => o instanceof RedirectRequest

const redirectTo = (to: string) => {
  throw new RedirectRequest(to)
}

interface PRedirectImpl {
  from: string
  navigate: (toPath: string, state: { replace: boolean; state: object }) => any
  noThrow: boolean
  replace: boolean
  state: any
  to: string
}

const RedirectImpl = (props: PRedirectImpl) => {
  const { navigate, to, from, replace, state, noThrow, ...restProps } = props
  if (!noThrow) redirectTo(insertParams(to, restProps))

  return null
}

const Redirect = props => {
  const locationContext = React.useContext(LocationContext)

  return <RedirectImpl {...locationContext} {...props} />
}

interface LinkPropGetter {
  isCurrent: boolean
  isPartiallyCurrent: boolean
  href: string
  location: any
}

interface LinkProps {
  to: string
  innerRef?: any
  state?: any
  replace?: () => any
  getProps?: (x: LinkPropGetter) => any
}

const Link: React.ComponentType<LinkProps & React.HTMLProps<HTMLAnchorElement>> = props => {
  const { baseuri } = React.useContext(BaseContext)
  const linkRef = React.useRef(null)

  return (
    <Location>
      {({ location, navigate }) => {
        const { to, state, replace, getProps = () => {}, ...anchorProps } = props
        const href = resolve(to, baseuri)
        const isCurrent = location.pathname === href
        const isPartiallyCurrent = startsWith(location.pathname, href)

        return (
          <a
            ref={linkRef}
            aria-current={isCurrent ? 'page' : undefined}
            {...anchorProps}
            {...getProps({ isCurrent, isPartiallyCurrent, href, location })}
            href={href}
            onClick={event => {
              if (anchorProps.onClick) anchorProps.onClick(event)
              if (isCurrent) {
                event.preventDefault()
                return
              }
              if (shouldNavigate(event)) {
                event.preventDefault()
                navigate(href, { state, replace })
              }
            }}
          />
        )
      }}
    </Location>
  )
}

const createRoute = (basepath: string) => (element: React.ReactElement<any>): Route | null => {
  if (!element) return null

  if (!isProduction) {
    invariant(
      element.props.path || element.props.default || element.type === Redirect,
      `<Router>: Children of <Router> must have a \`path\` or \`default\` prop, or be a \`<Redirect>\`. None found on element type \`${
        element.type
      }\``
    )

    invariant(
      !(element.type === Redirect && (!element.props.from || !element.props.to)),
      `<Redirect from="${element.props.from} to="${
        element.props.to
      }"/> requires both "from" and "to" props when inside a <Router>.`
    )

    invariant(
      !(element.type === Redirect && !validateRedirect(element.props.from, element.props.to)),
      `<Redirect from="${element.props.from} to="${
        element.props.to
      }"/> has mismatched dynamic segments, ensure both paths have the exact same dynamic segments.`
    )
  }

  if (element.props.default) return { value: element, default: true }

  const elementPath = element.type === Redirect ? element.props.from : element.props.path

  const path =
    elementPath === '/' ? basepath : `${stripSlashes(basepath)}/${stripSlashes(elementPath)}`

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
  isRedirect,
  Link,
  Location,
  LocationProvider,
  Match,
  navigate,
  Redirect,
  redirectTo,
  Router,
  ServerLocation
}
