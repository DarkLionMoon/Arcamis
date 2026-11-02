import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { isPagePublic, stripMarkdown } from './routes.mjs';

// Reuse the client parser so duplicate names and entry hashes stay identical.
export function collectionIndex(root) {
  const window = { location: { hash: '', pathname: '/', search: '' } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'scripts/js/explorer.js'), 'utf8'), { window });
  const parser = window.ArcExplorer;
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/registry.json'), 'utf8'));
  const entries = [];
  for (const page of registry.pages) {
    const file = path.join(root, 'content/pages', page.k + '.json');
    if (!fs.existsSync(file)) continue;
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    const cfg = doc.explore;
    if (!isPagePublic(doc) || !cfg || !page.path || !['drawer', 'master-detail', 'group-tabs'].includes(cfg.mode)) continue;
    const parsed = cfg.source === 'table' ? parser.parseTableEntries(doc.content) : parser.parseEntries(doc.content, cfg);
    for (const entry of parsed.entries) {
      if (!entry.entity) continue;
      const prefix = cfg.hash || parser.slugify(page.k.replace(/-homebrew$/, '').replace(/-scoperta$/, ''));
      entries.push({
        id: 'pag-' + page.k,
        title: entry.title,
        icon: doc.icon || page.i,
        category: doc.title || page.l,
        text: stripMarkdown(entry.body).slice(0, 700),
        url: '/' + page.path.replace(/^\//, '') + '#' + [prefix, entry.slug].map(encodeURIComponent).join('/')
      });
    }
  }
  return entries;
}
