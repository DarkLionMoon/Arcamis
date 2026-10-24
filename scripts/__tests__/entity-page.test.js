/*
  ARCAMIS — test della pagina entità (Fase 1).

  `entity-page.js` espone ArcEntity su window: parser e renderer sono
  funzioni pure, quindi le carichiamo in vm. I contenuti usati sono
  quelli reali del Pantheon, così il test copre anche la forma dei
  markdown che il sito produce.
*/
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

function loadEntity(withResponsiveImages = false) {
  const window = {
    arcPicture: withResponsiveImages
      ? (src, options) =>
          '<picture><img src="' + src + '" class="' + options.className + '" alt="' + options.alt + '"' +
          ' loading="' + options.loading + '" fetchpriority="' + options.fetchpriority + '"' +
          ' sizes="' + options.sizes + '" ' + options.attrs + '></picture>'
      : undefined
  }
  const sandbox = { window, console }
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/entity-page.js'), 'utf8'), sandbox)
  return sandbox.window.ArcEntity
}

const renderMd = (md) => '<div class="md">' + String(md) + '</div>'

const MD = `# Anivia

![Anivia](/images/pantheon-anivia.jpg#42,32)

> I am the fury of the blizzard. — Anivia

## Identità

- **Nome:** Anivia
- **Epiteto:** La Criofenice
- **Allineamento:** Legale Buono
- **Sfere:** Gelo, Libertà e Speranza

## Personalità

Anivia è uno spirito alato eterno.

### Natura

Testo della natura.

## Culto

- **Tempio:** Santuari all'aperto.
`

describe('ArcEntity.parse', () => {
  const ArcEntity = loadEntity()

  it('mette Identità nel rail e non tra le tab', () => {
    const parsed = ArcEntity.parse(MD)
    expect(parsed.meta.map((m) => m.key)).toEqual(['Epiteto', 'Allineamento', 'Sfere'])
    expect(parsed.sections.map((s) => s.title)).toEqual(['Personalità', 'Culto'])
  })

  it('scarta il Nome (già nel titolo) e conserva i valori', () => {
    const parsed = ArcEntity.parse(MD)
    expect(parsed.meta.find((m) => m.key === 'Epiteto').value).toBe('La Criofenice')
    expect(parsed.meta.some((m) => m.key === 'Nome')).toBe(false)
  })

  it("non ripete l'immagine di apertura nell'epigrafe", () => {
    const parsed = ArcEntity.parse(MD)
    expect(parsed.intro).toContain('fury of the blizzard')
    expect(parsed.intro).not.toContain('![')
  })

  it('non rompe una scheda senza sezione Identità', () => {
    const parsed = ArcEntity.parse('## Storia\n\nTesto.\n')
    expect(parsed.meta).toEqual([])
    expect(parsed.sections).toHaveLength(1)
  })
})

describe('ArcEntity.render', () => {
  const ArcEntity = loadEntity(true)
  const html = ArcEntity.render(
    { slug: 'anivia', n: 'Anivia', epi: 'La Criofenice', img: '/images/pantheon-anivia.jpg', pos: [42, 32], md: MD },
    { icon: '❄️', eyebrow: 'Pantheon di Arcamis', renderMd, backHref: '/lore/pantheon', backLabel: 'Il Pantheon' }
  )

  it('rende hero, titolo ed epiteto', () => {
    expect(html).toContain('class="arc-hero"')
    expect(html).toContain('<h1 class="arc-hero-title">Anivia</h1>')
    expect(html).toContain('La Criofenice')
    expect(html).toContain('src="/images/pantheon-anivia.jpg"')
    expect(html).toContain('object-position:42% 32%')
    expect(html).toContain('fetchpriority="high"')
    expect(html).toContain('onerror=')
  })

  it('renderizza il glifo lore come icona inline senza escaping', () => {
    const icon = '<svg class="arc-ic"><use href="/images/icons-lore.svg#ice"></use></svg>'
    const markup = ArcEntity.render({ n: 'Anivia', md: MD }, { icon, renderMd })
    expect(markup).toContain('<span class="arc-rail-glyph" aria-hidden="true"><svg class="arc-ic">')
  })

  it('rifiuta URL immagine con protocollo non sicuro', () => {
    const markup = ArcEntity.render({ n: 'Anivia', img: 'javascript:alert(1)', md: MD }, { renderMd })
    expect(markup).toContain('class="arc-hero-none"')
    expect(markup).not.toContain('javascript:')
  })

  it('rende il rail con i metadati come dl', () => {
    expect(html).toContain('class="arc-rail"')
    expect(html).toContain('<dt>Epiteto</dt><dd>La Criofenice</dd>')
    expect(html).toContain('href="/lore/pantheon"')
  })

  it('rende tab accessibili con la prima selezionata', () => {
    expect(html.match(/role="tab"/g)).toHaveLength(2)
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('role="tabpanel"')
    expect(html).toContain('id="arc-panel-0"')
    expect(html).toMatch(/id="arc-panel-1"[^>]*hidden/)
  })

  it("non produce markup dell'immagine nell'intro", () => {
    const intro = html.slice(html.indexOf('class="arc-intro"'), html.indexOf('class="arc-tabs-block"'))
    expect(intro).not.toContain('<img')
  })
})
