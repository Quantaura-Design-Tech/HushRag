import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';
import { encryptServerText } from '@/lib/crypto-server';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieves the active settings for an organization (LLM keys, DB configuration, channels)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter.' }, { status: 400 });
    }

    const db = await getDb('local'); // Settings are always stored in local control DB
    const settings = await db.get('SELECT * FROM settings WHERE org_id = ?', orgId);

    if (!settings) {
      return NextResponse.json({
        org_id: orgId,
        llm_provider: 'openai',
        active_model: 'gpt-4o-mini',
        db_provider: 'sqlite-local',
        encrypted_db_credentials: '{}',
        telegram_token: '',
        whatsapp_config: '',
        llm_key: '',
        has_access_code: false,
        pinecone_enabled: 0,
        pinecone_key: '',
        pinecone_host: '',
        embedding_provider: 'in-process',
        embedding_key: '',
        embedding_model: 'all-MiniLM-L6-v2'
      });
    }

    const sanitizedSettings = { ...settings };
    sanitizedSettings.has_access_code = !!settings.employee_access_code_hash;
    delete sanitizedSettings.employee_access_code_hash;

    // Mask LLM key if it exists
    if (settings.encrypted_llm_key) {
      sanitizedSettings.llm_key = '••••••••';
    } else {
      sanitizedSettings.llm_key = '';
    }
    delete sanitizedSettings.encrypted_llm_key;

    // Mask Pinecone key if it exists
    if (settings.encrypted_pinecone_key) {
      sanitizedSettings.pinecone_key = '••••••••';
    } else {
      sanitizedSettings.pinecone_key = '';
    }
    delete sanitizedSettings.encrypted_pinecone_key;

    // Mask Embedding key if it exists
    if (settings.encrypted_embedding_key) {
      sanitizedSettings.embedding_key = '••••••••';
    } else {
      sanitizedSettings.embedding_key = '';
    }
    delete sanitizedSettings.encrypted_embedding_key;

    return NextResponse.json(sanitizedSettings);
  } catch (e) {
    console.error('GET settings error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST: Saves settings updates for an organization
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orgId,
      llm_provider,
      active_model,
      llm_key,
      db_provider,
      encrypted_db_credentials,
      telegram_token,
      whatsapp_config,
      employee_access_code,
      pinecone_enabled,
      pinecone_key,
      pinecone_host,
      embedding_provider,
      embedding_key,
      embedding_model
    } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter.' }, { status: 400 });
    }

    let employee_access_code_hash = null;
    if (employee_access_code !== undefined) {
      if (employee_access_code === '') {
        employee_access_code_hash = '';
      } else {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(employee_access_code, salt, 1000, 64, 'sha512').toString('hex');
        employee_access_code_hash = `${salt}:${hash}`;
      }
    }

    const db = await getDb('local');

    // Handle transparent encryption of the keys
    const existing = await db.get('SELECT encrypted_llm_key, encrypted_pinecone_key, encrypted_embedding_key FROM settings WHERE org_id = ?', orgId);

    let updatedEncryptedLlmKey = null;
    if (llm_key === '••••••••') {
      // Keep existing key
      updatedEncryptedLlmKey = existing ? existing.encrypted_llm_key : null;
    } else if (llm_key) {
      // Encrypt new key
      updatedEncryptedLlmKey = encryptServerText(llm_key);
    } else {
      updatedEncryptedLlmKey = '';
    }

    let updatedEncryptedPineconeKey = null;
    if (pinecone_key === '••••••••') {
      updatedEncryptedPineconeKey = existing ? existing.encrypted_pinecone_key : null;
    } else if (pinecone_key) {
      updatedEncryptedPineconeKey = encryptServerText(pinecone_key);
    } else {
      updatedEncryptedPineconeKey = '';
    }

    let updatedEncryptedEmbeddingKey = null;
    if (embedding_key === '••••••••') {
      updatedEncryptedEmbeddingKey = existing ? existing.encrypted_embedding_key : null;
    } else if (embedding_key) {
      updatedEncryptedEmbeddingKey = encryptServerText(embedding_key);
    } else {
      updatedEncryptedEmbeddingKey = '';
    }

    // Ensure org row exists (handles DB recreation where browser still holds old orgId)
    await db.run('INSERT OR IGNORE INTO organizations (id, name) VALUES (?, ?)', orgId, 'Organization');

    await db.run(`
      INSERT INTO settings (
        org_id, 
        llm_provider, 
        active_model, 
        encrypted_llm_key, 
        db_provider, 
        encrypted_db_credentials, 
        telegram_token, 
        whatsapp_config,
        employee_access_code_hash,
        pinecone_enabled,
        encrypted_pinecone_key,
        pinecone_host,
        embedding_provider,
        encrypted_embedding_key,
        embedding_model
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(org_id) DO UPDATE SET
        llm_provider = excluded.llm_provider,
        active_model = excluded.active_model,
        encrypted_llm_key = excluded.encrypted_llm_key,
        db_provider = excluded.db_provider,
        encrypted_db_credentials = excluded.encrypted_db_credentials,
        telegram_token = excluded.telegram_token,
        whatsapp_config = excluded.whatsapp_config,
        employee_access_code_hash = COALESCE(excluded.employee_access_code_hash, settings.employee_access_code_hash),
        pinecone_enabled = excluded.pinecone_enabled,
        encrypted_pinecone_key = excluded.encrypted_pinecone_key,
        pinecone_host = excluded.pinecone_host,
        embedding_provider = excluded.embedding_provider,
        encrypted_embedding_key = excluded.encrypted_embedding_key,
        embedding_model = excluded.embedding_model
    `,
      orgId,
      llm_provider ?? '',
      active_model ?? '',
      updatedEncryptedLlmKey ?? '',
      db_provider ?? '',
      encrypted_db_credentials ?? '',
      telegram_token ?? '',
      whatsapp_config ?? '',
      employee_access_code_hash,
      pinecone_enabled ? 1 : 0,
      updatedEncryptedPineconeKey ?? '',
      pinecone_host ?? '',
      embedding_provider ?? 'in-process',
      updatedEncryptedEmbeddingKey ?? '',
      embedding_model ?? 'all-MiniLM-L6-v2'
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST settings error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
