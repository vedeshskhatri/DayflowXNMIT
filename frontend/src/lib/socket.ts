import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

/**
 * Socket.IO client for Dayflow HRMS.
 * 
 * CRITICAL ARCHITECTURAL RULES:
 * 1. `withCredentials: true` is required so the handshake includes the httpOnly cookie.
 * 2. NEVER pass `auth: { token }` — JWT is in the httpOnly cookie and parsed by the server.
 * 3. `disconnectSocket()` MUST be called before POST /auth/logout.
 */

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.IO connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket.IO connect error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });
  }
  return socket;
};

export const connectSocket = (): Socket => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = (): void => {
  if (socket) {
    if (socket.connected) {
      socket.disconnect();
    }
    socket = null;
  }
};
