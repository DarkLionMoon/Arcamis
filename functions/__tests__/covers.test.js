import { describe, it, expect } from 'vitest';
import { coverToUrl, coverUrlForId, isValidCoverId, parseImageDataUrl } from '../api/_lib/covers.js';

/* GIF 1x1 trasparente */
const GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

describe('isValidCoverId', () => {
  it('accetta id di pagina e chiavi carousel', () => {
    expect(isValidCoverId('2f00274fdc1c8065a11ff45192aa5dcb')).toBe(true);
    expect(isValidCoverId('carousel_0')).toBe(true);
    expect(isValidCoverId('lavori-forgia')).toBe(true);
  });

  it('rifiuta path traversal e valori vuoti', () => {
    expect(isValidCoverId('../admin_session_x')).toBe(false);
    expect(isValidCoverId('a/b')).toBe(false);
    expect(isValidCoverId('')).toBe(false);
    expect(isValidCoverId(null)).toBe(false);
  });
});

describe('coverUrlForId', () => {
  it('costruisce un URL same-origin con id codificato', () => {
    expect(coverUrlForId('carousel_0')).toBe('/api/cover/carousel_0');
  });
});

describe('coverToUrl', () => {
  it('sostituisce i data URL immagine con un URL statico', () => {
    const dataUrl = 'data:image/jpeg;base64,' + GIF_BASE64;
    expect(coverToUrl('pag-x', dataUrl)).toBe('/api/cover/pag-x');
    expect(coverToUrl('pag-x', 'data:image/webp;base64,AAAA')).toBe('/api/cover/pag-x');
  });

  it('lascia invariati URL, path e metadati', () => {
    expect(coverToUrl('pag-x', '/images/forgia.webp')).toBe('/images/forgia.webp');
    expect(coverToUrl('pag-x', 'https://cdn.example/cover.webp')).toBe('https://cdn.example/cover.webp');
    expect(coverToUrl('carousel_0_pos', 'center 40%')).toBe('center 40%');
    expect(coverToUrl('carousel_0_meta', '{"tag":"Arcamis"}')).toBe('{"tag":"Arcamis"}');
  });

  it('gestisce valori mancanti', () => {
    expect(coverToUrl('pag-x', null)).toBe(null);
    expect(coverToUrl('pag-x', '')).toBe('');
  });
});

describe('parseImageDataUrl', () => {
  it('decodifica i byte e mantiene il content type', () => {
    const parsed = parseImageDataUrl('data:image/gif;base64,' + GIF_BASE64);
    expect(parsed).not.toBe(null);
    expect(parsed.contentType).toBe('image/gif');
    expect(parsed.bytes).toBeInstanceOf(Uint8Array);
    expect(parsed.bytes.length).toBeGreaterThan(10);
    expect(parsed.bytes[0]).toBe(0x47); // 'G'
  });

  it('accetta base64 con spazi/newline', () => {
    const parsed = parseImageDataUrl('data:image/gif;base64,' + GIF_BASE64.slice(0, 10) + '\n' + GIF_BASE64.slice(10));
    expect(parsed).not.toBe(null);
  });

  it('rifiuta valori non immagine o non base64', () => {
    expect(parseImageDataUrl('/images/foo.webp')).toBe(null);
    expect(parseImageDataUrl('data:text/plain;base64,SGVsbG8=')).toBe(null);
    expect(parseImageDataUrl('data:image/jpeg;base64,@@@')).toBe(null);
    expect(parseImageDataUrl(null)).toBe(null);
  });
});
