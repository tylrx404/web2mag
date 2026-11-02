import { Router } from 'express';
import { extractArticle } from '../services/extractor.js';

const router = Router();

/**
 * POST /api/articles/import
 * Ingests an article from a public WordPress or standard webpage URL.
 */
router.post('/import', async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      error: 'Please provide a valid article URL in the request body ({ "url": "https://..." }).',
    });
  }

  try {
    const article = await extractArticle(url.trim());
    return res.status(200).json(article);
  } catch (err) {
    const message = err.message || 'Unable to import article content.';
    
    // Determine appropriate HTTP error code
    let statusCode = 422; // Unprocessable Entity (extraction failure)
    if (
      message.includes('Security validation') ||
      message.includes('forbidden') ||
      message.includes('Malformed') ||
      message.includes('Unsupported protocol') ||
      message.includes('whitespace')
    ) {
      statusCode = 400; // Bad Request (invalid or insecure URL)
    } else if (message.includes('timeout') || message.includes('timed out')) {
      statusCode = 504; // Gateway Timeout
    } else if (message.includes('status 404')) {
      statusCode = 404; // Not Found
    }

    return res.status(statusCode).json({
      error: message,
    });
  }
});

export default router;
