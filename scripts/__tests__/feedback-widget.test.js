import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const widget = fs.readFileSync(path.join(root, 'scripts/js/feedback.js'), 'utf8')
const styles = fs.readFileSync(path.join(root, 'scripts/css/feedback.css'), 'utf8')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

describe('widget feedback pubblico', () => {
  it('è caricato dalla home ed è sintatticamente valido', () => {
    expect(html).toContain('/scripts/js/feedback.js')
    expect(html).toContain('/scripts/css/feedback.css')
    expect(() => new vm.Script(widget)).not.toThrow()
    expect(styles).toContain('.arc-fb-trigger')
    expect(styles).toContain('@media (max-width: 560px)')
  })

  it('espone un dialog accessibile con trigger e chiusura da tastiera', () => {
    expect(widget).toContain("panel.setAttribute('role', 'dialog')")
    expect(widget).toContain("panel.setAttribute('aria-modal', 'true')")
    expect(widget).toContain("trigger.setAttribute('aria-expanded', 'false')")
    expect(widget).toContain("trigger.setAttribute('aria-controls', 'arc-fb-panel')")
    expect(widget).toContain("e.key === 'Escape'")
    expect(widget).toContain("e.key === 'Tab'")
  })

  it('valida il testo, conta i caratteri e gestisce invio, errore e offline', () => {
    expect(widget).toContain("'/api/feedback'")
    expect(widget).toContain('maxlength="1200"')
    expect(widget).toContain('arc-fb-count')
    expect(widget).toContain('navigator.onLine')
    expect(widget).toContain('arc_feedback_queue')
    expect(widget).toContain('localStorage')
    expect(widget).toContain('Riprova')
    expect(widget).toContain('aria-busy')
    expect(widget).toContain('role="status"')
  })
})
