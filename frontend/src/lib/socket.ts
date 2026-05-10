import { io, Socket } from 'socket.io-client';

// Keep a single socket instance
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      path: '/socket.io', // default
      autoConnect: false, // connect manually when auth is ready
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.debug('[Socket] Connected to server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.debug('[Socket] Disconnected from server:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }
  return socket;
};

export const connectSocket = (token: string) => {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
