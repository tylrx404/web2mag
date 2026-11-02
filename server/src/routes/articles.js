import { Router } from 'express';
import { extractArticle } from '../services/extractor.js';
import { cleanHtmlAndExtractSections } from '../services/htmlParserService.js';
import { exportMagazinePdf } from '../controllers/pdfController.js';
import { getSampleArticles } from '../controllers/articleController.js';

const router = Router();

/**
 * GET /api/articles/sample
 * Returns curated sample articles for library initialization.
 */
router.get('/sample', getSampleArticles);

/**
 * POST /api/articles/export-pdf
 * Exports magazine sheets or structured article data to high-resolution A4 PDF.
 */
router.post('/export-pdf', exportMagazinePdf);

/**
 * POST /api/articles/import
 * Ingests an article from a public WordPress or standard webpage URL.
 */
router.post('/import', async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid article URL in the request body ({ "url": "https://..." }).',
    });
  }

  try {
    const article = await extractArticle(url.trim());

    // Enrich with sections for multi-column layout engine if needed
    if (!article.sections || article.sections.length === 0) {
      const parsed = cleanHtmlAndExtractSections(article.contentHtml, article.sourceUrl);
      article.sections = parsed.sections;
      if (!article.thumbnail && parsed.firstImageUrl) {
        article.thumbnail = parsed.firstImageUrl;
      }
    }

    const sourceType = article.isWordPress ? 'wordpress-rest-api' : 'semantic-html';
    article.sourceType = sourceType;

    return res.status(200).json({
      success: true,
      ingestionMethod: article.isWordPress ? 'WordPress REST API' : 'General Article Semantic Extractor',
      article,
      ...article,
    });
  } catch (err) {
    const message = err.message || 'Unable to import article content.';

    // Determine appropriate HTTP error code
    let statusCode = 422; // Unprocessable Entity (extraction failure)
    if (
      message.includes('Security validation') ||
      message.includes('forbidden') ||
      message.includes('Malformed') ||
      message.includes('Unsupported protocol') ||
      message.includes('whitespace') ||
      message.includes('required and must be a valid string') ||
      message.includes('cannot contain whitespace') ||
      message.includes('private or loopback IP') ||
      message.includes('prohibited internal network')
    ) {
      statusCode = 400; // Bad Request (invalid or insecure URL)
    } else if (message.includes('timeout') || message.includes('timed out')) {
      statusCode = 504; // Gateway Timeout
    } else if (message.includes('status 404')) {
      statusCode = 404; // Not Found
    }

    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

export default router;
