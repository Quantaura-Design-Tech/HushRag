import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function initialize(credentials) {
  const { projectId, clientEmail, privateKey } = credentials;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firestore connection requires projectId, clientEmail, and privateKey (Service Account JSON fields).');
  }

  // Sanitize private key (replace escapes with actual newlines)
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  // Generate unique App Name for this config to support dynamic multi-tenant connections
  const appName = `firestore_org_${projectId}`;
  let app;

  const activeApps = getApps();
  const existingApp = activeApps.find(a => a.name === appName);

  if (existingApp) {
    app = existingApp;
  } else {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey
      })
    }, appName);
  }

  const firestore = getFirestore(app);

  return {
    saveCategory: async (orgId, categoryId, { name_ciphertext, desc_ciphertext }) => {
      const docRef = firestore.collection('categories').doc(categoryId);
      await docRef.set({
        id: categoryId,
        org_id: orgId,
        name_ciphertext,
        desc_ciphertext,
        created_at: new Date().toISOString()
      }, { merge: true });
      return { id: categoryId };
    },

    getCategories: async (orgId) => {
      const snap = await firestore.collection('categories')
        .where('org_id', '==', orgId)
        .get();
      const list = [];
      snap.forEach(doc => {
        const data = doc.data();
        list.push({
          id: doc.id,
          name_ciphertext: data.name_ciphertext,
          desc_ciphertext: data.desc_ciphertext
        });
      });
      return list;
    },

    deleteCategory: async (orgId, categoryId) => {
      const docRef = firestore.collection('categories').doc(categoryId);
      await docRef.delete();

      // Clean up orphaned documents within the deleted category
      const docSnap = await firestore.collection('documents')
        .where('org_id', '==', orgId)
        .where('category_id', '==', categoryId)
        .get();
      const batch = firestore.batch();
      docSnap.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      return { success: true };
    },

    saveDocument: async (orgId, documentId, { category_id, name_ciphertext, encrypted_chunks, encrypted_search_index }) => {
      const docRef = firestore.collection('documents').doc(documentId);
      await docRef.set({
        id: documentId,
        org_id: orgId,
        category_id,
        name_ciphertext,
        encrypted_chunks,
        encrypted_search_index,
        created_at: new Date().toISOString()
      }, { merge: true });
      return { id: documentId };
    },

    getDocuments: async (orgId, categoryId) => {
      let query = firestore.collection('documents').where('org_id', '==', orgId);
      if (categoryId) {
        query = query.where('category_id', '==', categoryId);
      }
      const snap = await query.get();
      const list = [];
      snap.forEach(doc => {
        const data = doc.data();
        list.push({
          id: doc.id,
          category_id: data.category_id,
          name_ciphertext: data.name_ciphertext,
          encrypted_chunks: data.encrypted_chunks,
          encrypted_search_index: data.encrypted_search_index
        });
      });
      return list;
    },

    deleteDocument: async (orgId, documentId) => {
      const docRef = firestore.collection('documents').doc(documentId);
      await docRef.delete();
      return { success: true };
    },

    saveChatSession: async (orgId, sessionId, { channel, encrypted_history, expires_at }) => {
      const docRef = firestore.collection('chat_sessions').doc(sessionId);
      await docRef.set({
        id: sessionId,
        org_id: orgId,
        channel,
        encrypted_history,
        created_at: new Date().toISOString(),
        expires_at // Client specifies ISOString or timestamp
      }, { merge: true });
      return { id: sessionId };
    },

    getChatSession: async (orgId, sessionId) => {
      const docRef = firestore.collection('chat_sessions').doc(sessionId);
      const doc = await docRef.get();
      if (!doc.exists) return null;
      const data = doc.data();
      // Ensure security mapping matches
      if (data.org_id !== orgId) return null;
      return {
        id: doc.id,
        channel: data.channel,
        encrypted_history: data.encrypted_history,
        expires_at: data.expires_at
      };
    },

    getChatSessions: async (orgId) => {
      const snap = await firestore.collection('chat_sessions')
        .where('org_id', '==', orgId)
        .orderBy('created_at', 'desc')
        .get();
      const list = [];
      snap.forEach(doc => {
        const data = doc.data();
        list.push({
          id: doc.id,
          channel: data.channel,
          encrypted_history: data.encrypted_history,
          created_at: data.created_at,
          expires_at: data.expires_at
        });
      });
      return list;
    },

    cleanupChatSessions: async (orgId, cutoffDate) => {
      // Although Firestore has a native TTL setting, this manual cleanup function 
      // is provided for api consistency and scheduled manual pruning.
      const snap = await firestore.collection('chat_sessions')
        .where('org_id', '==', orgId)
        .where('created_at', '<', cutoffDate)
        .get();
      
      if (snap.empty) {
        return { deletedCount: 0 };
      }

      const batch = firestore.batch();
      let count = 0;
      snap.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });
      await batch.commit();
      return { deletedCount: count };
    }
  };
}
