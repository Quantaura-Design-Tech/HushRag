import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET: Lists plaintext chat histories for the audit panel
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter.' }, { status: 400 });
    }

    const db = await getDb(orgId);
    const sessions = await db.getChatSessions(orgId);

    return NextResponse.json(sessions);
  } catch (e) {
    console.error('GET chat sessions error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST: Saves or appends plaintext conversation history
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { orgId, sessionId, channel, history, expires_at } = body;

    if (!orgId || !sessionId || !channel || !history) {
      return NextResponse.json({ error: 'Missing required chat fields.' }, { status: 400 });
    }

    // Default expiry is 7 days if not provided
    const expiry = expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const db = await getDb(orgId);
    const result = await db.saveChatSession(orgId, sessionId, {
      channel,
      history,
      expires_at: expiry
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (e) {
    console.error('POST chat session error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
