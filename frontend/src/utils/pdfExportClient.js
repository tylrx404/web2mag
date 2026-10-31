/**
 * Client-side helper for triggering high-resolution multi-page PDF exports.
 * Extracts rendered A4 magazine sheets, calls the backend Puppeteer export API,
 * and handles the browser file download.
 *
 * @param {{
 *   containerEl?: HTMLElement | null,
 *   article: any,
 *   columnMode?: string,
 *   onProgress?: (status: string) => void
 * }} options
 * @returns {Promise<{ success: boolean, durationMs?: number, filename?: string, error?: string }>}
 */
export async function exportMagazineToPdf({
  containerEl,
  article,
  columnMode = 'two-column',
  onProgress,
}) {
  const startTime = Date.now();

  try {
    onProgress?.('Preparing publication sheets...');

    let html = '';

    // If an on-screen container is available, clone the exact rendered sheets
    if (containerEl) {
      const sheets = containerEl.querySelectorAll('.magazine-sheet');
      if (sheets && sheets.length > 0) {
        html = Array.from(sheets)
          .map((sheet) => {
            const clone = sheet.cloneNode(true);

            // Strip interactive editor attributes and selection outlines
            clone.querySelectorAll('[contenteditable]').forEach((el) => {
              el.removeAttribute('contenteditable');
              el.removeAttribute('tabindex');
              el.removeAttribute('suppresscontenteditablewarning');
              el.classList.remove(
                'magazine-editable-text',
                'magazine-editable-text--active',
                'magazine-editable-figure--active',
                'magazine-editable-box--active'
              );
            });

            return clone.outerHTML;
          })
          .join('\n');
      }
    }

    onProgress?.('Generating high-resolution vector PDF...');

    const response = await fetch('/api/articles/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: article?.title || 'Web2Mag-Magazine',
        html: html || undefined,
        article: article || undefined,
        columnMode,
      }),
    });

    if (!response.ok) {
      let errorMsg = `Server export failed (HTTP ${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson?.error) {
          errorMsg = errJson.error;
        }
      } catch {
        // Response wasn't JSON
      }
      throw new Error(errorMsg);
    }

    onProgress?.('Finalizing and downloading PDF file...');

    // Extract filename from Content-Disposition header if available
    let filename = '';
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    if (!filename) {
      const safeTitle = (article?.title || 'magazine-article')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      filename = `${safeTitle || 'magazine-article'}.pdf`;
    }

    const durationHeader = response.headers.get('x-export-duration-ms');
    const serverDurationMs = durationHeader
      ? parseInt(durationHeader, 10)
      : Date.now() - startTime;

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(downloadLink);
    }, 1500);

    return {
      success: true,
      durationMs: serverDurationMs,
      filename,
    };
  } catch (error) {
    console.error('[PDF Export Error]:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during PDF export.',
    };
  }
}
