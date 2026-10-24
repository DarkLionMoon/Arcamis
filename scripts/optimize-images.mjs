#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   ARCAMIS — optimize-images.mjs

   Pipeline delle immagini: dai sorgenti in `images/` alle varianti
   AVIF/WebP usate dal sito.

   Per ogni immagine raster produce, in `images/opt/<stessa cartella>`:
     <nome>-640.avif|webp
     <nome>-1280.avif|webp
     <nome>-1920.avif|webp

   Le larghezze non vengono mai ingrandite: un'immagine da 700px
   genera solo la variante 640 (più la sua larghezza nativa).

   Scrive due manifest:
     images/opt/manifest.json      → usato dai test e dal report
     scripts/js/image-manifest.js  → letto subito da images.js, così
                                     il markup <picture> non aspetta
                                     una fetch per conoscere le misure

   Uso:
     npm run images:opt            genera/aggiorna le varianti
     npm run images:check          solo report, nessuna scrittura
     node scripts/optimize-images.mjs --force     rigenera tutto
* ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'images');
const OUT_DIR = path.join(SRC_DIR, 'opt');
const MANIFEST_JSON = path.join(OUT_DIR, 'manifest.json');
const MANIFEST_JS = path.join(ROOT, 'scripts/js/image-manifest.js');

const WIDTHS = [640, 1280, 1920];
const FORMATS = [
  { ext: 'avif', key: 'a', options: { quality: 52, effort: 3, chromaSubsampling: '4:2:0' } },
  { ext: 'webp', key: 'w', options: { quality: 74, effort: 4 } }
];
const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/* Budget in byte per variante: oltre, il build lo segnala. */
const BUDGETS = {
  640: 80 * 1024,
  1280: 180 * 1024,
  1920: 400 * 1024
};

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const FORCE = args.has('--force');
const QUIET = args.has('--quiet');

function urlOf(file) {
  return '/' + path.relative(ROOT, file).split(path.sep).join('/');
}

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'opt') continue;
      await walk(absolute, out);
    } else if (SOURCE_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(absolute);
    }
  }
  return out;
}

function variantWidths(sourceWidth) {
  const widths = WIDTHS.filter((width) => width < sourceWidth);
  widths.push(Math.min(sourceWidth, WIDTHS[WIDTHS.length - 1]));
  return [...new Set(widths)].sort((a, b) => a - b);
}

async function isFresh(source, variant) {
  try {
    const [src, out] = await Promise.all([fs.stat(source), fs.stat(variant)]);
    return out.mtimeMs >= src.mtimeMs;
  } catch {
    return false;
  }
}

async function processImage(file, report) {
  const relative = path.relative(SRC_DIR, file);
  const base = path.basename(relative, path.extname(relative));
  const targetDir = path.join(OUT_DIR, path.dirname(relative));
  const meta = await sharp(file).metadata();
  const widths = variantWidths(meta.width || 0);
  const entry = { w: meta.width || 0, h: meta.height || 0, v: {} };
  let written = 0;
  let bytes = 0;

  for (const width of widths) {
    entry.v[width] = {};
    for (const format of FORMATS) {
      const name = `${base}-${width}.${format.ext}`;
      const target = path.join(targetDir, name);
      const fresh = !FORCE && (await isFresh(file, target));
      if (!fresh && CHECK_ONLY) report.stale = (report.stale || 0) + 1;
      if (!fresh) {
        if (!CHECK_ONLY) {
          await fs.mkdir(targetDir, { recursive: true });
          /* Le thumbnail strette hanno meno pixel per byte utile: una
             qualità leggermente più bassa tiene il budget dei 80 KB. */
          const options =
            format.ext === 'webp' && width <= 640
              ? { ...format.options, quality: 72 }
              : format.options;
          await sharp(file)
            .resize({ width, withoutEnlargement: true })
            .toFormat(format.ext, options)
            .toFile(target);
          written += 1;
        }
      }
      if (!CHECK_ONLY || fresh) {
        const stat = await fs.stat(target).catch(() => null);
        const size = stat ? stat.size : 0;
        bytes += size;
        entry.v[width][format.key] = urlOf(target);
        entry.v[width][format.key + 'B'] = size;
        const budget = BUDGETS[width];
        if (budget && size > budget) {
          report.overBudget.push({ file: urlOf(target), width, size, budget });
        }
      }
    }
  }

  report.sources[urlOf(file)] = entry;
  report.total += 1;
  if (written) report.written += written;
  report.bytesOut += bytes;
  report.bytesIn += (await fs.stat(file)).size;

  if (!QUIET) {
    const saved = widths.map((width) => `${width}px`).join('/');
    console.log(`  ${CHECK_ONLY ? '·' : freshMark(written)} ${urlOf(file)} → ${saved}`);
  }
}

function freshMark(written) {
  return written > 0 ? '✓' : '↺';
}

async function main() {
  const started = Date.now();
  const files = await walk(SRC_DIR);
  const report = { total: 0, written: 0, stale: 0, bytesIn: 0, bytesOut: 0, overBudget: [], sources: {} };

  if (!CHECK_ONLY) await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Immagini: ${files.length} sorgenti · larghezze ${WIDTHS.join('/')}px · AVIF+WebP`);

  for (const file of files) {
    try {
      await processImage(file, report);
    } catch (error) {
      console.error(`  ✗ ${urlOf(file)}: ${error.message}`);
      report.failed = (report.failed || 0) + 1;
    }
  }

  if (!CHECK_ONLY) {
    await fs.writeFile(
      MANIFEST_JSON,
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          widths: WIDTHS,
          formats: ['avif', 'webp'],
          sources: report.sources
        },
        null,
        2
      ) + '\n'
    );

    const compact = {};
    for (const [src, entry] of Object.entries(report.sources)) {
      const variants = {};
      for (const [width, formats] of Object.entries(entry.v)) {
        variants[width] = {};
        for (const format of FORMATS) variants[width][format.key] = formats[format.key];
      }
      compact[src] = { w: entry.w, h: entry.h, v: variants };
    }
    await fs.writeFile(
      MANIFEST_JS,
      '/* AUTO-GENERATO da scripts/optimize-images.mjs — non modificare a mano. */\n' +
        'window.ARC_IMAGES = ' +
        JSON.stringify(compact) +
        ';\n'
    );
  }

  const mb = (bytes) => (bytes / 1048576).toFixed(1) + ' MB';
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log('');
  console.log(
    `  Sorgenti : ${report.total} file (${mb(report.bytesIn)})` +
      (report.failed ? ` · ${report.failed} errori` : '')
  );
  console.log(`  Varianti : ${report.written} nuovi file${CHECK_ONLY ? ' (check: nessuna scrittura)' : ''}`);
  console.log(`  Peso out : ${mb(report.bytesOut)} in ${Object.keys(report.sources).length} set`);
  if (report.overBudget.length) {
    console.log(`  ⚠ ${report.overBudget.length} varianti oltre il budget:`);
    report.overBudget.slice(0, 8).forEach((item) => {
      console.log(`     ${item.file} → ${(item.size / 1024).toFixed(0)} KB (max ${item.budget / 1024} KB)`);
    });
  } else {
    console.log('  ✓ Tutte le varianti entro il budget');
  }
  console.log(`  Tempo    : ${elapsed}s`);
  if (CHECK_ONLY && report.stale) {
    console.log(`  ⚠ ${report.stale} varianti mancanti o da aggiornare: esegui \`npm run images:opt\``);
    process.exitCode = 1;
  }
  if (report.failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
