// Unified Cryptography helper running identically in browser and Node.js
// Powered by globalThis.crypto.subtle (Standardized Web Crypto API)

const AES_ALGO = 'AES-GCM';
const PBKDF2_ALGO = 'PBKDF2';
const HASH_ALGO = 'SHA-256';

/**
 * Converts a string into a Uint8Array buffer
 */
function str2ab(str) {
  return new TextEncoder().encode(str);
}

/**
 * Converts an ArrayBuffer to a string
 */
function ab2str(buf) {
  return new TextDecoder().decode(buf);
}

/**
 * Converts a buffer to a Hex string
 */
function buf2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

/**
 * Converts a Hex string to a Uint8Array
 */
function hex2buf(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Derive an AES-GCM 256 key from a passphrase and a salt.
 */
async function deriveKey(passphrase, salt) {
  const subtle = globalThis.crypto.subtle;
  const passphraseBuffer = str2ab(passphrase);
  const saltBuffer = str2ab(salt);

  // Import passphrase as a raw key material
  const baseKey = await subtle.importKey(
    'raw',
    passphraseBuffer,
    { name: PBKDF2_ALGO },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the AES key
  return subtle.deriveKey(
    {
      name: PBKDF2_ALGO,
      salt: saltBuffer,
      iterations: 100000,
      hash: HASH_ALGO
    },
    baseKey,
    { name: AES_ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext string using a password and salt.
 * Returns a formatted Hex string: "saltHex:ivHex:ciphertextHex"
 */
export async function encryptText(plaintext, password, salt = 'policy-bot-default-salt') {
  const subtle = globalThis.crypto.subtle;
  const key = await deriveKey(password, salt);

  // Generate a cryptographically strong 12-byte IV (Initialization Vector)
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plaintextBuffer = str2ab(plaintext);

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: AES_ALGO,
      iv: iv
    },
    key,
    plaintextBuffer
  );

  const ivHex = buf2hex(iv.buffer);
  const ciphertextHex = buf2hex(ciphertextBuffer);
  const saltHex = buf2hex(str2ab(salt));

  // Output format combines all three elements necessary to decrypt
  return `${saltHex}:${ivHex}:${ciphertextHex}`;
}

/**
 * Decrypts a formatted Hex string ciphertext.
 */
export async function decryptText(encryptedString, password) {
  const subtle = globalThis.crypto.subtle;
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format. Expected saltHex:ivHex:ciphertextHex.');
  }

  const [saltHex, ivHex, ciphertextHex] = parts;
  const salt = ab2str(hex2buf(saltHex));
  const iv = hex2buf(ivHex);
  const ciphertext = hex2buf(ciphertextHex);

  const key = await deriveKey(password, salt);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: AES_ALGO,
      iv: iv
    },
    key,
    ciphertext
  );

  return ab2str(decryptedBuffer);
}
