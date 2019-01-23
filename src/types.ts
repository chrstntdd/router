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

export type RouteComponentProps<ComponentProps = {}> = Partial<ComponentProps> & {
  path?: string
  default?: boolean
  location?: HistoryLocation
  navigate?: NavigateFn
  uri?: string
}
