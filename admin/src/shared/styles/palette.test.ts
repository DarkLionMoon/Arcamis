/* ════════════════════════════════════════════════════════════════
   Test del design system del pannello.

   Il pannello ha due temi definiti in shared/styles/arc-admin-theme.css:
   chiaro (default, superfici bianche) e scuro (:root[data-theme='dark'],
   palette della wiki). Questo test verifica ciò che si rompe in silenzio:

     1. entrambi i temi definiscono TUTTI i token di colore: se un tema
        ne dimentica uno, l'altro tema ne eredita il valore e la UI mostra
        un colore del tema sbagliato;
     2. il tema chiaro è davvero chiaro e lo scuro davvero scuro
        (luminanza delle superfici), così uno swap di token non passa;
     3. ogni ruolo di testo resta ≥ 4,5:1 sulle superfici su cui compare,
        testo dei bottoni pieni compreso (il bianco su oro #c89b3c era
        2,56:1: sotto soglia AA, ed è il motivo per cui esiste --accent-ink);
     4. il tema scuro mantiene la parità con la wiki: stesse superfici,
        stesso oro e stessi ruoli di testo del sito pubblico;
     5. il testo di lavoro non usa il serif (il Cinzel resta al marchio)
        e nessun font è caricato da terze parti;
     6. nel livello di tema i componenti non scrivono colori a mano:
        passano solo da token, altrimenti i due temi divergono.

   Il test legge i CSS reali dal disco (vitest non elabora i CSS, quindi
   `import ... from './x.css'` restituirebbe stringa vuota).
   ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../../..')

const baseCss = fs.readFileSync(path.join(here, 'arc-admin-app.css'), 'utf8')
const themeCss = fs.readFileSync(path.join(here, 'arc-admin-theme.css'), 'utf8')
const siteCss = fs.readFileSync(path.join(repoRoot, 'scripts/css/style-base.css'), 'utf8')
const fontsCss = fs.readFileSync(path.join(repoRoot, 'scripts/css/fonts.css'), 'utf8')

const LIGHT_SELECTOR = '.arc-app, .arc-auth-page'
const DARK_SELECTOR = ":root[data-theme='dark'] .arc-app, :root[data-theme='dark'] .arc-auth-page"

/* I selettori possono essere multipli e su più righe: si confronta la
   versione "appiattita" del CSS così `.arc-app,\n.arc-auth-page {` è
   trovato da `.arc-app, .arc-auth-page`. */
function tokens(css: string, selector: string): Record<string, string> {
  const flat = css.replace(/\s+/g, ' ')
  const spaced = flat.indexOf(selector + ' {')
  const compact = flat.indexOf(selector + '{')
  const start = spaced !== -1 ? spaced : compact
  const found: Record<string, string> = {}
  if (start === -1) return found
  const end = flat.indexOf('}', start)
  const block = flat.slice(start, end)
  for (const match of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    found[match[1]] = match[2].trim()
  }
  return found
}

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

const light = tokens(themeCss, LIGHT_SELECTOR)
const dark = tokens(themeCss, DARK_SELECTOR)
const site = tokens(siteCss, ':root')

function parseColor(value: string | undefined): Rgba | null {
  if (!value) return null
  const text = value.trim()
  const hex = text.match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    return {
      r: parseInt(hex[1].slice(0, 2), 16),
      g: parseInt(hex[1].slice(2, 4), 16),
      b: parseInt(hex[1].slice(4, 6), 16),
      a: 1
    }
  }
  const rgba = text.match(/rgba?\(([^)]+)\)/i)
  if (rgba) {
    const parts = rgba[1].split(',').map((n) => parseFloat(n.trim()))
    return { r: parts[0], g: parts[1], b: parts[2], a: Number.isNaN(parts[3]) ? 1 : parts[3] }
  }
  return null
}

function luminance({ r, g, b }: Rgba): number {
  const channel = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function over(fg: Rgba, bg: Rgba): Rgba {
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1
  }
}

