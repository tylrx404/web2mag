import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'web2mag',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool = null;
let isDbConnected = false;
let dbInitError = null;

/**
 * Initializes MySQL database connection and executes schema migrations.
 * Falls back safely to in-memory persistence if MySQL is unconfigured or unreachable.
 */
export async function initDatabase() {
  console.log(`[Database] Attempting connection to MySQL at ${DB_CONFIG.host}:${DB_CONFIG.port} (user: ${DB_CONFIG.user}, db: ${DB_CONFIG.database})...`);

  try {
    // 1. First probe without database to ensure DB exists
    const rootConnection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    });

    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await rootConnection.end();

    // 2. Create Connection Pool
    pool = mysql.createPool(DB_CONFIG);

    // 3. Verify pool connection
    const testConn = await pool.getConnection();
    await testConn.ping();
    testConn.release();

    // 4. Run Table Creation Migrations
    await executeSchemaMigrations(pool);

    isDbConnected = true;
    dbInitError = null;
    console.log('[Database] MySQL connection established and schema verified successfully.');
    return { success: true, connected: true };
  } catch (err) {
    isDbConnected = false;
    dbInitError = err.message;
    console.warn(`[Database] MySQL unavailable (${err.message}). Activating in-memory store for session operations.`);
    return { success: false, connected: false, error: err.message };
  }
}

/**
 * Executes schema table creation queries.
 * @param {mysql.Pool} targetPool
 */
async function executeSchemaMigrations(targetPool) {
  // 1. magazine_issues
  await targetPool.query(`
    CREATE TABLE IF NOT EXISTS \`magazine_issues\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`title\` VARCHAR(255) NOT NULL DEFAULT 'Web2Mag Magazine',
      \`volume_number\` VARCHAR(50) DEFAULT '1',
      \`issue_number\` VARCHAR(50) DEFAULT '1',
      \`publication_date\` VARCHAR(100) DEFAULT '',
      \`logo_path\` TEXT,
      \`accent_color\` VARCHAR(20) DEFAULT '#2563eb',
      \`header_text\` VARCHAR(255) DEFAULT '',
      \`footer_text\` VARCHAR(255) DEFAULT '',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. articles
  await targetPool.query(`
    CREATE TABLE IF NOT EXISTS \`articles\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`title\` VARCHAR(500) NOT NULL,
      \`author\` VARCHAR(255) DEFAULT 'Editorial Staff',
      \`source_url\` TEXT,
      \`publication_date\` VARCHAR(100) DEFAULT '',
      \`extracted_content\` JSON,
      \`edited_content\` JSON,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. issue_articles
  await targetPool.query(`
    CREATE TABLE IF NOT EXISTS \`issue_articles\` (
      \`id\` INT AUTO_INCREMENT NOT NULL,
      \`issue_id\` VARCHAR(64) NOT NULL,
      \`article_id\` VARCHAR(64) NOT NULL,
      \`display_order\` INT NOT NULL DEFAULT 0,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_issue_article\` (\`issue_id\`, \`article_id\`),
      INDEX \`idx_issue_order\` (\`issue_id\`, \`display_order\`),
      CONSTRAINT \`fk_issue_articles_issue\` FOREIGN KEY (\`issue_id\`) REFERENCES \`magazine_issues\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_issue_articles_article\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. page_layouts
  await targetPool.query(`
    CREATE TABLE IF NOT EXISTS \`page_layouts\` (
      \`id\` INT AUTO_INCREMENT NOT NULL,
      \`issue_id\` VARCHAR(64) NOT NULL,
      \`article_id\` VARCHAR(64) NOT NULL,
      \`page_number\` INT NOT NULL,
      \`layout_data\` JSON,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_issue_article_page\` (\`issue_id\`, \`article_id\`, \`page_number\`),
      INDEX \`idx_page_lookup\` (\`issue_id\`, \`article_id\`, \`page_number\`),
      CONSTRAINT \`fk_page_layouts_issue\` FOREIGN KEY (\`issue_id\`) REFERENCES \`magazine_issues\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_page_layouts_article\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/**
 * Returns database health and connectivity status.
 */
export function getDbStatus() {
  return {
    connected: isDbConnected,
    mode: isDbConnected ? 'mysql' : 'memory',
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.user,
    error: dbInitError,
  };
}

/**
 * Parameterized database query execution.
 * @param {string} sql
 * @param {any[]} [params]
 */
export async function query(sql, params = []) {
  if (!pool || !isDbConnected) {
    throw new Error('MySQL connection pool is not active');
  }
  return pool.query(sql, params);
}

/**
 * Direct access to the pool instance.
 */
export function getPool() {
  return pool;
}
