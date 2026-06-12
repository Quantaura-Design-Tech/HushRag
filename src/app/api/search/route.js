import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { decryptServerText } from '@/lib/crypto-server';
import { searchIndex } from '@/lib/client-search';

/**
 * POST /api/search
 * Body: { orgId, categoryId, query, vector, limit }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { orgId, categoryId, query, vector, limit = 8 } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter.' }, { status: 400 });
    }

    // Retrieve settings for the organization to see if Pinecone is enabled
    const controlDb = await getDb('local');
    const settings = await controlDb.get('SELECT pinecone_enabled, encrypted_pinecone_key, pinecone_host FROM settings WHERE org_id = ?', orgId);

    if (settings && settings.pinecone_enabled === 1) {
      if (!vector || !Array.isArray(vector)) {
        return NextResponse.json({ error: 'Missing or invalid query vector for Pinecone search.' }, { status: 400 });
      }

      const pineconeKey = decryptServerText(settings.encrypted_pinecone_key);
      if (!pineconeKey) {
        throw new Error('Pinecone API Key decryption returned empty.');
      }

      let pineconeHost = settings.pinecone_host || '';
      if (!pineconeHost.startsWith('http://') && !pineconeHost.startsWith('https://')) {
        pineconeHost = `https://${pineconeHost}`;
      }

      // Construct metadata filter if categoryId is provided
      const filter = {};
      if (categoryId) {
        filter.categoryId = { '$eq': categoryId };
      }

      const pineconePayload = {
        vector,
        topK: limit,
        includeMetadata: true
      };

      if (categoryId) {
        pineconePayload.filter = filter;
      }

      const response = await fetch(`${pineconeHost}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': pineconeKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pineconePayload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Pinecone search failed: ${response.statusText} - ${errText}`);
      }

      const resData = await response.json();
      const matchedChunks = (resData.matches || []).map(m => ({
        title: m.metadata?.title || 'Untitled Chunk',
        text: m.metadata?.text || '',
        score: m.score,
        documentId: m.metadata?.documentId || '',
        categoryId: m.metadata?.categoryId || ''
      }));

      return NextResponse.json(matchedChunks);
    }

    // Fallback: Local Keyword Search via MiniSearch on the server
    if (!query) {
      return NextResponse.json({ error: 'Missing query for fallback search.' }, { status: 400 });
    }

    const orgDb = await getDb(orgId);
    const docList = await orgDb.getDocuments(orgId, categoryId);

    let matchedChunks = [];
    for (const doc of docList) {
      try {
        const matches = searchIndex(doc.search_index, query, limit);
        if (matches.length > 0) {
          const docChunks = typeof doc.chunks === 'string' ? JSON.parse(doc.chunks || '[]') : doc.chunks;
          matches.forEach(m => {
            const matchedText = docChunks.find(c => c.title === m.title);
            if (matchedText) {
              matchedChunks.push({
                title: m.title,
                text: matchedText.text,
                score: m.score,
                documentId: doc.id,
                categoryId: doc.category_id
              });
            }
          });
        }
      } catch (err) {
        console.error(`Local search failed for doc ${doc.id}:`, err);
      }
    }

    // Sort combined matches across all matching documents
    matchedChunks.sort((a, b) => b.score - a.score);
    return NextResponse.json(matchedChunks.slice(0, limit));

  } catch (e) {
    console.error('Unified Search API Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
