/* ════════════════════════════════════════════════════════
   ARCAMIS — _lib/carousel-config.js
   Manifest del carousel: validazione e normalizzazione pure,
   condivise tra admin.js (scrittura) e carousel.js (lettura).

   Manifest in KV (`admin_carousel`):
     { slides: [{ id, label, img, tag, tit, sub, desc, btns, hidden }],
       settings: { intervalMs, pauseOnHover } }

   Le funzioni non toccano KV né Request/Response: i validatori di
   URL/immagini arrivano dall'esterno così restano unit-testabili.
   ════════════════════════════════════════════════════════════════ */

export const CAROUSEL_MANIFEST_KEY = 'admin_carousel';
export const MAX_SLIDES = 8;
export const MIN_INTERVAL_MS = 2000;
export const MAX_INTERVAL_MS = 30000;

export const DEFAULT_SETTINGS = { intervalMs: 6000, pauseOnHover: true };

/** Slide di seed: gli stessi default hardcoded della home. */
export function defaultSlides() {
  return [
    {
      id: 'carousel_0',
      label: 'Slide 1 — Arcamis Porto',
      img: '',
      tag: 'Città Portuale — Marche di Arcamis',
      tit: 'ARCAMIS',
      sub: '',
      desc: "Città portuale delle Marche di Arcamis, porta d'ingresso al regno di Arcadia. Solo una piccola parte della regione è esplorata dai giocatori.",
      btns: [
        { label: 'Entra nel Discord', href: 'https://discord.gg/JZPnXZbXEJ' },
        { label: 'Scopri la città ↓', href: '' },
      ],
      hidden: false,
    },
    {
      id: 'carousel_1',
      label: 'Slide 2 — Pantheon',
      img: '',
      tag: 'Pantheon di Arcamis',
      tit: 'LE DIVINITÀ DI ARCAMIS',
      sub: '',
      desc: 'Ogni dio ha lasciato il proprio segno sulla terra. Scopri il Pantheon e i culti che plasmano il mondo.',
      btns: [{ label: 'Scopri il Pantheon →', href: '' }],
      hidden: false,
    },
    {
      id: 'carousel_2',
      label: 'Slide 3 — Personaggio',
      img: '',
      tag: 'Crea il tuo eroe',
      tit: 'CREA IL TUO PERSONAGGIO',
      sub: '',
      desc: 'Scegli la tua classe, forgia la tua storia. Il tuo personaggio esiste solo su Arcamis.',
      btns: [{ label: 'Come si inizia →', href: '' }],
      hidden: false,
    },
  ];
}

function isSlug(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-_]{0,63}$/.test(value);
}

function cleanStr(value, max) {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  return v.length > max ? null : v;
}

/**
 * Valida e normalizza un manifest candidato.
 * validators: { isValidImage(img): bool, isValidHref(href): bool }.
 * Ritorna { config } oppure { error }.
 */
export function sanitizeConfig(raw, validators) {
  const isValidImage = validators && validators.isValidImage ? validators.isValidImage : () => true;
  const isValidHref = validators && validators.isValidHref ? validators.isValidHref : () => true;

  if (!raw || typeof raw !== 'object') return { error: 'Configurazione non valida' };
  if (!Array.isArray(raw.slides)) return { error: 'slides deve essere una lista' };
  if (raw.slides.length < 1) return { error: 'Serve almeno una slide' };
  if (raw.slides.length > MAX_SLIDES) return { error: `Massimo ${MAX_SLIDES} slide` };

  const seen = new Set();
  const slides = [];
  for (let i = 0; i < raw.slides.length; i++) {
    const s = raw.slides[i];
    if (!s || typeof s !== 'object') return { error: `Slide ${i + 1} non valida` };
    if (!isSlug(s.id)) return { error: `Slide ${i + 1}: id non valido (a-z, 0-9, -, _)` };
    if (seen.has(s.id)) return { error: `Slide ${i + 1}: id duplicato (${s.id})` };
    seen.add(s.id);

    const label = cleanStr(s.label, 120);
    const tag = cleanStr(s.tag, 200);
    const tit = cleanStr(s.tit, 200);
    const sub = cleanStr(s.sub, 200);
    const desc = cleanStr(s.desc, 800);
    if (label === null || tag === null || tit === null || sub === null || desc === null) {
      return { error: `Slide ${i + 1}: testo troppo lungo` };
    }
    const img = typeof s.img === 'string' ? s.img.trim() : '';
    if (img && !isValidImage(img)) return { error: `Slide ${i + 1}: immagine non valida` };

    if (s.btns !== undefined && !Array.isArray(s.btns)) {
      return { error: `Slide ${i + 1}: btns deve essere una lista` };
    }
    const btns = [];
    for (const b of s.btns || []) {
      if (!b || typeof b !== 'object') continue;
      const blabel = typeof b.label === 'string' ? b.label.trim() : '';
      const href = typeof b.href === 'string' ? b.href.trim() : '';
      if (!blabel && !href) continue;
      if (!blabel) return { error: `Slide ${i + 1}: ogni bottone ha bisogno di un testo` };
      if (blabel.length > 80) return { error: `Slide ${i + 1}: testo del bottone troppo lungo` };
      if (!isValidHref(href)) return { error: `Slide ${i + 1}: link del bottone non valido` };
      btns.push({ label: blabel, href });
      if (btns.length > 3) return { error: `Slide ${i + 1}: massimo 3 bottoni` };
    }

    slides.push({
      id: s.id,
      label,
      img,
      tag,
      tit,
      sub,
      desc,
      btns,
      hidden: s.hidden === true,
    });
  }

  if (!slides.some((s) => !s.hidden)) return { error: 'Almeno una slide deve restare visibile' };

  let intervalMs = DEFAULT_SETTINGS.intervalMs;
  let pauseOnHover = DEFAULT_SETTINGS.pauseOnHover;
  if (raw.settings !== undefined) {
    if (typeof raw.settings !== 'object' || raw.settings === null) {
      return { error: 'settings non valide' };
    }
    if (raw.settings.intervalMs !== undefined) {
      const ms = Number(raw.settings.intervalMs);
      if (!Number.isFinite(ms)) return { error: 'Intervallo autoplay non valido' };
      intervalMs = Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, Math.round(ms)));
    }
    if (raw.settings.pauseOnHover !== undefined) {
      pauseOnHover = raw.settings.pauseOnHover === true;
    }
  }

  return { config: { slides, settings: { intervalMs, pauseOnHover } } };
}

/** Migrazione: slide legacy {key,img,meta,btns} → slide complete. */
export function seedSlidesFromLegacy(legacySlides) {
  const seeds = defaultSlides();
  return (legacySlides || []).map((s, i) => {
    const seed = seeds[i] || seeds[0];
    const meta = (s && s.meta) || {};
    const btns = Array.isArray(s && s.btns) && s.btns.length ? s.btns : seed.btns;
    return {
      id: (s && s.key) || seed.id,
      label: seed.label,
      img: (s && s.img) || '',
      tag: meta.tag || seed.tag,
      tit: meta.tit || seed.tit,
      sub: meta.sub || '',
      desc: meta.desc || seed.desc,
      btns: btns.map((b) => ({ label: b.label || '', href: b.href || '' })),
      hidden: false,
    };
  });
}

/** Solo le slide visibili, nell'ordine del manifest. */
export function visibleSlides(slides) {
  return (slides || []).filter((s) => s && s.hidden !== true);
}