function contrast(fg: Rgba, bg: Rgba): number {
  const l1 = luminance(over(fg, bg))
  const l2 = luminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/* Colori con alpha (le tinte -soft e i bordi) vengono composti sulla
   superficie indicata: è lì che il testo compare davvero. */
function resolve(palette: Record<string, string>, token: string, baseToken?: string): Rgba | null {
  const parsed = parseColor(palette[token])
  if (!parsed) return null
  if (parsed.a >= 1) return parsed
  const back = baseToken ? resolve(palette, baseToken) : null
  return back ? over(parsed, back) : null
}

/* Token di colore che OGNI tema deve ridefinire. I token non di colore
   (raggi, font, …) sono condivisi e non compaiono qui. */
const COLOR_TOKENS = [
  '--abg',
  '--asurface',
  '--asurface-2',
  '--asurface-3',
  '--aline',
  '--aline-2',
  '--afg',
  '--afg-2',
  '--afg-3',
  '--accent',
  '--accent-strong',
  '--accent-ink',
  '--accent-soft',
  '--accent-rgb',
  '--good',
  '--good-soft',
  '--warn',
  '--warn-soft',
  '--bad',
  '--bad-soft',
  '--info',
  '--info-soft',
  '--well',
  '--overlay',
  '--scrim',
  '--ring'
]

/* Coppie testo/sfondo, uguali nei due temi perché i ruoli sono gli stessi.
   Il terzo elemento è la superficie su cui comporre i fondi con alpha. */
const CONTRAST_PAIRS: Array<[string, string, string?]> = [
  ['--afg', '--asurface'],
  ['--afg', '--abg'],
  ['--afg-2', '--asurface'],
  ['--afg-2', '--abg'],
  ['--afg-2', '--asurface-2'],
  ['--afg-3', '--asurface'],
  ['--afg-3', '--abg'],
  ['--afg-3', '--asurface-2'],
  ['--accent', '--asurface'],
  ['--accent', '--abg'],
  ['--accent-strong', '--asurface'],
  ['--accent-strong', '--abg'],
  ['--good', '--asurface'],
  ['--warn', '--asurface'],
  ['--bad', '--asurface'],
  ['--info', '--asurface'],
  ['--good', '--good-soft', '--asurface'],
  ['--warn', '--warn-soft', '--asurface'],
  ['--bad', '--bad-soft', '--asurface'],
  ['--info', '--info-soft', '--asurface'],
  /* Testo dei bottoni pieni: è il caso che in passato stava sotto soglia. */
  ['--accent-ink', '--accent'],
  ['--accent-ink', '--accent-strong']
]

describe('palette del pannello', () => {
  it('legge i due temi dal livello di tema', () => {
    expect(Object.keys(light).length).toBeGreaterThan(20)
    expect(Object.keys(dark).length).toBeGreaterThan(20)
    expect(Object.keys(site).length).toBeGreaterThan(10)
  })

  it.each(COLOR_TOKENS)('entrambi i temi definiscono %s', (token) => {
    expect(light[token], `token mancante nel tema chiaro: ${token}`).toBeTruthy()
    expect(dark[token], `token mancante nel tema scuro: ${token}`).toBeTruthy()
  })

  it('il tema chiaro ha superfici chiare e testo scuro', () => {
    const bg = parseColor(light['--abg'])
    const surface = parseColor(light['--asurface'])
    const fg = parseColor(light['--afg'])
    expect(bg && luminance(bg)).toBeGreaterThan(0.7)
    expect(surface && luminance(surface)).toBeGreaterThan(0.9)
    expect(fg && luminance(fg)).toBeLessThan(0.1)
  })

  it('il tema scuro ha superfici scure e testo chiaro', () => {
    const bg = parseColor(dark['--abg'])
    const fg = parseColor(dark['--afg'])
    expect(bg && luminance(bg)).toBeLessThan(0.05)
    expect(fg && luminance(fg)).toBeGreaterThan(0.6)
  })

  describe.each([
    ['chiaro', () => light],
    ['scuro', () => dark]
  ])('contrasto AA — tema %s', (_label, paletteOf) => {
    const palette = paletteOf()
    it.each(CONTRAST_PAIRS)('%s su %s', (fgToken, bgToken, baseToken) => {
      const fg = resolve(palette, fgToken, baseToken)
      const bg = resolve(palette, bgToken, baseToken)
      expect(fg, `${fgToken} non è un colore calcolabile: ${palette[fgToken]}`).toBeTruthy()
      expect(bg, `${bgToken} non è un colore calcolabile: ${palette[bgToken]}`).toBeTruthy()

      const ratio = contrast(fg as Rgba, bg as Rgba)
      expect(ratio, `${fgToken} su ${bgToken} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
    })
  })

  it('il tema scuro resta allineato alla wiki', () => {
    for (const [darkToken, siteToken] of [
      ['--abg', '--bg'],
      ['--asurface', '--panel'],
      ['--asurface-2', '--bg3'],
      ['--asurface-3', '--bg4'],
      ['--accent', '--gold'],
      ['--afg', '--white'],
      ['--afg-2', '--parch']
    ]) {
      expect(dark[darkToken], `token mancante: ${darkToken}`).toBeTruthy()
      expect(site[siteToken], `token mancante nel sito: ${siteToken}`).toBeTruthy()
      expect(dark[darkToken].toLowerCase()).toBe(site[siteToken].toLowerCase())
    }
  })

  it('tiene i bordi del tema scuro nel tono dorato del sito', () => {
    const [goldR, goldG, goldB] = site['--gold-rgb'].split(',').map((n) => parseInt(n.trim(), 10))
    for (const token of ['--aline', '--aline-2']) {
      const border = parseColor(dark[token])
      expect(border, `${token} deve essere rgba()`).toBeTruthy()
      expect([border!.r, border!.g, border!.b]).toEqual([goldR, goldG, goldB])
      expect(border!.a).toBeLessThan(0.5)
    }
  })

  it('usa il sans per il testo di lavoro e il Cinzel solo per il marchio', () => {
    expect(light['--afont-body']).not.toMatch(/Cinzel/)
    expect(dark['--afont-body'] ?? light['--afont-body']).not.toMatch(/Cinzel/)
    expect(light['--afont-display']).toMatch(/Cinzel/)
  })

  it('usa solo font self-hosted presenti nel manifest generato', () => {
    const referenced = [...(baseCss + themeCss).matchAll(/url\('(\/fonts\/[^']+)'\)/g)].map((m) => m[1])
    expect(referenced.length).toBeGreaterThan(0)
    for (const url of referenced) {
      expect(fontsCss, `font non presente nel manifest: ${url} (rigenera con npm run fonts)`).toContain(url)
      const file = path.join(repoRoot, 'public', url.replace(/^\//, ''))
      expect(fs.existsSync(file), `file font mancante: ${url}`).toBe(true)
    }
    expect(baseCss + themeCss).not.toMatch(/fonts\.(googleapis|gstatic)\.com/)
  })

  it('nei componenti del livello di tema non ci sono colori scritti a mano', () => {
    /* Tutto ciò che segue il blocco dei token scuri sono regole di
       componente: lì i colori devono arrivare solo da var(--…), altrimenti
       il tema chiaro e quello scuro divergono. Unica eccezione ammessa:
       il bianco del testo sopra le immagini (--scrim). */
    const marker = '/* ─────────────── Componenti ───────────────'
    const componentStart = themeCss.indexOf(marker)
    expect(componentStart, 'marcatore dei componenti mancante nel livello di tema').toBeGreaterThan(-1)
    const components = themeCss.slice(componentStart)
    const literals = [...components.matchAll(/#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/g)].map((m) => m[0])
    const unexpected = literals.filter((literal) => literal.toLowerCase() !== '#ffffff')
    expect(unexpected, `colori scritti a mano nei componenti: ${unexpected.join(', ')}`).toEqual([])
  })
})
