/**
 * PDF Export Client Service for Web2Mag
 * Sends the current issue page sequence and configuration to the Node.js/Puppeteer backend,
 * receives the binary vector PDF, and triggers a browser file download.
 */

const API_ENDPOINTS = ['/api/export/pdf', 'http://localhost:5001/api/export/pdf'];

/**
 * Exports the complete magazine issue as a vector A4 PDF and downloads it to the user's computer.
 *
 * @param {Array<object>} pages - The current sequential magazine pages
 * @param {object} issueConfig - Dynamic issue metadata
 * @returns {Promise<{ success: boolean, filename: string, sizeBytes: number }>}
 */
export async function exportIssueToPdf(pages = [], issueConfig = {}) {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('Cannot export PDF: No magazine pages to export.');
  }

  const payload = {
    pages,
    issueConfig,
  };

  let lastError = null;

  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = `Server error ${response.status} generating PDF.`;
        try {
          const errData = await response.json();
          if (errData?.error) errorMsg = errData.error;
        } catch {
          // Response was not JSON
        }
        throw new Error(errorMsg);
      }

      // Extract filename from Content-Disposition header if available
      const disposition = response.headers.get('content-disposition');
      let filename = 'magazine-issue.pdf';
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();

      // Trigger automatic browser download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 2000);

      return {
        success: true,
        filename,
        sizeBytes: blob.size,
      };
    } catch (err) {
      lastError = err;
      // Try fallback endpoint if relative path failed
    }
  }

  throw lastError || new Error('Failed to connect to the PDF export backend.');
}

export default exportIssueToPdf;
