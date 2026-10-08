import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import catalogRouter from './routes/catalog.js';
import goalRouter from './routes/goal.js';
import { requireAuth } from './middleware/auth.js';

export function createApp() {
  const app = express();

  // Exact CORS allowlist
  const allowedOrigins = config.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // JSON body parser with 32KB limit
  app.use(express.json({ limit: '32kb' }));

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/goal', requireAuth, goalRouter);

  // 404 Route Not Found
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found.`
      }
    });
  });

  // Central JSON error handler
  app.use((err, req, res, next) => {
    // Check CORS error
    if (err.message && err.message.includes('CORS')) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: err.message
        }
      });
    }

    // Check BodyParser malformed JSON error
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: {
          code: 'MALFORMED_JSON',
          message: 'Malformed JSON payload in request body.'
        }
      });
    }

    const status = (typeof err.status === 'number' && err.status >= 400 && err.status < 600)
      ? err.status
      : 500;

    const errorPayload = {
      code: err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR'),
      message: status === 500 ? 'An unexpected error occurred. Please try again.'
        : err.code === 'DATABASE_ERROR' ? 'The database is temporarily unavailable. Please try again.'
        : err.message || 'An unexpected error occurred.'
    };

    if (err.fields) {
      errorPayload.fields = err.fields;
    }

    res.status(status).json({ error: errorPayload });
  });

  return app;
}
