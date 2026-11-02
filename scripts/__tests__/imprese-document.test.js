import fs from 'node:fs'
import vm from 'node:vm'
import { describe, it, expect } from 'vitest'

describe('Imprese: rules from the supplied document', () => {
  const doc = JSON.parse(fs.readFileSync('content/pages/imprese.json', 'utf8'))

  it('replaces the legacy app with the four-level rules and complete narrative', () => {
    expect(doc.layout).not.toBe('imprese')
    expect(doc.content).toContain('Bottega Artigiana')
    expect(doc.content).toContain('480 MO')
    expect(doc.content).toContain('650 MO')
    expect(doc.content).toContain('2000 MO')
    expect(doc.content).toContain('10000 MO')
    expect(doc.content).toContain('50 MO | 150 MO | 250 MO | 500 MO')
    expect(doc.content).toContain('Premi di RolePlay')
    expect(doc.content).toContain('680 MO')
    expect(doc.content).toContain('COMPAGNIE DI SERVIZIO')
    for (let level = 1; level <= 4; level++) {
      expect(doc.content).toContain('### Livello ' + level + ' — ')
    }
  })

  it('assigns every section to an accessible tab without dropping the source text', () => {
    const window = { location: { hash: '', pathname: '/imprese', search: '' } }
    vm.runInNewContext(fs.readFileSync('scripts/js/explorer.js', 'utf8'), { window })
    const built = window.ArcExplorer.build(doc.content, doc.explore, { pageKey: 'imprese' })
    expect(built.mode).toBe('tabs')
    expect(built.defs.map(tab => tab.label)).toEqual(['Fondazione', 'Patenti', 'Livelli', 'Fondo cassa', 'Premi e spedizioni', 'Esempi'])
    const sections = Object.values(built.byTab).flat()
    expect(sections.length).toBe(9)
    expect(sections.some(s => s.body.includes('rinegoziare le condizioni'))).toBe(true)
    expect(sections.some(s => s.body.includes('100 MO'))).toBe(true)
  })
})
