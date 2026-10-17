import { createPinia, setActivePinia } from 'pinia'
import { createApp, nextTick, type App } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useUIStore } from '@/app/store'
import ToastHost from './ToastHost.vue'

let host: HTMLElement
let app: App | null = null
let ui: ReturnType<typeof useUIStore>

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(ToastHost)
  app.use(createPinia())
  app.mount(host)
  ui = useUIStore()
}

function toasts(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll('.arc-toast')) as HTMLElement[]
}

beforeEach(() => {
  setActivePinia(createPinia())
  mount()
})

afterEach(() => {
  app?.unmount()
  host.remove()
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('ToastHost', () => {
  it('annuncia gli avvisi in una regione aria-live', () => {
    const region = document.body.querySelector('.arc-toasts')
    expect(region?.getAttribute('aria-live')).toBe('polite')
  })

  it('mostra messaggio, titolo e tipo', async () => {
    ui.toast('Pagina salvata', 'success', { title: 'Salvataggio' })
    await nextTick()

    const [toast] = toasts()
    expect(toast.className).toContain('arc-toast--success')
    expect(toast.textContent).toContain('Pagina salvata')
    expect(toast.textContent).toContain('Salvataggio')
    expect(toast.getAttribute('role')).toBe('status')
  })

  it('marca gli errori come alert', async () => {
    ui.toast('Sessione scaduta', 'error')
    await nextTick()
    expect(toasts()[0].getAttribute('role')).toBe('alert')
  })

  it('chiude l’avviso con il pulsante dedicato', async () => {
    ui.toast('Chiudimi', 'info')
    await nextTick()
    expect(ui.toasts).toHaveLength(1)

    const close = toasts()[0].querySelector('.arc-toast-x') as HTMLButtonElement
    expect(close.getAttribute('aria-label')).toBeTruthy()
    close.click()
    await nextTick()

    /* Lo stato è la fonte di verità: <transition-group> tiene il nodo in
       uscita nel DOM finché la transizione non termina, cosa che in jsdom
       senza CSS non avviene. */
    expect(ui.toasts).toHaveLength(0)
  })

  it('limita il numero di avvisi contemporanei', async () => {
    for (let i = 0; i < 7; i++) ui.toast('avviso ' + i, 'info')
    await nextTick()
    expect(toasts().length).toBeLessThanOrEqual(4)
    expect(ui.toasts[ui.toasts.length - 1].message).toBe('avviso 6')
  })

  it('sospende la chiusura automatica al passaggio del mouse', async () => {
    vi.useFakeTimers()
    ui.toast('Non sparire', 'info', { duration: 1000 })
    await nextTick()

    const toast = toasts()[0]
    toast.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(ui.toasts).toHaveLength(1)

    toast.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(3000)
    await nextTick()
    expect(ui.toasts).toHaveLength(0)
  })
})
