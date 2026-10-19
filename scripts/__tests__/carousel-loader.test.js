/*
  ARCAMIS — test del carousel-loader del sito

  Il loader decide dal backend se ricostruire le slide dal manifest
  (numero/ordine/visibilità dinamici) o applicare gli override legacy
  per-indice. Qui gira in vm con un DOM finto: si verifica il rebuild,
  i dot, le larghezze e le impostazioni di rotazione.
*/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const source = fs.readFileSync(path.join(root, 'scripts/js/carousel-loader.js'), 'utf8');

function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    children: [],
    attrs: {},
    setAttribute(k, v) {
      el.attrs[k] = String(v);
    },
    getAttribute(k) {
      return el.attrs[k] || null;
    },
    removeAttribute(k) {
      delete el.attrs[k];
    },
    appendChild(c) {
      el.children.push(c);
      return c;
    },
    addEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  return el;
}

function findAll(el, cls) {
  const out = [];
  const walk = (node) => {
    if (node.className && node.className.split(' ').includes(cls)) out.push(node);
    (node.children || []).forEach(walk);
  };
  walk(el);
  return out;
}

async function loadWithPayload(payload) {
  const track = makeEl('div');
  const dots = makeEl('div');
  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      getElementById: (id) => (id === 'ctrack' ? track : null),
      querySelector: (sel) => (sel === '.cdots' ? dots : null),
      querySelectorAll: () => [],
      createElement: (tag) => makeEl(tag),
      addEventListener() {},
    },
    fetch: async () => ({ json: async () => payload }),
    console: { warn() {} },
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  return { sandbox, track, dots };
}

const managedPayload = {
  managed: true,
  settings: { intervalMs: 9000, pauseOnHover: true },
  slides: [
    {
      id: 'promo',
      img: '/images/promo.webp',
      tag: 'Tag',
      tit: 'Titolo' + String.fromCharCode(10) + 'Seconda riga',
      sub: 'Sottotitolo.',
      desc: 'Descrizione.',
      btns: [
        { label: 'Esterno', href: 'https://example.com/x' },
        { label: 'Interno', href: '/lore/pantheon' },
      ],
    },
    { id: 'seconda', img: '', tag: 'T2', tit: 'Due', sub: '', desc: 'D2', btns: [] },
  ],
};

describe('carousel-loader gestito', () => {
  it('ricostruisce slide, dot e larghezze dal manifest', async () => {
    const { track, dots, sandbox } = await loadWithPayload(managedPayload);
    const slides = findAll(track, 'slide');
    expect(slides).toHaveLength(2);
    expect(track.style.width).toBe('200%');
    expect(slides[0].style.width).toBe('50%');
    expect(slides[0].style.backgroundImage).toBe("url('/images/promo.webp')");
    expect(findAll(dots, 'cdot')).toHaveLength(2);
    expect(findAll(dots, 'ca')).toHaveLength(1);
    expect(sandbox.window.__arcCarouselManaged).toBe(true);
  });

  it('applica testi, bottoni e impostazioni di rotazione', async () => {
    const { track, sandbox } = await loadWithPayload(managedPayload);
    const first = findAll(track, 'slide')[0];
    expect(findAll(first, 'stag')[0].textContent).toBe('Tag');
    expect(findAll(first, 'stit')[0].innerHTML).toBe('Titolo<br>Seconda riga');
    expect(findAll(first, 'ssub')[0].textContent).toBe('Sottotitolo.');
    expect(findAll(first, 'sdesc')[0].textContent).toBe('Descrizione.');
    expect(findAll(findAll(track, 'slide')[1], 'ssub')).toHaveLength(0);
    const btns = findAll(first, 'sbtn');
    expect(btns.map((b) => b.textContent)).toEqual(['Esterno', 'Interno']);
    expect(sandbox.window.__arcCarouselSettings).toEqual({ intervalMs: 9000, pauseOnHover: true });
  });

  it('senza slide gestite non tocca il DOM hardcoded', async () => {
    const { track } = await loadWithPayload({ managed: true, slides: [], settings: {} });
    expect(track.children).toHaveLength(0);
  });
});

describe('carousel-loader legacy', () => {
  it('applica gli override per-indice senza ricostruire', async () => {
    const slide = makeEl('div');
    const sandbox = {
      window: {},
      document: {
        readyState: 'complete',
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: (sel) => (sel === '.slide' ? [slide] : []),
        createElement: (tag) => makeEl(tag),
        addEventListener() {},
      },
      fetch: async () => ({
        json: async () => ({ slides: [{ img: '/images/a.webp', meta: null, btns: null }] }),
      }),
      console: { warn() {} },
    };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    expect(slide.style.backgroundImage).toBe("url('/images/a.webp')");
    expect(sandbox.window.__arcCarouselManaged).toBe(false);
  });

  it('il sottotitolo legacy crea il nodo .ssub dopo il titolo', async () => {
    const slide = makeEl('div');
    const sandbox = {
      window: {},
      document: {
        readyState: 'complete',
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: (sel) => (sel === '.slide' ? [slide] : []),
        createElement: (tag) => makeEl(tag),
        addEventListener() {},
      },
      fetch: async () => ({
        json: async () => ({ slides: [{ meta: { tit: 'T', sub: 'Sotto.' } }] }),
      }),
      console: { warn() {} },
    };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    const subs = findAll(slide, 'ssub');
    expect(subs).toHaveLength(1);
    expect(subs[0].textContent).toBe('Sotto.');
  });
});
