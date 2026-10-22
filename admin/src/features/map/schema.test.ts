import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { mapDataError, parseMapData } from './schema'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const realMap = JSON.parse(fs.readFileSync(path.join(root, 'content/mappins.json'), 'utf8')) as {
  mapImage: string
  pins: Array<Record<string, unknown>>
}

describe('schema mappa', () => {
  it('accetta i 12 pin reali del repository', () => {
    expect(mapDataError(realMap)).toBeNull()
    const parsed = parseMapData(realMap)
    expect(parsed.pins).toHaveLength(12)
    expect(parsed.pins[0].left).toMatch(/%$/)
  })

  it('rifiuta coordinate fuori range o non percentuali', () => {
    const invalid = {
      ...realMap,
      pins: [{ ...realMap.pins[0], left: '120%' }]
    }
    expect(mapDataError(invalid)).toContain('percentuale non valida')
  })

  it('rifiuta tipi e campi sconosciuti', () => {
    expect(mapDataError({ ...realMap, pins: [{ ...realMap.pins[0], type: 'castle' }] })).toContain('Invalid enum value')
    expect(mapDataError({ ...realMap, pins: [{ ...realMap.pins[0], extra: true }] })).toContain('Unrecognized key')
  })

  it('rifiuta id duplicati', () => {
    const pin = realMap.pins[0]
    const invalid = { ...realMap, pins: [pin, { ...pin }] }
    expect(mapDataError(invalid)).toContain('id ripetuto')
  })
})
