/*
  ARCAMIS — test della Bacheca Missioni e dello statblock

  scripts/js/quest-board.js espone logica pura su window.ArcQuests: qui
  la si carica in vm con un DOM finto e si verifica la logica. Lo
  statblock passa dal renderer vero (md-render.js), come nel browser.
*/
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

function makeEl() {
  return {
    innerHTML: '',
    textContent: '',
    value: '',
    _attrs: {},
    classList: { add() {}, remove() {} },
    setAttribute(k, v) {
      this._attrs[k] = v
    },
    getAttribute(k) {
      return this._attrs[k] ?? null
    },
    addEventListener() {},
    querySelector() {
      return null
    },
    querySelectorAll() {
      return []
    },
    appendChild(c) {
      return c
    }
  }
}

function loadModule(name) {
  const store = {}
  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      addEventListener() {},
      getElementById() {
        return null
      },
      createElement() {
        return makeEl()
      },
      querySelectorAll() {
        return []
      }
    },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v)
      },
      removeItem: (k) => {
        delete store[k]
      }
    },
    fetch: () => Promise.reject(new Error('no network')),
    alert: () => {},
    prompt: () => null,
    console
  }
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, `scripts/js/${name}.js`), 'utf8'), sandbox)
  return { sandbox, store }
}

function loadRenderer() {
  const sandbox = { window: {}, console }
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/md-render.js'), 'utf8'), sandbox)
  return (md) => vm.runInContext('window.mdRender', sandbox)(md)
}

describe('quest board (ArcQuests)', () => {
  const { sandbox } = loadModule('quest-board')
  const Q = sandbox.window.ArcQuests
  const quests = [
    { id: 'q1', titolo: 'Rune', descrizione: 'run nel bosco', stato: 'aperta', tag: ['mistero'] },
    { id: 'q2', titolo: 'Carovana', descrizione: 'scorta', stato: 'attiva', tag: ['viaggio'] }
  ]

  it('filtra per stato, tag e testo', () => {
    expect(Q.filter(quests, { stato: 'aperta' }).map((x) => x.id)).toEqual(['q1'])
    expect(Q.filter(quests, { tag: 'viaggio' }).map((x) => x.id)).toEqual(['q2'])
    expect(Q.filter(quests, { q: 'rune' }).map((x) => x.id)).toEqual(['q1'])
    expect(Q.filter(quests, {})).toHaveLength(2)
  })

  it('elenca i tag ordinati senza duplicati', () => {
    expect(Q.tags(quests)).toEqual(['mistero', 'viaggio'])
  })

  it('accetta e abbandona missioni', () => {
    Q.accept('q1')
    expect(Q.accepted()).toContain('q1')
    Q.leave('q1')
    expect(Q.accepted()).not.toContain('q1')
  })
})

describe('statblock (:::statblock)', () => {
  const render = loadRenderer()
  const md = [
    ':::statblock',
    '### Goblin',
    '*Umanoide piccolo, malvagio*',
    '- **Classe Armatura:** 15',
    '- **Punti Ferita:** 7 (2d6)',
    '---',
    '**Furtivo.** Si nasconde bene.',
    ':::'
  ].join('\n')

  it('rende nome, sottotitolo, campi e tratti', () => {
    const html = render(md)
    expect(html).toContain('<div class="n-statblock">')
    expect(html).toContain('<h4>Goblin</h4>')
    expect(html).toContain('Umanoide piccolo')
    expect(html).toContain('<dt>Classe Armatura:</dt>')
    expect(html).toContain('<dd>15</dd>')
    expect(html).toContain('<strong>Furtivo.</strong>')
  })

  it('rende immagine con lazy loading quando presente', () => {
    const html = render(':::statblock\n### X\n![X](/images/x.webp)\n:::')
    expect(html).toContain('loading="lazy"')
  })
})
