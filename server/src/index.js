import cors from 'cors';
import express from 'express';
import articleRoutes from './routes/articleRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'web2mag-server',
    timestamp: new Date().toISOString(),
  });
});

// Article Routes
app.use('/api/articles', articleRoutes);

// PDF Export direct alias route
app.post('/api/pdf/export', (req, res, next) => {
  req.url = '/export-pdf';
  articleRoutes(req, res, next);
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.url}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Web2Mag Server] Running on http://localhost:${PORT}`);
});

export default app;
