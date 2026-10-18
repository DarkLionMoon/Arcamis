/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Cronologia locale (undo/redo)

   Il testo markdown ha la cronologia di CodeMirror; i dati strutturati
   hanno questa: uno stack di impronte immutabili. Il limite evita di
   trattenere in memoria l'intero pantheon a ogni battitura.
   ════════════════════════════════════════════════════════════════ */

export interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export const HISTORY_LIMIT = 60

export function createHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [] }
}

/** Registra un nuovo stato (azzera il futuro, come ogni editor). */
export function record<T>(state: HistoryState<T>, next: T, limit = HISTORY_LIMIT): HistoryState<T> {
  const past = [...state.past, state.present]
  return {
    past: past.length > limit ? past.slice(past.length - limit) : past,
    present: next,
    future: []
  }
}

export function undo<T>(state: HistoryState<T>): HistoryState<T> {
  if (!state.past.length) return state
  const previous = state.past[state.past.length - 1]
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future]
  }
}

export function redo<T>(state: HistoryState<T>): HistoryState<T> {
  if (!state.future.length) return state
  const [next, ...rest] = state.future
  return {
    past: [...state.past, state.present],
    present: next,
    future: rest
  }
}

export function canUndo<T>(state: HistoryState<T>): boolean {
  return state.past.length > 0
}

export function canRedo<T>(state: HistoryState<T>): boolean {
  return state.future.length > 0
}

/** Le battiture ravvicinate sullo stesso campo sono un solo passo di undo. */
export function shouldCoalesce(lastPath: string | null, path: string, lastAt: number, now: number): boolean {
  return lastPath === path && now - lastAt < 700
}
