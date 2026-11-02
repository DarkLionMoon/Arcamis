import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { afterEach, describe, expect, it } from 'vitest'

describe('ricerca nel nuovo testo con la grafica originale di Imprese', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('mantiene visibili accordi commerciali e costo delle spedizioni cercati nel testo', () => {
    const root = path.resolve(process.cwd(), '..')
    const page = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/imprese.json'), 'utf8'))
    const sandbox = { window: { _impresePage: page } as Record<string, any>, document, console }
    vm.createContext(sandbox)
    for (const file of ['md-render.js', 'imprese.js']) {
      vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js', file), 'utf8'), sandbox)
    }
    sandbox.window._mdToHtml = sandbox.window.mdRender
    const host = document.createElement('div')
    document.body.appendChild(host)
    sandbox.window._impreseInit(host)
    for (const [section, query] of [
      ['entrate', 'accordi'],
      ['riferimenti', '100 MO']
    ]) {
      sandbox.window._impHandle('setSection', { getAttribute: () => section })
      expect(sandbox.window._impSearch(query)).toBeGreaterThan(0)
      expect(host.querySelector('.imp-doc-section')?.classList.contains('imp-hide')).toBe(false)
    }
    sandbox.window._impreseDestroy()
  })
})
