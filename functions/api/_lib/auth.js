/*
  ARCAMIS — _lib/auth.js
  Helper di autenticazione condivisi (modulo privato, non è un endpoint).

  Estratti da functions/api/admin.js per renderli testabili con Vitest
  e riutilizzabili (es. gh.js) senza dipendere dal runtime Workers.
  Nota: le directory "_*" non vengono esposte come rotte da Cloudflare Pages.
*/

/* Confronto constant-time per prevenire timing attacks */
export function constantTimeEqual(a, b) {
  const stra = String(a || '');
  const strb = String(b || '');
  if (stra.length !== strb.length) return false;
  let result = 0;
  for (let i = 0; i < stra.length; i++) {
    result |= stra.charCodeAt(i) ^ strb.charCodeAt(i);
  }
  return result === 0;
}

export async function sha256hex(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* Password hashing con salt casuale (PBKDF2-SHA256), 100.000 iterazioni */
export function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password, existingSalt) {
  const salt = existingSalt || generateSalt();
  const data = new TextEncoder().encode(password + salt);
  const keyMaterial = await crypto.subtle.importKey('raw', data, { name: 'PBKDF2' }, false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return {
    hash: Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    salt,
  };
}

export async function verifyPassword(password, storedHash, salt) {
  const { hash } = await hashPassword(password, salt);
  return constantTimeEqual(hash, storedHash);
}

/* Token casuale (32 byte hex) */
export function genToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* Legge un cookie dal header Cookie (name=value; ...) */
export function parseCookie(header, name) {
  if (!header || !/^[a-zA-Z0-9_-]+$/.test(name)) return null;
  const match = String(header).match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch (_) {
    return null;
  }
}

/* Consente solo percorsi relativi, senza traversal o caratteri di controllo. */
export function isSafeRepositoryPath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 500) return false;
  if (value.startsWith('/') || value.includes(String.fromCharCode(92)) || value.includes('..')) return false;
  return !/[\\u0000-\\u001f\\u007f]/.test(value);
}

/* I webhook sono configurazione server-side: limita l'SSRF a Discord. */
export function isAllowedDiscordWebhook(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'discord.com' || parsed.hostname === 'discordapp.com') &&
      parsed.pathname.startsWith('/api/webhooks/')
    );
  } catch (_) {
    return false;
  }
}

/*
  Rate limit generico su KV.
  kv: interfaccia { get(key): Promise<string|null>, put(key, value, opts): Promise<void> }
  Restituisce true se la richiesta va bloccata (limite superato), false altrimenti.
  Compatibile con il KV di Cloudflare Workers.
*/
export async function rateLimitCheck(kv, key, max, windowSec) {
  const raw = await kv.get(key, 'text');
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= max) return true;
  await kv.put(key, String(count + 1), { expirationTtl: windowSec });
  return false;
}
