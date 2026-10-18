/* ════════════════════════════════════════════════════════════════
   ARCAMIS — build-all.mjs
   Unico percorso di build: CI, staging e deploy da locale passano
   tutti di qui, così ciò che viene testato è ciò che viene pubblicato.

   L'ordine conta. Prima il pannello Vue in export/admin, poi il sito:
   `build-post.mjs` copia export/admin in dist/admin, quindi al
   contrario — build del sito e admin dopo — dist/ finirebbe con il
   pannello del commit precedente, o senza pannello affatto in un
   checkout pulito.

   Uso: npm run build
   ════════════════════════════════════════════════════════════════ */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error('\n✖ build: ' + message + '\n');
  process.exit(1);
}

/* `shell: true` è obbligatorio: su Windows npm è uno script .cmd e Node
   rifiuta di eseguirlo direttamente (EINVAL). Gli argomenti sono costanti
   scritte qui, quindi non c'è nulla di interpolato dalla shell. */
function step(title, args) {
  console.log('\n▶ ' + title);
  const result = spawnSync(['npm', ...args].join(' '), {
    cwd: root,
    stdio: 'inherit',
    shell: true
  });
  if (result.error) fail(title + ': ' + result.error.message);
  if (result.status !== 0) fail(title + ': uscita ' + result.status);
}

function requireFile(relative, hint) {
  if (!fs.existsSync(path.join(root, relative))) fail(relative + ' mancante: ' + hint);
}

/* Le dipendenze dell'admin vivono in admin/node_modules: senza di esse il
   pannello non si compila. In CI e staging ci pensano già `npm ci --prefix
   admin`; qui restano come rete per chi lancia la build da un checkout
   appena clonato (o per un build environment che installa solo la root). */
if (!fs.existsSync(path.join(root, 'admin/node_modules/vite'))) {
  step('Dipendenze del pannello mancanti: installo admin/', ['ci', '--prefix', 'admin']);
}

step('Pannello admin → export/admin', ['run', 'build:admin']);
requireFile('export/admin/app.html', 'la build del pannello è incompleta');

step('Sito + admin in dist/', ['run', 'build:site']);
requireFile('dist/index.html', 'la build del sito non ha prodotto la home');
requireFile('dist/admin/app.html', 'il pannello non è finito in dist/admin');

/* Impronta dell'artefatto: due build dello stesso commit devono dare lo
   stesso digest, e un digest diverso è il modo più veloce per accorgersi
   che ciò che è stato testato non è ciò che si sta pubblicando. */
function digest(dir) {
  const files = [];
  (function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1
    )) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else files.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  })(path.join(root, dir));
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update(fs.readFileSync(path.join(root, file)));
  }
  return { count: files.length, digest: hash.digest('hex').slice(0, 16) };
}

const admin = digest('export/admin');
const dist = digest('dist');
const maps = fs.readdirSync(path.join(root, 'dist/admin'), { recursive: true }).filter((name) => String(name).endsWith('.map'));

console.log('\n✔ Build pronta per il deploy');
console.log('  Pannello : export/admin — ' + admin.count + ' file, digest ' + admin.digest);
console.log('  Sito     : dist — ' + dist.count + ' file (pannello incluso), digest ' + dist.digest);
console.log('  Source map in dist/admin: ' + maps.length);
if (maps.length) fail('dist/admin contiene source map: il deploy non deve esporre i sorgenti del pannello');
