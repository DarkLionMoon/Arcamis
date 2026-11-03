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
  it('keeps the Mestieri patent reference in a closed note before its catalogue', () => {
    const E = loadExplorer()
    const page = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/mestieri.json'), 'utf8'))
    const built = E.build(page.content, page.explore, { pageKey: 'mestieri' })
    expect(built.html).toContain('<summary>Riepilogo patenti</summary>')
    expect(built.html).not.toContain('class="exp-notes" open')
    expect(built.data.entries).toHaveLength(11)
    expect(built.html.indexOf('Riepilogo patenti')).toBeLessThan(built.html.indexOf('exp-toolbar'))
    const levels = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/imprese.json'), 'utf8')).data.livelli
    for (const entry of built.data.entries) {
      for (const level of levels) expect(entry.body).toContain('| ' + level.fee + ' Mo |')
      expect(entry.body).not.toContain('12500 Mo')
      expect(entry.body).not.toContain('3000 Mo')
    }
  })

  it('renders the complete bibliography as searchable books without changing its drawer entries', () => {
    const E = loadExplorer()
    const page = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/bibliografia-scoperta.json'), 'utf8'))
    const built = E.build(page.content, page.explore, { pageKey: 'bibliografia-scoperta' })
    expect(built.data.entries).toHaveLength(29)
    expect(built.html).toContain('exp-bookshelf')
    expect((built.html.match(/class="exp-tile exp-book /g) || [])).toHaveLength(29)
    expect(built.html).not.toContain('exp-tile-glyph')
    expect(built.html).toContain('29 opere')
    expect(built.html).toContain('aria-label="Apri Cocktail All in the World"')
    const filtered = E.filterEntries(built.data.entries, { q: 'Theren' }, built.filters)
    expect(filtered.map(entry => entry.title)).toEqual(['L`Eredità Verde: Cronache della Linfa e del Sangue'])
    expect(filtered[0].fields[1].value).toContain('Theren')
  })

  it('filters bibliography by every original Notion tag, together with search', () => {
    const E = loadExplorer()
    const page = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/bibliografia-scoperta.json'), 'utf8'))
    const built = E.build(page.content, page.explore, { pageKey: 'bibliografia-scoperta' })
    expect(built.filters).toHaveLength(1)
    expect(built.filters[0].values).toContain('PERICOLOSO')
    expect(built.filters[0].values).not.toContain('Void · PERICOLOSO')
    const select = (tag, q = '') => E.filterEntries(built.data.entries, { q, filters: { argomento: tag } }, built.filters)
    expect(select('Void')).toHaveLength(5)
    expect(select('PERICOLOSO')).toHaveLength(5)
    expect(select('Shurima')).toHaveLength(3)
    expect(select('Armi')).toHaveLength(2)
    expect(select('Botanica', 'Theren')).toHaveLength(1)
    expect(select('Void', 'Theren')).toHaveLength(0)
    expect(built.data.entries.every(entry => E.metaValue(entry, 'Macro-argomento'))).toBe(true)
  })

  it('keeps the Ascesi introduction in a note outside the species catalogue', () => {
    const E = loadExplorer()
    const page = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/specie-homebrew.json'), 'utf8'))
    const built = E.build(page.content, page.explore, { pageKey: 'specie-homebrew' })
    expect(built.data.entries).toHaveLength(32)
    expect(built.data.entries.some(entry => entry.slug === 'ascesi')).toBe(false)
    expect(built.html).toContain('<summary>Nota sugli Ascesi</summary>')
    expect(built.html).toContain('Estremamente rari')
  })

  it('shows compact species badges while retaining the full age text in the body', () => {
    const E = loadExplorer()
    const md = '# Besheb\n\n**Tipologia:** Umanoide\n**Taglia:** Media\n**Velocità:** 30 piedi (9 metri)\n**Età:** I vastaya possono vivere fino ai 500 anni grazie al loro lignaggio Spiritico.\n'
    const built = E.build(md, { mode: 'master-detail', summaryFields: ['Tipologia', 'Taglia', 'Velocità', 'Scurovisione'] }, { pageKey: 'specie-homebrew' })
    const badges = built.html.match(/<div class="exp-badges">([\s\S]*?)<\/div>/)[1]
    expect(badges).not.toContain('500 anni')
    expect(built.html).toContain('500 anni')
    expect(badges).toContain('Umanoide')
  })

  it('shows leading metadata once and preserves metadata in later sections', () => {
    const E = loadExplorer()
    const md = '# Oste\n\n**Patente:** P.M.C.\n**Categoria:** Cucina\n\n## Requisiti\n\n**Patente:** P.M.C.\n'
    const result = E.build(md, { mode: 'master-detail', entryLevel: 1 }, { pageKey: 'mestieri' })
    expect((result.html.match(/\*\*Patente:/g) || []).length).toBe(1)
    expect(result.html).toContain('<b>Patente</b> P.M.C')
    expect(result.html).not.toContain('**Categoria:**')
  })

  it('keeps Materiale notes available in a closed disclosure before its filters', () => {
    const E = loadExplorer()
    const page = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/materiale-approvato.json'), 'utf8'))
    const result = E.build(page.content, page.explore, { pageKey: 'materiale-approvato' })
    expect(result.html).toContain('<summary>Note ai manuali</summary>')
    expect(result.html).not.toContain('class="exp-notes" open')
    expect(result.html).toContain('Lessons of the First Ones')
  })
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

  it('groups and filters entries independently of the metadata shown in their cards', () => {
    const md = '# Anfibio\n\nTipologia: Folletto\n\n# Foreste\n\nTipologia: Folletto\n\n# Celestiale\n\nTipologia: Celestiale\n'
    const cfg = E.normalizeConfig({ mode: 'master-detail', groupBy: 'gruppo', filters: [{ id: 'gruppo', label: 'Gruppo', field: 'Tipologia', valuesByEntry: { anfibio: 'Yordle', foreste: 'Yordle' } }] })
    const built = E.build(md, cfg, { pageKey: 'specie-homebrew' })
    expect(built.filters[0].values).toEqual(['Celestiale', 'Yordle'])
    const shown = E.filterEntries(built.data.entries, { filters: { gruppo: 'Yordle' } }, built.filters)
    expect(shown.map(entry => entry.slug)).toEqual(['anfibio', 'foreste'])
    expect(E.metaValue(shown[0], 'Tipologia')).toBe('Folletto')
    expect(built.html).toContain('exp-group-title">Yordle')
    expect(built.html).not.toContain('exp-group-title">Folletto')
    expect(built.html).toContain('Tipologia</b> Folletto')
    const groups = E.groupEntries(built.data.entries, cfg, built.filters)
    expect(groups.find(group => group.label === 'Yordle').entries).toHaveLength(2)
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

  it('genera il markup delle cinque modalità', () => {
    const ctx = { pageKey: 'specie-homebrew' }
    expect(E.build(SPECIES, { mode: 'master-detail', hash: 'specie' }, ctx).html).toContain('data-mode="master-detail"')
    expect(E.build(SPECIES, { mode: 'group-tabs', hash: 'specie' }, ctx).html).toContain('data-mode="group-tabs"')
    expect(E.build(SPECIES, { mode: 'drawer', hash: 'specie' }, ctx).html).toContain('data-mode="drawer"')
    expect(E.build(REGOLE, { mode: 'accordion', hash: 'regole' }, ctx).html).toContain('data-mode="accordion"')
    expect(E.build(SPECIES, { mode: 'tabs', hash: 'specie' }, ctx).html).toContain('data-mode="tabs"')
  })
})

describe('explorer · ordine delle schede lavoro', () => {
  const E = loadExplorer()
  const page = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/lavori.json'), 'utf8'))

  it('mostra lo stipendio prima della copertina in tutte le schede che lo prevedono', () => {
    const entries = E.parseEntries(page.content, E.normalizeConfig(page.explore)).entries
      .filter((entry) => /^#{1,6}\s+Stipendio\b/im.test(entry.body))
    expect(entries).toHaveLength(9)
    for (const entry of entries) {
      const { html } = E.build('# ' + entry.title + '\n\n' + entry.body,
        { ...page.explore, skipFirst: false }, { pageKey: 'lavori' })
      const body = html.indexOf('class="exp-rich"')
      const image = html.indexOf('class="exp-hero"')
      expect(body, entry.title).toBeGreaterThan(-1)
      expect(image, entry.title).toBeGreaterThan(body)
    }
  })
})

describe('explorer · gruppi + schede', () => {
  const E = loadExplorer()
  const CFG = {
    mode: 'group-tabs',
    entryLevel: 1,
    groupBy: 'Tipologia',
    groupPlural: 'tipologie',
    label: 'Specie',
    plural: 'specie',
    filters: [{ id: 't', label: 'Tipologia' }]
  }

  it('raggruppa le voci per il campo scelto', () => {
    const cfg = E.normalizeConfig(CFG)
    const parsed = E.parseEntries(SPECIES, cfg)
    const filters = E.buildFilters(parsed.entries, cfg)
    const groups = E.groupEntries(parsed.entries, cfg, filters)
    expect(groups.map((group) => group.label)).toEqual(['Bestiale', 'Costrutto', 'Umanoide'])
    expect(groups[2].entries.map((entry) => entry.title)).toEqual(['Ascesi'])
  })

  it('disegna colonna dei gruppi e linguette, senza ripetere il filtro', () => {
    const html = E.build(SPECIES, CFG, { pageKey: 'specie-homebrew' }).html
    expect(html).toContain('data-exp-groups')
    expect(html).toContain('data-exp-tabs')
    expect(html).toContain('3 tipologie · 3 specie')
    expect(html).not.toContain('data-filter="t"')
  })
})
