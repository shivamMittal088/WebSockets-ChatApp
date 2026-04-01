import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { getSocket } from "../socket";

interface Message {
  _id: string;
  text: string;
  sender: string;
  senderId: string;
  room: string;
  time: string;
}

const Chat: React.FC = () => {
  const { state } = useLocation();
  const { userId: targetUserId } = useParams<{ userId: string }>();
  const name: string = state?.name || "Unknown";
  const initial = name.charAt(0).toUpperCase();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId: string = currentUser._id || "";
  const firstName: string = currentUser.firstName || "";

  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId || !targetUserId) return;
    setMessages([]);
    const token = localStorage.getItem("token");

    axios
      .get(`/chat/messages/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        const previous: Message[] = data.map((msg: any) => ({
          _id: msg._id,
          text: msg.text,
          sender: msg.senderId?.firstName || "",
          senderId: msg.senderId?._id || "",
          room: msg.room,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(previous);
      })
      .catch((err) => console.error("Failed to fetch messages", err));
  }, [userId, targetUserId]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("receiveMessage", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("userTyping", () => {
      setIsTyping(true);
    });

    socket.on("userStoppedTyping", () => {
      setIsTyping(false);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    // Implement message sending logic here (e.g., emit to socket, update local state)
    console.log("Sending message:", newMessage);

    const socket = getSocket();

    socket.emit("sendMessage", {
      message: newMessage,
      firstName,
      userId,
      targetUserId,
    });

    // clear input after sending .
    setNewMessage("");
  };

  return (
    <div className="chat-area">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-avatar">{initial}</div>
        <div className="chat-header-info">
          <span className="chat-header-name">{name}</span>
        </div>
        <div className="chat-header-actions">
          <button>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`message ${msg.senderId === userId ? "message-sent" : "message-received"}`}
          >
            <div className="message-bubble">
              <p>{msg.text}</p>
              <div className="message-meta">
                <span className="message-time">{msg.time}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="input-box">
        <button className="input-action">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
        <button className="input-action">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <div className="input-field-wrapper">
          {isTyping && (
            <div className="typing-indicator">
              <span>{name} is typing</span>
              <span className="typing-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
          <input
            type="text"
            placeholder={isTyping ? `...` : "Type a message"}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              const socket = getSocket();
              socket.emit("typing", {
                fromUserId: userId,
                toUserId: targetUserId,
              });
              if (typingTimeoutRef.current)
                clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stopTyping", {
                  fromUserId: userId,
                  toUserId: targetUserId,
                });
              }, 1500);
            }}
          />
        </div>
        <button className="send-btn" onClick={sendMessage}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chat;
