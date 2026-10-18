/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — blocchi della pagina

   Il sito legge markdown: i blocchi non sono un formato nuovo, sono una
   vista sopra di esso. `parseBlocks()` riconosce le strutture che i
   renderer della wiki sanno già mostrare; tutto ciò che non riconosce
   finisce in un blocco `raw` con il testo originale, quindi passare da
   markdown a blocchi non può perdere contenuto.

   `serializeBlocks()` produce esattamente la sintassi di
   `scripts/js/md-render.js` (callout, tabelle, immagini, `:::cards`,
   `:::gallery`), così l'anteprima dell'editor e la pagina pubblica
   coincidono.
   ════════════════════════════════════════════════════════════════ */

export type BlockType =
  'heading' | 'paragraph' | 'callout' | 'accordion' | 'cards' | 'gallery' | 'image' | 'table' | 'divider' | 'raw'

export interface BlockCard {
  title: string
  body: string
}

export interface BlockImage {
  src: string
  alt: string
}

export interface BlockTable {
  headers: string[]
  rows: string[][]
}

export interface Block {
  id: string
  type: BlockType
  /** Testo di un titolo/paragrafo, corpo di callout e accordion, markdown grezzo. */
  text: string
  /** Livello dei titoli (1–3). */
  level?: 1 | 2 | 3
  /** Etichetta del callout (NOTE, TIP, WARNING, …). */
  tone?: string
  /** Titolo di callout e accordion. */
  title?: string
  src?: string
  alt?: string
  cards?: BlockCard[]
  images?: BlockImage[]
  table?: BlockTable
}

export const CALLOUT_TONES: Array<{ value: string; label: string }> = [
  { value: 'NOTE', label: 'Nota' },
  { value: 'TIP', label: 'Consiglio' },
  { value: 'WARNING', label: 'Avviso' },
  { value: 'IMPORTANT', label: 'Importante' },
  { value: 'LORE', label: 'Lore' },
  { value: 'QUEST', label: 'Quest' },
  { value: 'SECRET', label: 'Segreto' },
  { value: 'REGOLA', label: 'Regola' },
  { value: 'NPC', label: 'PNG' }
]

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Titolo',
  paragraph: 'Paragrafo',
  callout: 'Callout',
  accordion: 'Accordion / FAQ',
  cards: 'Griglia / Carte',
  gallery: 'Galleria',
  image: 'Immagine',
  table: 'Tabella',
  divider: 'Separatore',
  raw: 'Markdown grezzo'
}

let sequence = 0

/** Tono noto all'editor? Se no, la select lo mostra comunque. */
export function isKnownTone(tone: string | undefined): boolean {
  return CALLOUT_TONES.some((item) => item.value === tone)
}

export function newBlockId(): string {
  sequence += 1
  return 'blk-' + sequence.toString(36) + '-' + Math.random().toString(36).slice(2, 7)
}

function createBlock(type: BlockType): Block {
  const base: Block = { id: newBlockId(), type, text: '' }
  if (type === 'heading') return { ...base, level: 2 }
  if (type === 'callout') return { ...base, tone: 'NOTE', title: '' }
  if (type === 'accordion') return { ...base, tone: 'NOTE', title: '' }
  if (type === 'image') return { ...base, src: '', alt: '' }
  if (type === 'cards') return { ...base, cards: [{ title: '', body: '' }] }
  if (type === 'gallery') return { ...base, images: [{ src: '', alt: '' }] }
  if (type === 'table')
    return {
      ...base,
      table: {
        headers: ['Colonna 1', 'Colonna 2'],
        rows: [['', '']]
      }
    }
  return base
}

/** Blocco vuoto del tipo richiesto, con i valori minimi modificabili. */
export function makeBlock(type: BlockType): Block {
  return createBlock(type)
}

/* ── Riconoscimento delle strutture ─────────────────────────────── */

const FENCE_OPEN = /^:::\s*([a-z]+)\s*$/i
const FENCE_CLOSE = /^:::\s*$/
const HEADING = /^(#{1,3})\s+(.*)$/
const ANY_HEADING = /^#{1,6}\s+/
const HR = /^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/
const QUOTE = /^>\s?/
const CALLOUT = /^>\s?\[!([A-Za-z]+)\]([-+]?)\s*(.*)$/
const LIST = /^\s*(?:[-*+]|\d+[.)])\s+/
const IMAGE_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*$/
const TABLE_SEPARATOR = /^\|?[\s:|-]+\|?$/

