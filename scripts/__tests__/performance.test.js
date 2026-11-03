import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';

describe('production asset delivery', () => {
  let fixture;
  beforeAll(() => {
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'arcamis-performance-'));
    for (const dir of ['dist/scripts/js', 'content/pages']) fs.mkdirSync(path.join(fixture, dir), { recursive: true });
    fs.writeFileSync(path.join(fixture, 'content/pages/registry.json'), '{"pages":[]}');
    fs.writeFileSync(path.join(fixture, 'sw.js'), '');
    fs.copyFileSync('_headers', path.join(fixture, '_headers'));
    fs.writeFileSync(path.join(fixture, 'dist/scripts/js/app.js'), 'window.ready = true;');
    fs.writeFileSync(path.join(fixture, 'dist/index.html'), '<html><head><link rel="stylesheet" href="/scripts/css/main.abc.css"></head><body><div style="background-image:url(/assets/cover.webp)"></div><img src="/assets/mappa.webp"><script src="/scripts/js/app.js"></script></body></html>');
    execFileSync(process.execPath, [path.resolve('scripts/build-post.mjs')], { cwd: fixture, stdio: 'pipe' });
  });

  it('uses the same canonical image URLs as dynamic carousel and map updates', () => {
    const html = fs.readFileSync(path.join(fixture, 'dist/index.html'), 'utf8');
    expect(html).not.toContain('/assets/cover.webp');
    expect(html).not.toContain('/assets/mappa.webp');
    expect(html).toContain('url(/cover.webp)');
    expect(html).toContain('src="/mappa.webp"');
  });

  it('does not preload home imagery on internal routes', () => {
    const home = fs.readFileSync(path.join(fixture, 'dist/index.html'), 'utf8');
    const article = fs.readFileSync(path.join(fixture, 'dist/changelog.html'), 'utf8');
    expect(home).toContain('as="image" href="/cover.webp"');
    expect(article).not.toContain('as="image" href="/cover.webp"');
  });

  it('gives each fingerprinted asset one unambiguous immutable cache policy', () => {
    const html = fs.readFileSync(path.join(fixture, 'dist/index.html'), 'utf8');
    const script = html.match(/src="([^"]+\.js)"/)[1];
    const headers = fs.readFileSync(path.join(fixture, 'dist/_headers'), 'utf8');
    for (const resource of [script, '/scripts/css/main.abc.css']) {
      const policies = [];
      let matches = false;
      for (const line of headers.split(/\r?\n/)) {
        if (!line.trim() || line.startsWith('#')) continue;
        if (!/^\s/.test(line)) {
          const pattern = line.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
          matches = new RegExp('^' + pattern + '$').test(resource);
        } else if (matches && /Cache-Control:/i.test(line)) policies.push(line.trim());
      }
      expect(policies).toEqual(['Cache-Control: public, max-age=31536000, immutable']);
    }
    expect(headers).toContain('no-cache, no-store, must-revalidate');
    expect(headers).toContain('Content-Security-Policy:');
  });
});

describe('initial loader readiness', () => {
  const source = fs.readFileSync('scripts/js/app-ui.js', 'utf8').split('/* ════ FONT SIZE')[0];
  function setup(pathname) {
    const listeners = {};
    const hidden = [];
    const sandbox = {
      window: { addEventListener: (event, fn) => { listeners[event] = fn; } },
      document: {
        readyState: 'loading',
        addEventListener: (event, fn) => { listeners[event] = fn; },
        querySelector: () => ({ content: 'test-build' }),
        getElementById: () => ({ classList: { add: value => hidden.push(value) } }),
      },
      location: { pathname, search: '' },
      localStorage: { getItem: () => 'test-bui', setItem() {} },
      sessionStorage: {},
      URLSearchParams,
      setTimeout: () => {},
    };
    vm.runInNewContext(source, sandbox);
    return { listeners, hidden };
  }
  it('reveals the home at DOM readiness without waiting for every image', () => {
    const state = setup('/');
    state.listeners.DOMContentLoaded?.();
    expect(state.hidden).toEqual(['hidden']);
  });
  it('keeps internal routes covered until content is ready, with a load fallback', () => {
    const state = setup('/personaggio/materiale-approvato');
    state.listeners.DOMContentLoaded?.();
    expect(state.hidden).toEqual([]);
    state.listeners.load();
    expect(state.hidden).toEqual(['hidden']);
  });
});
