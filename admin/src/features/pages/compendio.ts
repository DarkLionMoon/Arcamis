/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Compendio strutturato (specie e sottoclassi)

   Le pagine `specie-homebrew` e `sottoclassi-homebrew` sono un unico
   markdown diviso in schede `# Nome` separate da `---`. Questo modulo
   le legge e le riscrive senza toccare il corpo delle schede: il testo
   resta la fonte di verità e può contenere tabelle, blocchi statistiche
   e titoli annidati che il form non deve interpretare.

   Il parser è volutamente conservativo: una sezione che non comincia
   con un H1 resta grezza e viene salvata alla lettera. Meglio una card
   non strutturata che una scheda persa.
   ════════════════════════════════════════════════════════════════ */

export type CompendioKind = 'specie' | 'sottoclassi'

export interface CompendioMeta {
  label: 'Tipologia' | 'Classe'
  value: string
}

export interface CompendioCard {
  kind: 'card'
  id: string
  title: string
  body: string
  meta: CompendioMeta | null
}

export interface CompendioRaw {
  kind: 'raw'
  id: string
  raw: string
}

export type CompendioPart = CompendioCard | CompendioRaw

export interface CompendioDoc {
  intro: string
  parts: CompendioPart[]
}

const SEPARATOR = /\n[ \t]*---[ \t]*\n/;
const TITLE = /^#\s+(.+)$/;
const SUBCLASS_META = /^\*Classe:\*\s*(.*)$/m;
const SPECIES_META = /^[-*]\s+\*\*Tipologia:\*\*\s*(.*)$/m;

function readMeta(body: string, kind: CompendioKind): CompendioMeta | null {
  if (kind === 'sottoclassi') {
    const match = body.match(SUBCLASS_META);
    return match ? { label: 'Classe', value: match[1].trim() } : null;
  }
  const match = body.match(SPECIES_META);
  return match ? { label: 'Tipologia', value: match[1].trim() } : null;
}

function splitCard(chunk: string, index: number, kind: CompendioKind): CompendioPart {
  const lines = chunk.split('\n');
  const first = lines.findIndex((line) => line.trim().length > 0);
  const title = first >= 0 ? lines[first].match(TITLE) : null;
  if (!title) return { kind: 'raw', id: `raw-${index}`, raw: chunk.trim() };

  const body = lines
    .slice(first + 1)
    .join('\n')
    .trim();
  const name = title[1].trim();
  return {
    kind: 'card',
    id: `card-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: name,
    body,
    meta: readMeta(body, kind)
  };
}

export function parseCompendio(markdown: string, kind: CompendioKind): CompendioDoc {
  const chunks = String(markdown || '')
    .replace(/\r\n/g, '\n')
    .split(SEPARATOR);
  const intro = (chunks.shift() || '').trim();
  const parts: CompendioPart[] = [];

  chunks.forEach((chunk, index) => {
    const block = chunk.trim();
    if (!block) return;
    parts.push(splitCard(block, index, kind));
  });

  return { intro, parts };
}

export function serializeCard(card: CompendioCard): string {
  const title = card.title.trim() || 'Scheda senza titolo';
  const body = card.body.trim();
  return body ? `# ${title}\n\n${body}` : `# ${title}`;
}

export function serializeCompendio(doc: CompendioDoc): string {
  return [doc.intro.trim(), ...doc.parts.map((part) => (part.kind === 'card' ? serializeCard(part) : part.raw.trim()))]
    .filter(Boolean)
    .join('\n\n---\n\n')
    .trim();
}

export function createCard(kind: CompendioKind, title = 'Nuova scheda', id = `card-new-${Date.now().toString(36)}`): CompendioCard {
  const firstSection = kind === 'sottoclassi' ? 'Descrizione' : 'Dettagli';
  return {
    kind: 'card',
    id,
    title,
    body: `## ${firstSection}\n\n`,
    meta: kind === 'sottoclassi' ? { label: 'Classe', value: '' } : null
  };
}

export function updateCard(
  card: CompendioCard,
  patch: { title?: string; body?: string },
  kind?: CompendioKind
): CompendioCard {
  const next = { ...card, ...patch };
  const effective = kind ?? (card.meta?.label === 'Classe' ? 'sottoclassi' : 'specie');
  return { ...next, meta: readMeta(next.body, effective) };
}

/**
 * Aggiorna la riga di metadato mantenendo la forma letta dal renderer.
 * Se la scheda non ha ancora quella riga viene aggiunta subito sotto il
 * titolo, nel punto in cui il sito la mostra.
 */
export function updateMeta(card: CompendioCard, value: string, kind?: CompendioKind): CompendioCard {
  if (!card.meta) return card;
  const line =
    card.meta.label === 'Classe' ? `*Classe:* ${value.trim()}` : `- **Tipologia:** ${value.trim()}`;
  const pattern = card.meta.label === 'Classe' ? SUBCLASS_META : SPECIES_META;
  const body = pattern.test(card.body) ? card.body.replace(pattern, line) : `${line}\n\n${card.body}`.trim();
  return updateCard(card, { body }, kind);
}

/** Schede raggruppabili per classe (sottoclassi) o tipologia (specie). */
export function cardGroup(card: CompendioCard, kind: CompendioKind): string {
  return card.meta?.value || (kind === 'sottoclassi' ? 'Altre classi' : 'Specie');
}