function cleanInline(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function splitCells(row: string): string[] {
  return row
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableStart(lines: string[], index: number): boolean {
  const line = lines[index]
  if (!line || line.trim().charAt(0) !== '|') return false
  const next = lines[index + 1]
  return Boolean(next && TABLE_SEPARATOR.test(next.trim()) && next.includes('-'))
}

function startsBlock(lines: string[], index: number): boolean {
  const line = lines[index]
  if (!line.trim()) return true
  if (FENCE_OPEN.test(line) || /^\s*```/.test(line)) return true
  if (ANY_HEADING.test(line)) return true
  if (HR.test(line)) return true
  if (isTableStart(lines, index)) return true
  if (QUOTE.test(line)) return true
  if (LIST.test(line)) return true
  if (IMAGE_ONLY.test(line.trim())) return true
  return false
}

function collectUntilBlank(lines: string[], start: number): { body: string[]; next: number } {
  const body: string[] = []
  let i = start
  while (i < lines.length && lines[i].trim()) {
    body.push(lines[i])
    i += 1
  }
  return { body, next: i }
}

function parseCards(body: string[]): Block | null {
  const cards: BlockCard[] = []
  let current: BlockCard | null = null
  for (const line of body) {
    const heading = /^###\s+(.*)$/.exec(line)
    if (heading) {
      if (current) cards.push(current)
      current = { title: heading[1].trim(), body: '' }
      continue
    }
    if (!current) {
      /* Testo prima della prima carta: non è una griglia, si conserva. */
      if (line.trim()) return null
      continue
    }
    current.body += (current.body ? '\n' : '') + line
  }
  if (current) cards.push(current)
  const filled = cards.filter((card) => card.title || card.body.trim())
  if (!filled.length) return null
  return { ...createBlock('cards'), cards: filled.map((card) => ({ title: card.title, body: card.body.trim() })) }
}

function parseGallery(body: string[]): Block | null {
  const images: BlockImage[] = []
  for (const line of body) {
    if (!line.trim()) continue
    const match = IMAGE_ONLY.exec(line.trim())
    if (!match) return null
    images.push({ alt: match[1].replace(/[\\/]/g, '').trim(), src: match[2] })
  }
  if (!images.length) return null
  return { ...createBlock('gallery'), images }
}

function parseFence(kind: string, body: string[]): Block {
  if (kind === 'cards') return parseCards(body) ?? { ...createBlock('raw'), text: fenceText('cards', body) }
  if (kind === 'gallery') return parseGallery(body) ?? { ...createBlock('raw'), text: fenceText('gallery', body) }
  return { ...createBlock('raw'), text: fenceText(kind, body) }
}

function fenceText(kind: string, body: string[]): string {
  return [':::' + kind, ...body, ':::'].join('\n')
}

/* ── Markdown → blocchi ─────────────────────────────────────────── */

export function parseBlocks(markdown: string): Block[] {
  const lines = (markdown || '').replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i += 1
      continue
    }

    const fence = FENCE_OPEN.exec(line)
    if (fence) {
      const body: string[] = []
      let j = i + 1
      while (j < lines.length && !FENCE_CLOSE.test(lines[j])) {
        body.push(lines[j])
        j += 1
      }
      blocks.push(parseFence(fence[1].toLowerCase(), body))
      i = j < lines.length ? j + 1 : j
      continue
    }

    if (/^\s*```/.test(line)) {
      const body = [line]
      let j = i + 1
      while (j < lines.length) {
        body.push(lines[j])
        if (/^\s*```\s*$/.test(lines[j])) {
          j += 1
          break
        }
        j += 1
      }
      blocks.push({ ...createBlock('raw'), text: body.join('\n') })
      i = j
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({
        ...createBlock('heading'),
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim()
      })
      i += 1
      continue
    }

    if (ANY_HEADING.test(line)) {
      /* H4–H6: fuori dai blocchi previsti, si conserva il testo. */
      const { body, next } = collectUntilBlank(lines, i)
      blocks.push({ ...createBlock('raw'), text: body.join('\n') })
      i = next
      continue
    }

    if (HR.test(line)) {
      blocks.push(createBlock('divider'))
      i += 1
      continue
    }

    if (isTableStart(lines, i)) {
      const rows: string[][] = []
      let j = i
      while (j < lines.length && lines[j].trim().charAt(0) === '|') {
        rows.push(splitCells(lines[j]))
        j += 1
      }
      const headers = rows[0] || []
      const dataRows = rows.slice(2).map((row) => {
        const next = row.slice(0, headers.length)
        while (next.length < headers.length) next.push('')
        return next
      })
      blocks.push({ ...createBlock('table'), table: { headers, rows: dataRows } })
      i = j
      continue
    }

    const callout = CALLOUT.exec(line)
    if (callout) {
      const body: string[] = []
      let j = i + 1
      while (j < lines.length && QUOTE.test(lines[j])) {
        body.push(lines[j].replace(/^>\s?/, ''))
        j += 1
      }
      const fold = callout[2] === '-'
      const tone = callout[1].toUpperCase()
      blocks.push({
        ...createBlock(fold ? 'accordion' : 'callout'),
        /* Il tono si conserva anche se non è nel menu: normalizzarlo
           cambierebbe il markdown al solo aprire i blocchi. */
        tone,
        title: cleanInline(callout[3]),
        text: body.join('\n').trim()
      })
      i = j
      continue
    }

    if (QUOTE.test(line)) {
      const { body, next } = collectUntilBlank(lines, i)
      blocks.push({ ...createBlock('raw'), text: body.join('\n') })
      i = next
      continue
    }

    const image = IMAGE_ONLY.exec(line.trim())
    if (image) {
      blocks.push({ ...createBlock('image'), src: image[2], alt: image[1].trim() })
      i += 1
      continue
    }

    if (LIST.test(line)) {
      /* Elenchi: restano markdown, preservati così come sono. */
      const { body, next } = collectUntilBlank(lines, i)
      blocks.push({ ...createBlock('raw'), text: body.join('\n') })
      i = next
      continue
    }

    /* Paragrafo: righe consecutive fino a un'altra struttura. */
    const body = [line]
    let j = i + 1
    while (j < lines.length && !startsBlock(lines, j)) {
      body.push(lines[j])
      j += 1
    }
    blocks.push({ ...createBlock('paragraph'), text: body.join('\n').trim() })
    i = j
  }

  return blocks
}

/* ── Blocchi → markdown ─────────────────────────────────────────── */

function quoteBody(text: string): string {
  return text
    .split('\n')
    .map((line) => (line.trim() ? '> ' + line : '>'))
    .join('\n')
}

function safeCell(value: string): string {
  return value
    .replace(/\|/g, '/')
    .replace(/\s*\n\s*/g, ' ')
    .trim()
}

export function serializeBlock(block: Block): string {
  switch (block.type) {
    case 'heading': {
      const text = block.text.trim()
      return text ? '#'.repeat(block.level || 2) + ' ' + text : ''
    }
    case 'paragraph':
      return block.text.trim()
    case 'divider':
      return '---'
    case 'callout': {
      const title = block.title?.trim() || ''
      const tone = block.tone || 'NOTE'
      const body = block.text.trim()
      if (!title && !body) return ''
      const head = '> [!' + tone + ']' + (title ? ' ' + title : '')
      return body ? head + '\n' + quoteBody(body) : head
    }
    case 'accordion': {
      const title = block.title?.trim() || ''
      const body = block.text.trim()
      if (!title && !body) return ''
      const head = '> [!' + (block.tone || 'NOTE') + ']-' + (title ? ' ' + title : '')
      return body ? head + '\n' + quoteBody(body) : head
    }
    case 'image': {
      const src = block.src?.trim() || ''
      if (!src) return ''
      return '![' + (block.alt || '').replace(/[[\]]/g, '') + '](' + src + ')'
    }
    case 'gallery': {
      const images = (block.images || []).filter((image) => image.src.trim())
      if (!images.length) return ''
      return [
        ':::gallery',
        ...images.map((image) => '![' + (image.alt || '').replace(/[[\]]/g, '') + '](' + image.src.trim() + ')'),
        ':::'
      ].join('\n')
    }
    case 'cards': {
      const cards = (block.cards || []).filter((card) => card.title.trim() || card.body.trim())
      if (!cards.length) return ''
      const parts = cards.map((card) => {
        const head = '### ' + (card.title.trim() || 'Senza titolo')
        const body = card.body.trim()
        return body ? head + '\n' + body : head
      })
      return [':::cards', parts.join('\n\n'), ':::'].join('\n')
    }
    case 'table': {
      const table = block.table
      if (!table || !table.headers.length) return ''
      const headers = table.headers.map(safeCell)
      const separator = headers.map(() => '---')
      const rows = table.rows.map((row) => headers.map((_, index) => safeCell(row[index] || '')).join(' | '))
      return [
        '| ' + headers.join(' | ') + ' |',
        '| ' + separator.join(' | ') + ' |',
        ...rows.map((row) => '| ' + row + ' |')
      ].join('\n')
    }
    case 'raw':
    default:
      return block.text.trim()
  }
}

export function serializeBlocks(blocks: Block[]): string {
  return blocks
    .map((block) => serializeBlock(block))
    .filter((text) => text.length > 0)
    .join('\n\n')
}

/* ── Diagnostica per l'editor ───────────────────────────────────── */

/** Problemi non bloccanti: l'editor li mostra sulla card del blocco. */
export function blockIssues(block: Block): string[] {
  const issues: string[] = []
  switch (block.type) {
    case 'heading':
      if (!block.text.trim()) issues.push('Titolo vuoto')
      break
    case 'paragraph':
      if (!block.text.trim()) issues.push('Paragrafo vuoto')
      break
    case 'callout':
    case 'accordion':
      if (!block.title?.trim() && !block.text.trim()) issues.push('Blocco vuoto')
      break
    case 'image':
      if (!block.src?.trim()) issues.push('Immagine senza file')
      break
    case 'gallery':
      if (!(block.images || []).some((image) => image.src.trim())) issues.push('Galleria senza immagini')
      break
    case 'cards':
      if (!(block.cards || []).some((card) => card.title.trim() || card.body.trim())) issues.push('Nessuna carta')
      else if ((block.cards || []).some((card) => !card.title.trim())) issues.push('Carta senza titolo')
      break
    case 'table':
      if (!block.table?.headers.length) issues.push('Tabella senza colonne')
      break
    default:
      break
  }
  return issues
}
