#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════
   ARCAMIS — gen-seo-static.mjs

   Riscrive le copie "sorgente" di sitemap.xml e robots.txt nella
   root del progetto (usate da `vite dev`/`vite preview`).

   La versione servita in produzione è generata a ogni build da
   scripts/build-post.mjs con la stessa logica (scripts/lib/routes.mjs):
   le due non possono divergere perché condividono il collettore.

   Uso: npm run seo
   La CI esegue `node scripts/gen-seo-static.mjs --check` per
   accorgersi se i file sono rimasti indietro.
════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { collectRoutes, renderSitemap, renderRobots } from './lib/routes.mjs';

const root = process.cwd();
const check = process.argv.includes('--check');
const routes = collectRoutes(root);
const targets = [
  ['sitemap.xml', renderSitemap(routes)],
  ['robots.txt', renderRobots()],
];

let stale = 0;
for (const [name, content] of targets) {
  const file = path.join(root, name);
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current === content) continue;
  stale++;
  if (check) {
    console.error(`✖ ${name} non è aggiornato: esegui \`npm run seo\`.`);
    continue;
  }
  fs.writeFileSync(file, content);
  console.log(`✔ aggiornato ${name} (${routes.length} rotte)`);
}

if (check && stale) process.exit(1);
if (!stale) console.log('✔ sitemap.xml e robots.txt sono allineati alle rotte correnti');
