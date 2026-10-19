/* ════════════════════════════════════════════════════════════════
   ARCAMIS — build-summary.mjs
   Trasforma dist/build-info.json in Markdown per $GITHUB_STEP_SUMMARY:
   il digest finisce nel riepilogo della run, quindi resta consultabile
   anche quando i log scadono.

   Uso: node scripts/build-summary.mjs >> "$GITHUB_STEP_SUMMARY"
   ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';

const infoPath = path.join(process.cwd(), 'dist/build-info.json');
if (!fs.existsSync(infoPath)) {
  console.error('✖ build-summary: dist/build-info.json mancante: esegui prima `npm run build`.');
  process.exit(1);
}

const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
const line = (label, entry) => '| ' + label + ' | ' + entry.files + ' | `' + entry.digest + '` |';

console.log('## Artefatto di build');
console.log('');
console.log('| Artefatto | File | Digest |');
console.log('| --- | --- | --- |');
console.log(line('export/admin', info.admin));
console.log(line('dist', info.dist));
console.log('');
console.log(
  'Commit `' + (info.commit || 'sconosciuto') + '` · il digest copre percorsi e contenuti; ' +
    '`dist/build-info.json` ne è escluso perché pubblica il digest stesso.'
);
const toolchain = info.toolchain || {};
console.log(
  'Costruito con Node `' +
    (toolchain.node || 'sconosciuto') +
    '`, npm `' +
    (toolchain.npm || 'sconosciuto') +
    '`, wrangler `' +
    (toolchain.wrangler || 'non installato') +
    '`.'
);
console.log('');
console.log(
  'Lo stesso digest è leggibile dal deploy su `/build-info.json`: se non coincide con ' +
    'questo, ciò che è pubblicato non è ciò che è stato testato.'
);
