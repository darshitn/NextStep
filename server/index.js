import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Resolve directory relative to this server file, independent of terminal CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client/dist');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for debugging development and production traffic
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'niat-backend'
  });
});

// 2. Strict 404 handler for unknown API routes (must precede static assets and SPA fallback)
app.use('/api', (req, res) => {
  res.status(404).json({
    ok: false,
    error: 'API route not found'
  });
});

// 3. Serve compiled frontend static assets from client/dist
app.use(express.static(clientDistPath));

// 4. Frontend SPA fallback routing: serve index.html for all non-API GET requests
app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      ok: false,
      error: 'Frontend build not found in client/dist. Run "npm run build" to build the client.'
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    ok: false,
    error: 'Internal server error'
  });
});

// Listen on process.env.PORT with local fallback 3001, binding to 0.0.0.0 for Replit compatibility
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Health check available at http://${HOST}:${PORT}/api/health`);
  console.log(`Serving client dist from ${clientDistPath}`);
});
