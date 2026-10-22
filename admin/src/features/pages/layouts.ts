/* Layout resi da notion-nav.js. La lista è la stessa di
   content/schemas/page.schema.json: tenerla qui evita un select libero
   che accetterebbe valori che il sito non sa rendere. */

export const LAYOUT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Standard (markdown)' },
  { value: 'contenuto', label: 'Contenuto' },
  { value: 'regole', label: 'Regolamento' },
  { value: 'lore', label: 'Lore' },
  { value: 'luoghi', label: 'Luoghi' },
  { value: 'pantheon', label: 'Pantheon' },
  { value: 'lavoro', label: 'Mestiere / Lavoro' },
  { value: 'personaggio', label: 'Personaggio' },
  { value: 'bestiario', label: 'Bestiario' },
  { value: 'oggetti', label: 'Oggetti' },
  { value: 'fazioni', label: 'Fazioni' },
  { value: 'materiale', label: 'Materiale' },
  { value: 'collezione', label: 'Collezione' },
  { value: 'compendio', label: 'Compendio (sidebar + schede)' },
  { value: 'generico', label: 'Generico' },
  { value: 'wide', label: 'Largo' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'cronache', label: 'Cronache' },
  { value: 'glossario', label: 'Glossario' },
  { value: 'galleria', label: 'Galleria' },
  { value: 'tabelle', label: 'Tabelle' },
  { value: 'schede', label: 'Schede / griglia' },
  { value: 'sessione', label: 'Sessione' },
  { value: 'quest', label: 'Quest' },
  { value: 'npc', label: 'NPC' },
  { value: 'spell', label: 'Incantesimo' },
  { value: 'specie', label: 'Specie' },
  { value: 'citta', label: 'Città' },
  { value: 'evento', label: 'Evento' },
  { value: 'imprese', label: 'Imprese' }
]

/* ── Preset di layout ─────────────────────────────────────────────
   La scelta rapida all'inizio della configurazione pagina. Ogni preset
   è una combinazione di valori che il sito sa già rendere: nessun
   layout "magico" lato client, solo `layout` + indice dei titoli. */

export interface LayoutPreset {
  id: 'wiki' | 'immersivo' | 'schede'
  label: string
  description: string
  icon: string
  layout: string
  toc: boolean
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'wiki',
    label: 'Wiki standard',
    description: 'Larghezza di lettura, indice dei titoli e navigazione laterale.',
    icon: '📖',
    layout: '',
    toc: true
  },
  {
    id: 'immersivo',
    label: 'Immersivo / full width',
    description: 'Contenuto a tutta larghezza, senza indice: mappe, imprese, landing.',
    icon: '🖼️',
    layout: 'wide',
    toc: false
  },
  {
    id: 'schede',
    label: 'Schede / griglia',
    description: 'Ogni sezione ## diventa una card in griglia: archivi e indici.',
    icon: '🗂️',
    layout: 'schede',
    toc: false
  }
]

/** Preset che corrisponde al layout attuale (null se è un layout avanzato). */
export function presetFor(layout: string | undefined): string | null {
  const current = layout || ''
  const preset = LAYOUT_PRESETS.find((candidate) => candidate.layout === current)
  return preset ? preset.id : null
}
