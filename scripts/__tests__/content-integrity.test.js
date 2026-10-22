/* ════════════════════════════════════════════════════════════
   Integrità dei contenuti migrati da Notion.

   Questa suite è volutamente severa: blocca segnaposto, residui
   dell'export, immagini mancanti, link interni rotti e JSON fuori
   schema. I contenuti sono la fonte di verità della wiki: una
   regressione qui deve fermare la build, non arrivare in produzione.
   ════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { collectRoutes } from '../lib/routes.mjs';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'content', 'pages');
const SCHEMAS_DIR = path.join(ROOT, 'content', 'schemas');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  );
const contentTextFiles = walk(path.join(ROOT, 'content')).filter((file) => /\.(json|md)$/i.test(file));
const pageFiles = fs.readdirSync(PAGES_DIR).filter((file) => file.endsWith('.json') && file !== 'registry.json');
const pageEntries = pageFiles.map((file) => [file.replace(/\.json$/, ''), readJson(path.join(PAGES_DIR, file))]);
const registry = readJson(path.join(PAGES_DIR, 'registry.json'));
const pageSchema = readJson(path.join(SCHEMAS_DIR, 'page.schema.json'));
const registrySchema = readJson(path.join(SCHEMAS_DIR, 'registry.schema.json'));
const mapSchema = readJson(path.join(SCHEMAS_DIR, 'mappins.schema.json'));
const mapData = readJson(path.join(ROOT, 'content', 'mappins.json'));

/* ── Validatore JSON Schema (sottoinsieme draft-07 usato dal repo) ──
   Evita una dipendenza in più: i nostri schemi usano type, required,
   properties, items, enum, pattern, minLength, format e additionalProperties. */
