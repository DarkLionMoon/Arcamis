/*
  ARCAMIS — Backup automatico KV/R2
  Eseguibile come:
  - Cloudflare Worker Scheduled (cron)
  - GitHub Action (workflow_dispatch / schedule)
  - CLI manuale: node scripts/backup-kv.js

  Richiede env vars:
  - CF_API_TOKEN (con permessi Workers KV Storage:Edit + R2:Edit)
  - CF_ACCOUNT_ID
  - KV_NAMESPACE_ID (o CF_KV_NAMESPACE_BINDING)
  - R2_BUCKET (opzionale, per backup su R2)
  - R2_PUBLIC_URL (opzionale, per URL pubblici)
*/

const { Octokit } = require('@octokit/rest');

/* Config */
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const KV_NAMESPACE_ID = process.env.KV_NAMESPACE_ID || process.env.CF_KV_NAMESPACE_BINDING;
const R2_BUCKET = process.env.R2_BUCKET; // opzionale
const GH_TOKEN = process.env.GH_TOKEN; // per backup repo su GitHub
const GH_REPO = process.env.GH_REPO || 'DarkLionMoon/Arcamis';
const BACKUP_PREFIX = 'arcamis-backup';

if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !KV_NAMESPACE_ID) {
  console.error('❌ Variabili mancanti: CF_API_TOKEN, CF_ACCOUNT_ID, KV_NAMESPACE_ID');
  process.exit(1);
}

const kvBase = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}`;
const headers = {
  'Authorization': `Bearer ${CF_API_TOKEN}`,
  'Content-Type': 'application/json'
};

/* Utils */
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function listAllKeys() {
  let cursor, all = [];
  do {
    const url = `${kvBase}/keys${cursor ? `?cursor=${cursor}` : ''}`;
    const data = await fetchJson(url);
    all.push(...data.result.keys.map(k => k.name));
    cursor = data.result.cursor;
  } while (cursor);
  return all;
}

async function getKey(key) {
  const url = `${kvBase}/values/${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return { key, value: await res.text() };
}

async function putR2(key, value, contentType = 'application/json') {
  if (!R2_BUCKET) return;
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${encodeURIComponent(key)}`;
  await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': contentType },
    body: value
  });
}

/* Backup KV → R2 */
async function backupKV() {
  console.log('📦 Elenco chiavi KV...');
  const keys = await listAllKeys();
  console.log(`   Trovate ${keys.length} chiavi`);

  let ok = 0, fail = 0;
  for (const k of keys) {
    try {
      const data = await getKey(k);
      if (!data) { fail++; continue; }
      const r2Key = `${BACKUP_PREFIX}/kv/${k}.json`;
      await putR2(r2Key, JSON.stringify({ key: data.key, value: data.value, backedUpAt: new Date().toISOString() }));
      ok++;
      if (ok % 50 === 0) console.log(`   ${ok}/${keys.length}...`);
    } catch (e) {
      fail++;
      console.error(`   ❌ ${k}: ${e.message}`);
    }
  }
  console.log(`✅ KV backup: ${ok} ok, ${fail} fail`);
  return { ok, fail };
}

/* Backup repo GitHub → R2 */
async function backupRepo() {
  if (!GH_TOKEN) { console.log('⏭️  GH_TOKEN non configurato, skip repo backup'); return; }
  const octokit = new Octokit({ auth: GH_TOKEN });
  const [owner, repo] = GH_REPO.split('/');
  console.log(`📦 Backup repo ${GH_REPO}...`);

  try {
    const { data: tree } = await octokit.git.getTree({
      owner, repo,
      tree_sha: (await octokit.repos.getBranch({ owner, repo, branch: 'main' })).data.commit.sha,
      recursive: true
    });

    let ok = 0;
    for (const file of tree.tree.filter(f => f.type === 'blob' && !f.path.startsWith('.git') && f.size < 5 * 1024 * 1024)) {
      try {
        const { data: content } = await octokit.repos.getContent({ owner, repo, path: file.path, ref: 'main' });
        const b64 = content.content;
        const r2Key = `${BACKUP_PREFIX}/repo/${file.path}`;
        await putR2(r2Key, Buffer.from(b64, 'base64').toString('utf8'), 'text/plain');
        ok++;
      } catch (e) { /* skip binary/large */ }
    }
    console.log(`✅ Repo backup: ${ok} file`);
  } catch (e) {
    console.error('❌ Repo backup failed:', e.message);
  }
}

/* Pulizia vecchi backup (mantieni ultimi N giorni) */
async function cleanupOldBackups(days = 30) {
  if (!R2_BUCKET) return;
  console.log(`🧹 Pulizia backup > ${days} giorni...`);
  // Cloudflare R2 non ha API nativa per list+delete by prefix easily via REST
  // Si può usare `wrangler r2 object delete` in CLI o Worker separato
  console.log('   (Pulizia manuale via `wrangler r2 object delete` se necessario)');
}

/* Main */
async function main() {
  const start = Date.now();
  console.log(`🚀 Backup iniziato: ${new Date().toISOString()}`);
  await backupKV();
  await backupRepo();
  await cleanupOldBackups(30);
  console.log(`🏁 Completato in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch(e => { console.error('💥 Errore fatale:', e); process.exit(1); });