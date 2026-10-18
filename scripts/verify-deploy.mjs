/* ════════════════════════════════════════════════════════════════
   ARCAMIS — verify-deploy.mjs
   Legge il digest dell'artefatto locale (dist/build-info.json) e lo
   confronta con quello che il deploy pubblica su /build-info.json:
   così "ciò che è stato testato è ciò che è online" non è una
   promessa, è un confronto che può fallire.

   Uso:
     node scripts/verify-deploy.mjs <url> [altra-url…]
     node scripts/verify-deploy.mjs https://arcamis.pages.dev

   Più URL servono allo staging, dove l'URL univoco del deploy e
   l'alias del branch sono candidati diversi.
   ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';

const attempts = Number(process.env.VERIFY_DEPLOY_ATTEMPTS || 8);
const delayMs = Number(process.env.VERIFY_DEPLOY_DELAY_MS || 5000);

function fail(message) {
  console.error('\n✖ verify-deploy: ' + message + '\n');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const candidates = process.argv
  .slice(2)
  .filter((value) => value && value.trim())
  .map((value) => value.trim().replace(/\/+$/, ''));

if (!candidates.length) {
  fail('serve almeno un URL: node scripts/verify-deploy.mjs https://<deploy>');
}

const localPath = path.join(process.cwd(), 'dist/build-info.json');
if (!fs.existsSync(localPath)) {
  fail('dist/build-info.json mancante: esegui prima `npm run build`.');
}
const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));

/* Il deploy può non essere ancora propagato: si ritenta, ma solo per il
   primo candidato raggiungibile. La query cache-buster evita che l'edge
   serva il build-info.json del deploy precedente. */
async function readRemote(base) {
  const url = base + '/build-info.json?cb=' + Date.now();
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { accept: 'application/json' }
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' da ' + url);
  const text = await response.text();
  try {
    return { base, url, info: JSON.parse(text) };
  } catch (error) {
    throw new Error('risposta non JSON da ' + url + ' (' + text.slice(0, 60).trim() + '…)');
  }
}

let remote = null;
let lastError = null;
for (const base of candidates) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await readRemote(base);
      /* Un deploy vecchio (o l'alias di un altro branch) risponde con un
         digest diverso: si aspetta la propagazione invece di dichiarare
         subito un fallimento. */
      if (result.info.dist && result.info.dist.digest === local.dist.digest) {
        remote = result;
        break;
      }
      lastError = new Error(
        base +
          ': pubblicato digest ' +
          (result.info.dist && result.info.dist.digest) +
          ', atteso ' +
          local.dist.digest
      );
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await sleep(delayMs);
  }
  if (remote) break;
}

if (!remote) {
  fail(
    'nessun candidato pubblica l\'artefatto appena costruito.\n' +
      '  atteso: dist ' +
      local.dist.digest +
      ' (admin ' +
      local.admin.digest +
      ', commit ' +
      (local.commit || 'sconosciuto') +
      ')\n' +
      '  ultimo errore: ' +
      (lastError ? lastError.message : 'nessun tentativo')
  );
}

console.log('\n✔ Deploy verificato su ' + remote.base);
console.log('  Digest : ' + remote.info.dist.digest + ' (uguale al dist locale)');
console.log(
  '  Commit : ' + (remote.info.commit || 'sconosciuto') + ' (locale: ' + (local.commit || 'sconosciuto') + ')'
);
if (remote.info.admin && remote.info.admin.digest !== local.admin.digest) {
  console.log('  ⚠ Pannello: il digest di export/admin non coincide, il sito è comunque quello giusto');
}
