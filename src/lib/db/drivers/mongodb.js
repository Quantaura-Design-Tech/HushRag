import { MongoClient } from 'mongodb';

export async function initialize(credentials) {
  const { uri, dbName } = credentials;
  if (!uri || !dbName) {
    throw new Error('MongoDB connection requires a uri and dbName.');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Set up collections and indexes
  const categoriesCol = db.collection('categories');
  const documentsCol = db.collection('documents');
  const chatSessionsCol = db.collection('chat_sessions');

  // Ensure organization filters are indexed for quick retrieval
  await categoriesCol.createIndex({ org_id: 1 });
  await documentsCol.createIndex({ org_id: 1, category_id: 1 });
  await chatSessionsCol.createIndex({ org_id: 1, created_at: -1 });

  return {
    saveCategory: async (orgId, categoryId, { name_ciphertext, desc_ciphertext }) => {
      await categoriesCol.updateOne(
        { _id: categoryId },
        {
          $set: {
            org_id: orgId,
            name_ciphertext,
            desc_ciphertext,
            updated_at: new Date().toISOString()
          },
          $setOnInsert: {
            created_at: new Date().toISOString()
          }
        },
        { upsert: true }
      );
      return { id: categoryId };
    },

    getCategories: async (orgId) => {
      const cursor = categoriesCol.find({ org_id: orgId });
      const docs = await cursor.toArray();
      return docs.map(doc => ({
        id: doc._id.toString(),
        name_ciphertext: doc.name_ciphertext,
        desc_ciphertext: doc.desc_ciphertext
      }));
    },

    deleteCategory: async (orgId, categoryId) => {
      await categoriesCol.deleteOne({ _id: categoryId });
      // Delete orphaned documents
      await documentsCol.deleteMany({ org_id: orgId, category_id: categoryId });
      return { success: true };
    },

    saveDocument: async (orgId, documentId, { category_id, name_ciphertext, encrypted_chunks, encrypted_search_index }) => {
      await documentsCol.updateOne(
        { _id: documentId },
        {
          $set: {
            org_id: orgId,
            category_id,
            name_ciphertext,
            encrypted_chunks,
            encrypted_search_index,
            updated_at: new Date().toISOString()
          },
          $setOnInsert: {
            created_at: new Date().toISOString()
          }
        },
        { upsert: true }
      );
      return { id: documentId };
    },

    getDocuments: async (orgId, categoryId) => {
      const query = { org_id: orgId };
      if (categoryId) {
        query.category_id = categoryId;
      }
      const cursor = documentsCol.find(query);
      const docs = await cursor.toArray();
      return docs.map(doc => ({
        id: doc._id.toString(),
        category_id: doc.category_id,
        name_ciphertext: doc.name_ciphertext,
        encrypted_chunks: doc.encrypted_chunks,
        encrypted_search_index: doc.encrypted_search_index
      }));
    },

    deleteDocument: async (orgId, documentId) => {
      await documentsCol.deleteOne({ _id: documentId });
      return { success: true };
    },

    saveChatSession: async (orgId, sessionId, { channel, encrypted_history, expires_at }) => {
      await chatSessionsCol.updateOne(
        { _id: sessionId },
        {
          $set: {
            org_id: orgId,
            channel,
            encrypted_history,
            expires_at: new Date(expires_at), // ISO date object for TTL index support
            updated_at: new Date().toISOString()
          },
          $setOnInsert: {
            created_at: new Date().toISOString()
          }
        },
        { upsert: true }
      );
      return { id: sessionId };
    },

    getChatSession: async (orgId, sessionId) => {
      const doc = await chatSessionsCol.findOne({ _id: sessionId, org_id: orgId });
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        channel: doc.channel,
        encrypted_history: doc.encrypted_history,
        expires_at: doc.expires_at.toISOString()
      };
    },

    getChatSessions: async (orgId) => {
      const cursor = chatSessionsCol.find({ org_id: orgId }).sort({ created_at: -1 });
      const docs = await cursor.toArray();
      return docs.map(doc => ({
        id: doc._id.toString(),
        channel: doc.channel,
        encrypted_history: doc.encrypted_history,
        created_at: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString(),
        expires_at: doc.expires_at ? new Date(doc.expires_at).toISOString() : new Date().toISOString()
      }));
    },

    cleanupChatSessions: async (orgId, cutoffDate) => {
      const result = await chatSessionsCol.deleteMany({
        org_id: orgId,
        created_at: { $lt: new Date(cutoffDate).toISOString() }
      });
      return { deletedCount: result.deletedCount };
    }
  };
}
