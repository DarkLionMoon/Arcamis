/*
  ARCAMIS — test del renderer condiviso (sito + anteprima admin)

  I blocchi dell'editor producono questa sintassi: se il renderer cambia,
  l'anteprima dell'admin resta indietro e i lettori vedono un'altra
  pagina. Qui si esegue il file vero in un contesto vm, come nel browser.
*/
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

function loadRenderer() {
  const sandbox = { window: {}, console }
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/md-render.js'), 'utf8'), sandbox)
  return {
    render: (md) => vm.runInContext('window.mdRender', sandbox)(md),
    toc: (md) => vm.runInContext('window.mdToc', sandbox)(md)
  }
}

const { render, toc } = loadRenderer()

describe('termini glossario ([[termine]])', () => {
  it('trasforma solo i termini presenti nei dati admin e lascia gli altri come testo', () => {
    const sandbox = { window: { ARC_GLOSSARY: { 'classe armatura': { title: 'Classe Armatura' } } }, console }
    vm.createContext(sandbox)
    vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/md-render.js'), 'utf8'), sandbox)
    const html = vm.runInContext('window.mdRender', sandbox)('Leggi [[Classe Armatura]] e [[<script>]].')
    expect(html).toContain('class="arc-glossary-term"')
    expect(html).toContain('data-glossary="Classe Armatura"')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})

describe('griglia di carte (:::cards)', () => {
  const markdown = [
    ':::cards',
    '### Guerriero',
    'Combattente esperto, **resistente**.',
    '',
    '### Mago',
    'Studia i segreti di Aetherion.',
    ':::'
  ].join('\n')

  it('rende una card per titolo, con markdown nel corpo', () => {
    const html = render(markdown)
    expect(html).toContain('<div class="n-cards">')
    expect((html.match(/class="n-card"/g) || []).length).toBe(2)
    expect(html).toContain('<div class="n-card-title">Guerriero</div>')
    expect(html).toContain('<strong>resistente</strong>')
  })

  it('le carte non sporcano il sommario della pagina', () => {
    const items = toc('## Sezione\n\n:::cards\n### Carta\nTesto\n:::\n\n### Sotto')
    expect(items.map((item) => item.text)).toEqual(['Sezione', 'Sotto'])
  })

  it('una griglia senza carte non rompe il resto del testo', () => {
    const html = render('Prima\n\n:::cards\n::: \n\nDopo')
    expect(html).toContain('<p class="n-p">Prima</p>')
    expect(html).toContain('<p class="n-p">Dopo</p>')
  })
})

describe('galleria (:::gallery)', () => {
  const markdown = [
    ':::gallery',
    '![Porto](/images/porto.webp)',
    '![Foresta](/images/foresta.webp)',
    ':::'
  ].join('\n')

  it('rende una figura per immagine con didascalia', () => {
    const html = render(markdown)
    expect(html).toContain('<div class="n-gal">')
    expect((html.match(/class="n-gal-item"/g) || []).length).toBe(2)
    expect(html).toContain('<img src="/images/porto.webp" alt="Porto"')
    expect(html).toContain('<figcaption>Foresta</figcaption>')
  })

  it('scarta indirizzi non sicuri', () => {
    const html = render(':::gallery\n![X](javascript:alert(1))\n:::')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('<img')
  })

  it('un fence sconosciuto resta codice visibile, non sparisce', () => {
    const html = render(':::mistero\ntesto\n:::')
    expect(html).toContain('testo')
  })
})

describe('anteprima dei blocchi canonici', () => {
  it('callout, tabella e immagine restano quelli del sito', () => {
    const html = render(
      '> [!WARNING] Attenzione\n> Non correre.\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n![Mappa](/mappa.webp)'
    )
    expect(html).toContain('class="n-callout"')
    expect(html).toContain('Attenzione')
    expect(html).toContain('<table class="n-tbl">')
    expect(html).toContain('src="/mappa.webp"')
  })
})
