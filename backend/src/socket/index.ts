import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

let io: SocketServer;

export function initializeSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user?.sub;
    if (userId) {
      socket.join(`user:${userId}`);
      const role = socket.data.user?.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        socket.join('admin');
      }
    }
    logger.debug(`Socket connected: ${socket.id} (user: ${userId})`);

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });

    socket.on('join:plant', (plantId: string) => {
      socket.join(`plant:${plantId}`);
    });

    socket.on('leave:plant', (plantId: string) => {
      socket.leave(`plant:${plantId}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
