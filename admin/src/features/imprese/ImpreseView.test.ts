import { createApp, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ImpreseView from './ImpreseView.vue'

vi.mock('@/shared/api', () => ({
  pagesApi: {
    get: vi.fn(async () => ({
      k: 'imprese',
      title: 'Imprese e Licenze',
      icon: '⚖️',
      layout: '',
      content: '## Patenti\n\nLe nuove regole.',
      lastModified: '2026-11-03T00:00:00Z',
      data: { livelli: [{ name: 'Vecchia Bottega', fee: 75 }] }
    }))
  },
  errorText: String
}))
vi.mock('@/app/store', () => ({ useUIStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/shared/guard', () => ({ useUnsavedGuard: vi.fn() }))
vi.mock('@/shared/confirm', () => ({ confirmAction: vi.fn() }))

describe('Imprese narrative edition', () => {
  let app: ReturnType<typeof createApp> | undefined
  afterEach(() => {
    app?.unmount()
    document.body.innerHTML = ''
  })

  it('directs editors to the current rules without showing obsolete structured data', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(ImpreseView)
    app.mount(host)
    await nextTick()
    await vi.waitFor(() => expect(host.textContent).toContain('Modifica le regole di Imprese'))
    expect(host.querySelector('a[href="#/editor/imprese"]')).not.toBeNull()
    expect(host.textContent).not.toContain('Vecchia Bottega')
    expect(host.textContent).not.toContain('Nuova voce')
  })
})
