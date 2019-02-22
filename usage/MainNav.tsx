import * as React from 'react'

import { Link } from '../dist/index'

function MainNav() {
  return (
    <nav>
      <Link to="/">homepage</Link>
      <Link to="/dashboard">dashboard</Link>
      <Link to="/nonsense">unknown</Link>
      <Link to="/secret">Members only</Link>
    </nav>
  )
}

export { MainNav }
