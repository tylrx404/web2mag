import express from 'express';
import { renderIssueToPdf } from '../services/pdfRenderer.js';

const router = express.Router();

/**
 * POST /api/export/pdf
 * Generates and downloads a complete, print-ready vector A4 magazine PDF.
 *
 * Request Body:
 * {
 *   pages: Array<object>,
 *   issueConfig: object
 * }
 */
router.post('/pdf', async (req, res, next) => {
  try {
    const { pages, issueConfig } = req.body || {};

    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({
        error: 'Invalid export request: "pages" array is required and must contain at least one page.',
      });
    }

    const safeConfig = issueConfig || {
      magazineTitle: 'Web2Mag Publication',
      volume: 'Volume 1',
      issue: 'Issue 1',
      date: '2026',
    };

    const pdfBuffer = await renderIssueToPdf(pages, safeConfig);

    const titleSlug = (safeConfig.magazineTitle || 'magazine')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const editionSlug = `${safeConfig.volume || ''}-${safeConfig.issue || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const filename = `${titleSlug}${editionSlug ? `-${editionSlug}` : ''}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

export default router;
