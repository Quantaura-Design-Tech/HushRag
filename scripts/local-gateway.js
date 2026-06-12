/**
 * SecurePolicy - Zero-Knowledge Local Gateway Script
 * Run this script locally on your own server to process Telegram and WhatsApp bots
 * without sharing your decryption passcode or LLM API keys with the SaaS servers.
 * 
 * Usage:
 *   export SAAS_URL="http://localhost:3000"
 *   export ORG_ID="your_org_id"
 *   export PASSPHRASE="your_local_decryption_passcode"
 *   export LLM_PROVIDER="openai" # 'openai' or 'anthropic'
 *   export LLM_API_KEY="sk-..."
 *   export ACTIVE_MODEL="gpt-4o-mini"
 *   export TELEGRAM_TOKEN="12345:bot_token"
 *   export PORT=3005
 * 
 *   node scripts/local-gateway.js
 */

const http = require('http');
const crypto = require('crypto');
const MiniSearch = require('minisearch');

// Load environment variables
const SAAS_URL = process.env.SAAS_URL || 'http://localhost:3000';
const ORG_ID = process.env.ORG_ID;
const PASSPHRASE = process.env.PASSPHRASE;
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';
const LLM_API_KEY = process.env.LLM_API_KEY;
const ACTIVE_MODEL = process.env.ACTIVE_MODEL;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PORT = process.env.PORT || 3005;

if (!ORG_ID || !PASSPHRASE || !LLM_API_KEY) {
  console.error('❌ Error: Missing required environment variables (ORG_ID, PASSPHRASE, LLM_API_KEY).');
  process.exit(1);
}

console.log('🔒 Starting Zero-Knowledge Local Gateway...');
console.log(`📡 Connected SaaS Hub: ${SAAS_URL}`);
console.log(`🏢 Organization ID: ${ORG_ID}`);
console.log(`🤖 LLM Provider: ${LLM_PROVIDER}`);

// --- Cryptography Helpers (Node-native port of E2EE) ---
function hex2buf(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}

function buf2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function deriveKeySync(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
}

function decryptTextSync(encryptedString, password) {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format.');

  const [saltHex, ivHex, ciphertextHex] = parts;
  const salt = Buffer.from(saltHex, 'hex').toString('utf8');
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const key = deriveKeySync(password, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  
  // Set auth tag (AES-GCM tag is appended at the end of the ciphertext by web crypto, usually 16 bytes)
  const tagLength = 16;
  const actualCiphertext = ciphertext.subarray(0, ciphertext.length - tagLength);
  const authTag = ciphertext.subarray(ciphertext.length - tagLength);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(actualCiphertext, 'binary', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encryptTextSync(plaintext, password, salt = 'policy-bot-default-salt') {
  const key = deriveKeySync(password, salt);
  const iv = crypto.randomBytes(12);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'binary');
  ciphertext += cipher.final('binary');
  
  const authTag = cipher.getAuthTag();
  const fullCiphertext = Buffer.concat([Buffer.from(ciphertext, 'binary'), authTag]);
  
  return `${Buffer.from(salt).toString('hex')}:${iv.toString('hex')}:${fullCiphertext.toString('hex')}`;
}

// --- Search Engine Functions ---
function runSearch(indexJson, queryText, docChunks) {
  try {
    const miniSearch = MiniSearch.loadJSON(indexJson, {
      fields: ['title', 'text'],
      storeFields: ['title', 'text']
    });

    const results = miniSearch.search(queryText, {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 2 }
    });

    return results.slice(0, 3).map(res => {
      const match = docChunks.find(c => c.title === res.title);
      return {
        title: res.title,
        text: match ? match.text : res.text,
        score: res.score
      };
    });
  } catch (e) {
    console.error('Local index search failed:', e);
    return [];
  }
}

// --- Core RAG & LLM Engine ---
async function runRAGPipeline(queryText) {
  console.log(`🔍 Processing query: "${queryText}"`);

  // 1. Pull encrypted documents from SaaS
  const response = await fetch(`${SAAS_URL}/api/documents?orgId=${ORG_ID}`);
  if (!response.ok) throw new Error('Failed to download documents from SaaS Hub.');
  const documents = await response.json();

  // 2. Decrypt and run local search
  let matchedChunks = [];
  for (const doc of documents) {
    try {
      const indexJson = decryptTextSync(doc.encrypted_search_index, PASSPHRASE);
      const chunksText = decryptTextSync(doc.encrypted_chunks, PASSPHRASE);
      const docChunks = JSON.parse(chunksText);

      const matches = runSearch(indexJson, queryText, docChunks);
      matchedChunks.push(...matches);
    } catch (e) {
      console.error(`⚠️ Failed to decrypt/search doc ${doc.id}:`, e.message);
    }
  }

  matchedChunks.sort((a, b) => b.score - a.score);
  const topChunks = matchedChunks.slice(0, 3);
  const contextText = topChunks.map(c => `[Section: ${c.title}]\n${c.text}`).join('\n\n');

  console.log(` Matches retrieved: ${topChunks.length} chunks.`);

  // 3. Perform LLM call
  const systemPrompt = `You are a helpful and professional corporate policy bot. 

If the user greets you (e.g., "hello", "hi", "hey", "good morning") or asks about your identity / capabilities, reply with a warm, professional greeting and explain that your purpose is to help employees securely query and understand the company's guidelines, HR policies, and employee handbook.

For all other questions, your sole task is to answer the employee's query using ONLY the provided guideline context sections. 
If the answer cannot be found in the context, politely state that you could not find this information in the official guidelines and suggest contacting HR or the appropriate department. Do not make up facts or extrapolate.

Context:
${contextText || 'No specific document context found.'}`;

  let reply = '';
  if (LLM_PROVIDER === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: ACTIVE_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: queryText }
        ],
        temperature: 0.1
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    reply = data.choices[0].message.content;
  } else if (LLM_PROVIDER === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LLM_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ACTIVE_MODEL || 'claude-3-5-haiku-20241022',
        system: systemPrompt,
        messages: [{ role: 'user', content: queryText }],
        max_tokens: 1024,
        temperature: 0.1
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    reply = data.content[0].text;
  } else {
    throw new Error(`Unsupported local LLM provider: ${LLM_PROVIDER}`);
  }

  return { reply, contextText };
}

