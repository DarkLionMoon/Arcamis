/*
  ARCAMIS — test delle app "Tavolo da gioco" e dello statblock

  I moduli scripts/js/{generators,calendar,combat,quest-board,diary}.js
  espongono logica pura su window.Arc*: qui li si carica in vm con un
  DOM finto e si verifica la logica + il montaggio smoke. Lo statblock
  passa dal renderer vero (md-render.js), come nel browser.
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

/* Rnd deterministico: sempre a metà intervallo. */
const HALF = () => 0.5

describe('generatori (ArcGenerators)', () => {
  const { sandbox } = loadModule('generators')
  const G = sandbox.window.ArcGenerators

  it('espone le quattro categorie', () => {
    expect(typeof G.nome).toBe('function')
    expect(typeof G.taverna).toBe('function')
    expect(typeof G.bottino).toBe('function')
    expect(typeof G.incontro).toBe('function')
  })

  it('nome deterministico con rnd fissa', () => {
    const a = G.nome(HALF, 'elfo')
    const b = G.nome(HALF, 'elfo')
    expect(a).toEqual(b)
    expect(a.nome.length).toBeGreaterThan(2)
    expect(a.cognome.length).toBeGreaterThan(1)
  })

  it('dado entro i limiti', () => {
    for (let i = 0; i < 50; i++) {
      const v = G.dado(HALF, 20)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(20)
    }
  })

  it('taverna completa di voce', () => {
    const t = G.taverna(HALF)
    expect(t.nome).toContain(' ')
    expect(t.oste.length).toBeGreaterThan(3)
    expect(t.voce.length).toBeGreaterThan(3)
  })

  it('bottino e incontro portano categoria e risultato', () => {
    expect(G.bottino(HALF, 'raro').rarita).toBe('raro')
    const e = G.incontro(HALF, 'rovine')
    expect(e.ambiente).toBe('rovine')
    expect(e.dado).toBeGreaterThanOrEqual(1)
  })

  it('mount smoke: quattro carte con output', () => {
    const root2 = makeEl()
    sandbox.window.initGenerators(root2)
    expect(root2.innerHTML).toContain('gen-card')
    expect(root2.innerHTML).toContain('Premi genera')
  })
})

describe('calendario (ArcCalendar)', () => {
  const { sandbox } = loadModule('calendar')
  const C = sandbox.window.ArcCalendar

  it("l'epoca gregoriana è il capodanno di Arcamis", () => {
    const arc = C.convert(new Date('2024-01-01T12:00:00'))
    expect(arc.anno).toBe(1492)
    expect(arc.mese).toBe(0)
    expect(arc.giorno).toBe(1)
    expect(arc.meseNome).toBe('Primofiore')
  })

  it('segna le feste del giorno', () => {
    const arc = C.convert(new Date('2024-01-01T12:00:00'))
    expect(arc.feste.map((f) => f.nome)).toContain('Capodanno di Primavera')
  })

  it('avanza di mese dopo 30 giorni', () => {
    const arc = C.convert(new Date('2024-01-31T12:00:00'))
    expect(arc.mese).toBe(1)
    expect(arc.giorno).toBe(1)
  })

  it('format compone la data leggibile', () => {
    expect(C.format({ giorno: 15, meseNome: 'Solealto', anno: 1493, weekday: 'Lunadì', feste: [] })).toBe(
      '15 Solealto 1493 (Lunadì)'
    )
  })
})

describe('combat tracker (ArcCombat)', () => {
  const { sandbox } = loadModule('combat')
  const C = sandbox.window.ArcCombat

  it('ordina per iniziativa decrescente', () => {
    const s = C.create()
    C.add(s, 'Goblin', 12, 7)
    C.add(s, 'Eroe', 18, 30)
    expect(s.combatants.map((c) => c.name)).toEqual(['Eroe', 'Goblin'])
  })

  it('il turno avanza e il round scatta alla fine', () => {
    const s = C.create()
    C.add(s, 'A', 10, 10)
    C.add(s, 'B', 5, 10)
    expect(s.round).toBe(1)
    C.next(s)
    expect(s.active).toBe(1)
    C.next(s)
    expect(s.active).toBe(0)
    expect(s.round).toBe(2)
  })

  it('danni e cure restano nei limiti', () => {
    const s = C.create()
    const c = C.add(s, 'Orco', 8, 15)
    C.damage(s, c.id, 20)
    expect(s.combatants[0].hp).toBe(0)
    C.heal(s, c.id, 99)
    expect(s.combatants[0].hp).toBe(15)
    C.remove(s, c.id)
    expect(s.combatants).toHaveLength(0)
  })

  it('persistenza localStorage round-trip', () => {
    const s = C.create()
    C.add(s, 'Mago', 14, 20)
    C.save('test', s)
    const back = C.load('test')
    expect(back.combatants[0].name).toBe('Mago')
    expect(C.load('assente')).toBeNull()
  })
})

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

describe('diario (ArcDiary)', () => {
  const { sandbox } = loadModule('diary')
  const D = sandbox.window.ArcDiary

  it('personaggi e pagine con round-trip', () => {
    const s = D.blank()
    const pg = D.addCharacter(s, 'Kael')
    D.addEntry(s, pg.id, 'Sessione 1', 'Abbiamo trovato le rune.')
    expect(D.entriesOf(s, pg.id)).toHaveLength(1)
    D.removeEntry(s, s.entries[0].id)
    expect(D.entriesOf(s, pg.id)).toHaveLength(0)
    D.removeCharacter(s, pg.id)
    expect(s.characters).toHaveLength(0)
  })

  it('export/import con validazione', () => {
    const s = D.blank()
    D.addCharacter(s, 'Mira')
    const back = D.importJson(D.exportJson(s))
    expect(back.characters[0].nome).toBe('Mira')
    expect(() => D.importJson('{"nope":true}')).toThrow()
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
