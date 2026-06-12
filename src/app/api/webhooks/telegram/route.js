import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { searchIndex } from '@/lib/client-search';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId query parameter.' }, { status: 400 });
    }

    const body = await request.json();
    const message = body.message;

    // Ignore non-message updates
    if (!message || !message.text) {
      return NextResponse.json({ success: true });
    }

    const chatId = message.chat.id;
    const queryText = message.text;

    // 1. Fetch organization settings
    const masterDb = await getDb('local');
    const settings = await masterDb.get('SELECT * FROM settings WHERE org_id = ?', orgId);

    if (!settings || !settings.telegram_token) {
      console.warn(`[Telegram Webhook] Bot token not found for org: ${orgId}`);
      return NextResponse.json({ success: true });
    }

    const token = settings.telegram_token;
    const telegramApiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    // 3. Check for Employee Access Code verification if configured
    const accessCodeHash = settings.employee_access_code_hash || '';
    const db = await getDb(orgId);
    const sessionId = `telegram_${chatId}`;
    const session = await db.getChatSession(orgId, sessionId);
    
    let isVerified = session ? (session.is_verified || 0) : 0;
    
    if (accessCodeHash && !isVerified) {
      const parts = accessCodeHash.split(':');
      if (parts.length === 2) {
        const [salt, hash] = parts;
        const inputHash = crypto.pbkdf2Sync(queryText.trim(), salt, 1000, 64, 'sha512').toString('hex');
        
        if (inputHash === hash) {
          isVerified = 1;
          await db.saveChatSession(orgId, sessionId, {
            channel: 'telegram',
            history: JSON.stringify([]),
            is_verified: 1,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
          await sendTelegramMessage(telegramApiUrl, chatId, "✅ Access Code verified! Welcome. Ask me any policy questions.");
          return NextResponse.json({ success: true });
        }
      }
      
      await sendTelegramMessage(telegramApiUrl, chatId, "🔒 This assistant is private. Please enter your employee access code to gain access.");
      return NextResponse.json({ success: true });
    }

    // Trigger "typing..." status so the user knows the bot is working
    sendTelegramAction(token, chatId, 'typing').catch(e => console.error(e));

    // 4. Load organization documents & run search (RAG)
    const documents = await db.getDocuments(orgId);

    let matchedChunks = [];
    for (const doc of documents) {
      try {
        const matches = searchIndex(doc.search_index, queryText, 8);

        if (matches.length > 0) {
          const docChunks = JSON.parse(doc.chunks || '[]');

          matches.forEach(m => {
            const matchedText = docChunks.find(c => c.title === m.title);
            if (matchedText) {
              matchedChunks.push({
                title: m.title,
                text: matchedText.text,
                score: m.score
              });
            }
          });
        }
      } catch (e) {
        console.error(`[Telegram Webhook] Search failed for doc ${doc.id}:`, e);
      }
    }

    matchedChunks.sort((a, b) => b.score - a.score);
    const topChunks = matchedChunks.slice(0, 8);
    const contextText = topChunks.map(c => `[Section: ${c.title}]\n${c.text}`).join('\n\n');

    // 5. Invoke dynamic completion proxy
    const chatProxyUrl = `${new URL(request.url).origin}/api/chat`;
    const chatProxyRes = await fetch(chatProxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId,
        query: queryText,
        context: contextText
      })
    });

    if (!chatProxyRes.ok) {
      throw new Error('LLM completion proxy request failed.');
    }

    const chatData = await chatProxyRes.json();
    const replyText = chatData.reply;

    // 6. Send message back to Telegram user
    await sendTelegramMessage(telegramApiUrl, chatId, replyText);

    // 7. Save plaintext chat history log asynchronously
    let currentHistory = [];
    if (session && session.history) {
      try {
        currentHistory = JSON.parse(session.history);
      } catch (e) {
        console.warn('Failed to parse session history, resetting', e);
      }
    }
    const updatedHistory = [
      ...currentHistory.slice(-5),
      { role: 'user', content: queryText },
      { role: 'assistant', content: replyText }
    ];

    await db.saveChatSession(orgId, sessionId, {
      channel: 'telegram',
      history: JSON.stringify(updatedHistory),
      is_verified: isVerified,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Telegram Webhook Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function sendTelegramMessage(apiUrl, chatId, text) {
  await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}

async function sendTelegramAction(token, chatId, action) {
  const url = `https://api.telegram.org/bot${token}/sendChatAction`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      action: action
    })
  });
}
