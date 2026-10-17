/* Monta davvero la modale in jsdom (senza @vue/test-utils, si usa
   createApp) e verifica il comportamento che conta: la parola chiave
   sblocca la conferma, Esc annulla, Annulla risolve false. */
import { createApp, nextTick, type App } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { confirmAction, confirmState } from '../confirm'
import ConfirmHost from './ConfirmHost.vue'

let host: HTMLElement
let app: App | null = null

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(ConfirmHost)
  app.mount(host)
}

function modal(): HTMLElement | null {
  return document.body.querySelector('.arc-modal')
}

function buttonByText(text: string): HTMLButtonElement {
  const buttons = Array.from(document.body.querySelectorAll('.arc-modal-actions button')) as HTMLButtonElement[]
  const found = buttons.find((b) => b.textContent?.trim() === text)
  if (!found) throw new Error('bottone non trovato: ' + text)
  return found
}

async function type(value: string) {
  const input = document.body.querySelector('.arc-modal-keyword input') as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input'))
  await nextTick()
}

beforeEach(() => {
  mount()
})

afterEach(() => {
  app?.unmount()
  host.remove()
  document.body.innerHTML = ''
  if (confirmState.value) void confirmState.value.resolve(false)
})

describe('ConfirmHost', () => {
  it('non mostra nulla senza richieste attive', () => {
    expect(modal()).toBeNull()
  })

  it('mostra il messaggio e risolve true con Conferma', async () => {
    const pending = confirmAction({ title: 'Elimina', message: 'Eliminare la pagina?' })
    await nextTick()

    expect(modal()?.textContent).toContain('Eliminare la pagina?')
    buttonByText('Conferma').click()

    await expect(pending).resolves.toBe(true)
  })

  it('annulla con il pulsante e con Esc', async () => {
    const first = confirmAction('Sicuro?')
    await nextTick()
    buttonByText('Annulla').click()
    await expect(first).resolves.toBe(false)

    const second = confirmAction('Ancora?')
    await nextTick()
    const backdrop = document.body.querySelector('.arc-modal-backdrop') as HTMLElement
    backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await expect(second).resolves.toBe(false)
  })

  it('blocca la conferma finché la parola chiave non è digitata', async () => {
    const pending = confirmAction({
      message: 'Eliminare definitivamente?',
      keyword: 'SVUOTA',
      danger: true,
      confirmLabel: 'Svuota cestino'
    })
    await nextTick()

    const confirmBtn = buttonByText('Svuota cestino')
    expect(confirmBtn.disabled).toBe(true)

    await type('svuota')
    expect(confirmBtn.disabled).toBe(true)

    await type('SVUOTA')
    expect(confirmBtn.disabled).toBe(false)

    confirmBtn.click()
    await expect(pending).resolves.toBe(true)
  })

  it('usa la conferma senza parola chiave subito disponibile', async () => {
    const pending = confirmAction({ message: 'Eliminare?' })
    await nextTick()
    expect(buttonByText('Conferma').disabled).toBe(false)
    buttonByText('Conferma').click()
    await pending
  })

  it('si chiude cliccando fuori dalla modale', async () => {
    const pending = confirmAction('Sicuro?')
    await nextTick()
    const backdrop = document.body.querySelector('.arc-modal-backdrop') as HTMLElement
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await expect(pending).resolves.toBe(false)
  })
})
