# Web2Mag — Web-to-PDF Magazine Editor

Web2Mag is an editorial publishing platform that transforms web articles (WordPress posts/pages and standard HTML webpages) into publication-grade, A4 multi-column print magazines and vector PDFs.

---

## Architecture Overview

```text
web2mag/
├── frontend/                # React 19 + Vite editorial dashboard
│   ├── src/
│   │   ├── components/      # ArticleLibrary, ImportArticleModal, A4MagazinePage, ArticleInspector
│   │   ├── services/        # articleIngestion client service
│   │   ├── data/            # mockArticles test data & simulator
│   │   └── App.jsx          # Three-panel editorial studio dashboard
│   ├── package.json
│   └── vite.config.js       # Vite config with /api proxy to backend (port 5001)
│
└── server/                  # Node.js + Express article ingestion service
    ├── src/
    │   ├── index.js         # Express app entry point
    │   ├── routes/          # POST /api/articles/import
    │   ├── services/        # WordPress API, Mozilla Readability, DOMPurify Sanitizer, SSRF Security
    │   └── utils/           # calculateReadingTime utility
    ├── test/                # Node.js built-in automated test suite
    └── package.json
```

---

## Quick Start & Running the Application

### 1. Backend Ingestion Service (`server/`)

The backend service is required for fetching external web pages and WordPress REST APIs without browser CORS restrictions, and enforces SSRF security and HTML sanitization.

```bash
# Navigate to backend directory
cd server

# Install dependencies (Node 18+ required)
npm install

# Start the ingestion server (runs on http://localhost:5001)
npm start

# Or run in development watch mode
npm run dev

# Run automated backend test suite (21 unit & integration tests)
npm test
```

### 2. Frontend Editorial Studio (`frontend/`)

```bash
# In a separate terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev

# Run ESLint check
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Article Ingestion API

### Endpoint: `POST /api/articles/import`

Ingests an article from a public WordPress REST API or standard HTML webpage.

**Request:**
```json
{
  "url": "https://entechonline.com/pcb-manufacturing-from-design-to-real-product/"
}
```

**Response (Normalized Schema):**
```json
{
  "id": "art-1730383123456-a1b2c3",
  "sourceUrl": "https://entechonline.com/pcb-manufacturing-from-design-to-real-product/",
  "title": "PCB Manufacturing: From Design to Real Product!",
  "author": "Virendra Singh Shekhawat",
  "excerpt": "This article explains the complete journey of PCB manufacturing...",
  "contentHtml": "<p>Every electronic device relies on PCBs...</p>",
  "rawText": "Every electronic device relies on PCBs...",
  "featuredImageUrl": "https://entechonline.com/wp-content/uploads/2026/08/PCB-design-and-manufacturing.jpg",
  "thumbnail": "https://entechonline.com/wp-content/uploads/2026/08/PCB-design-and-manufacturing.jpg",
  "images": [
    "https://entechonline.com/wp-content/uploads/2026/08/PCB-design-and-manufacturing.jpg"
  ],
  "publishDate": "2026-09-17T17:34:54",
  "category": "Issue 9 - September 2026",
  "readingTime": 5,
  "status": "Imported",
  "importedAt": "2026-10-31T18:44:19.123Z",
  "isWordPress": true,
  "isPage": false
}
```

### Security Features
- **SSRF Protection**: Rejects `localhost`, private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`), and private IPv6 addresses after DNS resolution.
- **Manual Redirect Validation**: Every redirect hop is re-validated against SSRF constraints (up to 5 hops).
- **Request Limits**: 12-second timeout and 10MB maximum response size.
- **HTML Sanitization**: DOMPurify strips scripts, iframes, and inline event handlers, enforcing safe links and responsive media.

---

## Automatic Two-Column Pagination Engine

Built directly to match physical A4 magazine dimensions (210mm × 297mm at 96 DPI: 794px × 1123px):
- **Page 1 Budget**: 755px per column (accounting for 42px top padding, 76px header, 121px headline/byline block, and 36px bottom padding).
- **Continuation Pages Budget**: 825px per column (accounting for 44px continuation bar).
- **Two-Column Balancing**: Evaluates height distribution across Column 1 and Column 2 independently before spilling over to the next page sheet.
- **Anti-Orphan Protection**: Employs `keepWithNext` logic to ensure headings are never stranded at the bottom of a page or column.
- **Atomic Elements**: Figures and captions remain bound together in `<figure class="a4-figure">`.
- **Sentence Splitting**: Oversized paragraphs are cleanly split across column and page boundaries at sentence delimiters without dropping words.
- **Dynamic TOC Synchronization**: Page starting folios in the Table of Contents automatically recompute whenever article order or page length changes.

---

## Magazine Story & Visual Block Editor

An intuitive, non-destructive editorial editor accessible from the top toolbar ("Edit Story"), the Article Inspector ("✍️ Edit Article & Blocks"), or the Article Library:
- **Metadata Editing**: Title, author, role, author biography, and category.
- **Block Management**: Add, delete, and reorder paragraphs, headings (H2, H3, H4), blockquotes, lists, and figures.
- **Media Tools**: Upload images from local disk (FileReader data URI), specify external image URLs, resize images (100%, 85%, 70%, 50%), align images (center, left, right), and edit captions.
- **Dual Mode**: Toggle between the Visual Block Editor and Raw HTML mode with instant bidirectional synchronization.
- **Issue Management**: Add blank stories (`+ Story`), reorder articles (`▲`, `▼`), and delete articles.

---

## Vector PDF Export (`POST /api/export/pdf`)

High-fidelity PDF rendering via Node.js and headless Puppeteer:
- **Vector Typography**: Crisp, selectable text rendered through Skia/PDF.
- **Standard A4 Dimensions**: Exact `210mm × 297mm` page boxes with zero browser margins (`@page { size: 210mm 297mm; margin: 0; }`).
- **Complete Publication**: Exports cover, dynamic Table of Contents, paginated article spreads, and contributor author profiles in a single cohesive document.
- **Robust Media Handling**: Waits for external imagery with a safety timeout so offline or slow remote assets never block publication.
