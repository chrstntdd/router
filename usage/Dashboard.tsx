import * as React from 'react'

import { Link } from '../dist'

function Dashboard() {
  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <Link to="/dashboard">Current link</Link>
      <Link to="/">Back Home</Link>
    </div>
  )
}

export default Dashboard
