# 💬 ChatApp — Real-Time Chat Application

A full-stack real-time chat application built with **React**, **Node.js**, **Socket.IO**, and **MongoDB**. This project was built to deeply understand **WebSockets**, real-time communication patterns, and full-stack architecture.

---

## ✨ Features

- 🔐 **Authentication** — Signup & login with JWT-based auth
- 💬 **Real-time messaging** — Instant message delivery via Socket.IO
- ⌨️ **Typing indicator** — Shows when the other user is typing (with debouncing)
- 🟢 **Online/offline status** — Track user presence in real time
- 💾 **Message persistence** — Chat history stored in MongoDB
- 🔒 **Room-based communication** — Private rooms using SHA-256 hashed IDs
- 👥 **User search** — Find users by name or email to start a chat

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React, TypeScript, Socket.IO Client |
| Backend    | Node.js, Express, TypeScript        |
| Realtime   | Socket.IO                           |
| Database   | MongoDB, Mongoose                   |
| Auth       | JWT, bcrypt                         |

---

## 📁 Folder Structure

```
chatApp/
├── package.json            # Root scripts (dev server + client)
├── nodemon.json            # Nodemon config for ts-node
├── tsconfig.json           # Root TypeScript config
│
├── server/                 # Backend (Node.js + Express)
│   ├── index.ts            # Entry point — sets up Express & Socket server
│   ├── socket.ts           # All Socket.IO event handlers
│   ├── config/
│   │   └── db.ts           # MongoDB connection
│   ├── middleware/
│   │   └── auth.ts         # JWT auth middleware
│   ├── models/
│   │   ├── User.ts         # User schema
│   │   ├── Chat.ts         # Chat (conversation) schema
│   │   └── Message.ts      # Message schema
│   └── routes/
│       ├── auth.ts         # /auth/signup, /auth/login
│       └── chat.ts         # Chat & message REST endpoints
│
└── client/                 # Frontend (React + TypeScript)
    ├── package.json
    ├── tsconfig.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.tsx             # Root component with routing
        ├── index.tsx           # React entry point
        ├── socket.ts           # Socket.IO client singleton
        ├── Components/
        │   ├── LoginPage.tsx   # Signup / Login form
        │   ├── ChatLayout.tsx  # Layout: Sidebar + Chat window
        │   ├── Sidebar.tsx     # User list / chat list
        │   ├── Chat.tsx        # Active chat window
        │   └── NoChat.tsx      # Empty state when no chat selected
        └── styles/             # CSS files per component
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/chatApp.git
cd chatApp
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure environment variables

Create a `.env` file in the root (`chatApp/`) directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_super_secret_key
BASE_URL=http://localhost:3000
```

### 5. Run the application

**Backend** (from root):
```bash
npm run dev
```

**Frontend** (from `client/`):
```bash
cd client
npm start
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:5000`.

---

## 🔌 API Endpoints

All protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint         | Description              | Auth |
|--------|------------------|--------------------------|------|
| `POST` | `/auth/signup`   | Register a new user      | No   |
| `POST` | `/auth/login`    | Login and receive JWT    | No   |

### Chat

| Method | Endpoint                          | Description                                | Auth |
|--------|-----------------------------------|--------------------------------------------|------|
| `GET`  | `/chat/users?search=`             | Search users by name or email              | Yes  |
| `GET`  | `/chat`                           | Get all conversations for logged-in user   | Yes  |
| `POST` | `/chat`                           | Create or get an existing 1-on-1 chat      | Yes  |
| `GET`  | `/chat/messages/:targetUserId`    | Fetch message history with a specific user | Yes  |

---

## ⚡ WebSocket Events

### Client → Server

| Event         | Payload                              | Description                                |
|---------------|--------------------------------------|--------------------------------------------|
| `joinRoom`    | `{ fromUserId, toUserId }`           | Join the private room for a conversation   |
| `leaveRoom`   | `{ fromUserId, toUserId }`           | Leave the current chat room                |
| `sendMessage` | `{ message, firstName, userId, targetUserId }` | Send a message in the active room |
| `typing`      | `{ fromUserId, toUserId }`           | Notify the other user that you are typing  |
| `stopTyping`  | `{ fromUserId, toUserId }`           | Notify the other user you stopped typing   |

### Server → Client

| Event               | Payload                                      | Description                              |
|---------------------|----------------------------------------------|------------------------------------------|
| `receiveMessage`    | `{ _id, text, sender, senderId, room, time }`| Deliver a new message to room members    |
| `userTyping`        | `{ userId }`                                 | Tell recipient the other user is typing  |
| `userStoppedTyping` | `{ userId }`                                 | Tell recipient they stopped typing       |
| `errorMessage`      | `{ error }`                                  | Emitted to sender if message save fails  |

