/* ════════════════════════════════════════════════════════════════
   Test del design system del pannello.

   Verifica tre cose che si rompono in silenzio:
     1. superfici e oro sono GLI STESSI del sito pubblico
        (scripts/css/style-base.css): pannello e wiki devono sembrare
        lo stesso prodotto, non due UI diverse;
     2. ogni colore di testo resta ≥ 4,5:1 sulle superfici admin;
     3. i font referenziati esistono ancora nel manifest generato da
        scripts/fetch-fonts.mjs (i nomi contengono l'hash del contenuto).

   Il test legge i file CSS reali dal disco (vitest non elabora i CSS,
   quindi `import ... from './x.css'` restituirebbe stringa vuota).
   ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../../..')

const adminCss = fs.readFileSync(path.join(here, 'arc-admin-app.css'), 'utf8')
const siteCss = fs.readFileSync(path.join(repoRoot, 'scripts/css/style-base.css'), 'utf8')
const fontsCss = fs.readFileSync(path.join(repoRoot, 'scripts/css/fonts.css'), 'utf8')

/* I selettori possono essere multipli e su più righe: si confronta la
   versione "appiattita" del CSS così `.arc-app,\n.arc-auth-page {` è
   trovato da `.arc-app, .arc-auth-page`. */
function tokens(css: string, selector: string): Record<string, string> {
  const flat = css.replace(/\s+/g, ' ')
  /* Il sito scrive `:root{`, il pannello `... page {`: entrambe le forme. */
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

const admin = tokens(adminCss, '.arc-app, .arc-auth-page')
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

describe('palette del pannello', () => {
  it('trova i token di admin e sito', () => {
    expect(Object.keys(admin).length).toBeGreaterThan(10)
    expect(Object.keys(site).length).toBeGreaterThan(10)
  })

  it.each([
    ['fondo', '--abg', '--bg'],
    ['pannello', '--asurface', '--panel'],
    ['pannello 2', '--asurface-2', '--bg3'],
    ['pannello 3', '--asurface-3', '--bg4'],
    ['accento', '--accent', '--gold']
  ])('%s: %s è identico al token del sito %s', (_label, adminToken, siteToken) => {
    expect(admin[adminToken], `token admin mancante: ${adminToken}`).toBeTruthy()
    expect(site[siteToken], `token sito mancante: ${siteToken}`).toBeTruthy()
    expect(admin[adminToken].toLowerCase()).toBe(site[siteToken].toLowerCase())
  })

  it('mappa i ruoli di testo sui toni chiari della palette', () => {
    expect(admin['--afg'].toLowerCase()).toBe(site['--white'].toLowerCase())
    expect(admin['--afg-2'].toLowerCase()).toBe(site['--parch'].toLowerCase())
  })

  it('tiene i bordi del pannello nel tono dorato del sito', () => {
    const [goldR, goldG, goldB] = site['--gold-rgb'].split(',').map((n) => parseInt(n.trim(), 10))
    for (const token of ['--aline', '--aline-2']) {
      const border = parseColor(admin[token])
      expect(border, `${token} deve essere rgba()`).toBeTruthy()
      expect([border!.r, border!.g, border!.b]).toEqual([goldR, goldG, goldB])
      expect(border!.a).toBeLessThan(0.5)
    }
  })

  it.each([
    ['--afg', '--abg'],
    ['--afg', '--asurface'],
    ['--afg-2', '--abg'],
    ['--afg-2', '--asurface'],
    ['--afg-3', '--abg'],
    ['--afg-3', '--asurface'],
    ['--accent', '--abg'],
    ['--accent', '--asurface'],
    ['--accent-strong', '--asurface'],
    ['--good', '--asurface'],
    ['--warn', '--asurface'],
    ['--bad', '--asurface']
  ])('%s resta sopra 4,5:1 su %s', (fgToken, bgToken) => {
    const fg = parseColor(admin[fgToken])
    const bg = parseColor(admin[bgToken])
    expect(fg, `${fgToken} non è un colore calcolabile: ${admin[fgToken]}`).toBeTruthy()
    expect(bg, `${bgToken} non è un colore calcolabile: ${admin[bgToken]}`).toBeTruthy()

    const ratio = contrast(fg as Rgba, bg as Rgba)
    expect(ratio, `${fgToken} su ${bgToken} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
  })

  it('dichiara i font del sito per titoli e testo', () => {
    expect(admin['--afont-display']).toMatch(/Cinzel/)
    expect(admin['--afont-body']).toMatch(/Crimson Pro/)
  })

  it('usa solo font self-hosted presenti nel manifest generato', () => {
    const referenced = [...adminCss.matchAll(/url\('(\/fonts\/[^']+)'\)/g)].map((m) => m[1])
    expect(referenced.length).toBeGreaterThan(0)
    for (const url of referenced) {
      expect(fontsCss, `font non presente nel manifest: ${url} (rigenera con npm run fonts)`).toContain(url)
      const file = path.join(repoRoot, 'public', url.replace(/^\//, ''))
      expect(fs.existsSync(file), `file font mancante: ${url}`).toBe(true)
    }
    expect(adminCss).not.toMatch(/fonts\.(googleapis|gstatic)\.com/)
  })
})
