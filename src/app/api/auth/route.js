import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'secure-policy-bot-default-jwt-secret-key-1234';

/**
 * Basic PBKDF2 password hashing (since it's node-native, avoiding bcrypt install complications)
 */
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, password, orgName } = body;
    const email = body.email ? body.email.trim().toLowerCase() : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = await getDb('local'); // Always use local control database for tenant accounts

    if (action === 'signup') {
      if (!orgName) {
        return NextResponse.json({ error: 'Organization name is required for signup.' }, { status: 400 });
      }

      // Check if user already exists
      const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);
      if (existingUser) {
        return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
      }

      const orgId = 'org_' + Math.random().toString(36).substr(2, 9);
      const userId = 'user_' + Math.random().toString(36).substr(2, 9);
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = `${salt}:${hashPassword(password, salt)}`;

      // Save organization and user in transaction
      await db.run('INSERT INTO organizations (id, name) VALUES (?, ?)', orgId, orgName);
      await db.run('INSERT INTO users (id, email, password_hash, org_id) VALUES (?, ?, ?, ?)', userId, email, passwordHash, orgId);

      // Create default settings for this organization
      await db.run(
        `INSERT INTO settings (org_id, llm_provider, active_model, db_provider, encrypted_db_credentials) 
         VALUES (?, ?, ?, ?, ?)`,
        orgId,
        'openai',
        'gpt-4o-mini',
        'sqlite-local',
        JSON.stringify({})
      );

      const token = jwt.sign({ userId, orgId, email }, JWT_SECRET, { expiresIn: '7d' });

      return NextResponse.json({
        success: true,
        token,
        orgId,
        orgName,
        email
      });
    } 
    
    if (action === 'login') {
      const user = await db.get('SELECT id, password_hash, org_id FROM users WHERE email = ?', email);
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      const [salt, storedHash] = user.password_hash.split(':');
      const inputHash = hashPassword(password, salt);

      if (inputHash !== storedHash) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      const org = await db.get('SELECT name FROM organizations WHERE id = ?', user.org_id);
      const token = jwt.sign({ userId: user.id, orgId: user.org_id, email }, JWT_SECRET, { expiresIn: '7d' });

      return NextResponse.json({
        success: true,
        token,
        orgId: user.org_id,
        orgName: org ? org.name : 'Organization',
        email
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (e) {
    console.error('Auth handler error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
