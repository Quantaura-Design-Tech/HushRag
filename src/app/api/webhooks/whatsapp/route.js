import { getDb } from '@/lib/db';
import { searchIndex } from '@/lib/client-search';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return new Response(generateTwiML('Error: Missing orgId parameter.'), {
        headers: { 'Content-Type': 'text/xml' },
        status: 400
      });
    }

    const formData = await request.formData();
    const queryText = formData.get('Body');
    const fromNumber = formData.get('From'); // Format: 'whatsapp:+1234567890'

    if (!queryText || !fromNumber) {
      return new Response(generateTwiML(''), { headers: { 'Content-Type': 'text/xml' } });
    }

    // 1. Fetch organization settings
    const masterDb = await getDb('local');
    const settings = await masterDb.get('SELECT * FROM settings WHERE org_id = ?', orgId);

    if (!settings) {
      return new Response(generateTwiML('Error: Organization settings not found.'), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // 3. Check for Employee Access Code verification if configured
    const accessCodeHash = settings.employee_access_code_hash || '';
    const db = await getDb(orgId);
    const sessionId = `whatsapp_${fromNumber.replace('whatsapp:', '')}`;
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
            channel: 'whatsapp',
            history: JSON.stringify([]),
            is_verified: 1,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
          return new Response(
            generateTwiML("✅ Access Code verified! Welcome. Ask me any policy questions."),
            { headers: { 'Content-Type': 'text/xml' } }
          );
        }
      }
      
      return new Response(
        generateTwiML("🔒 This assistant is private. Please enter your employee access code to gain access."),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

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
        console.error(`[WhatsApp Webhook] Search failed for doc ${doc.id}:`, e);
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

    // 6. Save plaintext chat history log
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
      channel: 'whatsapp',
      history: JSON.stringify(updatedHistory),
      is_verified: isVerified,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // 7. Return TwiML XML response back to Twilio WhatsApp
    return new Response(generateTwiML(replyText), {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (err) {
    console.error('[WhatsApp Webhook Error]:', err);
    return new Response(generateTwiML('⚠️ Sorry, there was an error processing your query.'), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

/**
 * Generate standard TwiML XML reply format
 */
function generateTwiML(messageText) {
  // XML Escape special characters
  const escapedMessage = messageText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapedMessage}</Message>
</Response>`;
}
