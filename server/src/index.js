import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'node:url';
import articlesRouter from './routes/articles.js';
import exportRouter from './routes/exportRoutes.js';
import issueRoutes from './routes/issueRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'web2mag-article-ingester',
    timestamp: new Date().toISOString(),
  });
});

// Article endpoints (import, sample, export-pdf)
app.use('/api/articles', articlesRouter);

// Magazine Issue database endpoints
app.use('/api/issues', issueRoutes);

// Magazine PDF export endpoints
app.use('/api/export', exportRouter);

// Direct alias for /api/pdf/export
app.post('/api/pdf/export', (req, res, next) => {
  req.url = '/export-pdf';
  articlesRouter(req, res, next);
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[Web2Mag Server Error]:', err);
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      error: 'Export payload exceeds maximum allowable limit of 50MB. Reduce image sizes or split issues.',
    });
  }
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error processing request.';
  res.status(statusCode).json({ error: message });
});

// Start listening only if executed directly (e.g. node src/index.js), not when imported by tests
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  app.listen(PORT, () => {
    console.log(`[Web2Mag Server] Ingestion service running at http://localhost:${PORT}`);
  });
}

export default app;
