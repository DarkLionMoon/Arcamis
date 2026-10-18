import { describe, expect, it } from 'vitest'

import { HISTORY_LIMIT, canRedo, canUndo, createHistory, record, redo, shouldCoalesce, undo } from './history'

describe('cronologia dell’editor', () => {
  it('parte senza passi da annullare', () => {
    const state = createHistory('a')
    expect(canUndo(state)).toBe(false)
    expect(canRedo(state)).toBe(false)
    expect(state.present).toBe('a')
  })

  it('registra, annulla e ripete', () => {
    let state = createHistory('a')
    state = record(state, 'b')
    state = record(state, 'c')
    expect(state.present).toBe('c')
    expect(canUndo(state)).toBe(true)

    state = undo(state)
    expect(state.present).toBe('b')
    state = undo(state)
    expect(state.present).toBe('a')
    expect(canUndo(state)).toBe(false)

    state = redo(state)
    expect(state.present).toBe('b')
    state = redo(state)
    expect(state.present).toBe('c')
    expect(canRedo(state)).toBe(false)
  })

  it('una nuova modifica azzera il futuro', () => {
    let state = createHistory('a')
    state = record(state, 'b')
    state = undo(state)
    expect(canRedo(state)).toBe(true)
    state = record(state, 'x')
    expect(canRedo(state)).toBe(false)
    expect(state.present).toBe('x')
  })

  it('limita la memoria conservando i passi più recenti', () => {
    let state = createHistory(0)
    for (let i = 1; i <= HISTORY_LIMIT + 5; i++) state = record(state, i)
    expect(state.past).toHaveLength(HISTORY_LIMIT)
    expect(state.past[0]).toBe(5)
    expect(state.present).toBe(HISTORY_LIMIT + 5)
  })

  it('annullare all’inizio non cambia nulla', () => {
    const state = createHistory('a')
    expect(undo(state)).toBe(state)
    expect(redo(state)).toBe(state)
  })

  it('fonde le battiture ravvicinate sullo stesso campo', () => {
    expect(shouldCoalesce('fields.intro', 'fields.intro', 1000, 1400)).toBe(true)
    expect(shouldCoalesce('fields.intro', 'fields.intro', 1000, 2200)).toBe(false)
    expect(shouldCoalesce('fields.intro', 'fields.epoca', 1000, 1100)).toBe(false)
    expect(shouldCoalesce(null, 'fields.intro', 1000, 1100)).toBe(false)
  })
})
