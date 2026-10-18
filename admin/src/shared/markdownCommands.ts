/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Comandi markdown

   Funzioni pure su testo + selezione: nessuna dipendenza da CodeMirror.
   Le usano sia la toolbar sia le scorciatoie dell'editor, e i test le
   verificano senza montare nulla.
   ════════════════════════════════════════════════════════════════ */

export interface EditState {
  text: string
  /** Inizio della selezione (offset assoluto). */
  from: number
  /** Fine della selezione (offset assoluto). */
  to: number
}

export interface EditResult {
  text: string
  /** Nuova selezione: il cursore resta sul contenuto appena inserito. */
  from: number
  to: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** `**grassetto**`, `*corsivo*`, `~~barrato~~`, `` `codice` ``. */
export function wrapSelection(state: EditState, marker: string, placeholder = 'testo'): EditResult {
  const { text } = state
  const from = clamp(state.from, 0, text.length)
  const to = clamp(state.to, from, text.length)
  const selected = text.slice(from, to)

  /* Marker subito fuori dalla selezione → togli il formato. */
  const outside = text.slice(from - marker.length, from) === marker && text.slice(to, to + marker.length) === marker
  if (outside) {
    return {
      text: text.slice(0, from - marker.length) + selected + text.slice(to + marker.length),
      from: from - marker.length,
      to: to - marker.length
    }
  }

  /* Marker dentro la selezione → togli il formato. */
  if (selected.length >= marker.length * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(marker.length, selected.length - marker.length)
    return { text: text.slice(0, from) + inner + text.slice(to), from, to: from + inner.length }
  }

  const content = selected || placeholder
  const next = text.slice(0, from) + marker + content + marker + text.slice(to)
  const innerStart = from + marker.length
  return { text: next, from: innerStart, to: innerStart + content.length }
}

/** Prefisso di riga: titoli (`## `), elenchi (`- `), citazioni (`> `). */
export function toggleLinePrefix(state: EditState, prefix: string): EditResult {
  const { text } = state
  const from = clamp(state.from, 0, text.length)
  const to = clamp(state.to, from, text.length)
  const start = text.lastIndexOf('\n', Math.max(0, from - 1)) + 1
  const endOfLine = text.indexOf('\n', to)
  const end = endOfLine === -1 ? text.length : endOfLine
  const block = text.slice(start, end)
  const lines = block.split('\n')
  const filled = lines.filter((line) => line.trim().length > 0)
  const already = filled.length > 0 && filled.every((line) => line.startsWith(prefix))
  /* I titoli si convertono (## → ###), non si impilano. */
  const headingPrefix = /^#{1,6}\s+/
  const isHeading = headingPrefix.test(prefix)

  const nextLines = lines.map((line) => {
    if (!line.trim()) return line
    if (already) return line.slice(prefix.length)
    const base = isHeading ? line.replace(headingPrefix, '') : line
    return prefix + base
  })
  const nextBlock = nextLines.join('\n')
  return {
    text: text.slice(0, start) + nextBlock + text.slice(end),
    from: start,
    to: start + nextBlock.length
  }
}

/** Inserisce `[etichetta](url)` sulla selezione o nel punto del cursore. */
export function insertLink(state: EditState, url: string, label = 'testo'): EditResult {
  const selected = state.text.slice(state.from, state.to)
  const text = selected || label
  const snippet = `[${text}](${url})`
  const next = state.text.slice(0, state.from) + snippet + state.text.slice(state.to)
  const labelStart = state.from + 1
  return { text: next, from: labelStart, to: labelStart + text.length }
}

/** Inserisce `![alt](percorso)` (usato dal Media drawer). */
export function insertImage(state: EditState, path: string, alt = 'immagine'): EditResult {
  const snippet = `![${alt || 'immagine'}](${path})`
  const next = state.text.slice(0, state.from) + snippet + state.text.slice(state.to)
  return { text: next, from: state.from + snippet.length, to: state.from + snippet.length }
}

/** Snippet su righe proprie (tabella, riga orizzontale, blocco codice). */
export function insertSnippet(state: EditState, snippet: string): EditResult {
  const before = state.text.slice(0, state.from)
  const prefix = before.length === 0 ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  const insertion = prefix + snippet + '\n\n'
  const next = state.text.slice(0, state.from) + insertion + state.text.slice(state.to)
  const cursor = state.from + insertion.length
  return { text: next, from: cursor, to: cursor }
}

/** Tabella pronta con intestazioni generiche, sostituibili subito. */
export const TABLE_SNIPPET = '| Colonna | Colonna |\n| --- | --- |\n| Valore | Valore |'
export const CODE_SNIPPET = '```\ncodice\n```'
