import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

describe('glossario markdown pubblico', () => {
  it('renderizza [[Nome Voce]] come termine accessibile', () => {
    const sandbox = { window: { ARC_GLOSSARY: { 'classe armatura': { title: 'Classe Armatura' } } }, console }
    vm.createContext(sandbox)
    vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/md-render.js'), 'utf8'), sandbox)
    const html = vm.runInContext('window.mdRender', sandbox)('La [[Classe Armatura]] protegge.')
    expect(html).toContain('class="arc-glossary-term"')
    expect(html).toContain('data-glossary="Classe Armatura"')
    expect(html).toContain('tabindex="0"')
  })

  it('espone una palette pubblica e conserva le sorgenti legacy dei database', () => {
    const extras = fs.readFileSync(path.join(root, 'scripts/js/public-extras.js'), 'utf8')
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    expect(extras).toContain("e.key.toLowerCase() === 'k'")
    expect(extras).not.toContain('var definitions =')
    expect(extras).toContain("fetch('/content/glossary.json')")
    expect(extras).toContain('/content/search-index.json')
    expect(html).toContain('/scripts/js/public-extras.js')
    for (const db of ['biblioteca','changelog','galleria','npc','sottoclassi','specie','timeline']) {
      expect(fs.existsSync(path.join(root, 'content/databases', db + '.json'))).toBe(true)
    }
  })
})
