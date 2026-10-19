import { describe, expect, it } from 'vitest'

import { diffLines, diffStats, wordDiffLine } from './wordDiff'

describe('wordDiffLine', () => {
  it('evidenzia solo le parole cambiate', () => {
    const { oldHtml, newHtml } = wordDiffLine('Il drago è rosso', 'Il drago è blu')
    expect(oldHtml).toContain('<del>rosso</del>')
    expect(newHtml).toContain('<ins>blu</ins>')
    expect(newHtml).toContain('drago')
    expect(newHtml).not.toContain('<ins>drago</ins>')
  })

  it('righe identiche senza evidenziazioni', () => {
    const { oldHtml, newHtml } = wordDiffLine('stessa riga', 'stessa riga')
    expect(oldHtml).not.toContain('<del>')
    expect(newHtml).not.toContain('<ins>')
  })

  it('fa escape HTML', () => {
    const { newHtml } = wordDiffLine('a', '<b>bold</b>')
    expect(newHtml).toContain('&lt;b&gt;')
    expect(newHtml).not.toContain('<b>bold</b>')
  })
})

describe('diffLines', () => {
  it('righe uguali restano same', () => {
    const lines = diffLines('a\nb\nc', 'a\nb\nc')
    expect(lines.every((l) => l.kind === 'same')).toBe(true)
  })

  it('accoppia righe sostituite con dettaglio a parole', () => {
    const lines = diffLines('ciao mondo', 'ciao luna')
    expect(lines.map((l) => l.kind)).toEqual(['del', 'add'])
    expect(lines[0].html).toContain('<del>mondo</del>')
    expect(lines[1].html).toContain('<ins>luna</ins>')
  })

  it('gestisce aggiunte e rimozioni pure', () => {
    const lines = diffLines('a\nb', 'a\nx\nb\ny')
    const kinds = lines.map((l) => l.kind)
    expect(kinds).toEqual(['same', 'add', 'same', 'add'])
  })

  it('testi vuoti senza crash', () => {
    expect(diffLines('', '')).toEqual([{ kind: 'same', text: '' }])
  })
})

describe('diffStats', () => {
  it('conta aggiunte e rimozioni', () => {
    const lines = diffLines('a\nb\nc', 'a\nx\nc\nd')
    expect(diffStats(lines)).toEqual({ added: 2, removed: 1 })
  })
})
