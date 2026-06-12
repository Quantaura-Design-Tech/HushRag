const Database = require('better-sqlite3');
const path = require('path');

function check() {
  const dbPath = path.resolve(__dirname, '../database.sqlite');
  const db = new Database(dbPath);
  
  const queries = {
    organizations: 'SELECT COUNT(*) as count FROM organizations',
    users: 'SELECT COUNT(*) as count FROM users',
    categories: 'SELECT COUNT(*) as count FROM categories',
    documents: 'SELECT COUNT(*) as count FROM documents',
    settings: 'SELECT COUNT(*) as count FROM settings'
  };
  
  for (const [table, sql] of Object.entries(queries)) {
    try {
      const row = db.prepare(sql).get();
      console.log(`Table "${table}" row count: ${row.count}`);
      if (row.count > 0 && table !== 'users') {
        const rows = db.prepare(`SELECT * FROM ${table} LIMIT 2`).all();
        console.log(`  Sample rows:`, JSON.stringify(rows, null, 2));
      }
    } catch (e) {
      console.log(`Failed to query table "${table}":`, e.message);
    }
  }
}

check();
