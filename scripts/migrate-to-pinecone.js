/**
 * Pinecone Vector Migration Script
 * 
 * Usage: node scripts/migrate-to-pinecone.js <orgId>
 * 
 * What it does:
 * 1. Resolves the database driver for the specified organization.
 * 2. Fetches all RAG documents and text chunks stored in that database.
 * 3. Loads the matching 'all-MiniLM-L6-v2' ONNX model server-side.
 * 4. Generates 384-dimensional vector embeddings for all chunks.
 * 5. Batch-uploads the vectors directly to your configured Pinecone Index.
 */

const path = require('path');

const { getDb } = require('../src/lib/db');
const { decryptServerText } = require('../src/lib/crypto-server');

async function migrate() {
  const orgId = process.argv[2];
  if (!orgId) {
    console.error("❌ Error: Missing organization ID argument.");
    console.log("Usage: node scripts/migrate-to-pinecone.js <orgId>");
    process.exit(1);
  }

  console.log(`🤖 Starting Pinecone vector migration for Org: ${orgId}...`);

  try {
    // 1. Fetch organization settings
    const controlDb = await getDb('local');
    const settings = await controlDb.get(
      'SELECT pinecone_enabled, encrypted_pinecone_key, pinecone_host FROM settings WHERE org_id = ?', 
      orgId
    );

    if (!settings) {
      throw new Error(`No settings found for organization: ${orgId}. Ensure the org is configured first.`);
    }

    if (settings.pinecone_enabled !== 1) {
      console.warn("⚠️ Warning: Pinecone is currently disabled in Settings for this organization.");
      console.log("We will proceed with the migration anyway using the saved index configurations.");
    }

    const pineconeKey = decryptServerText(settings.encrypted_pinecone_key);
    let pineconeHost = settings.pinecone_host || '';

    if (!pineconeKey || !pineconeHost) {
      throw new Error("Missing Pinecone Host URL or API Key in Settings. Configure them in the Dashboard first.");
    }

    if (!pineconeHost.startsWith('http://') && !pineconeHost.startsWith('https://')) {
      pineconeHost = `https://${pineconeHost}`;
    }

    // 2. Fetch all documents for this organization
    const orgDb = await getDb(orgId);
    const documents = await orgDb.getDocuments(orgId);

    if (documents.length === 0) {
      console.log("ℹ️ No documents found in database. Nothing to migrate.");
      process.exit(0);
    }

    console.log(`📂 Found ${documents.length} document(s) in local datastore. Preparing vector calculation...`);

    // 3. Load embedding model pipeline server-side
    console.log("🧠 Loading Xenova/all-MiniLM-L6-v2 ONNX model pipeline...");
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false; // Disable local file checking, fetch from HuggingFace CDN
    
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log("✓ Embedding model successfully loaded.");

    // Helper to generate a single vector (384-dimensions)
    const computeVector = async (text) => {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    };

    let totalChunksMigrated = 0;

    // 4. Loop documents, compute embeddings, and batch upload to Pinecone
    for (const doc of documents) {
      console.log(`\n📄 Processing document: "${doc.name}" (ID: ${doc.id})`);
      const chunks = typeof doc.chunks === 'string' ? JSON.parse(doc.chunks || '[]') : doc.chunks;

      if (!chunks || chunks.length === 0) {
        console.log(`   └─ No text chunks found. Skipping.`);
        continue;
      }

      console.log(`   └─ Found ${chunks.length} chunks. Calculating embeddings...`);

      const vectorsToUpload = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const vectorValues = await computeVector(chunk.text);
        
        vectorsToUpload.push({
          id: `${orgId}:${doc.id}:${i}`,
          values: vectorValues,
          metadata: {
            orgId,
            categoryId: doc.category_id,
            documentId: doc.id,
            chunkIndex: i,
            title: chunk.title || '',
            text: chunk.text || ''
          }
        });
      }

      // Upsert to Pinecone
      console.log(`   └─ Uploading vectors to Pinecone Index...`);
      const response = await fetch(`${pineconeHost}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': pineconeKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vectors: vectorsToUpload })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Pinecone upsert failed for document "${doc.name}": ${response.statusText} - ${errText}`);
      }

      console.log(`   └─ ✓ Successfully migrated ${chunks.length} vectors.`);
      totalChunksMigrated += chunks.length;
    }

    console.log(`\n🎉 Migration Complete! Successfully computed and uploaded ${totalChunksMigrated} vector(s) to Pinecone.`);
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Migration Failed:", error.message);
    process.exit(1);
  }
}

migrate();
