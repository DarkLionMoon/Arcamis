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

describe('renderer del materiale approvato', () => {
  const html = renderers.materiale(readPage('materiale-approvato').content)

  it('rende ogni classe come accordion con le sottoclassi', () => {
    expect(count(html, /class="mat-class-group"/g)).toBe(13)
    expect(count(html, /class="mat-sub-card"/g)).toBeGreaterThan(150)
    expect(html).toContain('<summary class="mat-class-base">')
    expect(html).toContain('<details class="mat-class-group"')
  })

  it('pulisce i titoli: niente asterischi e fonte leggibile', () => {
    const summaries = [...html.matchAll(/<summary class="mat-class-base">([\s\S]*?)<\/summary>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    expect(summaries).toContain("Barbarian (PHB '24) 14 sottoclassi ▾")
    expect(summaries.join(' ')).not.toContain('*')
  })

  it('rende le fonti come badge colorati con tooltip e non come testo markdown', () => {
    expect(html).toContain('>MPMM</span>')
    expect(html).toContain('>PHB \'24</span>')
    expect(html).toContain('mat-badge mat-src-mpmm')
    expect(html).toContain('mat-badge mat-src-phb')
    expect(html).toContain('mat-badge mat-src-homebrew')
    expect(html).toContain('data-tip="Fonte: MPMM"')
    expect(html).not.toContain('*')
  })

  it('interpreta il markdown dei callout', () => {
    expect(html).toContain('<strong>"5.5"</strong>')
  })
})

describe('browser del materiale (indice + dettaglio)', () => {
  const html = renderers.materiale(readPage('materiale-approvato').content)
  const hrefs = [...html.matchAll(/href="#(mat-[a-z0-9-]+)"/g)].map((m) => m[1])
  const ids = new Set([...html.matchAll(/id="(mat-[a-z0-9-]+)"/g)].map((m) => m[1]))

  it('avvolge il contenuto in sidebar + vista dettaglio con ricerca', () => {
    expect(html).toContain('class="mat-browser"')
    expect(html).toContain('class="mat-index-search"')
    expect(html).toContain('class="mat-index-list"')
    expect(html).toContain('class="mat-detail"')
    expect(html).toContain('class="mat-page"')
  })

  it('offre un chip di filtro per ogni fonte con Tutte attivo', () => {
    expect(html).toContain('<button type="button" class="mat-chip is-on" data-src="">Tutte</button>')
    expect(html).toContain('data-src="Homebrew"')
    expect(html).toContain('data-src="PHB \'24"')
  })

  it('ogni riga dell\'indice punta a un dettaglio esistente', () => {
    expect(hrefs.length).toBeGreaterThan(200)
    expect(hrefs.filter((h) => !ids.has(h))).toEqual([])
  })

  it('le righe portano fonte, contesto e tooltip per la consultazione', () => {
    expect(html).toContain('mat-index-item mat-idx-class')
    expect(html).toContain('mat-index-item mat-idx-sub')
    expect(html).toContain('mat-index-sec')
    expect(html).toMatch(/<li class="mat-index-item mat-idx-sub" data-src="[^"]+" data-name="[^"]+"/)
  })

  it('il sito attiva la ricerca live dopo il render', () => {
    expect(renderers.source).toContain('window.matBrowserInit(pbody)')
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
