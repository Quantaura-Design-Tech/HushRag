const Database = require('better-sqlite3');
const path = require('path');

function inspect() {
  const dbPath = path.resolve(__dirname, '../database.sqlite');
  const db = new Database(dbPath);
  
  const tables = ['categories', 'documents', 'chat_sessions', 'settings'];
  
  for (const table of tables) {
    try {
      const info = db.prepare(`PRAGMA table_info(${table})`).all();
      console.log(`Table "${table}":`);
      info.forEach(col => {
        console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'} (Default: ${col.dflt_value})`);
      });
    } catch (e) {
      console.log(`Table "${table}" does not exist or failed to inspect:`, e.message);
    }
  }
}

inspect();
