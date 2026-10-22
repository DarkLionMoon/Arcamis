/*
  ARCAMIS — test del motore di esplorazione.

  `explorer.js` espone le funzioni pure su window.ArcExplorer: le
  carichiamo in vm, con un renderer markdown minimo, e verifichiamo le
  strutture che il sito usa davvero (specie, pantheon, tab, regole).
*/
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

function loadExplorer() {
  const win = {
    location: { hash: '', pathname: '/', search: '' },
    history: { replaceState() {} },
    document: { addEventListener() {} }
  }
  const sandbox = { window: win, console, Map, Set }
  win._mdToHtml = (md) => '<div>' + String(md).replace(/</g, '&lt;') + '</div>'
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/explorer.js'), 'utf8'), sandbox)
  return sandbox.window.ArcExplorer
}

const SPECIES = `Intro alle specie.

---

# Ascesi

Tipologia: Umanoide

Testo degli Ascesi.

---

# Costrutto

- **Tipologia:** Costrutto

Testo del costrutto.

---

# Vastaya

**Tipologia:** Bestiale

Testo Vastaya.
`

const REGOLE = `# PVP

## Regola 1 — Arena

Testo arena.

## Regola 2 — PvP

Testo pvp.

# Regole In-Game

## Regola 1 — Erotic

Testo.
`

describe('explorer · parsing', () => {
  const E = loadExplorer()

  it('legge le schede H1 e i metadati', () => {
    const parsed = E.parseEntries(SPECIES, { mode: 'master-detail', entryLevel: 1, filters: [] })
    expect(parsed.entries.map((entry) => entry.title)).toEqual(['Ascesi', 'Costrutto', 'Vastaya'])
    expect(E.metaValue(parsed.entries[0], 'Tipologia')).toBe('Umanoide')
    expect(E.metaValue(parsed.entries[1], 'Tipologia')).toBe('Costrutto')
    expect(E.metaValue(parsed.entries[2], 'Tipologia')).toBe('Bestiale')
  })

  it('costruisce i filtri dai valori reali', () => {
    const parsed = E.parseEntries(SPECIES, { mode: 'master-detail', entryLevel: 1, filters: [{ id: 't', label: 'Tipologia' }] })
    const filters = E.buildFilters(parsed.entries, E.normalizeConfig({ filters: [{ id: 't', label: 'Tipologia' }] }))
    expect(filters[0].values).toEqual(['Bestiale', 'Costrutto', 'Umanoide'])
    expect(E.filterEntries(parsed.entries, { q: '', filters: { t: 'Costrutto' } }, filters)).toHaveLength(1)
  })

  it('salta il primo blocco quando è il titolo della pagina', () => {
    const parsed = E.parseEntries('# Lavori ad Arcamis\n\nIntro\n\n---\n\n# Forgia\n\nTesto', {
      mode: 'master-detail',
      entryLevel: 1,
      skipFirst: true
    })
    expect(parsed.entries.map((entry) => entry.title)).toEqual(['Forgia'])
    expect(parsed.intro).toContain('Lavori ad Arcamis')
  })

  it('legge una tabella catalogata', () => {
    const parsed = E.parseTableEntries('Intro\n\n| Opera | Autore |\n| --- | --- |\n| Libro A | Anonimo |\n| Libro B | — |\n')
    expect(parsed.entries).toHaveLength(2)
    expect(parsed.entries[0].title).toBe('Libro A')
    expect(parsed.entries[0].fields[1].value).toBe('Anonimo')
  })

  it('raggruppa le regole per macro-categoria H1', () => {
    const parsed = E.parseAccordion(REGOLE, E.normalizeConfig({ mode: 'accordion', entryLevel: 2 }))
    expect(parsed.groups.map((group) => group.title)).toEqual(['PVP', 'Regole In-Game'])
    expect(parsed.groups[0].entries.map((entry) => entry.title)).toEqual(['Regola 1 — Arena', 'Regola 2 — PvP'])
  })
})

describe('explorer · configurazione', () => {
  const E = loadExplorer()

  it('normalizza un pattern sconosciuto su master-detail', () => {
    expect(E.normalizeConfig({ mode: 'boh' }).mode).toBe('master-detail')
    expect(E.normalizeConfig({ mode: 'tabs' }).entryLevel).toBe(2)
  })

  it('produce uno slug stabile per il deep link', () => {
    expect(E.slugify('Asceso di Shurima')).toBe('asceso-di-shurima')
    expect(E.slugify('Regola 1 — Arena')).toBe('regola-1-arena')
  })

  it('genera il markup delle quattro modalità', () => {
    const ctx = { pageKey: 'specie-homebrew' }
    expect(E.build(SPECIES, { mode: 'master-detail', hash: 'specie' }, ctx).html).toContain('data-mode="master-detail"')
    expect(E.build(SPECIES, { mode: 'drawer', hash: 'specie' }, ctx).html).toContain('data-mode="drawer"')
    expect(E.build(REGOLE, { mode: 'accordion', hash: 'regole' }, ctx).html).toContain('data-mode="accordion"')
    expect(E.build(SPECIES, { mode: 'tabs', hash: 'specie' }, ctx).html).toContain('data-mode="tabs"')
  })
})
