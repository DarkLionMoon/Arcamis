import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { createEntity, parsePantheon, serializeEntity, serializePantheon, updateEntity, updateField } from './pantheon'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const source = (
  JSON.parse(fs.readFileSync(path.join(root, 'content/pages/pantheon.json'), 'utf8')) as { content: string }
).content

describe('pantheon strutturato', () => {
  it('riconosce le 20 divinità e lascia grezze le sezioni speciali', () => {
    const doc = parsePantheon(source)
    const entities = doc.parts.filter((part) => part.kind === 'entity')
    expect(entities).toHaveLength(20)
    expect(doc.parts.some((part) => part.kind === 'raw')).toBe(true)
    for (const entity of entities) {
      if (entity.kind !== 'entity') continue
      expect(entity.name.trim().length).toBeGreaterThan(0)
      expect(entity.identity.some((field) => field.label === 'Nome' && field.value)).toBe(true)
      expect(entity.cult.length).toBeGreaterThan(0)
    }
  })

  it('riscrive il markdown reale senza perdere contenuto', () => {
    const doc = parsePantheon(source)
    const output = serializePantheon(doc)
    /* Le uniche differenze ammesse sono spazi di separazione normalizzati. */
    expect(output.replace(/\s+/g, ' ').trim()).toBe(source.replace(/\s+/g, ' ').trim())
  })

  it('modifica una divinità senza toccare le altre sezioni', () => {
    const doc = parsePantheon(source)
    const first = doc.parts.find((part) => part.kind === 'entity')
    expect(first?.kind).toBe('entity')
    if (!first || first.kind !== 'entity') return

    const edited = updateField(updateEntity(first, { name: 'Anivia Test' }), 'identity', 'Epiteto', 'La Fenice')
    const output = serializePantheon({
      ...doc,
      parts: doc.parts.map((part) => (part.id === first.id ? edited : part))
    })

    expect(output).toContain('# Anivia Test')
    expect(output).toContain('- **Epiteto:** La Fenice')
    expect(output).toContain('## Personalità')
    expect(output).toContain('## Culto')
    expect(output).toContain('# Nota sulle fonti')
  })

  it('crea una nuova scheda con i campi canonici', () => {
    const entity = createEntity('Nuova Divinità')
    const markdown = serializeEntity(entity)
    expect(markdown).toContain('# Nuova Divinità')
    expect(markdown).toContain('- **Nome:** Nuova Divinità')
    expect(markdown).toContain('## Culto')
  })
})
