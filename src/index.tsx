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
import { NavigateFn, NavigateOptions, HistoryLocation, ParamsObj, History } from './types'
import { createHistory, createMemorySource, globalHistory, navigate } from './history'

// Sets baseuri and basepath for nested routers and links
const BaseContext = React.createContext({ baseuri: '/', basepath: '/' })

interface RouterProps {
  basepath?: string
  baseuri?: string
  component?: React.ReactElement<any>
  location?: HistoryLocation
  primary?: boolean
}

/**
 * @description Main Router component that connects the matched Component to
 * the contexts.
 */
const Router: React.FC<RouterProps> = props => {
  const baseContext = React.useContext(BaseContext)

  return (
    <Location>
      {locationContext => <RouterImpl {...baseContext} {...locationContext} {...props} />}
    </Location>
  )
}

type RouterImplProps = RouterProps & { navigate: NavigateFn }

const RouterImpl: React.FC<RouterImplProps> = ({
  basepath,
  baseuri,
  children,
  component,
  location,
  navigate,
  primary = true,
  ...domProps
}) => {
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
  component: React.ReactElement<any>
  location: HistoryLocation
  uri: string
}

const FocusHandler: React.FC<FocusHandlerProps> = ({ uri, location, component, ...domProps }) => {
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

type FocusHandlerImplProps = {
  role?: string
  requestFocus: (el: HTMLElement) => void
} & FocusHandlerProps

// don't focus on initial render
let initialRender = true
let focusHandlerCount = 0

const FocusHandlerImpl: React.FC<FocusHandlerImplProps> = ({
  children,
  component,
  location,
  requestFocus,
  role = 'group',
  uri,
  ...domProps
}) => {
  const [shouldFocus, setShouldFocus] = React.useState(() => true)
  const compEl = React.useRef(null)

  // cDM && cWU
  React.useEffect(() => {
    focus()
    focusHandlerCount++
    setShouldFocus(true)

    return () => {
      focusHandlerCount--
      if (focusHandlerCount == 0) initialRender = true
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

interface MatchProps {
  path: string
  children: (props: MatchChildrenProps) => React.ReactElement<any>
}

interface MatchChildrenProps {
  navigate: NavigateFn
  location: HistoryLocation
  match: ParamsObj
}

const Match: React.FC<MatchProps> = ({ path, children }) => {
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

interface LocationProviderProps {
  history?: History
}

const LocationProvider: React.FC<LocationProviderProps> = ({ history, children }) => {
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

  return (
    <LocationContext.Provider value={locationState}>
      {typeof children == 'function' ? children(locationState) : children || null}
    </LocationContext.Provider>
  )
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

const Redirect: React.FC<RedirectProps> = ({ to, from, state, replace = true, ...props }) => {
  const { navigate } = React.useContext(LocationContext)

  React.useEffect(() => {
    Promise.resolve().then(() => {
      navigate(insertParams(to, props), { replace, state })
    })
  }, [])

  return null
}

interface LinkPropGetter {
  isCurrent: boolean
  isPartiallyCurrent: boolean
  href: string
  location: any
}

interface LinkProps {
  to: string
  state?: any
  replace?: () => any
  /* To support hooking into location data for applying your own props */
  getProps?: (props: LinkPropGetter) => void
}

const Link: React.FC<LinkProps & React.HTMLProps<HTMLAnchorElement>> = props => {
  const { baseuri } = React.useContext(BaseContext)
  const linkRef = React.useRef(null)

  return (
    <Location>
      {({ location, navigate }) => {
        const { to, state, replace, getProps, ...anchorProps } = props
        const href = resolve(to, baseuri)
        const isCurrent = location.pathname == href
        const isPartiallyCurrent = startsWith(location.pathname, href)

        return (
          <a
            ref={linkRef}
            aria-current={isCurrent ? 'page' : undefined}
            {...anchorProps}
            {...typeof getProps == 'function' &&
              getProps({ isCurrent, isPartiallyCurrent, href, location })}
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
  Location,
  LocationProvider,
  Match,
  navigate,
  Redirect,
  Router,
  ServerLocation
}
