import {
  generatePdfFromHtml,
  renderArticleToHtml,
  wrapMagazineInPrintDocument,
} from '../services/pdfExportService.js';

/**
 * Controller to handle PDF export requests from Web2Mag.
 * Accepts either:
 *  - `html`: Pre-rendered multi-page A4 magazine sheets from the visual editor.
 *  - `article`: Structured article object (for headless API export).
 */
export async function exportMagazinePdf(req, res) {
  const startTime = Date.now();

  try {
    const { html, article, title, columnMode = 'two-column' } = req.body || {};

    if (!html && !article) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid export request: Please provide either rendered "html" or structured "article" data.',
      });
    }

    const documentTitle =
      title || article?.title || 'Web2Mag-Magazine-Article';

    let fullHtml = '';
    if (html && typeof html === 'string' && html.trim().length > 0) {
      // Client provided the live WYSIWYG editor sheets
      fullHtml = wrapMagazineInPrintDocument(html, documentTitle);
    } else if (article) {
      // Headless export fallback
      fullHtml = renderArticleToHtml(article, { columnMode });
    }

    console.log(
      `[PDF Controller] Initiating PDF generation for "${documentTitle}"...`
    );

    const { pdfBuffer, durationMs } = await generatePdfFromHtml(fullHtml, {
      title: documentTitle,
    });

    const safeFilename = documentTitle
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'magazine-article';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Export-Duration-Ms', durationMs.toString());
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Disposition, X-Export-Duration-Ms'
    );

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(
      `[PDF Controller] Export failed after ${elapsed}ms:`,
      error
    );

    return res.status(500).json({
      success: false,
      error: `Failed to generate PDF: ${error.message || 'Unknown export error'}`,
    });
  }
}
