/* ════════════════════════════════════════════════════════════════
   Copertura Admin dei contenuti migrati

   Le pagine importate devono essere apribili nell'editor a blocchi e
   risalvabili senza perdere titoli, immagini o link. Questo test legge
   i file reali di content/pages, non fixtures: se una pagina sparisce
   dal registro o il parser dei blocchi smette di riconoscerne la
   struttura, il pannello non è più una fonte di modifica sicura.
   ════════════════════════════════════════════════════════════════ */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { parseBlocks, serializeBlocks } from './blocks'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const pagesDir = path.join(root, 'content/pages')

const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8')) as T
const registry = readJson<{ pages: Array<{ k: string; l: string; admin?: boolean; id: string }> }>(
  path.join(pagesDir, 'registry.json')
)
const files = fs
  .readdirSync(pagesDir)
  .filter((file) => file.endsWith('.json') && file !== 'registry.json')
  .map((file) => file.replace(/\.json$/, ''))
const pages = new Map(
  files.map((key) => [
    key,
    readJson<{ k: string; title: string; content: string; layout?: string }>(path.join(pagesDir, key + '.json'))
  ])
)

const headings = (markdown: string) =>
  markdown
    .split('\n')
    .filter((line) => /^#{1,3}\s+/.test(line))
    .map((line) => line.trim())

const images = (markdown: string) =>
  [...markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((match) => match[1]).sort()

const links = (markdown: string) =>
  [...markdown.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)/g)].map((match) => match[1]).sort()

describe('copertura Admin dei contenuti migrati', () => {
  it('ogni pagina del registro ha un file apribile nell’editor', () => {
    const keys = new Set(files)
    for (const entry of registry.pages) {
      expect(keys.has(entry.k), `file mancante per ${entry.k}`).toBe(true)
      expect(entry.admin, `${entry.k} non è gestibile dall’Admin`).not.toBe(false)
      expect(pages.get(entry.k)?.k, `${entry.k}: chiave incoerente`).toBe(entry.k)
    }
    expect(files.length).toBe(registry.pages.length)
  })

  it('il parser dei blocchi non perde titoli, immagini o link', () => {
    for (const [key, page] of pages) {
      const source = page.content || ''
      const roundTrip = serializeBlocks(parseBlocks(source))
      expect(headings(roundTrip), `${key}: titoli persi`).toEqual(headings(source))
      expect(images(roundTrip), `${key}: immagini perse`).toEqual(images(source))
      expect(links(roundTrip), `${key}: link persi`).toEqual(links(source))
    }
  })

  it('specie e sottoclassi hanno schede riconoscibili dal block editor', () => {
    for (const [key, count] of [
      ['specie-homebrew', 33],
      ['sottoclassi-homebrew', 18]
    ] as const) {
      const page = pages.get(key)!
      const cards = parseBlocks(page.content).filter(
        (block) => block.type === 'heading' && block.level === 1
      )
      expect(cards.length, `${key}: schede non rilevate`).toBe(count)
    }
  })

  it('le configurazioni di esplorazione puntano a titoli reali del contenuto', () => {
    interface ExploreShell {
      mode: string
      tabs?: Array<{ label: string; sections?: string[] }>
      groups?: Array<{ label: string; sections?: string[] }>
      filters?: Array<{ label: string; field?: string }>
    }
    const explored = [...pages.entries()].filter(([, page]) => (page as { explore?: ExploreShell }).explore)
    /* Ogni pagina con più di una manciata di sezioni dichiara il suo pattern:
       le pagine brevi restano di lettura. */
    expect(explored.length).toBeGreaterThanOrEqual(15)

    for (const [key, page] of explored) {
      const config = (page as { explore?: ExploreShell }).explore!
      const titles = new Set(headings(page.content).map((line) => line.replace(/^#+\s+/, '').trim()))
      for (const group of [...(config.tabs || []), ...(config.groups || [])]) {
        expect(group.label?.trim(), `${key}: gruppo senza etichetta`).toBeTruthy()
        for (const section of group.sections || []) {
          expect(titles.has(section), `${key}: «${section}» non è un titolo del contenuto`).toBe(true)
        }
      }
      for (const filter of config.filters || []) {
        expect(filter.label.trim(), `${key}: filtro senza etichetta`).toBeTruthy()
      }
    }
  })

  it('i pin della mappa sono completi e collegati a pagine esistenti', () => {
    const map = readJson<{ pins: Array<{ id: string; left: string; top: string; name: string; pageId?: string }> }>(
      path.join(root, 'content/mappins.json')
    )
    const ids = new Set([...registry.pages.map((page) => page.id), ...files])
    expect(map.pins.length).toBeGreaterThanOrEqual(12)
    for (const pin of map.pins) {
      expect(pin.name.trim().length, `${pin.id}: nome vuoto`).toBeGreaterThan(0)
      expect(Number.parseFloat(pin.left), `${pin.id}: left`).toBeGreaterThanOrEqual(0)
      expect(Number.parseFloat(pin.left), `${pin.id}: left`).toBeLessThanOrEqual(100)
      expect(Number.parseFloat(pin.top), `${pin.id}: top`).toBeGreaterThanOrEqual(0)
      expect(Number.parseFloat(pin.top), `${pin.id}: top`).toBeLessThanOrEqual(100)
      if (pin.pageId) expect(ids.has(pin.pageId), `${pin.id}: pagina ${pin.pageId} assente`).toBe(true)
    }
  })
})
