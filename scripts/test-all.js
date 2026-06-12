/**
 * SecurePolicy - Integration Test Suite
 * Validates the core cryptographic, RAG search, document parsing, and database layers.
 * 
 * Usage:
 *   node scripts/test-all.js
 */

const { parseDocumentToMarkdown } = require('../src/lib/document-parser');
const { splitMarkdownIntoChunks, buildSearchIndex, searchIndex } = require('../src/lib/client-search');
const { getLocalDb } = require('../src/lib/db/drivers/sqlite-local');
const crypto = require('crypto');

// --- Mock Crypto Functions (Client-Side Simulation) ---
function deriveKeySync(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
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

function decryptTextSync(encryptedString, password) {
  const parts = encryptedString.split(':');
  const [saltHex, ivHex, ciphertextHex] = parts;
  const salt = Buffer.from(saltHex, 'hex').toString('utf8');
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const key = deriveKeySync(password, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  const tagLength = 16;
  const actualCiphertext = ciphertext.subarray(0, ciphertext.length - tagLength);
  const authTag = ciphertext.subarray(ciphertext.length - tagLength);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(actualCiphertext, 'binary', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// --- Test Suite Execution ---
async function runTests() {
  console.log('🧪 Starting SecurePolicy Test Suite...\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failCount++;
    }
  }

  // --- Test 1: Cryptography E2EE ---
  try {
    const rawText = 'This is a highly confidential HR policy document.';
    const secret = 'super-secret-key-123';
    
    const ciphertext = encryptTextSync(rawText, secret);
    const decrypted = decryptTextSync(ciphertext, secret);
    
    assert(ciphertext.includes(':'), 'E2EE ciphertext matches salt:iv:data format');
    assert(decrypted === rawText, 'E2EE Decrypt matches original plaintext');
  } catch (e) {
    assert(false, `Test 1 Crypto failed: ${e.message}`);
  }

  // --- Test 2: Document Parser (TXT) ---
  try {
    const textBuffer = Buffer.from('# Leave Policy\n\nEmployees get 20 days off.');
    const parsed = await parseDocumentToMarkdown(textBuffer, 'text/plain', 'leaves.txt');
    assert(parsed.startsWith('# Leave Policy'), 'Plain text parsed to markdown correctly');
  } catch (e) {
    assert(false, `Test 2 Parser failed: ${e.message}`);
  }

  // --- Test 3: Client Search Indexing (MiniSearch) ---
  try {
    const md = `
# Sick Leaves
Employees receive 10 sick leaves per year. Contact HR to claim.

# Paid Time Off (PTO)
Regular full-time staff accumulate 1.5 days of PTO per month.
    `;
    const chunks = splitMarkdownIntoChunks(md);
    assert(chunks.length === 2, 'Markdown correctly split into 2 chunks');
    assert(chunks[0].title === 'Sick Leaves', 'Chunk 1 title parsed correctly');
    assert(chunks[1].title === 'Paid Time Off (PTO)', 'Chunk 2 title parsed correctly');

    const { indexJson, chunksJson } = buildSearchIndex(chunks);
    const results = searchIndex(indexJson, 'sick time off', 2);
    
    assert(results.length > 0, 'MiniSearch returns matched search hits');
    assert(results[0].title === 'Sick Leaves', 'MiniSearch matches relevant section first');
  } catch (e) {
    assert(false, `Test 3 Indexing failed: ${e.message}`);
  }

  // --- Test 4: SQLite CRUD Driver Operations ---
  try {
    const db = getLocalDb();
    const testOrgId = 'test_org_99';
    const testCatId = 'test_cat_99';
    const testDocId = 'test_doc_99';

    // Cleanup previous runs
    await db.run('DELETE FROM organizations WHERE id = ?', testOrgId);

    // Organization Creation
    await db.run('INSERT INTO organizations (id, name) VALUES (?, ?)', testOrgId, 'Test Org');
    
    // Save Category Folder (Encrypted mock data)
    const catPayload = {
      name_ciphertext: encryptTextSync('Leaves Topic', 'pwd'),
      desc_ciphertext: encryptTextSync('Leaves folder', 'pwd')
    };
    await db.saveCategory(testOrgId, testCatId, catPayload);
    const categories = await db.getCategories(testOrgId);
    
    assert(categories.length === 1, 'Database driver correctly inserts categories');
    assert(decryptTextSync(categories[0].name_ciphertext, 'pwd') === 'Leaves Topic', 'Decrypted category name matches input');

    // Save E2EE Document
    const docPayload = {
      category_id: testCatId,
      name_ciphertext: encryptTextSync('leaves_policy.md', 'pwd'),
      encrypted_chunks: encryptTextSync('[{"title": "Leaves", "text": "Details"}]', 'pwd'),
      encrypted_search_index: encryptTextSync('{}', 'pwd')
    };
    await db.saveDocument(testOrgId, testDocId, docPayload);
    const docs = await db.getDocuments(testOrgId, testCatId);
    
    assert(docs.length === 1, 'Database driver correctly inserts documents inside categories');
    assert(decryptTextSync(docs[0].name_ciphertext, 'pwd') === 'leaves_policy.md', 'Decrypted doc name matches input');

    // Clean up
    await db.deleteDocument(testOrgId, testDocId);
    const docListAfter = await db.getDocuments(testOrgId, testCatId);
    assert(docListAfter.length === 0, 'Database driver deletes documents successfully');
  } catch (e) {
    assert(false, `Test 4 SQLite failed: ${e.message}`);
  }

  // --- Test 5: TTL Auto-Expiry ---
  try {
    const db = getLocalDb();
    const testOrgId = 'test_org_99';
    const testSessionId = 'test_sess_99';
    
    // Insert organization settings if not present
    const existingOrg = await db.get('SELECT id FROM organizations WHERE id = ?', testOrgId);
    if (!existingOrg) {
      await db.run('INSERT INTO organizations (id, name) VALUES (?, ?)', testOrgId, 'Test Org');
    }

    // Delete session if existing
    await db.run('DELETE FROM chat_sessions WHERE id = ?', testSessionId);

    // Save chat session with simulated EXPIRED creation timestamp
    // TTL is 7 days, so we set expired date to 8 days ago
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Save session
    await db.saveChatSession(testOrgId, testSessionId, {
      channel: 'web-test',
      encrypted_history: encryptTextSync('[]', 'pwd'),
      expires_at: expiresAt
    });

    // Manually force the created_at back by 8 days to simulate expiration
    const expiredTimestamp = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    await db.run('UPDATE chat_sessions SET created_at = ? WHERE id = ?', expiredTimestamp, testSessionId);

    // Execute cleanup
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const cleanup = await db.cleanupChatSessions(testOrgId, cutoffDate);

    assert(cleanup.deletedCount === 1, 'TTL cleanup successfully prunes expired chat sessions (>7 days old)');
    
    const retrieved = await db.getChatSession(testOrgId, testSessionId);
    assert(!retrieved, 'Expired session is no longer accessible');
  } catch (e) {
    assert(false, `Test 5 TTL failed: ${e.message}`);
  }

  // --- Final Summary ---
  console.log(`\n📊 Test Suite Summary:`);
  console.log(`  PASSED: ${passCount}`);
  console.log(`  FAILED: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('\n🚀 ALL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
}

runTests();
