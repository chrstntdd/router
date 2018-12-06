import React from 'react'

import { Link } from '../dist'

function Home() {
  return (
    <React.Fragment>
      <div className="home">Home</div>
      <Link to="/dashboard">to the Dashboard</Link>
      <Link to="/nonsense">to Unknown</Link>
    </React.Fragment>
  )
}

export default Home
