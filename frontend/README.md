# Web2Mag — Article Import & Library UI Module

A responsive, accessible React frontend module for **Web2Mag** (a Web-to-PDF Magazine Editor application). This package provides the **Article Library Sidebar** (`ArticleLibrary`) and **Import Article Modal** (`ImportArticleModal`) along with deterministic local mock import utilities and a standalone integration workspace (`App.jsx`).

---

## 1. Prerequisites

- **Node.js**: v18.18+ or v20+ (LTS recommended)
- **npm**: v9+

---

## 2. Installation & Commands

Run all commands from the `web2mag/frontend` directory:

```bash
# Install dependencies (if not already installed)
npm install

# Start the Vite development server with HMR
npm run dev

# Run ESLint static analysis
npm run lint

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## 3. Project Structure

```text
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── ArticleLibrary.jsx       # Reusable Article Library sidebar component
│   │   ├── ArticleLibrary.css       # Styles for the Article Library sidebar
│   │   ├── ImportArticleModal.jsx   # Reusable Import Article modal dialog
│   │   └── ImportArticleModal.css   # Styles for the Import Article modal
│   ├── data/
│   │   └── mockArticles.js          # Initial mock dataset, URL validator, and mock import simulator
│   ├── App.jsx                      # Parent integration demo managing state and modal lifecycle
│   ├── App.css                      # Workspace layout and selected-article inspection styles
│   ├── index.css                    # Global typography and color tokens
│   └── main.jsx                     # Application entry point
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

---

## 4. Component Responsibilities & API

### `ArticleLibrary` (`src/components/ArticleLibrary.jsx`)

Renders the sidebar containing the library header, live article counter badge, primary **Import Article** trigger, article list cards, missing/broken thumbnail fallback placeholders, and an empty state when no articles are present. Does **not** maintain a duplicate internal copy of the `articles` array.

#### Props

| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `articles` | `Array<Article>` | Yes | List of article objects (`{ id, title, author, thumbnail, sourceUrl, status }`). |
| `selectedArticleId` | `string \| null` | Yes | ID of the currently active/selected article. |
| `onSelectArticle` | `(id: string) => void` | Yes | Callback fired when an article card or title button is clicked/activated. |
| `onRemoveArticle` | `(id: string) => void` | Yes | Callback fired when an article's **Remove** button is clicked (stops propagation so selection is not triggered). |
| `onImportClick` | `() => void` | Yes | Callback fired when the header **Import Article** button or empty-state **Import your first article** button is clicked. |

---

### `ImportArticleModal` (`src/components/ImportArticleModal.jsx`)

Renders an accessible modal dialog (`role="dialog"`, `aria-modal="true"`) for importing an article by URL. Handles client-side URL validation using the native JavaScript `URL` constructor, keyboard focus trapping, `Escape` key dismissal, backdrop click dismissal, duplicate-submission prevention while loading, and inline error recovery.

#### Props

| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | No (default `true`) | Controls whether the modal is mounted and visible. |
| `onClose` | `() => void` | Yes | Callback invoked when the user clicks **Cancel**, the close (`×`) button, the backdrop, or presses `Escape`. |
| `onImport` | `(article: Article) => void` | Yes | Callback invoked with the newly created article object when a mock import succeeds. |

---

## 5. How Mock Imports & URL Validation Work

All validation and mock import logic resides in `src/data/mockArticles.js`:

1. **URL Validation (`validateArticleUrl`)**:
   - Uses the standard JavaScript `new URL(input)` constructor.
   - Rejects empty or whitespace-only strings, malformed URLs, URLs containing spaces, non-HTTP/HTTPS protocols (such as `ftp:`, `file:`, or `javascript:`), and hostnames without a valid domain structure.
   - Does not claim a syntactically valid URL is a verified WordPress article.

2. **Simulated Import (`simulateArticleImport`)**:
   - Performs no network or backend requests.
   - Simulates an asynchronous import (~750ms delay) showing a loading spinner and `"Importing article..."` status while disabling form controls.
   - On success, deterministically generates an article object with `{ id, title, author, thumbnail, sourceUrl, status: 'Imported' }` derived from the URL path slug and hostname.
   - If the URL contains `no-image` or `nothumb` (e.g. `https://editorial.example.com/2026/minimalist-column-layouts-no-image`), it returns an empty `thumbnail: ''` so the missing-image placeholder can be tested on newly imported items.

---

## 6. Testing the Simulated Failure Case

To test the error state and retry flow in `ImportArticleModal`:

1. Click **Import Article** to open the modal.
2. Enter `https://example.com/error` (or click the **Simulated failure URL** quick-fill chip in the modal).
   - Any valid HTTP/HTTPS URL containing `/error`, `/fail`, `/404`, `/500`, `error.`, or `fail.` will also trigger the simulated import failure.
3. Click **Import**.
4. After the loading state finishes, the modal remains open, displays a clear inline error alert (`role="alert"`), and keeps focus in the input so you can edit the URL and retry.

---

## 7. Integrating into the Main Magazine Dashboard

Another developer integrating these components into the main Web2Mag editor dashboard can import `ArticleLibrary` and `ImportArticleModal` directly and connect them to dashboard state:

```jsx
import { useState } from 'react';
import { ArticleLibrary } from './components/ArticleLibrary.jsx';
import { ImportArticleModal } from './components/ImportArticleModal.jsx';
import { INITIAL_ARTICLES, normalizeArticleUrl } from './data/mockArticles.js';

export function MagazineDashboard() {
  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [selectedArticleId, setSelectedArticleId] = useState(INITIAL_ARTICLES[0]?.id ?? null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleImport = (newArticle) => {
    const existing = articles.find(
      (item) => normalizeArticleUrl(item.sourceUrl) === normalizeArticleUrl(newArticle.sourceUrl)
    );
    if (existing) {
      setSelectedArticleId(existing.id);
      return;
    }
    setArticles((prev) => [newArticle, ...prev]);
    setSelectedArticleId(newArticle.id);
  };

  const handleRemove = (idToRemove) => {
    setArticles((prev) => {
      const next = prev.filter((item) => item.id !== idToRemove);
      if (selectedArticleId === idToRemove) {
        setSelectedArticleId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  return (
    <div className="dashboard-layout">
      <ArticleLibrary
        articles={articles}
        selectedArticleId={selectedArticleId}
        onSelectArticle={setSelectedArticleId}
        onRemoveArticle={handleRemove}
        onImportClick={() => setIsImportOpen(true)}
      />

      {/* Main Magazine Canvas / Editor Component goes here */}

      <ImportArticleModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
```

---

## 8. Current Limitations

- **Mock Imports Only**: Real WordPress REST API fetching, HTML scraping, and backend persistence are intentionally not implemented in this module.
- **No Backend / Auth / Database**: All state is held in memory inside the React parent component (`App.jsx`) and resets on page reload.
- **No A4 Pagination or PDF Export**: The full multi-page magazine layout engine and PDF generation pipeline belong to separate modules of the Web2Mag application.
