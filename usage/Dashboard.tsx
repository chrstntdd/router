import * as React from 'react'

import { Link } from '../dist/index'

import { MainNav } from './MainNav'
import { Page } from './Page'

function Dashboard() {
  return (
    <div className="page-container">
      <MainNav />
      <Page
        criticalRequests={{
          /* Batch of absolute essentials to have the app be in a usable state */
          a: async () => {
            return new Promise(res => {
              setTimeout(() => {
                res('a')
              }, 100)
            })
          },
          b: async () => {
            return new Promise(res => {
              setTimeout(() => {
                res('b')
              }, 1500)
            })
          }
        }}
      >
        <h1>Dashboard</h1>
        <Link to="/dashboard">Current link</Link>
        <Link to="/">Back Home</Link>
      </Page>
    </div>
  )
}

export default Dashboard
