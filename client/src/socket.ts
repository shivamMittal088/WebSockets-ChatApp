import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL);
  }
  return socket;
}
