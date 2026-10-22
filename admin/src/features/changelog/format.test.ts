import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { newChangelogId, parseChangelog, serializeChangelog } from './format'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const source = JSON.parse(fs.readFileSync(path.join(root, 'content/changelog.json'), 'utf8')) as unknown

describe('formato changelog', () => {
  it('legge l’array reale del sito con tutte le entry e gli id', () => {
    const entries = parseChangelog(source)
    expect(entries).toHaveLength(10)
    expect(entries.every((entry) => typeof entry.id === 'string' && entry.id.length > 0)).toBe(true)
  })

  it('accetta anche il vecchio wrapper { entries } senza perdere dati', () => {
    const entries = parseChangelog({ entries: source })
    expect(entries).toHaveLength(10)
  })

  it('riscrive un array puro, non { entries }, preservando gli id', () => {
    const entries = parseChangelog(source)
    const saved = JSON.parse(serializeChangelog(entries)) as unknown
    expect(Array.isArray(saved)).toBe(true)
    expect((saved as typeof entries)[0].id).toBe(entries[0].id)
    expect(serializeChangelog(entries).endsWith('\n')).toBe(true)
  })

  it('genera id stabili e non ripetuti per le nuove entry', () => {
    const first = newChangelogId(1000)
    const second = newChangelogId(1000)
    expect(first).toMatch(/^cl-/)
    expect(first).not.toBe(second)
  })
})
