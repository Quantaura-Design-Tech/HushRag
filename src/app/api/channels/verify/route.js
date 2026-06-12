import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orgId, code } = body;

    if (!orgId || !code) {
      return NextResponse.json({ error: 'Missing orgId or code.' }, { status: 400 });
    }

    const db = await getDb('local');
    const settings = await db.get('SELECT * FROM settings WHERE org_id = ?', orgId);

    if (!settings || !settings.employee_access_code_hash) {
      return NextResponse.json({ success: false, error: 'Employee access control not configured.' });
    }

    const parts = settings.employee_access_code_hash.split(':');
    if (parts.length !== 2) {
      return NextResponse.json({ success: false, error: 'Invalid access code configuration.' });
    }

    const [salt, hash] = parts;
    const inputHash = crypto.pbkdf2Sync(code.trim(), salt, 1000, 64, 'sha512').toString('hex');

    if (inputHash === hash) {
      return NextResponse.json({
        success: true,
        passphrase: settings.hosted_bot_passphrase || ''
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid access code.' });
  } catch (e) {
    console.error('Verify access code error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
