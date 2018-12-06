import * as React from 'react'
import { unstable_scheduleCallback as defer } from 'scheduler'

/* CLONE/FORK OF https://github.com/reach/router */

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
import { createHistory, createMemorySource, globalHistory, navigate } from './history'

const createNamedContext = (name: string, defaultValue?: any): React.Context<any> => {
  const Ctx = React.createContext(defaultValue)
  // @ts-ignore
  Ctx.Consumer.displayName = `${name}.Consumer`
  // @ts-ignore
  Ctx.Provider.displayName = `${name}.Provider`

  return Ctx
}

// Sets baseuri and basepath for nested routers and links
const BaseContext = createNamedContext('Base', { baseuri: '/', basepath: '/' })

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
  basepath: any
  baseuri: any
  component: any
  location: any
  navigate: any
  children: any
  primary?: boolean
}

const RouterImpl = ({
  basepath,
  baseuri,
  children,
  component = 'div',
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
      navigate: (to: string, options: any) => navigate(resolve(to, uri), options)
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

    /* using 'div' for < 16.3 support */
    const FocusWrapper = primary ? FocusHandler : component
    /* don't pass any props to 'div' */
    const wrapperProps = primary ? { uri, location, component, ...domProps } : domProps

    return (
      <BaseContext.Provider value={{ basepath, baseuri: uri }}>
        <FocusWrapper {...wrapperProps}>{clone}</FocusWrapper>
      </BaseContext.Provider>
    )
  }

  return null
}

const FocusContext = createNamedContext('Focus')

interface FocusHandlerProps {
  children: any
  component: any
  location: any
  uri: string
}

const FocusHandler = ({ uri, location, component, ...domProps }: FocusHandlerProps) => {
  const requestFocus = React.useContext(FocusContext)

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
  requestFocus: (any1: any) => void
  uri: any
  location: any
  role?: string
  style?: object
}

// don't focus on initial render
let initialRender = true
let focusHandlerCount = 0

const FocusHandlerImpl = (props: PFocusHandlerImpl) => {
  const [state, setState] = React.useState({ shouldFocus: null })
  const compEl = React.useRef(null)

  // cDM && cWU
  React.useEffect(() => {
    focus()
    focusHandlerCount++
    setState({ shouldFocus: true, ...props })

    // cleanup
    return () => {
      focusHandlerCount--
      if (focusHandlerCount === 0) {
        initialRender = true
      }
    }
  }, [])

  // cDU
  React.useEffect(() => state.shouldFocus && focus(), [props.location])

  function focus() {
    if (process.env.NODE_ENV === 'test') {
      // getting cannot read property focus of null in the tests
      // and that bit of global `initialRender` state causes problems
      // should probably figure it out!
      return
    }

    const { requestFocus } = props

    requestFocus
      ? requestFocus(compEl.current)
      : initialRender
      ? (initialRender = false)
      : !compEl.current.contains(document.activeElement) && compEl.current.focus()
  }

  const internalRequestFocus = node => {
    !state.shouldFocus && node.focus()
  }

  const {
    children,
    component: Comp = 'div',
    location,
    requestFocus,
    role = 'group',
    style,
    uri,
    ...domProps
  } = props

  return (
    <Comp
      ref={compEl}
      role={role}
      style={{ outline: 'none', ...style }}
      tabIndex="-1"
      {...domProps}
    >
      <FocusContext.Provider value={internalRequestFocus}>{props.children}</FocusContext.Provider>
    </Comp>
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

const LocationContext = createNamedContext('Location')

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
interface SLocationProvider {
  context: {
    navigate: any
    location: any
  }
  refs: {
    unlisten: any
  }
}

const LocationProvider = (props: PLocationProvider) => {
  const [locationState, setLocationState] = React.useState({
    context: getContext(),
    refs: { unlisten: null }
  })

  const unmounted = React.useRef(null)

  React.useEffect(() => {
    locationState.refs.unlisten = props.history.listen(() => {
      Promise.resolve().then(() => {
        defer(() => {
          if (!unmounted.current) {
            // @ts-ignore
            setLocationState({ context: getContext() })
          }
        })
      })
    })

    return () => {
      unmounted.current = true
      locationState.refs.unlisten()
    }
  }, [])

  function getContext() {
    const {
      history: { navigate, location }
    } = props

    return { navigate, location }
  }

  try {
    return (
      <LocationContext.Provider value={locationState.context}>
        {typeof props.children === 'function'
          ? props.children(locationState.context)
          : props.children || null}
      </LocationContext.Provider>
    )
  } catch (error) {
    // componentDidCatch...?
    if (isRedirect(error)) {
      props.history.navigate(error.uri, { replace: true })
    } else {
      throw error
    }
  }
}

LocationProvider.defaultProps = {
  history: globalHistory
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
const ServerLocation = ({ url, children }) => (
  <LocationContext.Provider
    value={{
      location: { pathname: url },
      navigate: () => {
        throw new Error("You can't call navigate on the server.")
      }
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

const createRoute = basepath => (element): Route => {
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
