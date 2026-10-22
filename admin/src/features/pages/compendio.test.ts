import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  cardGroup,
  createCard,
  parseCompendio,
  serializeCard,
  serializeCompendio,
  updateCard,
  updateMeta,
  type CompendioDoc
} from './compendio'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const contentOf = (key: string) =>
  (JSON.parse(fs.readFileSync(path.join(root, 'content/pages', key + '.json'), 'utf8')) as { content: string }).content

const normalize = (markdown: string) => markdown.replace(/\s+/g, ' ').trim()

describe('compendio strutturato', () => {
  for (const [key, kind, count] of [
    ['specie-homebrew', 'specie', 33],
    ['sottoclassi-homebrew', 'sottoclassi', 18]
  ] as const) {
    const source = contentOf(key)

    it(`${key}: riconosce ${count} schede reali`, () => {
      const doc = parseCompendio(source, kind)
      const cards = doc.parts.filter((part) => part.kind === 'card')
      expect(cards).toHaveLength(count)
      for (const card of cards) {
        if (card.kind !== 'card') continue
        expect(card.title.trim().length).toBeGreaterThan(0)
        expect(card.body.length).toBeGreaterThan(0)
      }
    })

    it(`${key}: riscrive il markdown reale senza perdere contenuto`, () => {
      const doc = parseCompendio(source, kind)
      expect(normalize(serializeCompendio(doc))).toBe(normalize(source))
    })
  }

  it('modifica una scheda senza toccare le altre', () => {
    const source = contentOf('sottoclassi-homebrew')
    const doc = parseCompendio(source, 'sottoclassi')
    const first = doc.parts.find((part) => part.kind === 'card')
    expect(first?.kind).toBe('card')
    if (!first || first.kind !== 'card') return

    const edited = updateMeta(
      updateCard(first, { title: 'Chemtecnico — prova', body: first.body + '\n\nNuovo tratto di prova.' }),
      'Artefice'
    )
    const output = serializeCompendio({
      ...doc,
      parts: doc.parts.map((part) => (part.id === first.id ? edited : part))
    })

    expect(output).toContain('# Chemtecnico — prova')
    expect(output).toContain('Nuovo tratto di prova.')
    expect(output).toContain('*Classe:* Artefice')
    expect(output).toContain('# Sentiero degli abissi')
    const reparsed = parseCompendio(output, 'sottoclassi')
    expect(reparsed.parts.filter((part) => part.kind === 'card')).toHaveLength(18)
  })

  it('crea una scheda con la sezione iniziale del tipo giusto', () => {
    const card = createCard('sottoclassi', 'Nuova sottoclasse')
    expect(serializeCard(card)).toContain('# Nuova sottoclasse')
    expect(card.body.startsWith('## Descrizione')).toBe(true)
    expect(card.meta).toEqual({ label: 'Classe', value: '' })

    const species = createCard('specie', 'Nuova specie')
    expect(species.body.startsWith('## Dettagli')).toBe(true)
    expect(species.meta).toBeNull()
  })

  it('raggruppa le sottoclassi per classe reale', () => {
    const doc: CompendioDoc = parseCompendio(contentOf('sottoclassi-homebrew'), 'sottoclassi')
    const groups = new Set(
      doc.parts
        .filter((part) => part.kind === 'card')
        .map((part) => (part.kind === 'card' ? cardGroup(part, 'sottoclassi') : ''))
    )
    expect(groups.size).toBeGreaterThan(8)
    expect(groups.has('Artefice')).toBe(true)
    expect(groups.has('Barbaro')).toBe(true)
  })
})
