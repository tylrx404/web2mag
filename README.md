# Web2Mag — High-Quality Multi-Page Magazine PDF Export & Editorial Workspace

**Web2Mag** is a modern Web-to-PDF Magazine Layout and Visual Editorial Workspace.

This release completes **Phase 4: PDF Export and Quality Assurance**, uniting Phase 1 article ingestion, Phase 2 automatic A4 pagination, Phase 3 interactive visual editor, and high-fidelity multi-page PDF generation via Puppeteer and Headless Chrome.

---

## 1. Phase 4 Deliverables & Features

### 1. High-Fidelity Multi-Page PDF Export (`pdfExportService.js`)
- **Puppeteer Headless Chrome Engine**: Employs Headless Chrome directly on the Node.js backend to render complete A4 magazine spreads without converting pages to raster screenshots or canvas bitmaps.
- **REST API Endpoint (`POST /api/articles/export-pdf`)**:
  - Accepts pre-rendered client HTML from the visual editor (`{ html, title, columnMode }`), maintaining all custom user text edits, image resizes, alignments, reordered pages, and custom uploaded photos.
  - Also accepts raw article objects (`{ article, columnMode }`), providing a fully autonomous headless PDF generation path for external services and automation pipelines.
  - Returns a binary stream (`Content-Type: application/pdf`) with automatic file naming (`Content-Disposition: attachment; filename="...pdf"`).

### 2. Precise Print Configuration & Page Geometry
- **Standard ISO 216 A4 Dimensions**: Explicitly configured for `210mm × 297mm` (MediaBox: `595 pt × 842 pt`).
- **CSS Page Breaks**: Preserves CSS page breaks across discrete sheets (`page-break-after: always; break-after: page;`) while preventing blank trailing pages (`.magazine-sheet:last-of-type { break-after: auto; }`).
- **Zero Print Margin Overrides**: Sets Puppeteer print margins to `0mm` so the pixel-perfect CSS margins and padding (`16mm top/bottom, 18mm left/right`) govern exact layout positioning without double-margin distortion.
- **Print Backgrounds Enabled**: Background colors, category pills, standfirst summary boxes, blockquote highlights, and dividers render identically (`printBackground: true`, `-webkit-print-color-adjust: exact`).
- **Clean Browser Suppression**: Disables unwanted browser-generated headers and footers (`displayHeaderFooter: false`) to preserve Web2Mag's running magazine headers and dynamic `Page X of Y` footers.

### 3. Vector Typography vs. Print-Image Resolution (DPI / PPI)
- **Selectable, Searchable Vector Text**: Text is rendered as native PDF font glyph streams (`/FontDescriptor`, `BT...ET` stream operators). Vector text has **no fixed DPI** and scales with infinite mathematical precision to any printer DPI (600, 1200, 2400 DPI) or digital zoom level.
- **Image Resolution (300 DPI Print / 150 DPI Digital)**:
  - Raster images (`<img>`) are preserved at their native pixel dimensions without rasterizing the whole document.
  - At A4 column width (317px at 96 CSS DPI = 84mm = 3.3 inches), an image requires **~990px** width for 300 DPI print standards, and **~495px** width for 150 DPI digital distribution.
  - Full-width hero spreads spanning 658px (174mm = 6.85 inches) require **~2055px** width for 300 DPI print and **~1030px** width for 150 DPI digital use.
- **Font & Asset Preloading**: Generation ensures web fonts (`Inter`, `Playfair Display`, `Source Serif 4`, `JetBrains Mono`) and all inline images (including base64 data URLs) are fully resolved before snapshotting (`document.fonts.ready` and `img.complete`).

### 4. Interactive Frontend Integration
- **Export PDF Button**: Prominently placed in the Visual Editor toolbar and Reader Preview header.
- **Real-Time Progress Feedback**: Displays informative statuses ("Preparing publication sheets...", "Generating high-resolution vector PDF...", "Finalizing and downloading...") with spinner animations and disabled states to prevent double-clicks.
- **Error Handling**: Captures server issues, displays accessible alert notices, and automatically recovers.
- **Automatic Browser Download**: Downloads the generated PDF as `${slugify(title)}.pdf`.

---

## 2. Project Architecture

