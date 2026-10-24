import { describe, expect, it } from 'vitest'

import {
  assignSection,
  countEntries,
  countTableRows,
  createExplore,
  normalizeExplore,
  sectionTitles,
  suggestedMode,
  toggleSection
} from './explore'

const MARKDOWN = ['Intro', '', '# Alfa', '## Uno', '## Due', '# Beta', '## Tre'].join('\n')

describe('configurazione esplorazione', () => {
  it('crea un master-detail con ricerca e filtri vuoti', () => {
    const config = createExplore('master-detail')
    expect(config.mode).toBe('master-detail')
    expect(config.entryLevel).toBe(1)
    expect(config.search).toBe(true)
    expect(config.filters).toEqual([])
    expect(config.tabs).toEqual([])
    expect(config.groups).toEqual([])
  })

  it('normalizza configurazioni parziali senza perdere il pattern', () => {
    const config = normalizeExplore({ mode: 'drawer', label: 'Divinità', filters: [{ id: 'f', label: 'Fonte' }] })
    expect(config.mode).toBe('drawer')
    expect(config.label).toBe('Divinità')
    expect(config.search).toBe(true)
    expect(config.filters).toHaveLength(1)
    expect(config.tabs).toEqual([])
  })

  it('suggerisce il pattern in base al vecchio layout', () => {
    expect(suggestedMode('pantheon')).toBe('drawer')
    expect(suggestedMode('regole')).toBe('accordion')
    expect(suggestedMode('timeline')).toBe('tabs')
    expect(suggestedMode('compendio')).toBe('master-detail')
  })

  it('elenca i titoli H1 e H2 per l’assegnazione', () => {
    expect(sectionTitles(MARKDOWN)).toEqual([
      { title: 'Alfa', level: 1 },
      { title: 'Uno', level: 2 },
      { title: 'Due', level: 2 },
      { title: 'Beta', level: 1 },
      { title: 'Tre', level: 2 }
    ])
  })

  it('conta le voci del livello configurato', () => {
    expect(countEntries(MARKDOWN, createExplore('master-detail'))).toBe(2)
    expect(countEntries(MARKDOWN, createExplore('tabs'))).toBe(3)
  })

  it('conta le righe della tabella quando la sorgente è la tabella', () => {
    const table = ['Intro', '', '| Voce | Fonte |', '| --- | --- |', '| Alfa | X |', '| Beta | Y |'].join('\n')
    expect(countTableRows(table)).toBe(2)
    expect(countTableRows(MARKDOWN)).toBe(0)
  })

  it('assegna una sezione a un solo gruppo', () => {
    const groups = [
      { id: 'a', label: 'A', sections: ['Uno'] },
      { id: 'b', label: 'B', sections: ['Due'] }
    ]
    expect(assignSection(groups, 'b', 'Uno')).toEqual([
      { id: 'a', label: 'A', sections: [] },
      { id: 'b', label: 'B', sections: ['Due', 'Uno'] }
    ])
  })

  it('aggiunge e rimuove una sezione con il toggle', () => {
    const groups = [{ id: 'a', label: 'A', sections: ['Uno'] }]
    expect(toggleSection(groups, 'a', 'Due')[0].sections).toEqual(['Uno', 'Due'])
    expect(toggleSection(groups, 'a', 'Uno')[0].sections).toEqual([])
  })
})
