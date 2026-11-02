import fs from 'node:fs'
import vm from 'node:vm'
import { describe, it, expect } from 'vitest'

describe('Imprese: rules from the supplied document', () => {
  const doc = JSON.parse(fs.readFileSync('content/pages/imprese.json', 'utf8'))

  it('keeps the original app with the four-level rules and complete narrative', () => {
    expect(doc.layout).toBe('imprese')
    expect(doc.explore).toBeUndefined()
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

  it('preserves the original shell and navigation while replacing the rules', () => {
    const nodes = {}
    const node = () => ({ innerHTML: '', style: {}, classList: { add() {}, remove() {} }, scrollIntoView() {}, addEventListener() {}, removeEventListener() {} })
    for (const id of ['tabsRow', 'sidenav', 'content', 'searchRow', 'mobileDrawerNav']) nodes['imp-' + id] = node()
    const document = { getElementById: id => nodes[id] || null }
    const window = { _impresePage: structuredClone(doc) }
    const sandbox = { window, document, console }
    vm.createContext(sandbox)
    vm.runInContext(fs.readFileSync('scripts/js/md-render.js', 'utf8'), sandbox)
    window._mdToHtml = window.mdRender
    vm.runInContext(fs.readFileSync('scripts/js/imprese.js', 'utf8'), sandbox)
    const root = node()
    window._impreseInit(root)
    expect(root.innerHTML).toContain('imp-tabsRow')
    expect(root.innerHTML).toContain('imp-sidenav')
    expect(root.innerHTML).not.toContain('exp-tabbar')
    expect(nodes['imp-tabsRow'].innerHTML).toContain('Licenze & Patenti')
    expect(nodes['imp-content'].innerHTML).toContain('480')
    const select = id => window._impHandle('setSection', { getAttribute: () => id })
    select('livelli')
    expect(nodes['imp-content'].innerHTML).toContain('imp-card-type')
    expect(nodes['imp-content'].innerHTML).toContain('10000')
    select('entrate')
    expect(nodes['imp-content'].innerHTML).toContain('rinegoziare le condizioni')
    select('riferimenti')
    expect(nodes['imp-content'].innerHTML).toContain('100 MO')
    select('procedura')
    expect(nodes['imp-content'].innerHTML).toContain('1660 MO')
  })
})
