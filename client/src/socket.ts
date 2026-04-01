import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function connectSocket(userId: string): void {
  if (!socket) {
    socket = io(SOCKET_URL);
  }
  socket.emit('register', userId);
}

export function getSocket(): Socket {
  if (!socket) throw new Error('Socket not connected. Call connectSocket() after login.');
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