// --- HTTP Webhook Server ---
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. Telegram Webhook Endpoint
  if (req.method === 'POST' && url.pathname === '/telegram') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        const update = JSON.parse(bodyText);
        if (update.message && update.message.text && TELEGRAM_TOKEN) {
          const chatId = update.message.chat.id;
          const query = update.message.text;

          // Process RAG
          const { reply } = await runRAGPipeline(query);

          // Reply via Telegram Bot API
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: reply })
          });

          // Upload encrypted audit log back to SaaS Hub
          const history = [{ role: 'user', content: query }, { role: 'assistant', content: reply }];
          const encryptedHistory = encryptTextSync(JSON.stringify(history), PASSPHRASE);
          
          await fetch(`${SAAS_URL}/api/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orgId: ORG_ID,
              sessionId: `telegram_${chatId}`,
              channel: 'telegram-local-gateway',
              encrypted_history: encryptedHistory
            })
          });
        }
      } catch (err) {
        console.error('Telegram local webhook error:', err.message);
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // 2. WhatsApp Twilio Webhook Endpoint
  if (req.method === 'POST' && url.pathname === '/whatsapp') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        // Parse Form URL Encoded Twilio Payload
        const params = new URLSearchParams(bodyText);
        const query = params.get('Body');
        const fromNumber = params.get('From'); // e.g. 'whatsapp:+14155238886'

        if (query && fromNumber) {
          // Process RAG
          const { reply } = await runRAGPipeline(query);

          // Twilio expects a TwiML response to send the message back
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${reply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message>
</Response>`;

          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml);

          // Upload encrypted logs to SaaS Hub
          const history = [{ role: 'user', content: query }, { role: 'assistant', content: reply }];
          const encryptedHistory = encryptTextSync(JSON.stringify(history), PASSPHRASE);
          
          await fetch(`${SAAS_URL}/api/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orgId: ORG_ID,
              sessionId: `whatsapp_${fromNumber.replace('whatsapp:', '')}`,
              channel: 'whatsapp-local-gateway',
              encrypted_history: encryptedHistory
            })
          });
          return;
        }
      } catch (err) {
        console.error('WhatsApp local webhook error:', err.message);
      }
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end('<Response></Response>');
    });
    return;
  }

  // Default Route
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 Zero-Knowledge Local Gateway Server listening on port ${PORT}`);
});
