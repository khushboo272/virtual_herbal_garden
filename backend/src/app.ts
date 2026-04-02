import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from './config/passport';
import { env } from './config/env';
import { sanitizeInput } from './middleware/sanitize';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { logger } from './utils/logger';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Type'],
}));

// Body parsing
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(compression());

// Input sanitization (NoSQL injection prevention)
app.use(sanitizeInput);

// Rate limiting
app.use(globalLimiter);

// Passport
app.use(passport.initialize());

// Request logging
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

// API routes
app.use(`/api/${env.API_VERSION}`, routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger docs (lazy loaded)
app.use('/api/docs', async (_req, res, next) => {
  try {
    const swaggerUi = await import('swagger-ui-express');
    const { swaggerSpec } = await import('./swagger');
    swaggerUi.serve[0](_req, res, () => {
      swaggerUi.setup(swaggerSpec)(_req, res, next);
    });
  } catch {
    next();
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// Global error handler
app.use(errorHandler);

export default app;
