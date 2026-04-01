import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import '../styles/HomePage.css'

const ChatLayout: React.FC = () => {
  return (
    <div className="home-container">
      <Sidebar />
      <Outlet />
    </div>
  )
}

export default ChatLayout
