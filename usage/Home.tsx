import * as React from 'react'

import { Link } from '../dist'

function Home() {
  return (
    <div className="page-container">
      <h1>Home</h1>
      <Link to="/">Current link</Link>
      <Link to="/dashboard">to the Dashboard</Link>
      <Link to="/nonsense">to Unknown</Link>
    </div>
  )
}

export default Home
