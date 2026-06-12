import pg from 'pg';

const { Pool } = pg;

export async function initialize(credentials) {
  const { connectionString } = credentials;
  if (!connectionString) {
    throw new Error('Supabase/PostgreSQL connection requires a connectionString.');
  }

  const pool = new Pool({
    connectionString,
    // Add SSL support for Supabase since it's hosted in the cloud
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });

  // Automatically initialize tables in the user's PostgreSQL database
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        org_id VARCHAR(255) NOT NULL,
        name_ciphertext TEXT NOT NULL,
        desc_ciphertext TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        org_id VARCHAR(255) NOT NULL,
        category_id VARCHAR(255) NOT NULL,
        name_ciphertext TEXT NOT NULL,
        encrypted_chunks TEXT NOT NULL,
        encrypted_search_index TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(255) PRIMARY KEY,
        org_id VARCHAR(255) NOT NULL,
        channel VARCHAR(255) NOT NULL,
        encrypted_history TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );
    `);
  } finally {
    client.release();
  }

  return {
    saveCategory: async (orgId, categoryId, { name_ciphertext, desc_ciphertext }) => {
      await pool.query(`
        INSERT INTO categories (id, org_id, name_ciphertext, desc_ciphertext)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          name_ciphertext = EXCLUDED.name_ciphertext,
          desc_ciphertext = EXCLUDED.desc_ciphertext
      `, [categoryId, orgId, name_ciphertext, desc_ciphertext]);
      return { id: categoryId };
    },

    getCategories: async (orgId) => {
      const result = await pool.query('SELECT id, name_ciphertext, desc_ciphertext FROM categories WHERE org_id = $1', [orgId]);
      return result.rows.map(row => ({
        id: row.id,
        name_ciphertext: row.name_ciphertext,
        desc_ciphertext: row.desc_ciphertext
      }));
    },

    deleteCategory: async (orgId, categoryId) => {
      await pool.query('DELETE FROM categories WHERE id = $1 AND org_id = $2', [categoryId, orgId]);
      return { success: true };
    },

    saveDocument: async (orgId, documentId, { category_id, name_ciphertext, encrypted_chunks, encrypted_search_index }) => {
      await pool.query(`
        INSERT INTO documents (id, org_id, category_id, name_ciphertext, encrypted_chunks, encrypted_search_index)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          category_id = EXCLUDED.category_id,
          name_ciphertext = EXCLUDED.name_ciphertext,
          encrypted_chunks = EXCLUDED.encrypted_chunks,
          encrypted_search_index = EXCLUDED.encrypted_search_index
      `, [documentId, orgId, category_id, name_ciphertext, encrypted_chunks, encrypted_search_index]);
      return { id: documentId };
    },

    getDocuments: async (orgId, categoryId) => {
      let result;
      if (categoryId) {
        result = await pool.query('SELECT id, category_id, name_ciphertext, encrypted_chunks, encrypted_search_index FROM documents WHERE org_id = $1 AND category_id = $2', [orgId, categoryId]);
      } else {
        result = await pool.query('SELECT id, category_id, name_ciphertext, encrypted_chunks, encrypted_search_index FROM documents WHERE org_id = $1', [orgId]);
      }
      return result.rows.map(row => ({
        id: row.id,
        category_id: row.category_id,
        name_ciphertext: row.name_ciphertext,
        encrypted_chunks: row.encrypted_chunks,
        encrypted_search_index: row.encrypted_search_index
      }));
    },

    deleteDocument: async (orgId, documentId) => {
      await pool.query('DELETE FROM documents WHERE id = $1 AND org_id = $2', [documentId, orgId]);
      return { success: true };
    },

    saveChatSession: async (orgId, sessionId, { channel, encrypted_history, expires_at }) => {
      await pool.query(`
        INSERT INTO chat_sessions (id, org_id, channel, encrypted_history, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          encrypted_history = EXCLUDED.encrypted_history,
          expires_at = EXCLUDED.expires_at
      `, [sessionId, orgId, channel, encrypted_history, new Date(expires_at)]);
      return { id: sessionId };
    },

    getChatSession: async (orgId, sessionId) => {
      const result = await pool.query('SELECT id, channel, encrypted_history, expires_at FROM chat_sessions WHERE id = $1 AND org_id = $2', [sessionId, orgId]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        channel: row.channel,
        encrypted_history: row.encrypted_history,
        expires_at: row.expires_at.toISOString()
      };
    },

    getChatSessions: async (orgId) => {
      const result = await pool.query('SELECT id, channel, encrypted_history, created_at, expires_at FROM chat_sessions WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
      return result.rows.map(row => ({
        id: row.id,
        channel: row.channel,
        encrypted_history: row.encrypted_history,
        created_at: row.created_at.toISOString(),
        expires_at: row.expires_at.toISOString()
      }));
    },

    cleanupChatSessions: async (orgId, cutoffDate) => {
      const result = await pool.query('DELETE FROM chat_sessions WHERE org_id = $1 AND created_at < $2', [orgId, new Date(cutoffDate)]);
      return { deletedCount: result.rowCount };
    }
  };
}
