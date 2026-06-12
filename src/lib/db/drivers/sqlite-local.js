import Database from 'better-sqlite3';
import path from 'path';

let dbInstance = null;

/**
 * Initializes/returns the local SQLite database connection pool.
 * Sets up schemas if they do not exist.
 */
export function getLocalDb() {
  if (dbInstance) return dbInstance;

  // Store SQLite database in the root folder for simplicity
  const dbPath = path.resolve(process.cwd(), 'database.sqlite');
  const db = new Database(dbPath);

  // Enable WAL mode for high concurrency
  db.pragma('journal_mode = WAL');

  // Initialize Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      org_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      chunks TEXT NOT NULL,
      search_index TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      org_id TEXT PRIMARY KEY,
      llm_provider TEXT,
      active_model TEXT,
      encrypted_llm_key TEXT,
      db_provider TEXT,
      encrypted_db_credentials TEXT,
      telegram_token TEXT,
      whatsapp_config TEXT,
      employee_access_code_hash TEXT,
      pinecone_enabled INTEGER DEFAULT 0,
      encrypted_pinecone_key TEXT,
      pinecone_host TEXT,
      embedding_provider TEXT DEFAULT 'in-process',
      encrypted_embedding_key TEXT,
      embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2',
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      history TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  // Run migrations for settings columns if they don't exist
  const tableInfo = db.prepare("PRAGMA table_info(settings)").all();
  const columns = tableInfo.map(c => c.name);
  if (!columns.includes('employee_access_code_hash')) {
    db.exec("ALTER TABLE settings ADD COLUMN employee_access_code_hash TEXT;");
  }
  if (!columns.includes('pinecone_enabled')) {
    db.exec("ALTER TABLE settings ADD COLUMN pinecone_enabled INTEGER DEFAULT 0;");
  }
  if (!columns.includes('encrypted_pinecone_key')) {
    db.exec("ALTER TABLE settings ADD COLUMN encrypted_pinecone_key TEXT;");
  }
  if (!columns.includes('pinecone_host')) {
    db.exec("ALTER TABLE settings ADD COLUMN pinecone_host TEXT;");
  }
  if (!columns.includes('embedding_provider')) {
    db.exec("ALTER TABLE settings ADD COLUMN embedding_provider TEXT DEFAULT 'in-process';");
  }
  if (!columns.includes('encrypted_embedding_key')) {
    db.exec("ALTER TABLE settings ADD COLUMN encrypted_embedding_key TEXT;");
  }
  if (!columns.includes('embedding_model')) {
    db.exec("ALTER TABLE settings ADD COLUMN embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2';");
  }

  // Migration checks for categories (recreate without old cipher columns if they exist)
  const catInfo = db.prepare("PRAGMA table_info(categories)").all();
  const catCols = catInfo.map(c => c.name);
  if (catCols.includes('name_ciphertext')) {
    db.exec("ALTER TABLE categories RENAME TO old_categories;");
    db.exec(`
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      INSERT INTO categories (id, org_id, name, description, created_at)
      SELECT id, org_id, COALESCE(name, ''), COALESCE(description, ''), created_at
      FROM old_categories;
    `);
    db.exec("DROP TABLE old_categories;");
  } else {
    if (!catCols.includes('name')) db.exec("ALTER TABLE categories ADD COLUMN name TEXT DEFAULT '';");
    if (!catCols.includes('description')) db.exec("ALTER TABLE categories ADD COLUMN description TEXT DEFAULT '';");
  }

  // Migration checks for documents (recreate without old cipher columns if they exist)
  const docInfo = db.prepare("PRAGMA table_info(documents)").all();
  const docCols = docInfo.map(c => c.name);
  if (docCols.includes('name_ciphertext')) {
    db.exec("ALTER TABLE documents RENAME TO old_documents;");
    db.exec(`
      CREATE TABLE documents (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        chunks TEXT NOT NULL,
        search_index TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      INSERT INTO documents (id, org_id, category_id, name, chunks, search_index, created_at)
      SELECT id, org_id, category_id, COALESCE(name, ''), COALESCE(chunks, '[]'), COALESCE(search_index, '{}'), created_at
      FROM old_documents;
    `);
    db.exec("DROP TABLE old_documents;");
  } else {
    if (!docCols.includes('name')) db.exec("ALTER TABLE documents ADD COLUMN name TEXT DEFAULT '';");
    if (!docCols.includes('chunks')) db.exec("ALTER TABLE documents ADD COLUMN chunks TEXT DEFAULT '[]';");
    if (!docCols.includes('search_index')) db.exec("ALTER TABLE documents ADD COLUMN search_index TEXT DEFAULT '{}';");
  }

  // Migration checks for chat_sessions (recreate without old cipher columns if they exist)
  const chatSessionsInfo = db.prepare("PRAGMA table_info(chat_sessions)").all();
  const chatSessionCols = chatSessionsInfo.map(c => c.name);
  if (chatSessionCols.includes('encrypted_history')) {
    db.exec("ALTER TABLE chat_sessions RENAME TO old_chat_sessions;");
    db.exec(`
      CREATE TABLE chat_sessions (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        history TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      INSERT INTO chat_sessions (id, org_id, channel, history, is_verified, expires_at, created_at)
      SELECT id, org_id, channel, COALESCE(history, '[]'), COALESCE(is_verified, 0), expires_at, created_at
      FROM old_chat_sessions;
    `);
    db.exec("DROP TABLE old_chat_sessions;");
  } else {
    if (!chatSessionCols.includes('is_verified')) {
      db.exec("ALTER TABLE chat_sessions ADD COLUMN is_verified INTEGER DEFAULT 0;");
    }
    if (!chatSessionCols.includes('history')) {
      db.exec("ALTER TABLE chat_sessions ADD COLUMN history TEXT DEFAULT '[]';");
    }
  }

  // Helper: ensure the organization row exists before FK-dependent inserts.
  // This handles cases where the database was recreated/migrated but the
  // browser session still holds a valid orgId from a previous DB state.
  const ensureOrganization = (orgId) => {
    const existing = db.prepare('SELECT id FROM organizations WHERE id = ?').get(orgId);
    if (!existing) {
      db.prepare('INSERT OR IGNORE INTO organizations (id, name) VALUES (?, ?)').run(orgId, 'Organization');
    }
  };

  // Expose async-wrapped functions matching unified interface
  dbInstance = {
    // Basic wrappers
    get: async (sql, ...params) => db.prepare(sql).get(...params),
    all: async (sql, ...params) => db.prepare(sql).all(...params),
    run: async (sql, ...params) => db.prepare(sql).run(...params),

    // Unified CRUD Interface
    saveCategory: async (orgId, categoryId, { name, description, name_ciphertext, desc_ciphertext }) => {
      ensureOrganization(orgId);
      const catName = name !== undefined ? name : name_ciphertext;
      const catDesc = description !== undefined ? description : desc_ciphertext;
      db.prepare(`
        INSERT INTO categories (id, org_id, name, description)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description
      `).run(categoryId, orgId, catName, catDesc);
      return { id: categoryId };
    },

    getCategories: async (orgId) => {
      const rows = db.prepare('SELECT id, name, description FROM categories WHERE org_id = ?').all(orgId);
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        name_ciphertext: row.name,
        desc_ciphertext: row.description
      }));
    },

    deleteCategory: async (orgId, categoryId) => {
      db.prepare('DELETE FROM categories WHERE id = ? AND org_id = ?').run(categoryId, orgId);
      return { success: true };
    },

    saveDocument: async (orgId, documentId, { category_id, name, chunks, search_index, name_ciphertext, encrypted_chunks, encrypted_search_index }) => {
      ensureOrganization(orgId);
      const docName = name !== undefined ? name : name_ciphertext;
      const docChunks = chunks !== undefined ? chunks : encrypted_chunks;
      const docSearchIndex = search_index !== undefined ? search_index : encrypted_search_index;
      const chunksStr = typeof docChunks === 'string' ? docChunks : JSON.stringify(docChunks);
      const searchIndexStr = typeof docSearchIndex === 'string' ? docSearchIndex : JSON.stringify(docSearchIndex);
      db.prepare(`
        INSERT INTO documents (id, org_id, category_id, name, chunks, search_index)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          category_id = excluded.category_id,
          name = excluded.name,
          chunks = excluded.chunks,
          search_index = excluded.search_index
      `).run(documentId, orgId, category_id, docName, chunksStr, searchIndexStr);
      return { id: documentId };
    },

    getDocuments: async (orgId, categoryId) => {
      let rows;
      if (categoryId) {
        rows = db.prepare('SELECT id, category_id, name, chunks, search_index FROM documents WHERE org_id = ? AND category_id = ?').all(orgId, categoryId);
      } else {
        rows = db.prepare('SELECT id, category_id, name, chunks, search_index FROM documents WHERE org_id = ?').all(orgId);
      }
      return rows.map(row => ({
        id: row.id,
        category_id: row.category_id,
        name: row.name,
        chunks: row.chunks,
        search_index: row.search_index,
        name_ciphertext: row.name,
        encrypted_chunks: row.chunks,
        encrypted_search_index: row.search_index
      }));
    },

    deleteDocument: async (orgId, documentId) => {
      db.prepare('DELETE FROM documents WHERE id = ? AND org_id = ?').run(documentId, orgId);
      return { success: true };
    },

    saveChatSession: async (orgId, sessionId, { channel, history, is_verified, expires_at, encrypted_history }) => {
      ensureOrganization(orgId);
      const docHistory = history !== undefined ? history : encrypted_history;
      const historyStr = typeof docHistory === 'string' ? docHistory : JSON.stringify(docHistory);
      db.prepare(`
        INSERT INTO chat_sessions (id, org_id, channel, history, is_verified, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          history = excluded.history,
          is_verified = COALESCE(excluded.is_verified, chat_sessions.is_verified),
          expires_at = excluded.expires_at
      `).run(sessionId, orgId, channel, historyStr, is_verified !== undefined ? is_verified : 0, expires_at);
      return { id: sessionId };
    },

    getChatSession: async (orgId, sessionId) => {
      const row = db.prepare('SELECT id, channel, history, is_verified, expires_at FROM chat_sessions WHERE id = ? AND org_id = ?').get(sessionId, orgId);
      if (!row) return null;
      return {
        id: row.id,
        channel: row.channel,
        history: row.history,
        encrypted_history: row.history,
        is_verified: row.is_verified,
        expires_at: row.expires_at
      };
    },

    getChatSessions: async (orgId) => {
      const rows = db.prepare('SELECT id, channel, history, created_at, expires_at FROM chat_sessions WHERE org_id = ? ORDER BY created_at DESC').all(orgId);
      return rows.map(row => ({
        id: row.id,
        channel: row.channel,
        history: row.history,
        encrypted_history: row.history,
        created_at: row.created_at,
        expires_at: row.expires_at
      }));
    },

    cleanupChatSessions: async (orgId, cutoffDate) => {
      const result = db.prepare('DELETE FROM chat_sessions WHERE org_id = ? AND created_at < ?').run(orgId, cutoffDate);
      return { deletedCount: result.changes };
    }
  };

  return dbInstance;
}

export async function initialize(config) {
  // Config ignored for local SQLite since it runs from a local static file
  return getLocalDb();
}
