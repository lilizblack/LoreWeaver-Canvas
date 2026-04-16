/**
 * configCrypto.ts
 * AES-GCM encryption for BYOH Firebase configs.
 *
 * Key is derived per-user using PBKDF2 (uid + app salt).
 * The encrypted blob is safe to store in Master Firestore.
 *
 * RULE: Auth always stays on Master Firebase.
 *       Only the BYOH config (not auth tokens) is stored here.
 */

const APP_SALT = process.env.NEXT_PUBLIC_BYOH_SALT ?? 'loreweaver-byoh-v1';

/** Derive a 256-bit AES-GCM key from the user's uid + app salt */
async function deriveKey(uid: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(uid + APP_SALT),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(APP_SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a Firebase config object for the given user.
 * Returns a base64 string suitable for Firestore storage.
 */
export async function encryptConfig(config: object, uid: string): Promise<string> {
  const key = await deriveKey(uid);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(config))
  );

  // Combine [iv (12 bytes)] + [ciphertext]
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Safe base64 for Firestore
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt an encrypted config blob for the given user.
 * Returns the parsed config object, or null if decryption fails.
 */
export async function decryptConfig(blob: string, uid: string): Promise<Record<string, any> | null> {
  try {
    const combined = Uint8Array.from(atob(blob), c => c.charCodeAt(0));
    const iv   = combined.slice(0, 12);
    const data = combined.slice(12);

    const key = await deriveKey(uid);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    console.warn('[configCrypto] Decryption failed:', e);
    return null;
  }
}
