import { describe, expect, it } from 'vitest'

import { confirmAction, confirmDanger, confirmState, resolveConfirm } from './confirm'

describe('confirmAction', () => {
  it('risolve true quando l’utente conferma', async () => {
    const pending = confirmAction({ message: 'Eliminare?' })
    expect(confirmState.value?.message).toBe('Eliminare?')
    resolveConfirm(true)
    await expect(pending).resolves.toBe(true)
    expect(confirmState.value).toBeNull()
  })

  it('risolve false quando l’utente annulla', async () => {
    const pending = confirmAction('Sicuro?')
    resolveConfirm(false)
    await expect(pending).resolves.toBe(false)
  })

  it('accetta una stringa come messaggio minimo', async () => {
    const pending = confirmAction('Sicuro?')
    expect(confirmState.value?.message).toBe('Sicuro?')
    resolveConfirm(false)
    await pending
  })

  it('annulla la conferma precedente quando ne arriva una nuova', async () => {
    const first = confirmAction({ message: 'prima' })
    const second = confirmAction({ message: 'seconda' })

    await expect(first).resolves.toBe(false)
    expect(confirmState.value?.message).toBe('seconda')

    resolveConfirm(true)
    await expect(second).resolves.toBe(true)
  })

  it('espone un id diverso per ogni richiesta', () => {
    void confirmAction({ message: 'a' })
    const firstId = confirmState.value?.id
    void confirmAction({ message: 'b' })
    expect(confirmState.value?.id).not.toBe(firstId)
    resolveConfirm(false)
  })
})

describe('confirmDanger', () => {
  it('imposta la parola chiave e il tono di pericolo', async () => {
    const pending = confirmDanger('Svuota cestino', 'Svuotare?', 'SVUOTA', 'dettaglio')
    expect(confirmState.value).toMatchObject({
      danger: true,
      keyword: 'SVUOTA',
      title: 'Svuota cestino',
      detail: 'dettaglio',
      confirmLabel: 'Elimina definitivamente'
    })
    resolveConfirm(false)
    await pending
  })
})