---

## 🧭 Frontend Routing

| Route           | Component       | Description                                  |
|-----------------|-----------------|----------------------------------------------|
| `/login`        | `LoginPage`     | Signup / login page                          |
| `/`             | `ChatLayout`    | Main layout — sidebar + empty chat state     |
| `/chat/:userId` | `ChatLayout` + `Chat` | Active 1-on-1 conversation with a user |

The app uses a layout-based routing pattern — `ChatLayout` always renders the `Sidebar`. The right panel renders either `Chat` (when a user is selected) or `NoChat` (empty state).

---

## 🔄 System Design & Flow

### Message Flow

```
User A types a message and hits send
        │
        ▼
Client emits: sendMessage { message, userId, targetUserId }
        │
        ▼
Server receives sendMessage
  ├─ Computes roomId = SHA-256(sorted userIds)
  ├─ Saves message to MongoDB
  └─ Emits receiveMessage to everyone in the room
        │
        ▼
Both User A and User B receive the message in real time
```

### Typing Indicator Flow

```
User A starts typing in the input field
        │
        ▼
Client emits: typing { fromUserId, toUserId }
        │
        ▼
Server computes roomId and re-emits: userTyping to room (excluding sender)
        │
        ▼
User B's client sets isTyping = true → indicator appears

After 1500ms of inactivity:
Client emits: stopTyping { fromUserId, toUserId }
        │
        ▼
Server re-emits: userStoppedTyping → isTyping = false
```

### Room Joining Logic

```
User navigates to /chat/:userId (opens a conversation)
        │
        ▼
Client emits: joinRoom { fromUserId, toUserId }
        │
        ▼
Server:
  ├─ Leaves all existing rooms (except own socket room)
  ├─ Computes roomId = SHA-256([userId, targetUserId].sort().join('_'))
  └─ Joins that room via socket.join(roomId)

All subsequent events (messages, typing) are scoped to this room
```

---

## 🗺️ Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                        CLIENT (React)                    │
│                                                          │
│  ┌──────────┐    REST API     ┌───────────────────────┐  │
│  │ LoginPage│ ─────────────▶ │  Express REST Routes  │  │
│  └──────────┘                └───────────────────────┘  │
│                                         │                │
│  ┌──────────┐   Socket.IO    ┌─────────▼─────────────┐  │
│  │ Chat.tsx │ ◀────────────▶ │   Socket.IO Server    │  │
│  │          │  sendMessage   │                       │  │
│  │          │  typing        │  roomHash(a,b)        │  │
│  │          │  joinRoom      │  SHA-256 room IDs     │  │
│  └──────────┘                └─────────┬─────────────┘  │
│                                        │                 │
│  ┌──────────┐                ┌─────────▼─────────────┐  │
│  │ Sidebar  │ ─── REST ────▶ │       MongoDB         │  │
│  └──────────┘                │  Users, Chats,        │  │
│                              │  Messages             │  │
└──────────────────────────────└───────────────────────┘──┘

Socket Room Model:
┌─────────┐           ┌───────────────────────┐           ┌─────────┐
│ User A  │──joinRoom─▶   Room: SHA-256(A+B)  ◀──joinRoom─│ User B  │
│         │◀─receive──│                       │───receive─▶│         │
│         │──typing──▶│  All events scoped    │◀──typing───│         │
└─────────┘           │  to this room only    │           └─────────┘
                      └───────────────────────┘
```

---

## 📸 Screenshots

> _Screenshots coming soon_

| Login Page | Chat Window |
|------------|-------------|
| ![Login](./screenshots/login.png) | ![Chat](./screenshots/chat.png) |

---

## 🚀 Future Improvements

- [ ] ✓✓ **Read receipts** — Show when messages are delivered and read
- [ ] 👥 **Group chat** — Support for multi-user conversations
- [ ] 🖼️ **Media sharing** — Send images, files, and voice messages
- [ ] 🔴 **Online presence** — Real-time online/offline indicators per user
- [ ] ⚡ **Redis adapter** — Scale Socket.IO across multiple server instances
- [ ] 🔔 **Push notifications** — Notify users of new messages when inactive
- [ ] 🔒 **End-to-end encryption** — Secure message content client-side

---

## 📝 Conclusion

This project was built with a single goal: to **deeply understand how WebSockets and real-time systems work** under the hood. By building everything from scratch — authentication, room management, message persistence, and live typing indicators — the architecture of Socket.IO-based applications became very clear.

The SHA-256 room hashing strategy ensures deterministic, collision-resistant private rooms without storing room mappings in the database. The debounced typing indicator demonstrates how to balance real-time UX with network efficiency.

---

> Built with ❤️ to learn real-time full-stack development.
