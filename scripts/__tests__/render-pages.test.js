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
    materiale: vm.runInContext('_renderMateriale', sandbox)
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
    expect(html).toContain('<details class="mat-class-group">')
  })

  it('pulisce i titoli: niente asterischi e fonte leggibile', () => {
    const summaries = [...html.matchAll(/<summary class="mat-class-base">([\s\S]*?)<\/summary>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    expect(summaries).toContain("Barbarian (PHB '24) 14 sottoclassi ▾")
    expect(summaries.join(' ')).not.toContain('*')
  })

  it('rende le fonti come badge e non come testo markdown', () => {
    expect(html).toContain('<span class="mat-badge">MPMM</span>')
    expect(html).toContain('<span class="mat-badge">PHB \'24</span>')
    expect(html).not.toContain('*')
  })

  it('interpreta il markdown dei callout', () => {
    expect(html).toContain('<strong>"5.5"</strong>')
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
