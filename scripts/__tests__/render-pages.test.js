/*
  ARCAMIS — test dei renderer delle pagine speciali

  Le pagine «Regole» e «Materiale approvato» non passano dal markdown
  generico: hanno renderer dedicati che leggono il testo compilato.
  Qui si carica il vero `notion-nav.js` in un contesto vm e si controlla
  l'HTML prodotto sui contenuti reali del repository.

  Perché serve: un errore in questi parser non rompe la build — la pagina
  resta 200 ma mostra asterischi, titoli grezzi o sezioni vuote. Sono
  esattamente le regressioni segnalate durante la revisione dei contenuti.
*/
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

function loadSiteRenderers() {
  const sandbox = {
    window: {},
    document: {
      addEventListener() {},
      querySelectorAll() {
        return []
      },
      getElementById() {
        return null
      }
    },
    console
  }
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/md-render.js'), 'utf8'), sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/notion-nav.js'), 'utf8'), sandbox)
  return {
    regole: vm.runInContext('_renderRegole', sandbox),
    materiale: vm.runInContext('_renderMateriale', sandbox),
    schede: vm.runInContext('_renderSchede', sandbox),
    source: fs.readFileSync(path.join(root, 'scripts/js/notion-nav.js'), 'utf8')
  }
}

function readPage(key) {
  return JSON.parse(fs.readFileSync(path.join(root, 'content/pages', `${key}.json`), 'utf8'))
}

const renderers = loadSiteRenderers()
const count = (html, re) => (html.match(re) || []).length

describe('renderer delle regole', () => {
  const html = renderers.regole(readPage('regole-del-server').content)

  it('raggruppa le regole nelle categorie dichiarate con #', () => {
    const titles = [...html.matchAll(/class="regle-cat-title">([^<]+)/g)].map((m) => m[1])
    expect(titles).toEqual(['Regole Generali', 'PVP', 'Regole In-Game'])
    expect(count(html, /class="regle-cat"/g)).toBe(3)
    expect(count(html, /class="regle-section"/g)).toBe(22)
  })

  it('mostra il conteggio per categoria', () => {
    expect(html).toContain('9 regole')
    expect(html).toContain('5 regole')
    expect(html).toContain('8 regole')
  })

  it('non lascia asterischi di markdown nel testo', () => {
    expect(html).not.toContain('*')
  })
})

describe('materiale approvato (motore explore, sorgente tabella)', () => {
  const page = readPage('materiale-approvato')
  const rows = page.content.split('\n').filter((line) => /^\| /.test(line))

  it('usa il cassetto dell\'explore con la tabella come catalogo', () => {
    expect(page.explore).toMatchObject({ mode: 'drawer', source: 'table' })
    expect(page.explore.filters.map((f) => f.field)).toEqual(['Categoria', 'Classe'])
    expect(page.layout).toBe('')
  })

  it('elenca specie, manuali e sottoclassi con la fonte', () => {
    expect(rows.length).toBeGreaterThan(240)
    expect(page.content).toContain('| Khoravar | Specie |  | EFA | Half-Elf nel server |')
    expect(page.content).toContain('| Chetechnician | Sottoclasse | Artificer | Homebrew |')
    expect(page.content).toContain("| Player's Handbook 2024 | Talenti · manuale |  | PHB'24 |")
  })

  it('conserva le note ai manuali fuori dalla tabella', () => {
    expect(page.content).toContain('**Note ai manuali**')
    expect(page.content).toContain('Origin Feat')
    expect(page.content).toContain('Silvery Barbs')
  })

  it('il sito dà la precedenza al motore explore dichiarato dalla pagina', () => {
    expect(renderers.source).toContain('if (_localJson.explore && window.ArcExplorer)')
    expect(renderers.source).toContain('window.ArcExplorer.mount(pbody, _exploreBuilt)')
  })
})

describe('layout a schede dell\'editor', () => {
  const html = renderers.schede('## Guerriero\nCorpo\n\n## Mago\nAltro corpo')

  it('rende ogni sezione ## come card della griglia', () => {
    expect(html).toContain('class="sch-page"')
    expect(count(html, /class="sch-card"/g)).toBe(2)
    expect(html).toContain('>Guerriero<')
  })

  it('il sito riconosce il layout scelto dall\'editor', () => {
    expect(renderers.source).toContain("_layout === 'schede'")
    const schema = JSON.parse(
      fs.readFileSync(path.join(root, 'content/schemas/page.schema.json'), 'utf8')
    )
    expect(schema.properties.layout.enum).toContain('schede')
  })
})

describe('pagina Changelog e banner meme', () => {
  it('il changelog è una pagina pubblica con rotta propria', () => {
    const registry = JSON.parse(
      fs.readFileSync(path.join(root, 'content/pages/registry.json'), 'utf8')
    )
    const page = registry.pages.find((p) => p.k === 'changelog')
    expect(page?.path).toBe('changelog')
    expect(page?.menu).toBe(true)
    expect(readPage('changelog').layout).toBe('wide')
    const appJs = fs.readFileSync(path.join(root, 'scripts/js/app.js'), 'utf8')
    expect(appJs).toContain("'changelog': 'pag-changelog'")
  })

  it('La Storia di Gandora si dichiara pagina meme', () => {
    expect(readPage('la-storia-di-gandora').meme).toBe(true)
    const schema = JSON.parse(
      fs.readFileSync(path.join(root, 'content/schemas/page.schema.json'), 'utf8')
    )
    expect(schema.properties.meme.type).toBe('boolean')
  })

  it('i crediti hanno una sezione per gli artisti', () => {
    expect(readPage('credits').content).toContain('### Artisti delle illustrazioni')
  })
})