function schemaErrors(value, schema, where = '$') {
  const errors = [];
  if (!schema || typeof schema !== 'object') return errors;

  const typeOf = (candidate) => {
    if (candidate === null) return 'null';
    if (Array.isArray(candidate)) return 'array';
    if (Number.isInteger(candidate)) return 'integer';
    return typeof candidate;
  };
  const matchesType = (candidate, expected) => {
    if (expected === 'number') return typeof candidate === 'number' && Number.isFinite(candidate);
    return typeOf(candidate) === expected;
  };

  if (schema.type) {
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!expected.some((type) => matchesType(value, type))) {
      errors.push(`${where}: tipo ${typeOf(value)}, atteso ${expected.join('|')}`);
      return errors;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${where}: valore «${String(value)}» fuori enum`);
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${where}: stringa troppo corta (${value.length}/${schema.minLength})`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${where}: «${value}» non rispetta ${schema.pattern}`);
    }
    if (schema.format === 'date-time' && Number.isNaN(Date.parse(value))) {
      errors.push(`${where}: data non valida «${value}»`);
    }
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => errors.push(...schemaErrors(item, schema.items, `${where}[${index}]`)));
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required || []) {
      if (!(key in value)) errors.push(`${where}: manca «${key}»`);
    }
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (key in value) errors.push(...schemaErrors(value[key], child, `${where}.${key}`));
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in (schema.properties || {}))) errors.push(`${where}: proprietà non ammessa «${key}»`);
      }
    }
  }

  return errors;
}

const isExternal = (target) => /^(?:[a-z]+:)?\/\//i.test(target) || /^(?:mailto|tel|data):/i.test(target);
const stripSuffix = (target) => target.split('#')[0].split('?')[0];

/* ── Pagine ───────────────────────────────────────────────── */
describe('integrità · pagine migrate', () => {
  it('nessun file JSON/MD contiene segnaposto o rumore dell’export Notion', () => {
    const forbidden = [
      'Da scrivere',
      'Contenuto in arrivo',
      'In allestimento',
      'Sezione in allestimento',
      'notion.site',
      'collection://',
      'page_id',
      '&nbsp;',
      '&amp;',
      '<div',
      '<span'
    ];
    for (const file of contentTextFiles) {
      const haystack = fs.readFileSync(file, 'utf8').toLowerCase();
      for (const token of forbidden) {
        expect(haystack, `${path.relative(ROOT, file)}: segnaposto/residuo «${token}»`).not.toContain(
          token.toLowerCase()
        );
      }
    }
  });

  it('non contengono segnaposto o rumore dell’export Notion', () => {
    const forbidden = [
      'Da scrivere',
      'Contenuto in arrivo',
      'In allestimento',
      'Sezione in allestimento',
      'notion.site',
      'collection://',
      'page_id',
      '&nbsp;',
      '&amp;',
      '<div',
      '<span'
    ];
    for (const [key, page] of pageEntries) {
      const haystack = [page.title, page.description, page.content].filter(Boolean).join('\n');
      for (const token of forbidden) {
        expect(haystack.toLowerCase(), `${key}: segnaposto/residuo «${token}»`).not.toContain(token.toLowerCase());
      }
      /* Gli ID Notion sono 32 caratteri esadecimali; i nomi immagine locali
         usano un prefisso diverso e non vengono confusi. */
      expect(haystack, `${key}: ID Notion residuo`).not.toMatch(/[a-f0-9]{32}/i);
    }
  });

  it('hanno contenuto non vuoto e un file per ogni voce del registro', () => {
    const registryKeys = new Set(registry.pages.map((page) => page.k));
    const pageKeys = new Set(pageEntries.map(([key]) => key));

    for (const [key, page] of pageEntries) {
      if (page.layout === 'imprese') continue;
      expect(String(page.content || '').trim().length, `${key}: contenuto vuoto`).toBeGreaterThan(0);
      expect(registryKeys.has(key), `${key}: pagina fuori dal registro Admin`).toBe(true);
    }
    for (const entry of registry.pages) {
      expect(pageKeys.has(entry.k), `${entry.k}: file pagina mancante`).toBe(true);
      expect(entry.admin, `${entry.k}: pagina non gestibile dall’Admin`).not.toBe(false);
    }
    expect(pageKeys.size).toBe(registry.pages.length);
  });

  it('rispettano lo schema page.schema.json', () => {
    for (const [key, page] of pageEntries) {
      expect(schemaErrors(page, pageSchema), key).toEqual([]);
    }
    expect(schemaErrors(registry, registrySchema)).toEqual([]);
  });

  it('non duplicano paragrafi consecutivi (regressione della migrazione)', () => {
    for (const [key, page] of pageEntries) {
      const lines = String(page.content || '').split('\n');
      for (let index = 1; index < lines.length; index += 1) {
        const previous = lines[index - 1].trim();
        const current = lines[index].trim();
        if (previous.length < 60 || previous !== current) continue;
        throw new Error(`${key}: riga ${index + 1} ripetuta consecutivamente: «${previous.slice(0, 80)}…»`);
      }
    }
  });

  it('usano solo layout che il sito e l’Admin conoscono', () => {
    const allowed = new Set(pageSchema.properties.layout.enum);
    for (const [key, page] of pageEntries) {
      expect(allowed.has(page.layout || ''), `${key}: layout «${page.layout}» sconosciuto`).toBe(true);
    }
  });
});

/* ── Immagini ─────────────────────────────────────────────── */
describe('integrità · immagini', () => {
  it('ogni immagine referenziata esiste sul filesystem', () => {
    const refs = new Set();
    for (const [key, page] of pageEntries) {
      for (const match of String(page.content || '').matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
        const src = match[1].trim().split('#')[0];
        if (!src || isExternal(src)) continue;
        refs.add(src);
      }
    }
    /* Anche i JSON non-pagina (mappa, registro, changelog) possono
       referenziare immagini: se il percorso sparisce, il test lo blocca. */
    for (const file of contentTextFiles) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/(?:^|[\s"'(])(\/images\/[^\s"'()\]]+)/g)) {
        refs.add(match[1].split('#')[0].split('?')[0]);
      }
    }
    if (mapData.mapImage) refs.add(mapData.mapImage);

    expect(refs.size).toBeGreaterThan(60);
    for (const src of refs) {
      const relative = src.replace(/^\/+/, '');
      expect(fs.existsSync(path.join(ROOT, relative)), `immagine mancante: ${src}`).toBe(true);
    }

    /* Nessun file orfano: ogni immagine copiata da Notion è usata da una
       pagina e resta gestibile dall'Admin. */
    const imported = fs
      .readdirSync(path.join(ROOT, 'images', 'notion'))
      .map((name) => `/images/notion/${name}`)
      .sort();
    const usedImported = [...refs].filter((src) => src.startsWith('/images/notion/')).sort();
    expect(usedImported).toEqual(imported);
  });
});

/* ── Link ─────────────────────────────────────────────────── */
describe('integrità · link interni', () => {
  it('nessun link di pagina punta a una rotta inesistente', () => {
    const routes = new Set(collectRoutes(ROOT).map((route) => '/' + route.path));
    routes.add('/');

    const broken = [];
    for (const [key, page] of pageEntries) {
      const content = String(page.content || '');
      for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const before = content.slice(Math.max(0, match.index - 1), match.index);
        if (before === '!') continue; // immagine, già verificata sopra
        const target = match[1].trim();
        if (!target || target.startsWith('#') || isExternal(target)) continue;
        const clean = stripSuffix(target);
        if (!clean.startsWith('/')) continue;
        if (routes.has(clean)) continue;
        if (fs.existsSync(path.join(ROOT, clean.replace(/^\/+/, '')))) continue;
        broken.push(`${key} → ${target}`);
      }
    }

    expect(broken).toEqual([]);
  });
});

/* ── Contenuti strutturati ────────────────────────────────── */
const splitCards = (markdown) =>
  String(markdown)
    .split(/\n[ \t]*---[ \t]*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

describe('integrità · pantheon e compendi', () => {
  it('il pantheon ha 20 divinità complete', () => {
    const page = pageEntries.find(([key]) => key === 'pantheon')?.[1];
    const sections = String(page.content)
      .split(/\n---\n/)
      .map((block) => block.trim())
      .filter((block) => block.startsWith('# ') && block.includes('## Identità'));
    expect(sections).toHaveLength(20);
    for (const section of sections) {
      expect(section).toContain('## Identità');
      expect(section).toContain('**Nome:**');
      expect(section).toContain('**Epiteto:**');
      expect(section).toContain('**Allineamento:**');
      expect(section).toContain('**Sfere:**');
      expect(section).toContain('**Simbolo:**');
      expect(section).toContain('## Personalità');
      expect(section).toContain('## Culto');
    }
  });

  it('specie e sottoclassi usano il compendio, senza schede vuote', () => {
    for (const [key, count] of [
      ['specie-homebrew', 33],
      ['sottoclassi-homebrew', 18]
    ]) {
      const page = pageEntries.find(([candidate]) => candidate === key)?.[1];
      expect(page.layout, `${key}: layout`).toBe('compendio');
      const blocks = splitCards(page.content);
      const cards = blocks.filter((block) => /^#\s+\S/m.test(block));
      expect(cards.length, `${key}: numero schede`).toBe(count);
      expect(blocks.every((block) => block.trim().length > 0), `${key}: scheda vuota`).toBe(true);
      for (const card of cards) {
        expect(card, `${key}: scheda senza titolo`).toMatch(/^#\s+\S/m);
        /* Un solo H1 per scheda: un H1 annidato spezza l'indice del
           compendio e crea ancore duplicate nella sidebar pubblica. */
        expect((card.match(/^#\s+\S/gm) || []).length, `${key}: H1 annidato in «${card.split('\n')[0]}»`).toBe(1);
      }
    }
  });
});

/* ── Mappa ────────────────────────────────────────────────── */
describe('integrità · mappa e pin', () => {
  it('rispetta lo schema e collega solo pagine esistenti', () => {
    expect(schemaErrors(mapData, mapSchema)).toEqual([]);
    expect(mapData.pins.length).toBeGreaterThanOrEqual(12);

    const pageIds = new Set([...registry.pages.map((page) => page.id), ...pageEntries.map(([key]) => key)]);
    for (const pin of mapData.pins) {
      expect(pin.name.trim().length, `pin ${pin.id}: nome vuoto`).toBeGreaterThan(0);
      if (pin.pageId) expect(pageIds.has(pin.pageId), `pin ${pin.id}: pagina ${pin.pageId} inesistente`).toBe(true);
    }
  });
});
