import puppeteer from 'puppeteer';
import { sanitizeHtml } from './sanitizer.js';
import fs from 'node:fs';

/**
 * Finds a suitable Chrome or Chromium executable on the host machine.
 * Checks standard system paths on Windows/Linux/macOS before falling back to Puppeteer's default.
 *
 * @returns {string | undefined}
 */
export function getChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    if (fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
  }

  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  for (const path of candidatePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }

  return undefined; // Puppeteer will use its bundled Chromium
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getInitials(name = '') {
  if (!name || typeof name !== 'string') return 'ED';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function formatIssn(issn = '') {
  if (!issn) return 'ISSN (Online): 2584-2749';
  const trimmed = String(issn).trim();
  if (/^ISSN/i.test(trimmed)) return trimmed;
  return `ISSN (Online): ${trimmed}`;
}

/**
 * Generates the unified CSS styles required for accurate A4 vector PDF rendering.
 */
function getPrintStylesheet() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    @page {
      size: 210mm 297mm;
      margin: 0;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .print-sheet {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      position: relative;
      background: #ffffff;
      padding: 16mm 18mm 14mm 18mm;
      display: flex;
      flex-direction: column;
    }

    .print-sheet:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* ===================================================
       COVER PAGE STYLES
       =================================================== */
    .a4-cover-page {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .cover-header {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
      flex-shrink: 0;
    }

    .cover-header__top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .cover-header__edition {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cover-header__dot {
      color: #cbd5e1;
    }

    .cover-header__web {
      color: #0284c7;
      font-weight: 700;
    }

    .cover-masthead {
      border-top: 3px solid #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding: 14px 0 10px 0;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }

    .cover-masthead__brand {
      margin: 0;
      font-size: 42px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.04em;
      text-transform: uppercase;
      line-height: 0.95;
    }

    .cover-masthead__sub {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.16em;
      color: #0284c7;
      text-transform: uppercase;
    }

    .cover-issn-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #0f172a;
      color: #f8fafc;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.06em;
    }

    .cover-issn-bar__pill {
      background-color: #0284c7;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 8.5px;
      font-weight: 800;
    }

    .cover-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 0;
    }

    .cover-hero-card {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 28px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      background-color: #0f172a;
    }

    .cover-hero-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.75) 60%, rgba(15, 23, 42, 0.95) 100%);
    }

    .cover-hero-content {
      position: relative;
      z-index: 2;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cover-hero-badge {
      align-self: flex-start;
      background-color: #0284c7;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 3px 10px;
      border-radius: 4px;
    }

    .cover-hero-title {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      line-height: 1.15;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .cover-hero-subhead {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
      color: #e2e8f0;
      max-width: 540px;
    }

    .cover-stories-section {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      flex-shrink: 0;
    }

    .cover-stories-heading {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0284c7;
      margin-bottom: 8px;
    }

    .cover-stories-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .cover-story-card {
      border-left: 2.5px solid #0284c7;
      padding-left: 8px;
    }

    .cover-story-card__category {
      font-size: 8px;
      font-weight: 800;
      color: #0284c7;
      text-transform: uppercase;
      display: block;
    }

    .cover-story-card__title {
      margin: 2px 0;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.25;
    }

    .cover-story-card__author {
      font-size: 9px;
      color: #64748b;
    }

    .cover-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      margin-top: auto;
    }

    /* ===================================================
       TABLE OF CONTENTS STYLES
       =================================================== */
    .a4-toc-page {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .toc-header {
      margin-bottom: 14px;
      flex-shrink: 0;
    }

    .toc-header__top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .toc-header__brand {
      font-weight: 800;
      color: #0f172a;
    }

    .toc-header__web {
      color: #0284c7;
      font-weight: 700;
    }

    .toc-header__rule {
      height: 2px;
      background: linear-gradient(90deg, #0284c7 0%, #38bdf8 35%, #e2e8f0 100%);
      width: 100%;
    }

    .toc-title-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding-top: 8px;
    }

    .toc-title {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }

    .toc-issue-tag {
      font-size: 10px;
      font-weight: 700;
      color: #0284c7;
      text-transform: uppercase;
    }

    .toc-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
    }

    .toc-entries-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .toc-entry-card {
      display: grid;
      grid-template-columns: 42px 1fr;
      gap: 14px;
      align-items: flex-start;
      padding: 8px 12px;
      border-radius: 6px;
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
    }

    .toc-entry__page-badge {
      font-size: 20px;
      font-weight: 900;
      color: #0284c7;
      text-align: right;
      line-height: 1;
    }

    .toc-entry__content {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .toc-entry__meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toc-entry__category {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0369a1;
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 1.5px 6px;
      border-radius: 3px;
    }

    .toc-entry__author {
      font-size: 9.5px;
      font-weight: 600;
      color: #64748b;
    }

    .toc-entry__pages-tag {
      font-size: 8px;
      font-weight: 700;
      color: #475569;
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 1.5px 5px;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .toc-entry__title {
      margin: 0;
      font-size: 13px;
      font-weight: 750;
      color: #0f172a;
      line-height: 1.3;
    }

    .toc-entry__desc {
      margin: 0;
      font-size: 10px;
      color: #64748b;
      line-height: 1.35;
    }

    .toc-colophon-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #64748b;
      flex-shrink: 0;
    }

    .toc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      margin-top: auto;
    }

    /* ===================================================
       A4 ARTICLE SPREAD STYLES (2-COLUMN PRINT MEDIA)
       =================================================== */
    .a4-page {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .a4-header {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
      flex-shrink: 0;
    }

    .a4-header__top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .a4-header__brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .a4-header__brand-name {
      font-weight: 800;
      color: #0f172a;
    }

    .a4-header__issn {
      color: #94a3b8;
      font-size: 8.5px;
    }

    .a4-header__issue-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .a4-header__divider-dot {
      color: #cbd5e1;
    }

    .a4-header__web {
      color: #0284c7;
      font-weight: 600;
    }

    .a4-header__rule {
      height: 2px;
      background: linear-gradient(90deg, #0284c7 0%, #38bdf8 40%, #e2e8f0 100%);
      width: 100%;
    }

    .a4-header__nav-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 3px;
    }

    .a4-header__folio-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .a4-folio-badge {
      width: 30px;
      height: 30px;
      background-color: #0284c7;
      color: #ffffff;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      line-height: 1;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
      flex-shrink: 0;
    }

    .a4-category-tag {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0369a1;
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 2.5px 8px;
      border-radius: 4px;
    }

    .a4-header__edition {
      font-size: 9.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }

    /* Headline Block (Page 1) */
    .a4-headline-block {
      margin-top: 6px;
      margin-bottom: 12px;
      flex-shrink: 0;
    }

    .a4-headline {
      margin: 0 0 6px 0;
      font-size: 24px;
      font-weight: 800;
      line-height: 1.2;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .a4-byline-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10.5px;
      color: #475569;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
    }

    .a4-byline__prefix {
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      font-size: 9px;
    }

    .a4-byline__author {
      font-weight: 700;
      color: #0f172a;
    }

    .a4-byline__bullet {
      color: #cbd5e1;
    }

    .a4-byline__issue {
      color: #64748b;
    }

    /* Continuation Header Bar (Pages 2+) */
    .a4-continuation-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 2px;
      margin-bottom: 10px;
      padding: 5px 10px;
      background-color: #f8fafc;
      border-left: 3px solid #0284c7;
      border-radius: 0 4px 4px 0;
      flex-shrink: 0;
    }

    .a4-continuation-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 440px;
    }

    .a4-continuation-tag {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #0284c7;
      background-color: #e0f2fe;
      padding: 2px 7px;
      border-radius: 9999px;
    }

    /* Two-Column Body Layout */
    .a4-body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .a4-columns {
      column-count: 2;
      column-gap: 26px;
      column-rule: 1px solid #f1f5f9;
      text-align: justify;
      text-justify: inter-word;
      font-size: 10.5px;
      line-height: 1.55;
      color: #334155;
      height: 100%;
    }

    .a4-columns p {
      margin: 0 0 9px 0;
    }

    .a4-columns .a4-lead {
      font-size: 11.2px;
      line-height: 1.58;
      color: #0f172a;
      margin-bottom: 11px;
      font-weight: 500;
    }

    .a4-columns h1,
    .a4-columns h2,
    .a4-columns h3,
    .a4-columns h4 {
      break-after: avoid;
      break-inside: avoid;
      font-weight: 800;
      color: #0f172a;
      margin: 12px 0 5px 0;
    }

    .a4-columns h3 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0284c7;
    }

    .a4-columns h2 {
      font-size: 12px;
      letter-spacing: -0.01em;
      color: #0f172a;
    }

    .a4-columns ol,
    .a4-columns ul {
      margin: 5px 0 9px 0;
      padding-left: 16px;
    }

    .a4-columns li {
      margin-bottom: 3.5px;
    }

    .a4-columns figure,
    .a4-figure {
      margin: 9px 0;
      break-inside: avoid;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      overflow: hidden;
      background-color: #f8fafc;
      display: block;
    }

    .a4-figure__img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }

    .a4-figure figcaption {
      font-size: 8.5px;
      line-height: 1.35;
      color: #475569;
      padding: 5px 8px;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-style: italic;
    }

    /* Clean placeholder when article body content is pending */
    .a4-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 30px 20px;
    }

    .a4-placeholder__notice-card {
      background-color: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: 8px;
      padding: 24px 32px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      max-width: 480px;
    }

    .a4-placeholder__badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 8.5px;
      font-weight: 700;
      color: #0369a1;
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 3px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .a4-placeholder__heading {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }

    .a4-placeholder__text {
      margin: 0;
      font-size: 9.5px;
      line-height: 1.5;
      color: #64748b;
    }

    .a4-columns blockquote {
      margin: 8px 0;
      padding: 6px 12px;
      border-left: 3px solid #ec4899;
      background-color: #fdf2f8;
      font-style: italic;
      color: #831843;
      break-inside: avoid;
    }

    .a4-columns table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin: 8px 0;
      break-inside: avoid;
    }

    .a4-columns th,
    .a4-columns td {
      padding: 3.5px 5px;
      border: 1px solid #e2e8f0;
    }

    .a4-footer {
      margin-top: auto;
      padding-top: 12px;
      flex-shrink: 0;
    }

    .a4-footer__rule {
      height: 1px;
      background-color: #e2e8f0;
      margin-bottom: 7px;
    }

    .a4-footer__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
    }

    .a4-footer__copy {
      color: #94a3b8;
    }

    .a4-footer__center {
      color: #475569;
      text-transform: uppercase;
      font-weight: 700;
    }

    .a4-footer__folio {
      color: #0284c7;
      font-weight: 800;
    }

    /* ===================================================
       AUTHOR PROFILE PAGE STYLES
       =================================================== */
    .a4-author-page {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .author-header {
      margin-bottom: 14px;
      flex-shrink: 0;
    }

    .author-header__top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .author-header__brand {
      font-weight: 800;
      color: #0f172a;
    }

    .author-header__web {
      color: #0284c7;
      font-weight: 700;
    }

    .author-header__rule {
      height: 2px;
      background: linear-gradient(90deg, #0284c7 0%, #38bdf8 35%, #e2e8f0 100%);
      width: 100%;
    }

    .author-title-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding-top: 8px;
    }

    .author-title {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }

    .author-section-tag {
      font-size: 10px;
      font-weight: 700;
      color: #0284c7;
      text-transform: uppercase;
    }

    .author-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-height: 0;
    }

    .author-cards-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }

    .author-profile-card {
      display: grid;
      grid-template-columns: 60px 1fr;
      gap: 16px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }

    .author-avatar-frame {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 800;
      overflow: hidden;
      flex-shrink: 0;
    }

    .author-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .author-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .author-name-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .author-name {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }

    .author-role {
      font-size: 10px;
      font-weight: 600;
      color: #0284c7;
    }

    .author-bio {
      margin: 0;
      font-size: 10.5px;
      line-height: 1.45;
      color: #475569;
    }

    .author-articles-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .author-articles-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .author-article-pill {
      font-size: 9px;
      font-weight: 600;
      color: #0369a1;
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 1.5px 6px;
      border-radius: 3px;
    }

    .author-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      margin-top: auto;
    }
  `;
}

/**
 * Builds the complete standalone HTML string for a multi-page magazine issue.
 *
 * @param {Array<object>} pages - List of sequential magazine pages from magazineModel
 * @param {object} issueConfig - Dynamic issue metadata
 * @returns {string} Standalone HTML ready for Puppeteer rendering
 */
export function buildIssuePrintHtml(pages = [], issueConfig = {}) {
  const css = getPrintStylesheet();

  const renderedPagesHtml = pages
    .map((page) => {
      let pageInner = '';

      if (page.type === 'cover') {
        const headline = page.coverHeadline || issueConfig.coverHeadline || 'Featured Issue Story';
        const subhead = page.coverSubhead || issueConfig.coverSubhead || '';
        const heroImg = page.coverImage || issueConfig.coverImageUrl || '';
        const featured = page.featuredArticles || [];

        const heroImageHtml = heroImg
          ? `<img src="${heroImg}" alt="Cover Feature" class="cover-hero-image" />`
          : '<div class="cover-hero-image" style="background:#0f172a;"></div>';

        const featuredCards = featured.slice(1, 5).map((story) => `
          <div class="cover-story-card">
            <span class="cover-story-card__category">${escapeHtml(story.category || 'FEATURE')}</span>
            <h3 class="cover-story-card__title">${escapeHtml(story.title)}</h3>
            <span class="cover-story-card__author">By ${escapeHtml(story.author || 'Staff')}</span>
          </div>
        `).join('\n');

        pageInner = `
          <article class="a4-cover-page">
            <header class="cover-header">
              <div class="cover-header__top-row">
                <div class="cover-header__edition">
                  <span>${escapeHtml(issueConfig.date)}</span>
                  <span class="cover-header__dot">•</span>
                  <span>${escapeHtml(issueConfig.volume)} | ${escapeHtml(issueConfig.issue)}</span>
                </div>
                <span class="cover-header__web">${escapeHtml(issueConfig.website)}</span>
              </div>
              <div class="cover-masthead">
                <h1 class="cover-masthead__brand">${escapeHtml(issueConfig.magazineTitle)}</h1>
                <div class="cover-masthead__sub"><span>Engineering &amp; Editorial</span></div>
              </div>
              <div class="cover-issn-bar">
                <span>${escapeHtml(formatIssn(issueConfig.issn))}</span>
                <span class="cover-issn-bar__pill">${escapeHtml(issueConfig.coverTag || 'MONTHLY EDITION')}</span>
              </div>
            </header>
            <main class="cover-body">
              <div class="cover-hero-card">
                ${heroImageHtml}
                <div class="cover-hero-overlay"></div>
                <div class="cover-hero-content">
                  <span class="cover-hero-badge">Cover Feature</span>
                  <h2 class="cover-hero-title">${escapeHtml(headline)}</h2>
                  ${subhead ? `<p class="cover-hero-subhead">${escapeHtml(subhead)}</p>` : ''}
                </div>
              </div>
              ${featured.length > 1 ? `
                <section class="cover-stories-section">
                  <div class="cover-stories-heading">Inside This Issue</div>
                  <div class="cover-stories-grid">${featuredCards}</div>
                </section>
              ` : ''}
            </main>
            <footer class="cover-footer">
              <span>© ${escapeHtml(issueConfig.publisher)}</span>
              <span>All Rights Reserved</span>
              <span>${escapeHtml(issueConfig.website)}</span>
            </footer>
          </article>
        `;
      } else if (page.type === 'toc') {
        const entries = page.entries || [];
        const entriesHtml = entries.map((entry) => {
          const numStr = String(entry.pageNumber).padStart(2, '0');
          const pageCountTag = entry.pageCount > 1 ? `<span class="toc-entry__pages-tag">${entry.pageCount} Pages</span>` : '';
          return `
            <li class="toc-entry-card">
              <div class="toc-entry__page-badge">${numStr}</div>
              <div class="toc-entry__content">
                <div class="toc-entry__meta-row">
                  <span class="toc-entry__category">${escapeHtml(entry.category)}</span>
                  <span class="toc-entry__author">By ${escapeHtml(entry.author)}</span>
                  ${pageCountTag}
                </div>
                <h2 class="toc-entry__title">${escapeHtml(entry.title)}</h2>
                ${entry.excerpt ? `<p class="toc-entry__desc">${escapeHtml(entry.excerpt)}</p>` : ''}
              </div>
            </li>
          `;
        }).join('\n');

        pageInner = `
          <article class="a4-toc-page">
            <header class="toc-header">
              <div class="toc-header__top-bar">
                <span class="toc-header__brand">${escapeHtml(issueConfig.magazineTitle)}</span>
                <span>${escapeHtml(issueConfig.volume)} | ${escapeHtml(issueConfig.issue)} • ${escapeHtml(issueConfig.date)}</span>
                <span class="toc-header__web">${escapeHtml(issueConfig.website)}</span>
              </div>
              <div class="toc-header__rule"></div>
              <div class="toc-title-row">
                <h1 class="toc-title">Table of Contents</h1>
                <span class="toc-issue-tag">Issue Catalog</span>
              </div>
            </header>
            <main class="toc-body">
              <ul class="toc-entries-list">${entriesHtml}</ul>
              <div class="toc-colophon-card">
                <div>
                  <strong>${escapeHtml(issueConfig.publisher)}</strong> • ${escapeHtml(formatIssn(issueConfig.issn))}
                </div>
                <div>Standard A4 Portrait (210 × 297 mm)</div>
              </div>
            </main>
            <footer class="toc-footer">
              <span>© ${escapeHtml(issueConfig.website)}</span>
              <span>${escapeHtml(issueConfig.magazineTitle)} • ${escapeHtml(issueConfig.date)}</span>
              <span class="a4-footer__folio">Page 02</span>
            </footer>
          </article>
        `;
      } else if (page.type === 'article') {
        const art = page.article || {};
        const isFirst = Boolean(page.isFirstPage);
        const chunkIndex = page.chunkIndex || 0;
        const totalChunks = page.totalPagesForArticle || 1;
        const pageNum = page.pageNumber || 3;
        const sanitizedContent = sanitizeHtml(page.contentHtml || art.contentHtml || '');

        const headerBlock = isFirst
          ? `
            <div class="a4-headline-block">
              <h1 class="a4-headline">${escapeHtml(art.title)}</h1>
              <div class="a4-byline-bar">
                <span class="a4-byline__prefix">Written By:</span>
                <span class="a4-byline__author">${escapeHtml(art.author || 'Editorial Staff')}</span>
                <span class="a4-byline__bullet">•</span>
                <span class="a4-byline__issue">${escapeHtml(issueConfig.magazineTitle)} • ${escapeHtml(issueConfig.date)}</span>
              </div>
            </div>
          `
          : `
            <div class="a4-continuation-bar">
              <span class="a4-continuation-title">${escapeHtml(art.title)}</span>
              <span class="a4-continuation-tag">Continued • Part ${chunkIndex + 1} of ${totalChunks}</span>
            </div>
          `;

        const folioFooter = totalChunks > 1
          ? `Page ${pageNum} (${chunkIndex + 1}/${totalChunks})`
          : `Page ${pageNum}`;

        pageInner = `
          <article class="a4-page">
            <header class="a4-header">
              <div class="a4-header__top-bar">
                <div class="a4-header__brand-group">
                  <span class="a4-header__brand-name">${escapeHtml(issueConfig.magazineTitle)}</span>
                  <span class="a4-header__issn">${escapeHtml(formatIssn(issueConfig.issn))}</span>
                </div>
                <div class="a4-header__issue-meta">
                  <span>${escapeHtml(issueConfig.volume)} | ${escapeHtml(issueConfig.issue)}</span>
                  <span class="a4-header__divider-dot">•</span>
                  <span>${escapeHtml(issueConfig.date)}</span>
                  <span class="a4-header__divider-dot">•</span>
                  <span class="a4-header__web">${escapeHtml(issueConfig.website)}</span>
                </div>
              </div>
              <div class="a4-header__rule"></div>
              <div class="a4-header__nav-row">
                <div class="a4-header__folio-group">
                  <div class="a4-folio-badge">${pageNum}</div>
                  <span class="a4-category-tag">${escapeHtml(art.category || 'FEATURE')}</span>
                </div>
                <span class="a4-header__edition">${escapeHtml(issueConfig.date)} • ${escapeHtml(issueConfig.volume)}</span>
              </div>
            </header>

            ${headerBlock}

            <section class="a4-body">
              ${
                sanitizedContent && sanitizedContent.trim()
                  ? `<div class="a4-columns">${sanitizedContent}</div>`
                  : `
                    <div class="a4-placeholder">
                      <div class="a4-placeholder__notice-card">
                        <span class="a4-placeholder__badge">Draft Article • Editorial Placeholder</span>
                        <h2 class="a4-placeholder__heading">Story Body Content Pending</h2>
                        <p class="a4-placeholder__text">This article is cataloged in the issue library. Body copy can be added or edited using the Web2Mag Editor.</p>
                      </div>
                    </div>
                  `
              }
            </section>

            <footer class="a4-footer">
              <div class="a4-footer__rule"></div>
              <div class="a4-footer__inner">
                <span class="a4-footer__copy">© 2023-2026 ${escapeHtml(issueConfig.website)}</span>
                <span class="a4-footer__center">${escapeHtml(issueConfig.magazineTitle)} • ${escapeHtml(issueConfig.date)}</span>
                <span class="a4-footer__folio">${folioFooter}</span>
              </div>
            </footer>
          </article>
        `;
      } else if (page.type === 'author') {
        const authors = page.authors || [];
        const authorCards = authors.map((author) => {
          const avatar = author.avatarUrl
            ? `<img src="${author.avatarUrl}" alt="${escapeHtml(author.name)}" class="author-avatar-img" />`
            : `<span>${getInitials(author.name)}</span>`;

          const articlePills = (author.articles || []).map((t) => `
            <span class="author-article-pill">${escapeHtml(t)}</span>
          `).join('');

          return `
            <div class="author-profile-card">
              <div class="author-avatar-frame">${avatar}</div>
              <div class="author-info">
                <div class="author-name-row">
                  <h2 class="author-name">${escapeHtml(author.name)}</h2>
                  <span class="author-role">${escapeHtml(author.role || 'Contributing Author')}</span>
                </div>
                <p class="author-bio">${escapeHtml(author.bio || '')}</p>
                ${author.articles?.length ? `
                  <div class="author-articles-list">
                    <span class="author-articles-label">Articles:</span>
                    ${articlePills}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('\n');

        pageInner = `
          <article class="a4-author-page">
            <header class="author-header">
              <div class="author-header__top-bar">
                <span class="author-header__brand">${escapeHtml(issueConfig.magazineTitle)}</span>
                <span>${escapeHtml(issueConfig.volume)} | ${escapeHtml(issueConfig.issue)} • ${escapeHtml(issueConfig.date)}</span>
                <span class="author-header__web">${escapeHtml(issueConfig.website)}</span>
              </div>
              <div class="author-header__rule"></div>
              <div class="author-title-row">
                <h1 class="author-title">About the Authors</h1>
                <span class="author-section-tag">Contributor Spotlight</span>
              </div>
            </header>
            <main class="author-body">
              <div class="author-cards-list">${authorCards}</div>
            </main>
            <footer class="author-footer">
              <span>© ${escapeHtml(issueConfig.website)}</span>
              <span>${escapeHtml(issueConfig.magazineTitle)} • ${escapeHtml(issueConfig.date)}</span>
              <span class="a4-footer__folio">Page ${page.pageNumber || ''}</span>
            </footer>
          </article>
        `;
      }

      return `<div class="print-sheet">${pageInner}</div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(issueConfig.magazineTitle || 'Magazine Issue')}</title>
  <style>${css}</style>
</head>
<body>
${renderedPagesHtml}
</body>
</html>`;
}

/**
 * Renders a full magazine issue to a vector A4 PDF using Puppeteer.
 *
 * @param {Array<object>} pages - Magazine pages array
 * @param {object} issueConfig - Dynamic issue configuration
 * @returns {Promise<Buffer>} Vector PDF binary buffer
 */
export async function renderIssueToPdf(pages = [], issueConfig = {}) {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('Cannot export PDF: No magazine pages provided.');
  }

  const html = buildIssuePrintHtml(pages, issueConfig);
  const executablePath = getChromeExecutablePath();

  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();

    // High DPI viewport for crisp vector and raster rendering
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    // Load full issue HTML
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    // Wait for images to load with a safe timeout so offline/slow remote assets never stall export
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      const imgPromises = images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        });
      });
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 4000));
      await Promise.race([Promise.all(imgPromises), timeoutPromise]);
    });

    // Render exact vector A4 PDF
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}

export default renderIssueToPdf;
