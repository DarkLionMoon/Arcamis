/* ════════════════════════════════════════════════════════
   ARCAMIS — covers.js
   Le cover dell'admin sono storicamente salvate in KV come
   data URL base64. Restituirle dentro un JSON costringe ogni
   visitatore a scaricare l'intero set (≈7 MB sulla home).
   Questi helper convertono i valori in URL serviti on-demand
   da /api/cover/<id>, lasciando invariati metadati e URL già
   presenti (es. /images/foo.webp).
════════════════════════════════════════════════════════ */

const COVER_ID_RE = /^[A-Za-z0-9_-]{1,120}$/;

export function isValidCoverId(id) {
  return typeof id === 'string' && COVER_ID_RE.test(id);
}

export function coverUrlForId(pageId) {
  return '/api/cover/' + encodeURIComponent(pageId);
}

/**
 * Converte un valore di copertina in un URL servibile.
 * - data URL immagine  → /api/cover/<pageId>
 * - URL / percorso      → invariato
 * - metadati JSON/altro → invariato
 */
export function coverToUrl(pageId, value) {
  if (typeof value !== 'string' || !value) return value;
  if (/^data:image\//i.test(value)) return coverUrlForId(pageId);
  return value;
}

/**
 * Decodifica un data URL immagine in byte + content type.
 * Ritorna null se il valore non è un'immagine base64 valida.
 */
export function parseImageDataUrl(value) {
  if (typeof value !== 'string') return null;
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(value);
  if (!match) return null;
  const base64 = match[2].replace(/\s+/g, '');
  if (!base64) return null;
  let binary;
  try {
    binary = atob(base64);
  } catch (e) {
    return null;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { contentType: match[1].toLowerCase(), bytes };
}
