import React from 'react'

import { Link } from '../dist'

function Dashboard() {
  return (
    <React.Fragment>
      <div className="dashboard">Dashboard</div>
      <Link to="/">Back Home</Link>
    </React.Fragment>
  )
}

export default Dashboard
