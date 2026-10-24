/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Configurazione dell'esplorazione

   Un solo modello per i cinque pattern pubblici. Il markdown della
   pagina resta la fonte delle voci; qui si decide come leggerlo e
   disporlo (sezioni, tab, gruppi, filtri) senza toccare il codice.
   ════════════════════════════════════════════════════════════════ */

import type { ExploreConfig, ExploreFilter, ExploreGroup, ExploreMode } from '@/types'

export interface ExploreModeOption {
  value: ExploreMode
  label: string
  description: string
  icon: string
}

export const EXPLORE_MODES: ExploreModeOption[] = [
  {
    value: 'master-detail',
    label: 'Master-detail',
    description: 'Elenco ricercabile a sinistra, scheda unica a destra.',
    icon: '▥'
  },
  {
    value: 'group-tabs',
    label: 'Gruppi + schede',
    description: 'Gruppi a sinistra, voci del gruppo come schede orizzontali.',
    icon: '⊞'
  },
  {
    value: 'tabs',
    label: 'Schede + indice',
    description: 'Tab orizzontali e indice sticky con evidenziazione.',
    icon: '☰'
  },
  {
    value: 'drawer',
    label: 'Griglia + cassetto',
    description: 'Tessere del catalogo e dettaglio in un drawer laterale.',
    icon: '▤'
  },
  {
    value: 'accordion',
    label: 'Accordion',
    description: 'Macro-categorie e regole richiudibili.',
    icon: '⌄'
  }
]

const MODE_DEFAULTS: Record<ExploreMode, Partial<ExploreConfig>> = {
  'master-detail': {
    entryLevel: 1,
    label: 'Scheda',
    plural: 'schede',
    search: true,
    detailStyle: 'markdown',
    showHero: true
  },
  'group-tabs': {
    entryLevel: 1,
    label: 'Scheda',
    plural: 'schede',
    search: true,
    detailStyle: 'markdown',
    showHero: true
  },
  tabs: {
    entryLevel: 2,
    label: 'Sezione',
    plural: 'sezioni',
    search: false,
    showHero: false
  },
  drawer: {
    entryLevel: 1,
    label: 'Voce',
    plural: 'voci',
    search: true,
    showHero: true
  },
  accordion: {
    entryLevel: 2,
    label: 'Regola',
    plural: 'regole',
    search: true,
    showHero: false
  }
}

export function createExplore(mode: ExploreMode): ExploreConfig {
  return {
    mode,
    ...MODE_DEFAULTS[mode],
    filters: [],
    tabs: [],
    groups: []
  }
}

export function normalizeExplore(
  config: ExploreConfig | undefined,
  fallback: ExploreMode = 'master-detail'
): ExploreConfig {
  const mode = config?.mode && EXPLORE_MODES.some((option) => option.value === config.mode) ? config.mode : fallback
  return {
    ...MODE_DEFAULTS[mode],
    ...(config || {}),
    mode,
    filters: Array.isArray(config?.filters) ? config.filters : [],
    tabs: Array.isArray(config?.tabs) ? config.tabs : [],
    groups: Array.isArray(config?.groups) ? config.groups : []
  }
}

/** Pattern suggerito dal vecchio layout, per non ripartire da zero. */
export function suggestedMode(layout: string | undefined): ExploreMode {
  switch (layout) {
    case 'pantheon':
    case 'collezione':
      return 'drawer'
    case 'regole':
    case 'contenuto':
      return 'accordion'
    case 'timeline':
    case 'cronache':
    case 'lore':
    case 'wide':
      return 'tabs'
    case 'compendio':
    case 'materiale':
    case 'bestiario':
    case 'oggetti':
    case 'fazioni':
    case 'tabelle':
      return 'master-detail'
    default:
      return 'master-detail'
  }
}

export interface HeadingOption {
  title: string
  level: number
}

/** Titoli disponibili per assegnare sezioni a tab/gruppi. */
export function sectionTitles(markdown: string): HeadingOption[] {
  return String(markdown || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({ title: match[2].trim(), level: match[1].length }))
    .filter((heading) => heading.level <= 2)
}

export function newFilter(index: number): ExploreFilter {
  return { id: `filtro-${index + 1}`, label: 'Nuovo filtro', field: '' }
}

export function newGroup(index: number, prefix = 'Gruppo'): ExploreGroup {
  return { id: `gruppo-${index + 1}`, label: `${prefix} ${index + 1}`, sections: [] }
}

/** Assegna una sezione a un solo gruppo (tab o accordion). */
export function assignSection(groups: ExploreGroup[], groupId: string, title: string): ExploreGroup[] {
  return groups.map((group) => {
    const without = group.sections.filter((section) => section !== title)
    return group.id === groupId ? { ...group, sections: [...without, title] } : { ...group, sections: without }
  })
}

export function toggleSection(groups: ExploreGroup[], groupId: string, title: string): ExploreGroup[] {
  const target = groups.find((group) => group.id === groupId)
  if (target?.sections.includes(title)) {
    return groups.map((group) =>
      group.id === groupId ? { ...group, sections: group.sections.filter((section) => section !== title) } : group
    )
  }
  return assignSection(groups, groupId, title)
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** Conta le voci che il sito mostrerà con questa configurazione. */
export function countEntries(markdown: string, config: ExploreConfig): number {
  const titles = sectionTitles(markdown)
  const level = config.entryLevel || (config.mode === 'tabs' || config.mode === 'accordion' ? 2 : 1)
  return titles.filter((heading) => heading.level === level).length
}

/** Righe della prima tabella: le voci lette con `source: 'table'`. */
export function countTableRows(markdown: string): number {
  const lines = String(markdown || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
  const start = lines.findIndex((line) => /^\s*\|/.test(line))
  if (start < 0) return 0
  let end = start
  while (end + 1 < lines.length && /^\s*\|/.test(lines[end + 1])) end++
  return Math.max(0, end - start - 1)
}
