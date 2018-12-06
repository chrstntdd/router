export type HistoryLocation = Window['location'] & { state?: any }

export type NavigateFn = (to: string, options?: NavigateOptions<{}>) => void

export type EventHandler = (event: Event) => void

export interface NavigateOptions<T> {
  state?: T
  replace?: boolean
}

export type HistoryListener = (p: { location: HistoryLocation; action: 'PUSH' | 'POP' }) => void
export type HistoryUnsubscribe = () => void

export interface History {
  readonly location: HistoryLocation
  readonly transitioning: boolean
  listen: (listener: HistoryListener) => HistoryUnsubscribe
  navigate: NavigateFn
}

export interface HistorySource {
  readonly location: HistoryLocation
  addEventListener(name: string, listener: EventHandler): void
  removeEventListener(name: string, listener: EventHandler): void
  history: {
    readonly state: any
    pushState(state: any, title: string, uri: string): void
    replaceState(state: any, title: string, uri: string): void
    readonly entries: any
    readonly index: number
  }
}

/**
 * @description Check the environment
 */
const canUseDOM: boolean = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

/**
 * @description To wrap a history source
 */
const getLocation = (source: Window | HistorySource) => ({
  ...source.location,
  state: source.history.state,
  key: (source.history.state && source.history.state.key) || 'initial'
})

const createHistory = (source: Window | HistorySource) => {
  let listeners: any[] = []
  let location = getLocation(source)
  let transitioning = false
  let resolveTransition = () => {}

  return {
    get location() {
      return location
    },

    get transitioning() {
      return transitioning
    },

    onTransitionComplete() {
      transitioning = false
      resolveTransition()
    },

    listen(listener: HistoryListener) {
      listeners.push(listener)

      const popstateListener = () => {
        location = getLocation(source)
        listener({ location, action: 'POP' })
      }

      source.addEventListener('popstate', popstateListener)

      return () => {
        source.removeEventListener('popstate', popstateListener)
        listeners = listeners.filter(fn => fn !== listener)
      }
    },

    navigate(to: string, { state = {}, replace = false } = {}) {
      state = { ...state, key: Date.now().toString() }

      // try...catch iOS Safari limits to 100 pushState calls
      try {
        if (transitioning || replace) {
          // @ts-ignore not updating the title of the page
          source.history.replaceState(state, null, to)
        } else {
          // @ts-ignore not updating the title of the page
          source.history.pushState(state, null, to)
        }
      } catch (e) {
        source.location[replace ? 'replace' : 'assign'](to)
      }

      location = getLocation(source)
      transitioning = true
      const transition = new Promise(res => (resolveTransition = res))
      listeners.forEach(listener => listener({ location, action: 'PUSH' }))
      return transition
    }
  }
}

/**
 * @description Stores history entries in memory for testing or other platforms like Native
 */
const createMemorySource = (initialPathname = '/'): HistorySource => {
  const stack = [{ pathname: initialPathname, search: '' }]
  const states: any[] = []
  let index = 0

  return {
    // @ts-ignore memory location is not fully spec compliant ¯\_(ツ)_/¯
    get location() {
      return stack[index]
    },
    addEventListener(name: string, fn: EventHandler) {},
    removeEventListener(name: string, fn: EventHandler) {},
    history: {
      get entries() {
        return stack
      },
      get index() {
        return index
      },
      get state() {
        return states[index]
      },
      pushState(state: any, _: never, uri: string) {
        const [pathname, search = ''] = uri.split('?')
        index++
        stack.push({ pathname, search })
        states.push(state)
      },
      replaceState(state: any, _: never, uri: string) {
        const [pathname, search = ''] = uri.split('?')
        stack[index] = { pathname, search }
        states[index] = state
      }
    }
  }
}

/**
 * @description To retrieve a history source. Uses `window.history`
 * if available, but falls back to using a memory history that
 * mirrors the same API
 */
const getSource = () => (canUseDOM ? window : createMemorySource())

const globalHistory = createHistory(getSource())
const { navigate } = globalHistory

export { globalHistory, navigate, createHistory, createMemorySource }
