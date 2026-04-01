import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getSocket, disconnectSocket } from "../socket";

interface UserInfo {
  _id: string;
  firstName: string;
  lastName: string;
  statusMessage?: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Online/offline status
  useEffect(() => {
    const socket = getSocket();
    socket.on("onlineUsers", (ids: string[]) => setOnlineUserIds(new Set(ids)));
    return () => { socket.off("onlineUsers"); };
  }, []);

  // Fetch users
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("/chat/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setUsers(data))
      .catch((err) => console.error("Failed to fetch users", err));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-avatar">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="sidebar-title">Chats</h2>

        {/* Three-dot menu */}
        <div className="sidebar-menu-wrap" ref={menuRef}>
          <button
            className="sidebar-action"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="sidebar-dropdown">
              <button
                className="sidebar-dropdown-item sidebar-dropdown-danger"
                onClick={() => {
                  setMenuOpen(false);
                  setShowModal(true);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-search">
        <input type="text" placeholder="Search users to start a chat" />
      </div>

      <div className="chat-list">
        {users.map((user) => (
          <div
            key={user._id}
            className="chat-item"
            onClick={() => {
              const fromUserId = JSON.parse(localStorage.getItem("user") || "{}")._id;
              getSocket().emit('joinRoom', { fromUserId, toUserId: user._id });
              navigate(`/chat/${user._id}`, {
                state: { name: `${user.firstName} ${user.lastName}` },
              });
            }}
          >
            <div className="chat-item-avatar" style={{ position: 'relative' }}>
              {user.firstName.charAt(0)}
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 10, height: 10, borderRadius: '50%',
                background: onlineUserIds.has(user._id) ? '#22c55e' : '#9ca3af',
                border: '2px solid white',
              }} />
            </div>
            <div className="chat-item-info">
              <div className="chat-item-top">
                <span className="chat-item-name">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <div className="chat-item-bottom">
                <span className="chat-item-msg">
                  {user.statusMessage || "Start a conversation"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Logout Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Confirm Logout</h3>
            <p className="modal-message">Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="modal-btn modal-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