```text
web2mag/
├── package.json                   # Root scripts (start:server, start:frontend, test)
├── .gitignore                     # Repository-wide ignore rules
├── server/                        # Node.js + Express Backend (Port 5001)
│   ├── package.json               # Express, Puppeteer, Cheerio, CORS
│   ├── src/
│   │   ├── index.js               # Express application server
│   │   ├── routes/
│   │   │   └── articleRoutes.js   # API route declarations (/import, /export-pdf)
│   │   ├── controllers/
│   │   │   ├── articleController.js # WP ingestion and Cheerio HTML fallback
│   │   │   └── pdfController.js     # Orchestrates PDF export requests
│   │   ├── services/
│   │   │   ├── pdfExportService.js  # Headless Chrome Puppeteer PDF rendering engine
│   │   │   ├── wordpressService.js  # WP REST API discovery & post retrieval
│   │   │   ├── htmlParserService.js # Cheerio DOM cleaner & semantic block extractor
│   │   │   └── articleNormalizer.js # Standardizes structured article schema & stats
│   │   └── utils/
│   │       └── urlHelper.js       # URL validation and slug extraction
│   └── test/
│       ├── pdfExport.test.js      # PDF service unit tests (3 tests)
│       └── qaTestSuite.test.js    # Comprehensive QA test suite (4 tests)
│
└── frontend/                      # React 19 + Vite Frontend (Port 5173)
    ├── package.json
    ├── vite.config.js             # Vite config with /api reverse proxy to Port 5001
    ├── eslint.config.js
    ├── index.html
    └── src/
        ├── components/
        │   ├── MagazineEditor.jsx        # WYSIWYG Visual Editor with PDF export
        │   ├── MagazineEditor.css        # Editor layout, export banners, print rules
        │   ├── EditorToolbar.jsx         # Text formatting, image controls, Export PDF btn
        │   ├── EditorToolbar.css         # SaaS toolbar styling, spinners, button states
        │   ├── PageThumbnailsSidebar.jsx # Mini-A4 thumbnails, reordering, & add page
        │   ├── PageThumbnailsSidebar.css # Thumbnail cards and active sheet indicators
        │   ├── DeletePageModal.jsx       # Modal confirmation for page deletion
        │   ├── DeletePageModal.css       # Modal overlay and dialog animation
        │   ├── MagazinePage.jsx          # Editable A4 sheet component (contenteditable)
        │   ├── MagazinePreview.jsx       # Multi-page Reader view with Export PDF btn
        │   ├── MagazinePreview.css       # A4 dimensions, print styles, and typography
        │   ├── ArticleLibrary.jsx        # Article Library sidebar
        │   └── ImportArticleModal.jsx    # Real WP REST API article import dialog
        ├── hooks/
        │   └── useArticlePagination.js   # Two-phase layout measurement & overflow hook
        ├── utils/
        │   ├── pdfExportClient.js        # Frontend export trigger, progress & download helper
        │   ├── paginationEngine.js       # Pure A4 pagination algorithms & column logic
        │   ├── paginationEngine.test.js  # Pagination edge case test suite (7 tests)
        │   └── editorFeatures.test.js    # Editor state and actions test suite (5 tests)
        ├── data/
        │   └── mockArticles.js           # Sample articles & URL normalizers
        ├── App.jsx                       # Top shell, workspace tabs (Editor/Reader/Details)
        ├── App.css                       # Global workspace styling & segmented controls
        ├── index.css                     # Global typography and color tokens
        └── main.jsx                      # React entry point
```

---

## 3. Quick Start & Running the Application

### Prerequisites
- **Node.js**: v18.18+ or v20+ (Node v24 tested)
- **npm**: v9+ (npm v11 tested)
- **Google Chrome** or **Microsoft Edge** installed on host machine (or Puppeteer bundled Chromium)

### Step 1: Start Backend Server
```bash
cd server
npm install
npm start
# Server listens on http://localhost:5001
```

### Step 2: Start Frontend Application
```bash
cd frontend
npm install
npm run dev
# Vite runs on http://localhost:5173 with proxy to backend
```

---

## 4. Quality Assurance & Performance Benchmark Results

Run the full automated test suite (all 19 tests):

```bash
npm test
```

### Measured Performance Results
| Scenario | Pages | Measured Export Time | Output File Size | Verified Quality Attributes |
|---|---|---|---|---|
| **Single-Page Article** | 1 Page | **3.28s** | 165.4 KB | Exact A4 (`209.9 × 297.0mm`), vector text streams, Page 1 of 1 |
| **Typical Feature Article** | 4 Pages | **3.25s** | 481.6 KB | 2-column flow, hero image, Page 1 to 4 sequential footers |
| **Multiple Images & Base64** | 2 Pages | **3.20s** | 226.6 KB | Hero image + inline figures, no clipping, aspect ratio preserved |
| **Custom Editor Reordered** | 2 Pages | **3.10s** | 131.7 KB | In-place text edits, reordered sections, custom blank page |

### Test Summary (19/19 passing)
- **Backend Tests (7/7)**:
  - `wrapMagazineInPrintDocument`: HTML5 doctype, A4 portrait size, Google Fonts, print rules.
  - `renderArticleToHtml`: Multi-page A4 magazine sheets, headers, footers, Page X of Y.
  - `generatePdfFromHtml`: Vector PDF buffer, `%PDF-` signature, MediaBox dimensions.
  - `QA Test 1`: Single-page article export.
  - `QA Test 2`: Typical multi-page article (3–5 pages) performance benchmark (< 4 seconds).
  - `QA Test 3`: Multiple images & Base64 data URLs.
  - `QA Test 4`: Custom editor changes, in-place edits, and page reordering.
- **Frontend Tests (12/12)**:
  - 7 pagination engine tests (sentence splitting, short articles, long articles, orphan heading prevention, image boundaries, paragraph splitting, list splitting).
  - 5 interactive editor tests (text editing, image controls, blank page addition, page deletion, page reordering).

### Static Analysis & Production Build
```bash
npm --prefix frontend run lint
# Result: 0 errors, 0 warnings

npm --prefix frontend run build
# Result: Production bundle built successfully in 325ms (dist/assets generated)
```
