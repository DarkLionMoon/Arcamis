/*
  ARCAMIS — test della pipeline immagini.

  Verifica tre cose che, se saltano, rompono il sito in silenzio:
    1. ogni immagine citata nei markdown ha le varianti nel manifest;
    2. `images.js` produce <picture> con srcset AVIF/WebP e misure;
    3. ogni icona mappata in `icons.js` esiste nello sprite SVG.
*/
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

import { describe, expect, it } from 'vitest'

const root = process.cwd()
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'images/opt/manifest.json'), 'utf8'))

const pagesDir = path.join(root, 'content/pages')
const referenced = new Set()
for (const file of fs.readdirSync(pagesDir)) {
  if (!file.endsWith('.json') || file === 'registry.json') continue
  const page = JSON.parse(fs.readFileSync(path.join(pagesDir, file), 'utf8'))
  for (const match of String(page.content || '').matchAll(/!\[[^\]]*\]\((\/images\/[^)\s]+)/g)) {
    /* Il frammento #x,y è il punto focale, non fa parte del file. */
    referenced.add(match[1].split('#')[0])
  }
}

function loadImages(sources) {
  const win = { ARC_IMAGES: sources }
  const sandbox = { window: win, Object, Number, String }
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/images.js'), 'utf8'), sandbox)
  return win
}

describe('immagini · manifest', () => {
  it('copre tutte le immagini citate nelle pagine', () => {
    const missing = [...referenced].filter((src) => !manifest.sources[src])
    expect(missing, `immagini senza varianti: ${missing.join(', ')}`).toEqual([])
  })

  it('ha AVIF e WebP per ogni larghezza dichiarata', () => {
    const broken = []
    for (const [src, entry] of Object.entries(manifest.sources)) {
      if (!entry.v || !Object.keys(entry.v).length) broken.push(src)
      for (const [width, formats] of Object.entries(entry.v || {})) {
        if (!formats.a || !formats.w) broken.push(`${src}@${width}`)
      }
      if (!(entry.w > 0) || !(entry.h > 0)) broken.push(`${src} (misure)`)
    }
    expect(broken).toEqual([])
  })

  it('tiene le varianti entro i budget dichiarati', () => {
    const over = []
    for (const [src, entry] of Object.entries(manifest.sources)) {
      for (const [width, formats] of Object.entries(entry.v)) {
        const budget = { 640: 80 * 1024, 1280: 180 * 1024, 1920: 400 * 1024 }[width]
        if (!budget) continue
        if (formats.wB > budget) over.push(`${src}@${width} webp ${Math.round(formats.wB / 1024)}KB`)
      }
    }
    expect(over).toEqual([])
  })
})

describe('immagini · markup', () => {
  const win = loadImages(manifest.sources)
  const sample = Object.keys(manifest.sources)[0]
  const data = manifest.sources[sample]

  it('emette picture con srcset AVIF e WebP e le misure reali', () => {
    const html = win.arcPicture(sample, { alt: 'Prova', className: 'n-image n-zoomable' })
    expect(html).toContain('<picture class="arc-pic">')
    expect(html).toContain('type="image/avif"')
    expect(html).toContain('type="image/webp"')
    expect(html).toMatch(/srcset="[^"]+\d{3,4}w/)
    expect(html).toContain(`width="${data.w}"`)
    expect(html).toContain(`height="${data.h}"`)
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('class="n-image n-zoomable"')
  })

  it('restituisce un <img> semplice per sorgenti fuori pipeline', () => {
    const html = win.arcPicture('/images/fuori-pipeline.jpg', { alt: 'Vecchia' })
    expect(html).toContain('<img')
    expect(html).not.toContain('<picture')
    expect(html).toContain('src="/images/fuori-pipeline.jpg"')
  })

  it('usa la variante più grande per lo zoom', () => {
    const full = win.arcImageFull(sample)
    expect(full).toContain('/images/opt/')
    expect(full).toMatch(/-(\d+)\.(avif|webp)$/)
  })
})

describe('icone · sprite', () => {
  const sprite = fs.readFileSync(path.join(root, 'images/icons-lore.svg'), 'utf8')
  const icons = fs.readFileSync(path.join(root, 'scripts/js/icons.js'), 'utf8')
  const ids = new Set([...sprite.matchAll(/<symbol id="([a-z-]+)"/g)].map((match) => match[1]))
  const mapBlock = icons.slice(icons.indexOf('var EMOJI = {'), icons.indexOf('};', icons.indexOf('var EMOJI = {')))
  const mapped = [...mapBlock.matchAll(/:\s*'([a-z-]+)'/g)].map((match) => match[1])

  it('contiene ogni simbolo usato dalla mappa emoji', () => {
    const missing = [...new Set(mapped)].filter((name) => !ids.has(name))
    expect(missing, `simboli mancanti: ${missing.join(', ')}`).toEqual([])
  })

  it('mappa le emoji del registro su simboli esistenti', () => {
    const registry = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/registry.json'), 'utf8'))
    const pages = Array.isArray(registry) ? registry : registry.pages || []
    const emojis = new Set(pages.map((page) => String(page.i || '').replace(/\uFE0F/g, '')))
    const unmapped = [...emojis].filter((emoji) => emoji && !icons.includes(`'${emoji}'`))
    expect(unmapped, `emoji non mappate: ${unmapped.join(' ')}`).toEqual([])
  })
})
