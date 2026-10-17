import { describe, expect, it, vi } from 'vitest'

import { createBeforeUnloadHandler, unsavedConfirmOptions } from './guard'

function fakeEvent() {
  return { preventDefault: vi.fn(), returnValue: undefined as unknown } as unknown as BeforeUnloadEvent
}

describe('createBeforeUnloadHandler', () => {
  it('blocca la chiusura quando ci sono modifiche non salvate', () => {
    const handler = createBeforeUnloadHandler(() => true)
    const event = fakeEvent()

    handler(event)

    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect((event as { returnValue: unknown }).returnValue).toBe('')
  })

  it('lascia passare la chiusura quando non c’è nulla di pendente', () => {
    const handler = createBeforeUnloadHandler(() => false)
    const event = fakeEvent()

    handler(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('rivaluta lo stato al momento dell’evento, non alla registrazione', () => {
    let dirty = false
    const handler = createBeforeUnloadHandler(() => dirty)

    const first = fakeEvent()
    handler(first)
    expect(first.preventDefault).not.toHaveBeenCalled()

    dirty = true
    const second = fakeEvent()
    handler(second)
    expect(second.preventDefault).toHaveBeenCalledTimes(1)
  })
})

describe('unsavedConfirmOptions', () => {
  it('descrive l’esito e propone di restare', () => {
    const options = unsavedConfirmOptions('modifiche alla mappa non salvate')

    expect(options.title).toBe('Modifiche non salvate')
    expect(options.message).toContain('modifiche alla mappa non salvate')
    expect(options.confirmLabel).toBe('Esci senza salvare')
    expect(options.cancelLabel).toBe('Resta qui')
    expect(options.danger).toBe(true)
  })
})
