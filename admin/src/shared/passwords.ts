/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — password helper
   Hashing client-side compatibile con il backend (_lib/auth.js):
   PBKDF2-SHA256, 100.000 iterazioni, salt casuale, 256 bit.
   ════════════════════════════════════════════════════════════════ */

export function generateSalt(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPassword(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = existingSalt || generateSalt()
  const data = new TextEncoder().encode(password + salt)
  const keyMaterial = await crypto.subtle.importKey('raw', data, { name: 'PBKDF2' }, false, ['deriveBits'])
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return {
    hash: Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    salt
  }
}
