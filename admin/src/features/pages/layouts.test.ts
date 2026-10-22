import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { LAYOUT_OPTIONS, LAYOUT_PRESETS, presetFor } from './layouts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

/* I preset sono combinazioni di layout che il sito sa rendere: se uno
   puntasse a un layout inesistente, il pannello salverebbe una pagina
   con layout ignoto (notion-nav cade sul markdown generico). */

describe('preset di layout', () => {
  const known = new Set(LAYOUT_OPTIONS.map((option) => option.value))

  it('sono tre e coprono wiki, immersivo e schede', () => {
    expect(LAYOUT_PRESETS.map((preset) => preset.id)).toEqual(['wiki', 'immersivo', 'schede'])
  })

  it('ogni preset usa un layout che il sito elenca', () => {
    for (const preset of LAYOUT_PRESETS) {
      expect(known, preset.label).toContain(preset.layout)
    }
  })

  it('wiki e immersivo hanno lo stesso layout di prima', () => {
    const wiki = LAYOUT_PRESETS.find((preset) => preset.id === 'wiki')
    const immersivo = LAYOUT_PRESETS.find((preset) => preset.id === 'immersivo')
    expect(wiki).toMatchObject({ layout: '', toc: true })
    expect(immersivo).toMatchObject({ layout: 'wide', toc: false })
  })

  it('elenca esattamente i layout ammessi dallo schema delle pagine', () => {
    const schema = JSON.parse(fs.readFileSync(path.join(root, 'content/schemas/page.schema.json'), 'utf8')) as {
      properties: { layout: { enum: string[] } }
    }
    expect([...known].sort()).toEqual([...schema.properties.layout.enum].sort())
  })

  it('riconosce il preset dal layout salvato', () => {
    expect(presetFor('')).toBe('wiki')
    expect(presetFor('wide')).toBe('immersivo')
    expect(presetFor('schede')).toBe('schede')
    expect(presetFor(undefined)).toBe('wiki')
    expect(presetFor('pantheon')).toBeNull()
  })
})
