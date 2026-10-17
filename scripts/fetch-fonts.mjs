#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════
   ARCAMIS — fetch-fonts.mjs

   Scarica una volta sola i .woff2 di Cinzel e Crimson Pro e genera
   scripts/css/fonts.css con @font-face locali.

   Perché: la pagina non deve contattare fonts.googleapis.com /
   fonts.gstatic.com (trasferirebbe l'IP del visitatore a Google e
   aggiunge due round-trip prima del primo testo).

   Nota sui pesi: Google serve per queste famiglie lo stesso file
   variabile per ogni peso richiesto. Il file viene quindi salvato
   una volta sola e dichiarato con un range (`font-weight: 400 900`),
   altrimenti il browser sintetizzerebbe il grassetto.

   I file finiscono in public/fonts (serviti dallo stesso dominio,
   copiati nel dist da Vite) e sono versionati.

   Uso: npm run fonts
════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const fontsDir = path.join(root, 'public', 'fonts');
const cssFile = path.join(root, 'scripts', 'css', 'fonts.css');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const families = [
  { family: 'Cinzel', query: 'Cinzel:wght@400;600;700;900', slug: 'cinzel', range: '400 900' },
  {
    family: 'Crimson Pro',
    query: 'Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400',
    slug: 'crimson-pro',
    range: '200 900',
  },
];

/* Solo i subset che servono all'italiano: latino base + esteso. */
const SUBSETS = new Set(['latin', 'latin-ext']);

fs.mkdirSync(fontsDir, { recursive: true });

const faces = new Map();
for (const family of families) {
  const url = `https://fonts.googleapis.com/css2?family=${family.query}&display=swap`;
  const response = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!response.ok) {
    console.error(`✖ ${family.family}: HTTP ${response.status}`);
    process.exit(1);
  }
  const css = await response.text();
  const regex = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([\s\S]*?)\}/g;
  let match;
  while ((match = regex.exec(css))) {
    const subset = match[1];
    if (!SUBSETS.has(subset)) continue;
    const body = match[2];
    const style = ((body.match(/font-style:\s*([^;]+);/) || [])[1] || 'normal').trim();
    const src = (body.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
    const range = (body.match(/unicode-range:\s*([^;]+);/) || [])[1];
    if (!src) continue;

    const key = `${family.slug}-${style}-${subset}`;
    if (faces.has(key)) continue;

    const bin = await fetch(src, { headers: { 'User-Agent': UA } });
    if (!bin.ok) {
      console.error(`✖ download ${key}: HTTP ${bin.status}`);
      process.exit(1);
    }
    const buffer = Buffer.from(await bin.arrayBuffer());
    /* suffisso di contenuto: se il font cambia, cambia anche l'URL */
    const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 8);
    const fileName = `${key}.${hash}.woff2`;
    fs.writeFileSync(path.join(fontsDir, fileName), buffer);
    faces.set(key, {
      family: family.family,
      style,
      range: family.range,
      fileName,
      unicodeRange: range && range.trim(),
      bytes: buffer.length,
    });
    console.log(`✔ ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }
}

/* Rimuove i file di versioni precedenti, per non accumulare doppioni. */
const keep = new Set([...faces.values()].map((face) => face.fileName));
for (const file of fs.readdirSync(fontsDir)) {
  if (!file.endsWith('.woff2')) continue;
  if (keep.has(file)) continue;
  fs.unlinkSync(path.join(fontsDir, file));
  console.log(`− rimosso obsoleto ${file}`);
}

const css = [
  '/* ════════════════════════════════════════════════════════',
  '   ARCAMIS — fonts.css',
  '   AUTO-GENERATO da scripts/fetch-fonts.mjs — non modificare a mano.',
  '   Font self-hosted: nessuna richiesta a Google al caricamento.',
  '   Licenze: SIL Open Font License 1.1 (Cinzel, Crimson Pro).',
  '════════════════════════════════════════════════════════ */',
  ...[...faces.values()].map((face) =>
    [
      '@font-face{',
      `  font-family:'${face.family}';`,
      `  font-style:${face.style};`,
      `  font-weight:${face.range};`,
      '  font-display:swap;',
      `  src:url('/fonts/${face.fileName}') format('woff2');`,
      face.unicodeRange ? `  unicode-range:${face.unicodeRange};` : null,
      '}',
    ]
      .filter(Boolean)
      .join('\n')
  ),
  '',
].join('\n');

fs.writeFileSync(cssFile, css);
const total = [...faces.values()].reduce((sum, face) => sum + face.bytes, 0);
console.log(`✔ ${path.relative(root, cssFile)}: ${faces.size} @font-face, ${(total / 1024).toFixed(0)} KB totali`);
