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
  { value: 'generico', label: 'Generico' },
  { value: 'wide', label: 'Largo' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'cronache', label: 'Cronache' },
  { value: 'glossario', label: 'Glossario' },
  { value: 'galleria', label: 'Galleria' },
  { value: 'tabelle', label: 'Tabelle' },
  { value: 'sessione', label: 'Sessione' },
  { value: 'quest', label: 'Quest' },
  { value: 'npc', label: 'NPC' },
  { value: 'spell', label: 'Incantesimo' },
  { value: 'specie', label: 'Specie' },
  { value: 'citta', label: 'Città' },
  { value: 'evento', label: 'Evento' },
  { value: 'imprese', label: 'Imprese' }
]
