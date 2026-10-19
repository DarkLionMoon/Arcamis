/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — wordDiff.ts
   Diff riga-per-riga con dettaglio a parole per le righe sostituite.
   Usato dal pannello Cronologia per confrontare una versione con il
   testo corrente. Funzioni pure, verificate dai test.
   ════════════════════════════════════════════════════════════════ */

export type DiffKind = 'same' | 'del' | 'add'

export interface DiffLine {
  kind: DiffKind
  text: string
}

/** LCS su sequenze generiche: indici allineati (a→b) delle righe uguali. */
function lcs<T>(a: T[], b: T[], equal: (x: T, y: T) => boolean): Array<[number, number]> {
  const n = a.length
  const m = b.length
  /* Tabella compatta su righe: basta la riga precedente per il punteggio. */
  let prev = new Array<number>(m + 1).fill(0)
  const lens: number[][] = [prev.slice()]
  for (let i = 1; i <= n; i++) {
    const cur = new Array<number>(m + 1).fill(0)
    for (let j = 1; j <= m; j++) {
      cur[j] = equal(a[i - 1], b[j - 1]) ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1])
    }
    lens.push(cur)
    prev = cur
  }
  const pairs: Array<[number, number]> = []
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    if (equal(a[i - 1], b[j - 1])) {
      pairs.unshift([i - 1, j - 1])
      i--
      j--
    } else if (lens[i - 1][j] >= lens[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return pairs
}

function splitWords(line: string): string[] {
  return line.split(/(\s+)/).filter((part) => part.length > 0)
}

/** Evidenziazione inline delle parole cambiate tra due righe. */
export function wordDiffLine(oldLine: string, newLine: string): { oldHtml: string; newHtml: string } {
  const a = splitWords(oldLine)
  const b = splitWords(newLine)
  const pairs = lcs(a, b, (x, y) => x === y)
  const inA = new Set(pairs.map(([i]) => i))
  const inB = new Set(pairs.map(([, j]) => j))
  const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return {
    oldHtml: a.map((w, i) => (inA.has(i) ? esc(w) : `<del>${esc(w)}</del>`)).join(''),
    newHtml: b.map((w, j) => (inB.has(j) ? esc(w) : `<ins>${esc(w)}</ins>`)).join('')
  }
}

/**
 * Confronta due testi markdown. Le righe sostituite a coppie mostrano
 * anche il dettaglio a parole (`oldHtml`/`newHtml`); gli altri casi
 * restano righe intere aggiunte o rimosse.
 */
export interface RichDiffLine extends DiffLine {
  html?: string
}

export function diffLines(oldText: string, newText: string): RichDiffLine[] {
  const a = (oldText || '').split('\n')
  const b = (newText || '').split('\n')
  /* Testi grandi: il diff resta leggibile campionando, non bloccando la UI. */
  const LIMIT = 2000
  const aa = a.length > LIMIT ? a.slice(0, LIMIT) : a
  const bb = b.length > LIMIT ? b.slice(0, LIMIT) : b
  const pairs = lcs(aa, bb, (x, y) => x === y)
  const out: RichDiffLine[] = []
  let i = 0
  let j = 0
  const pushBlock = (del: string[], add: string[]): void => {
    const n = Math.max(del.length, add.length)
    for (let k = 0; k < n; k++) {
      const d = del[k]
      const x = add[k]
      if (d !== undefined && x !== undefined) {
        const rich = wordDiffLine(d, x)
        out.push({ kind: 'del', text: d, html: rich.oldHtml })
        out.push({ kind: 'add', text: x, html: rich.newHtml })
      } else if (d !== undefined) {
        out.push({ kind: 'del', text: d })
      } else if (x !== undefined) {
        out.push({ kind: 'add', text: x })
      }
    }
  }
  for (const [pi, pj] of pairs) {
    pushBlock(aa.slice(i, pi), bb.slice(j, pj))
    out.push({ kind: 'same', text: aa[pi] })
    i = pi + 1
    j = pj + 1
  }
  pushBlock(aa.slice(i), bb.slice(j))
  if (a.length > LIMIT || b.length > LIMIT) {
    out.push({ kind: 'same', text: `… (diff troncato oltre le ${LIMIT} righe)` })
  }
  return out
}

/** Riepilogo numerico per l'intestazione del pannello. */
export function diffStats(lines: RichDiffLine[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const line of lines) {
    if (line.kind === 'add') added++
    else if (line.kind === 'del') removed++
  }
  return { added, removed }
}
