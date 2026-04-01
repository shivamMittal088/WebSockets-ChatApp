import React from 'react'

const NoChat: React.FC = () => {
  return (
    <div className="no-chat">
      <div className="no-chat-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <h2 className="no-chat-title">Your Messages</h2>
      <p className="no-chat-subtitle">Select a conversation from the sidebar to start chatting</p>
    </div>
  )
}

export default NoChat
