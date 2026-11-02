import { getDbStatus, query } from '../config/db.js';

/**
 * In-memory fallback stores when MySQL is offline.
 */
const memoryStore = {
  issues: new Map([
    [
      'default-issue-1',
      {
        id: 'default-issue-1',
        title: 'Web2Mag Magazine',
        volume_number: '1',
        issue_number: '1',
        publication_date: 'Fall 2026',
        logo_path: '',
        accent_color: '#2563eb',
        header_text: 'WEB2MAG • ISSN (ONLINE): 2584-2749',
        footer_text: '© 2026 Web2Mag • All rights reserved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  ]),
  articles: new Map(),
  issueArticles: new Map(), // issueId -> [{ article_id, display_order }]
  pageLayouts: new Map(), // `${issueId}:${articleId}` -> [{ page_number, layout_data }]
};

// ============================================================================
// MAGAZINE ISSUES CRUD
// ============================================================================

export async function getAllIssues() {
  const { connected } = getDbStatus();

  if (connected) {
    try {
      const [rows] = await query(
        'SELECT * FROM `magazine_issues` ORDER BY `created_at` DESC'
      );
      return rows;
    } catch (err) {
      console.warn('[DB Storage] Error querying issues, using memory store:', err.message);
    }
  }

  return Array.from(memoryStore.issues.values());
}

export async function getIssueById(issueId) {
  const { connected } = getDbStatus();

  if (connected) {
    try {
      const [rows] = await query(
        'SELECT * FROM `magazine_issues` WHERE `id` = ?',
        [issueId]
      );
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn('[DB Storage] Error getting issue by id, checking memory store:', err.message);
    }
  }

  return memoryStore.issues.get(issueId) || null;
}

export async function createOrUpdateIssue(issueData) {
  const { connected } = getDbStatus();
  const id = issueData.id || `issue-${Date.now()}`;
  const title = issueData.title || 'Web2Mag Magazine';
  const volumeNumber = String(issueData.volumeNumber ?? issueData.volume_number ?? '1');
  const issueNumber = String(issueData.issueNumber ?? issueData.issue_number ?? '1');
  const publicationDate = String(issueData.publicationDate ?? issueData.publication_date ?? '');
  const logoPath = issueData.logoPath ?? issueData.logo_path ?? '';
  const accentColor = issueData.accentColor ?? issueData.accent_color ?? '#2563eb';
  const headerText = issueData.headerText ?? issueData.header_text ?? '';
  const footerText = issueData.footerText ?? issueData.footer_text ?? '';

  if (connected) {
    try {
      const sql = `
        INSERT INTO \`magazine_issues\` (
          \`id\`, \`title\`, \`volume_number\`, \`issue_number\`, \`publication_date\`,
          \`logo_path\`, \`accent_color\`, \`header_text\`, \`footer_text\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          \`title\` = VALUES(\`title\`),
          \`volume_number\` = VALUES(\`volume_number\`),
          \`issue_number\` = VALUES(\`issue_number\`),
          \`publication_date\` = VALUES(\`publication_date\`),
          \`logo_path\` = VALUES(\`logo_path\`),
          \`accent_color\` = VALUES(\`accent_color\`),
          \`header_text\` = VALUES(\`header_text\`),
          \`footer_text\` = VALUES(\`footer_text\`);
      `;

      await query(sql, [
        id,
        title,
        volumeNumber,
        issueNumber,
        publicationDate,
        logoPath,
        accentColor,
        headerText,
        footerText,
      ]);

      return getIssueById(id);
    } catch (err) {
      console.warn('[DB Storage] Error saving issue to MySQL:', err.message);
    }
  }

  // Memory store fallback
  const record = {
    id,
    title,
    volume_number: volumeNumber,
    issue_number: issueNumber,
    publication_date: publicationDate,
    logo_path: logoPath,
    accent_color: accentColor,
    header_text: headerText,
    footer_text: footerText,
    created_at: memoryStore.issues.get(id)?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.issues.set(id, record);
  return record;
}

export async function deleteIssue(issueId) {
  const { connected } = getDbStatus();

  if (connected) {
    try {
      await query('DELETE FROM `magazine_issues` WHERE `id` = ?', [issueId]);
    } catch (err) {
      console.warn('[DB Storage] Error deleting issue from MySQL:', err.message);
    }
  }

  memoryStore.issues.delete(issueId);
  memoryStore.issueArticles.delete(issueId);
  return { success: true };
}

// ============================================================================
// ARTICLES CRUD
// ============================================================================

export async function getAllArticles() {
  const { connected } = getDbStatus();

  if (connected) {
    try {
      const [rows] = await query('SELECT * FROM `articles` ORDER BY `created_at` DESC');
      return rows.map(deserializeArticleRow);
    } catch (err) {
      console.warn('[DB Storage] Error querying articles, using memory store:', err.message);
    }
  }

  return Array.from(memoryStore.articles.values());
}

export async function getArticleById(articleId) {
  const { connected } = getDbStatus();

  if (connected) {
    try {
      const [rows] = await query('SELECT * FROM `articles` WHERE `id` = ?', [articleId]);
      if (rows && rows.length > 0) {
        return deserializeArticleRow(rows[0]);
      }
    } catch (err) {
      console.warn('[DB Storage] Error getting article by id:', err.message);
    }
  }

  return memoryStore.articles.get(articleId) || null;
}

export async function saveOrUpdateArticle(article) {
  const { connected } = getDbStatus();
  const id = article.id || `art-${Date.now()}`;
  const title = article.title || 'Untitled Article';
  const author = article.author || 'Editorial Staff';
  const sourceUrl = article.sourceUrl || article.source_url || '';
  const publicationDate = article.formattedDate || article.date || article.publication_date || '';

  const extractedContent = JSON.stringify(article.extractedContent || article.sections || []);
  const editedContent = JSON.stringify(article.editedContent || article.sections || []);

  if (connected) {
    try {
      const sql = `
        INSERT INTO \`articles\` (
          \`id\`, \`title\`, \`author\`, \`source_url\`, \`publication_date\`,
          \`extracted_content\`, \`edited_content\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          \`title\` = VALUES(\`title\`),
          \`author\` = VALUES(\`author\`),
          \`source_url\` = VALUES(\`source_url\`),
          \`publication_date\` = VALUES(\`publication_date\`),
          \`extracted_content\` = VALUES(\`extracted_content\`),
          \`edited_content\` = VALUES(\`edited_content\`);
      `;

      await query(sql, [
        id,
        title,
        author,
        sourceUrl,
        publicationDate,
        extractedContent,
        editedContent,
      ]);

      return getArticleById(id);
    } catch (err) {
      console.warn('[DB Storage] Error saving article to MySQL:', err.message);
    }
  }

  // Memory store fallback
  const record = {
    id,
    title,
    author,
    source_url: sourceUrl,
    sourceUrl,
    publication_date: publicationDate,
    formattedDate: publicationDate,
    category: article.category || 'Feature',
    summary: article.summary || '',
    thumbnail: article.thumbnail || '',
    sections: article.sections || [],
    extracted_content: article.extractedContent || article.sections || [],
    edited_content: article.editedContent || article.sections || [],
    created_at: memoryStore.articles.get(id)?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryStore.articles.set(id, record);
  return record;
}

export async function deleteArticle(articleId) {
  const { connected } = getDbStatus();

  if (connected) {
    try {
      await query('DELETE FROM `articles` WHERE `id` = ?', [articleId]);
    } catch (err) {
      console.warn('[DB Storage] Error deleting article from MySQL:', err.message);
    }
  }

  memoryStore.articles.delete(articleId);
  return { success: true };
}

// ============================================================================
// ISSUE ARTICLES MAPPING & ORDERING
// ============================================================================

export async function getIssueArticles(issueId) {
  const { connected } = getDbStatus();

  if (connected) {
    try {
      const sql = `
        SELECT a.*, ia.display_order
        FROM \`issue_articles\` ia
        JOIN \`articles\` a ON ia.article_id = a.id
        WHERE ia.issue_id = ?
        ORDER BY ia.display_order ASC;
      `;
      const [rows] = await query(sql, [issueId]);
      return rows.map(deserializeArticleRow);
    } catch (err) {
      console.warn('[DB Storage] Error fetching issue articles from MySQL:', err.message);
    }
  }

  const mappings = memoryStore.issueArticles.get(issueId) || [];
  return mappings
    .sort((a, b) => a.display_order - b.display_order)
    .map((m) => memoryStore.articles.get(m.article_id))
    .filter(Boolean);
}

export async function setIssueArticles(issueId, articleOrders) {
  // articleOrders: Array<{ articleId: string, displayOrder: number }>
  const { connected } = getDbStatus();

  if (connected) {
    try {
      await query('DELETE FROM \`issue_articles\` WHERE \`issue_id\` = ?', [issueId]);

      if (articleOrders && articleOrders.length > 0) {
        const values = articleOrders.map((item, idx) => [
          issueId,
          item.articleId || item.article_id || item.id,
          item.displayOrder ?? idx,
        ]);

        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatParams = values.flat();

        await query(
          `INSERT INTO \`issue_articles\` (\`issue_id\`, \`article_id\`, \`display_order\`) VALUES ${placeholders}`,
          flatParams
        );
      }
      return { success: true };
    } catch (err) {
      console.warn('[DB Storage] Error setting issue articles in MySQL:', err.message);
    }
  }

  const mapped = (articleOrders || []).map((item, idx) => ({
    article_id: item.articleId || item.article_id || item.id,
    display_order: item.displayOrder ?? idx,
  }));
  memoryStore.issueArticles.set(issueId, mapped);
  return { success: true };
}

// ============================================================================
// PAGE LAYOUTS CRUD
// ============================================================================

export async function getPageLayouts(issueId, articleId) {
  const { connected } = getDbStatus();

  if (connected) {
    try {
      const sql = `
        SELECT * FROM \`page_layouts\`
        WHERE \`issue_id\` = ? AND \`article_id\` = ?
        ORDER BY \`page_number\` ASC;
      `;
      const [rows] = await query(sql, [issueId, articleId]);
      return rows.map((r) => ({
        ...r,
        layout_data: typeof r.layout_data === 'string' ? JSON.parse(r.layout_data) : r.layout_data,
      }));
    } catch (err) {
      console.warn('[DB Storage] Error fetching page layouts:', err.message);
    }
  }

  const key = `${issueId}:${articleId}`;
  return memoryStore.pageLayouts.get(key) || [];
}

export async function savePageLayouts(issueId, articleId, layouts) {
  const { connected } = getDbStatus();

  if (connected) {
    try {
      await query(
        'DELETE FROM \`page_layouts\` WHERE \`issue_id\` = ? AND \`article_id\` = ?',
        [issueId, articleId]
      );

      if (layouts && layouts.length > 0) {
        for (const l of layouts) {
          const pageNum = l.pageNumber || l.page_number || 1;
          const layoutJson = JSON.stringify(l.layoutData || l.layout_data || l);
          await query(
            `INSERT INTO \`page_layouts\` (\`issue_id\`, \`article_id\`, \`page_number\`, \`layout_data\`)
             VALUES (?, ?, ?, ?)`,
            [issueId, articleId, pageNum, layoutJson]
          );
        }
      }
      return { success: true };
    } catch (err) {
      console.warn('[DB Storage] Error saving page layouts to MySQL:', err.message);
    }
  }

  const key = `${issueId}:${articleId}`;
  const mapped = (layouts || []).map((l, idx) => ({
    issue_id: issueId,
    article_id: articleId,
    page_number: l.pageNumber || l.page_number || idx + 1,
    layout_data: l.layoutData || l.layout_data || l,
  }));
  memoryStore.pageLayouts.set(key, mapped);
  return { success: true };
}

// ============================================================================
// ATOMIC COMPLETE SAVE ENDPOINT
// ============================================================================

export async function saveCompleteIssueState({ issue, articles = [], layouts = [] }) {
  if (!issue || !issue.id) {
    throw new Error('Valid issue object with ID is required');
  }

  // 1. Save or update Issue metadata
  const savedIssue = await createOrUpdateIssue(issue);

  // 2. Save individual articles
  for (const art of articles) {
    await saveOrUpdateArticle(art);
  }

  // 3. Map articles to issue with ordering
  const articleOrders = articles.map((art, idx) => ({
    articleId: art.id,
    displayOrder: idx,
  }));
  await setIssueArticles(issue.id, articleOrders);

  // 4. Save Page Layouts if provided
  if (layouts && layouts.length > 0) {
    // Group layouts by articleId
    const layoutsByArticle = new Map();
    for (const l of layouts) {
      const aId = l.articleId || l.article_id || articles[0]?.id;
      if (aId) {
        if (!layoutsByArticle.has(aId)) layoutsByArticle.set(aId, []);
        layoutsByArticle.get(aId).push(l);
      }
    }

    for (const [aId, artLayouts] of layoutsByArticle.entries()) {
      await savePageLayouts(issue.id, aId, artLayouts);
    }
  }

  return {
    success: true,
    issue: savedIssue,
    articlesCount: articles.length,
    layoutsSaved: layouts.length,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function deserializeArticleRow(row) {
  if (!row) return null;

  let extracted = [];
  let edited = [];

  try {
    extracted = typeof row.extracted_content === 'string'
      ? JSON.parse(row.extracted_content)
      : row.extracted_content || [];
  } catch {}

  try {
    edited = typeof row.edited_content === 'string'
      ? JSON.parse(row.edited_content)
      : row.edited_content || [];
  } catch {}

  const sections = (edited && edited.length > 0) ? edited : extracted;

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    sourceUrl: row.source_url,
    source_url: row.source_url,
    formattedDate: row.publication_date,
    date: row.publication_date,
    publication_date: row.publication_date,
    category: row.category || 'Feature',
    summary: row.summary || (sections.find((s) => s.type === 'paragraph')?.content?.slice(0, 200) || ''),
    thumbnail: row.thumbnail || (sections.find((s) => s.type === 'image')?.src || ''),
    sections,
    extracted_content: extracted,
    edited_content: edited,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
