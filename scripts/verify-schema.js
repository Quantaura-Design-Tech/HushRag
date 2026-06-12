const Database = require('better-sqlite3');
const path = require('path');

async function test() {
  console.log('Running SQLite migrations on database.sqlite and verifying...');
  try {
    const dbPath = path.resolve(__dirname, '../database.sqlite');
    const db = new Database(dbPath);
    
    // Run the migrations exactly as specified in the sqlite-local driver
    const tableInfo = db.prepare("PRAGMA table_info(settings)").all();
    const columns = tableInfo.map(c => c.name);
    
    if (!columns.includes('employee_access_code_hash')) {
      db.exec("ALTER TABLE settings ADD COLUMN employee_access_code_hash TEXT;");
      console.log('Added column: employee_access_code_hash');
    }
    if (!columns.includes('pinecone_enabled')) {
      db.exec("ALTER TABLE settings ADD COLUMN pinecone_enabled INTEGER DEFAULT 0;");
      console.log('Added column: pinecone_enabled');
    }
    if (!columns.includes('encrypted_pinecone_key')) {
      db.exec("ALTER TABLE settings ADD COLUMN encrypted_pinecone_key TEXT;");
      console.log('Added column: encrypted_pinecone_key');
    }
    if (!columns.includes('pinecone_host')) {
      db.exec("ALTER TABLE settings ADD COLUMN pinecone_host TEXT;");
      console.log('Added column: pinecone_host');
    }
    if (!columns.includes('embedding_provider')) {
      db.exec("ALTER TABLE settings ADD COLUMN embedding_provider TEXT DEFAULT 'in-process';");
      console.log('Added column: embedding_provider');
    }
    if (!columns.includes('encrypted_embedding_key')) {
      db.exec("ALTER TABLE settings ADD COLUMN encrypted_embedding_key TEXT;");
      console.log('Added column: encrypted_embedding_key');
    }
    if (!columns.includes('embedding_model')) {
      db.exec("ALTER TABLE settings ADD COLUMN embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2';");
      console.log('Added column: embedding_model');
    }
    
    // Verify columns exist now
    const updatedTableInfo = db.prepare("PRAGMA table_info(settings)").all();
    const updatedColumns = updatedTableInfo.map(c => c.name);
    
    const requiredCols = [
      'pinecone_enabled',
      'encrypted_pinecone_key',
      'pinecone_host',
      'embedding_provider',
      'encrypted_embedding_key',
      'embedding_model'
    ];
    
    for (const col of requiredCols) {
      if (updatedColumns.includes(col)) {
        console.log(`✓ settings table contains column: ${col}`);
      } else {
        throw new Error(`Missing column: ${col}`);
      }
    }
    
    console.log('✓ SQLite database successfully migrated and verified!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Schema verification failed:', err);
    process.exit(1);
  }
}

test();
