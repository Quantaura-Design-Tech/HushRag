import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { decryptServerText } from '@/lib/crypto-server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter.' }, { status: 400 });
    }

    // 1. Fetch organization settings
    const controlDb = await getDb('local');
    const settings = await controlDb.get(
      'SELECT pinecone_enabled, encrypted_pinecone_key, pinecone_host FROM settings WHERE org_id = ?', 
      orgId
    );

    if (!settings) {
      return NextResponse.json({ error: `No settings found for organization: ${orgId}. Ensure the org is configured first.` }, { status: 400 });
    }

    const pineconeKey = decryptServerText(settings.encrypted_pinecone_key);
    let pineconeHost = settings.pinecone_host || '';

    if (!pineconeKey || !pineconeHost) {
      return NextResponse.json({ error: "Missing Pinecone Host URL or API Key in Settings. Configure them in the Dashboard first." }, { status: 400 });
    }

    if (!pineconeHost.startsWith('http://') && !pineconeHost.startsWith('https://')) {
      pineconeHost = `https://${pineconeHost}`;
    }

    // 2. Fetch all documents for this organization
    const orgDb = await getDb(orgId);
    const documents = await orgDb.getDocuments(orgId);

    if (documents.length === 0) {
      return NextResponse.json({ success: true, message: 'No documents found in database. Nothing to migrate.', count: 0 });
    }

    console.log(`🤖 [API Migration] Found ${documents.length} documents for org ${orgId}. Loading transformers...`);

    // 3. Load embedding model pipeline server-side dynamically
    const { pipeline: getPipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false; // Disable local file checking, fetch from HuggingFace CDN
    
    const extractor = await getPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // Helper to generate a single vector (384-dimensions)
    const computeVector = async (text) => {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    };

    let totalChunksMigrated = 0;

    // 4. Loop documents, compute embeddings, and batch upload to Pinecone
    for (const doc of documents) {
      const chunks = typeof doc.chunks === 'string' ? JSON.parse(doc.chunks || '[]') : doc.chunks;

      if (!chunks || chunks.length === 0) {
        continue;
      }

      console.log(`🤖 [API Migration] Processing document: "${doc.name}" with ${chunks.length} chunks.`);

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

      totalChunksMigrated += chunks.length;
    }

    console.log(`🤖 [API Migration] Migration complete. Total chunks migrated: ${totalChunksMigrated}`);
    return NextResponse.json({ success: true, count: totalChunksMigrated });

  } catch (error) {
    console.error('Pinecone migration API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
