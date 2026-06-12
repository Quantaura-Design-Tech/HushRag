import crypto from 'crypto';

const SERVER_SECRET = process.env.ENCRYPTION_KEY || 'secure-policy-bot-default-server-key-12345';

// Derive a 32-byte key from the secret synchronously
const derivedKey = crypto.scryptSync(SERVER_SECRET, 'salt-for-key-derivation', 32);

/**
 * Encrypts plaintext string using AES-256-GCM with a server-side secret.
 * Returns a formatted Hex string: "ivHex:authTagHex:ciphertextHex"
 */
export function encryptServerText(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a formatted Hex string ciphertext using AES-256-GCM with a server-side secret.
 */
export function decryptServerText(encryptedString) {
  if (!encryptedString) return '';
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid server encrypted text format. Expected ivHex:tagHex:ciphertextHex.');
  }
  const [ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
