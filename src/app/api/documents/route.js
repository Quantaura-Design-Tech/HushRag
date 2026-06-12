import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { decryptServerText } from '@/lib/crypto-server';

export const dynamic = 'force-dynamic';

/**
 * GET: Lists plaintext documents for an organization (and optionally a category)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const categoryId = searchParams.get('categoryId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter.' }, { status: 400 });
    }

    const db = await getDb(orgId);
    const documents = await db.getDocuments(orgId, categoryId);

    return NextResponse.json(documents);
  } catch (e) {
    console.error('GET documents error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST: Saves a plaintext document (plaintext chunks & search index) and optionally upserts vectors to Pinecone
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { orgId, documentId, categoryId, name, chunks, search_index, vectors } = body;

    if (!orgId || !documentId || !categoryId || !name || !chunks || !search_index) {
      return NextResponse.json({ error: 'Missing required document fields.' }, { status: 400 });
    }

    const parsedChunks = typeof chunks === 'string' ? JSON.parse(chunks) : chunks;

    // Check if Pinecone is enabled
    const controlDb = await getDb('local');
    const settings = await controlDb.get('SELECT pinecone_enabled, encrypted_pinecone_key, pinecone_host FROM settings WHERE org_id = ?', orgId);

    if (settings && settings.pinecone_enabled === 1) {
      if (!vectors || !Array.isArray(vectors) || vectors.length !== parsedChunks.length) {
        return NextResponse.json({ error: 'Missing or mismatched pre-computed vectors for Pinecone upload.' }, { status: 400 });
      }

      const pineconeKey = decryptServerText(settings.encrypted_pinecone_key);
      let pineconeHost = settings.pinecone_host || '';
      if (!pineconeHost.startsWith('http://') && !pineconeHost.startsWith('https://')) {
        pineconeHost = `https://${pineconeHost}`;
      }

      const pineconeVectors = parsedChunks.map((chunk, i) => ({
        id: `${orgId}:${documentId}:${i}`,
        values: vectors[i],
        metadata: {
          orgId,
          categoryId,
          documentId,
          chunkIndex: i,
          title: chunk.title || '',
          text: chunk.text || ''
        }
      }));

      const upsertResponse = await fetch(`${pineconeHost}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': pineconeKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vectors: pineconeVectors })
      });

      if (!upsertResponse.ok) {
        const errText = await upsertResponse.text();
        throw new Error(`Pinecone upsert failed: ${upsertResponse.statusText} - ${errText}`);
      }
    }

    const db = await getDb(orgId);
    const result = await db.saveDocument(orgId, documentId, {
      category_id: categoryId,
      name,
      chunks: typeof chunks === 'string' ? chunks : JSON.stringify(chunks),
      search_index
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (e) {
    console.error('POST document error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE: Deletes a document (and associated Pinecone vectors)
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const documentId = searchParams.get('documentId');

    if (!orgId || !documentId) {
      return NextResponse.json({ error: 'Missing orgId or documentId parameters.' }, { status: 400 });
    }

    const controlDb = await getDb('local');
    const settings = await controlDb.get('SELECT pinecone_enabled, encrypted_pinecone_key, pinecone_host FROM settings WHERE org_id = ?', orgId);

    const db = await getDb(orgId);

    if (settings && settings.pinecone_enabled === 1) {
      const documents = await db.getDocuments(orgId);
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        const docChunks = typeof doc.chunks === 'string' ? JSON.parse(doc.chunks || '[]') : doc.chunks;
        const vectorIds = docChunks.map((_, i) => `${orgId}:${documentId}:${i}`);

        if (vectorIds.length > 0) {
          const pineconeKey = decryptServerText(settings.encrypted_pinecone_key);
          let pineconeHost = settings.pinecone_host || '';
          if (!pineconeHost.startsWith('http://') && !pineconeHost.startsWith('https://')) {
            pineconeHost = `https://${pineconeHost}`;
          }

          const deleteResponse = await fetch(`${pineconeHost}/vectors/delete`, {
            method: 'POST',
            headers: {
              'Api-Key': pineconeKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: vectorIds })
          });

          if (!deleteResponse.ok) {
            const errText = await deleteResponse.text();
            console.error(`Pinecone vector deletion failed: ${deleteResponse.statusText} - ${errText}`);
          }
        }
      }
    }

    await db.deleteDocument(orgId, documentId);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE document error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
