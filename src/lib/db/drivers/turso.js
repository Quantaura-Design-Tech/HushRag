import { createClient } from '@libsql/client';

export async function initialize(credentials) {
  const { url, authToken } = credentials;
  if (!url || !authToken) {
    throw new Error('Turso connection requires url and authToken credentials.');
  }

  const client = createClient({
    url,
    authToken,
  });

  // Automatically initialize tables in the user's Turso database if they don't exist
  await client.batch([
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      name_ciphertext TEXT NOT NULL,
      desc_ciphertext TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      name_ciphertext TEXT NOT NULL,
      encrypted_chunks TEXT NOT NULL,
      encrypted_search_index TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      encrypted_history TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL
    )`
  ], 'write');

  return {
    saveCategory: async (orgId, categoryId, { name_ciphertext, desc_ciphertext }) => {
      await client.execute({
        sql: `INSERT INTO categories (id, org_id, name_ciphertext, desc_ciphertext)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name_ciphertext = excluded.name_ciphertext,
                desc_ciphertext = excluded.desc_ciphertext`,
        args: [categoryId, orgId, name_ciphertext, desc_ciphertext]
      });
      return { id: categoryId };
    },

    getCategories: async (orgId) => {
      const rs = await client.execute({
        sql: 'SELECT id, name_ciphertext, desc_ciphertext FROM categories WHERE org_id = ?',
        args: [orgId]
      });
      return rs.rows.map(row => ({
        id: row.id,
        name_ciphertext: row.name_ciphertext,
        desc_ciphertext: row.desc_ciphertext
      }));
    },

    deleteCategory: async (orgId, categoryId) => {
      await client.execute({
        sql: 'DELETE FROM categories WHERE id = ? AND org_id = ?',
        args: [categoryId, orgId]
      });
      return { success: true };
    },

    saveDocument: async (orgId, documentId, { category_id, name_ciphertext, encrypted_chunks, encrypted_search_index }) => {
      await client.execute({
        sql: `INSERT INTO documents (id, org_id, category_id, name_ciphertext, encrypted_chunks, encrypted_search_index)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                category_id = excluded.category_id,
                name_ciphertext = excluded.name_ciphertext,
                encrypted_chunks = excluded.encrypted_chunks,
                encrypted_search_index = excluded.encrypted_search_index`,
        args: [documentId, orgId, category_id, name_ciphertext, encrypted_chunks, encrypted_search_index]
      });
      return { id: documentId };
    },

    getDocuments: async (orgId, categoryId) => {
      let rs;
      if (categoryId) {
        rs = await client.execute({
          sql: 'SELECT id, category_id, name_ciphertext, encrypted_chunks, encrypted_search_index FROM documents WHERE org_id = ? AND category_id = ?',
          args: [orgId, categoryId]
        });
      } else {
        rs = await client.execute({
          sql: 'SELECT id, category_id, name_ciphertext, encrypted_chunks, encrypted_search_index FROM documents WHERE org_id = ?',
          args: [orgId]
        });
      }
      return rs.rows.map(row => ({
        id: row.id,
        category_id: row.category_id,
        name_ciphertext: row.name_ciphertext,
        encrypted_chunks: row.encrypted_chunks,
        encrypted_search_index: row.encrypted_search_index
      }));
    },

    deleteDocument: async (orgId, documentId) => {
      await client.execute({
        sql: 'DELETE FROM documents WHERE id = ? AND org_id = ?',
        args: [documentId, orgId]
      });
      return { success: true };
    },

    saveChatSession: async (orgId, sessionId, { channel, encrypted_history, expires_at }) => {
      await client.execute({
        sql: `INSERT INTO chat_sessions (id, org_id, channel, encrypted_history, expires_at)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                encrypted_history = excluded.encrypted_history,
                expires_at = excluded.expires_at`,
        args: [sessionId, orgId, channel, encrypted_history, expires_at]
      });
      return { id: sessionId };
    },

    getChatSession: async (orgId, sessionId) => {
      const rs = await client.execute({
        sql: 'SELECT id, channel, encrypted_history, expires_at FROM chat_sessions WHERE id = ? AND org_id = ?',
        args: [sessionId, orgId]
      });
      if (rs.rows.length === 0) return null;
      const row = rs.rows[0];
      return {
        id: row.id,
        channel: row.channel,
        encrypted_history: row.encrypted_history,
        expires_at: row.expires_at
      };
    },

    getChatSessions: async (orgId) => {
      const rs = await client.execute({
        sql: 'SELECT id, channel, encrypted_history, created_at, expires_at FROM chat_sessions WHERE org_id = ? ORDER BY created_at DESC',
        args: [orgId]
      });
      return rs.rows.map(row => ({
        id: row.id,
        channel: row.channel,
        encrypted_history: row.encrypted_history,
        created_at: row.created_at,
        expires_at: row.expires_at
      }));
    },

    cleanupChatSessions: async (orgId, cutoffDate) => {
      const rs = await client.execute({
        sql: 'DELETE FROM chat_sessions WHERE org_id = ? AND created_at < ?',
        args: [orgId, cutoffDate]
      });
      return { deletedCount: rs.rowsAffected };
    }
  };
}
