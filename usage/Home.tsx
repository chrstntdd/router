import React from 'react'

import { Link } from '../dist'

function Home() {
  return (
    <React.Fragment>
      <div className="home">Home</div>
      <Link to="/dashboard">Dashboard</Link>
    </React.Fragment>
  )
}

export default Home
