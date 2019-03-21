import React from 'react'

const NOT_ASKED = 'NOT_ASKED'
const LOADING = 'LOADING'
const SUCCESS = 'SUCCESS'
const ERROR = 'ERROR'

const fold = (type, data = null) => o => o[type](data)

const Data = {
  notAsked: () => ({ type: NOT_ASKED, transformation: fold(NOT_ASKED) }),
  loading: () => ({ type: LOADING, transformation: fold(LOADING) }),
  error: error => ({ type: ERROR, error, transformation: fold(ERROR, error) }),
  success: data => ({ type: SUCCESS, data, transformation: fold(SUCCESS, data) })
}

interface PRemoteDataFetcher {
  handleTask: {
    notAsked: () => JSX.Element
    loading: () => JSX.Element
    error: (error: any) => JSX.Element
    success: (data: any) => JSX.Element
  }
}

type RemoteData<S, E> = NotAsked | Loading | Success<S> | Error<E>

interface NotAsked {}
interface Loading {}
interface Success<S> {}
interface Error<E> {}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case '@@page/start':
      return {
        ...state,
        loading: true
      }
    case '@@page/critical-data-success':
      return {
        ...state,
        data: action.payload,
        loading: false
      }
    default:
      return state
  }
}

const initialState = {
  criticalRequests: {},
  deferredRequests: {}
}

const PageContext = React.createContext(initialState)

const usePage = () => {
  const ctx = React.useContext(PageContext)

  return ctx
}

const resolveCriticalData = async criticalRequests => {
  for (let req in criticalRequests) {
    console.log(await criticalRequests[req]())
  }
}

const Page: React.FC<any> = ({ children, initialState, criticalRequests }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  React.useEffect(() => {
    dispatch({ type: '@@page/start' })

    const loadData = async () => {
      try {
        const response = await fetch('https://api.randomuser.me/')
        if (response.ok) {
          const body = await response.json()
          dispatch({ type: '@@page/critical-data-success', payload: body })
        } else {
          dispatch({ type: '@@page/critical-data-error', payload: { response } })
        }
      } catch (error) {
        dispatch({ type: '@@page/critical-data-error', payload: error })
      }
    }

    loadData()

    // resolveCriticalData(criticalRequests)
    //   .then(() => {
    //     dispatch({ type: '@@page/critical-data-success' })
    //   })
    //   .catch(() => {
    //     dispatch({ type: '@@page/critical-data-error' })
    //   })
  }, [])

  return <PageContext.Provider value={state}>{children}</PageContext.Provider>
}

export { Page, usePage }
