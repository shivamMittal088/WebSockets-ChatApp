import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ChatLayout from './Components/ChatLayout'
import NoChat from './Components/NoChat'
import Chat from './Components/Chat'
import LoginPage from './Components/LoginPage'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatLayout />}>
          <Route index element={<NoChat />} />
          <Route path=":userId" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App