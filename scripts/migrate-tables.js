const Database = require('better-sqlite3');
const path = require('path');

function migrate() {
  const dbPath = path.resolve(__dirname, '../database.sqlite');
  const db = new Database(dbPath);
  
  console.log("Migrating tables directly...");
  
  // categories
  const catCols = db.prepare("PRAGMA table_info(categories)").all().map(c => c.name);
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
    console.log("✓ categories table recreated and clean.");
  }
  
  // documents
  const docCols = db.prepare("PRAGMA table_info(documents)").all().map(c => c.name);
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
    console.log("✓ documents table recreated and clean.");
  }
  
  // chat_sessions
  const chatSessionCols = db.prepare("PRAGMA table_info(chat_sessions)").all().map(c => c.name);
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
    console.log("✓ chat_sessions table recreated and clean.");
  }
  
  console.log("Migration complete!");
}

migrate();
