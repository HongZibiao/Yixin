import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import './Layout.css'

const Layout: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="header-link">
          <h1>学生考勤系统</h1>
        </Link>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout