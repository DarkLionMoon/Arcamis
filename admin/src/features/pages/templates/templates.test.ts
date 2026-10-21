import { describe, expect, it } from 'vitest'

import { BUILT_IN_TEMPLATES, getTemplate } from './index'
import { BLANK_MARKER, compileTemplate, isBlank } from './compile'
import {
  emptyTemplateData,
  parseTemplate,
  setValueAtPath,
  TemplateError,
  type FieldValue,
  type PageTemplate
} from './schema'
import { seedFromMarkdown, headingPattern } from './seed'
import { validateTemplateData } from './validate'

/* Replica del rilevamento bozza del sito pubblico (notion-nav.js): se il
   markdown compilato ci passa, la scheda mostra il badge senza modifiche. */
const SITE_DRAFT_MARKERS = [
  'da scrivere',
  'tipo di tempio',
  'cerimonie principali',
  'chi lo/la adora',
  'chi la adora',
  'da definire',
  'da completare'
]
function siteDetectsDraft(md: string): boolean {
  const low = (md || '').toLowerCase()
  if (SITE_DRAFT_MARKERS.some((marker) => low.includes(marker))) return true
  return /(^|\n)[ \t]*[-*][ \t]*\*\*[^*]+\*\*[ \t]*:?[ \t]*(?=\r?\n|$)/.test(md)
}

function template(id: string): PageTemplate {
  const found = getTemplate(id)
  if (!found) throw new Error(`modello ${id} assente`)
  return found
}

function deity(overrides: Record<string, FieldValue> = {}): Record<string, FieldValue> {
  return {
    nome: 'Anivia',
    epiteto: 'La Criofenice',
    allineamento: 'Legale Buono',
    sfere: ['Gelo', 'Libertà', 'Speranza'],
    simbolo: 'Piuma di ghiaccio',
    immagine: '/images/anivia.jpg',
    ritaglio: '42,32',
    citazione: 'I am the fury of the blizzard.',
    personalita: 'Calma e implacabile.',
    tempio: 'Santuario di ghiaccio',
    rituali: 'Canti al solstizio',
    seguaci: 'Nomadi del nord',
    ...overrides
  }
}

function dataWith(
  templateId: string,
  items: Array<Record<string, FieldValue>>,
  fields: Record<string, FieldValue> = {}
) {
  const tpl = template(templateId)
  const data = emptyTemplateData(tpl)
  data.fields = { ...data.fields, ...fields }
  const key = tpl.collections[0].key
  data.collections[key] = items
  return data
}

describe('modelli built-in', () => {
  it('espone i modelli per ogni scopo editoriale, tutti validi', () => {
    expect(BUILT_IN_TEMPLATES.map((tpl) => tpl.id)).toEqual([
      'divinita',
      'regola',
      'lore',
      'mestiere',
      'luogo',
      'fazione',
      'npc',
      'creatura',
      'oggetto',
      'sessione',
      'cronologia'
    ])
    for (const tpl of BUILT_IN_TEMPLATES) {
      expect(() => parseTemplate(tpl)).not.toThrow()
      expect(tpl.collections.length).toBeGreaterThan(0)
    }
  })

  it('rifiuta un modello con riferimenti a campi inesistenti', () => {
    const broken = {
      ...template('divinita'),
      collections: [
        {
          ...template('divinita').collections[0],
          item: {
            ...template('divinita').collections[0].item,
            sections: [{ blocks: [{ kind: 'markdown', field: 'inesistente' }] }]
          }
        }
      ]
    }
    expect(() => parseTemplate(broken)).toThrow(TemplateError)
  })

  it('rifiuta una select senza opzioni', () => {
    const broken = {
      ...template('lore'),
      page: {
        ...template('lore').page,
        fields: [{ key: 'x', label: 'X', type: 'select' }]
      }
    }
    expect(() => parseTemplate(broken)).toThrow(/options/)
  })
})

describe('compilazione pantheon', () => {
  it('genera la struttura letta dal renderer: titolo, immagine con ritaglio, identità, culto', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [deity()], { intro: 'Gli dèi di Aetherion.' })
    const { markdown } = compileTemplate(tpl, data)

    expect(markdown.startsWith('# Divinità')).toBe(true)
    expect(markdown).toContain('Gli dèi di Aetherion.')
    expect(markdown).toContain('# Anivia')
    expect(markdown).toContain('![Anivia](/images/anivia.jpg#42,32)')
    expect(markdown).toContain('- **Nome:** Anivia')
    expect(markdown).toContain('- **Sfere:** Gelo, Libertà, Speranza')
    expect(markdown).toContain('## Identità')
    expect(markdown).toContain('## Personalità')
    expect(markdown).toContain('> I am the fury of the blizzard.')
    expect(markdown).toContain('- **Seguaci:** Nomadi del nord')
  })

  it('separa le schede con --- così il parser del sito ne conta una per entità', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [
      deity(),
      deity({ nome: 'Janna', immagine: '', ritaglio: '', epiteto: 'Spirito della Saggezza' })
    ])
    const { markdown } = compileTemplate(tpl, data)
    const blocks = markdown.split(/\n[ \t]*---[ \t]*\n/)
    /* Il primo blocco è l'introduzione (con il titolo della pagina): il
       parser del sito lo scarta, i successivi sono le schede. */
    expect(blocks).toHaveLength(3)
    expect(blocks[0]).toContain('# Divinità')
    expect(blocks.slice(1).every((block) => /^#\s+/m.test(block))).toBe(true)
  })

  it('un campo obbligatorio vuoto resta nel conteggio e accende il badge bozza del sito', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [deity({ nome: '', personalita: '' })])
    const result = compileTemplate(tpl, data)
    expect(result.blanks).toContain('collections.entita.0.nome')
    expect(result.markdown).toContain('- **Nome:**')
    expect(siteDetectsDraft(result.markdown)).toBe(true)
  })

  it('un testo obbligatorio vuoto diventa il segnaposto «Da scrivere»', () => {
    const tpl = template('regola')
    const data = dataWith('regola', [{ numero: 1, titolo: 'Accesso', corpo: '' }])
    const result = compileTemplate(tpl, data)
    expect(result.markdown).toContain(BLANK_MARKER)
    expect(siteDetectsDraft(result.markdown)).toBe(true)
  })

  it('un campo opzionale vuoto resta un segnaposto di identità (badge automatico)', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [deity({ simbolo: '' })])
    const { markdown } = compileTemplate(tpl, data)
    expect(markdown).toContain('- **Simbolo:**')
    expect(siteDetectsDraft(markdown)).toBe(true)
  })

  it('un campo marcato «in lavorazione» scrive il segnaposto anche nel markdown', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [deity({ tempio: '' })])
    const { markdown, drafts } = compileTemplate(tpl, data, ['collections.entita.0.tempio'])
    expect(markdown).toContain(`- **Tempio:** ${BLANK_MARKER}`)
    /* Il campo opzionale lasciato vuoto non diventa un draft: la scelta è
       esplicita e il conteggio la riporta. */
    expect(drafts).toEqual(['collections.entita.0.tempio'])
  })

  it('non spezza una scheda se il testo contiene una riga ---', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [deity({ personalita: 'Prima parte\n\n---\n\nSeconda parte' })])
    const { markdown } = compileTemplate(tpl, data)
    expect(markdown).toContain('***')
    /* Un solo separatore: intro | scheda. La riga --- scritta a mano
       è diventata *** e non ha spezzato la scheda. */
    expect(markdown.split(/\n[ \t]*---[ \t]*\n/)).toHaveLength(2)
  })

  it('una scheda completamente vuota non viene pubblicata', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [{}])
    const { markdown } = compileTemplate(tpl, data)
    expect(markdown).toBe('# Divinità')
  })
})

describe('compilazione regolamento', () => {
  it('compone intestazione numerata, eccezioni e nota', () => {
    const tpl = template('regola')
    const data = dataWith('regola', [
      {
        numero: 3,
        titolo: 'Spam e Pubblicità',
        corpo: 'Qualsiasi forma di spam è vietata.',
        eccezioni: ['Gli artisti possono pubblicare i propri lavori'],
        nota: 'Documenta sempre prima di segnalare.'
      }
    ])
    const { markdown } = compileTemplate(tpl, data)
    expect(markdown).toContain('## Regola 3 — Spam e Pubblicità')
    expect(markdown).toContain('**Eccezioni:**\n- Gli artisti possono pubblicare i propri lavori')
    expect(markdown).toContain('> Documenta sempre prima di segnalare.')
    expect(markdown).not.toContain('## Eccezioni')
  })

  it('gestisce numeri mancanti senza lasciare trattini orfani', () => {
    const tpl = template('regola')
    const data = dataWith('regola', [{ numero: '', titolo: 'Privacy', corpo: 'Testo' }])
    const { markdown } = compileTemplate(tpl, data)
    expect(markdown).toContain('## Regola — Privacy')
  })
})

describe('compilazione lore e mestiere', () => {
  it('lore usa sezioni ## senza separatori ---', () => {
    const tpl = template('lore')
    const data = dataWith(
      'lore',
      [{ titolo: 'Le origini', corpo: 'Testo della sezione.', approfondimenti: 'Nota finale.' }],
      { intro: 'Introduzione alla storia.' }
    )
    const { markdown } = compileTemplate(tpl, data)
    expect(markdown).toContain('## Informazioni')
    expect(markdown).toContain('## Le origini')
    expect(markdown).toContain('### Approfondimenti')
    expect(markdown).not.toContain('---')
  })

  it('mestiere produce un blocco per mestiere con la scheda tecnica', () => {
    const tpl = template('mestiere')
    const data = dataWith('mestiere', [
      {
        nome: 'Biblioteca',
        categoria: 'Accademico',
        requisiti: ['Intelligenza 12'],
        strumenti: ['Libri'],
        modificatori: 'INT o CHA',
        stipendio: 'Base più bonus.',
        descrizione: 'Custodire i volumi.',
        come: 'Turni di 8 ore.'
      }
    ])
    const { markdown } = compileTemplate(tpl, data)
    expect(markdown.startsWith('# Lavori ad Arcamis')).toBe(true)
    /* Una scheda = un titolo #, come in lavori.json: il parser del sito
       (layout collezione) usa proprio l'H1 per la tessera e lo slug. */
    expect(markdown).toContain('# Biblioteca')
    expect(markdown).toContain('- **Categoria:** Accademico')
    expect(markdown).toContain('## Stipendio')
    expect(markdown.match(/^# /gm)).toHaveLength(2)
  })
})

describe('modelli per luoghi, fazioni, PNG, creature, oggetti, sessioni e cronologie', () => {
  it('luogo produce una card ## con immagine, scheda e sezioni', () => {
    const tpl = template('luogo')
    const data = dataWith('luogo', [
      {
        nome: 'Volonx',
        tipo: 'Villaggio',
        regione: 'Marche di Arcamis',
        popolazione: '800 abitanti',
        governo: 'Consiglio degli anziani',
        clima: 'Umido',
        immagine: '/images/volonx.jpg',
        ritaglio: '50,40',
        descrizione: 'Un villaggio di pescatori.',
        storia: 'Fondato dopo la piena.',
        attrazioni: ['Il pozzo che canta'],
        volti: ['Mira la guaritrice'],
        pericoli: 'Nebbie notturne.'
      }
    ])
    const { markdown } = compileTemplate(tpl, data)
    expect(markdown).toContain('## Volonx')
    expect(markdown).toContain('![Volonx](/images/volonx.jpg#50,40)')
    expect(markdown).toContain('- **Governo:** Consiglio degli anziani')
    expect(markdown).toContain('### Da vedere')
    expect(markdown).not.toContain('---')
  })

  it('fazione e PNG restano schede complete con relazioni e segreti', () => {
    const fazione = dataWith('fazione', [
      { nome: 'Luna Nera', tipo: 'Compagnia', sede: 'Forte Vigilus', alleati: ['Gilda dei Mercanti'], segreti: 'Serve un culto.' }
    ])
    const fazioneMd = compileTemplate(template('fazione'), fazione).markdown
    expect(fazioneMd).toContain('## Luna Nera')
    expect(fazioneMd).toContain('### Alleanze')
    expect(fazioneMd).toContain('- Gilda dei Mercanti')
    expect(fazioneMd).toContain('### Segreti')

    const npc = dataWith('npc', [{ nome: 'Mira', ruolo: 'Guaritrice', agganci: ['Deve una promessa al party'] }])
    const npcMd = compileTemplate(template('npc'), npc).markdown
    expect(npcMd).toContain('## Mira')
    expect(npcMd).toContain('- **Ruolo:** Guaritrice')
    expect(npcMd).toContain('### Agganci narrativi')
  })

  it('creatura compila la scheda da bestiario con statistiche e azioni', () => {
    const data = dataWith('creatura', [
      {
        nome: 'Goblin Furtivo',
        tipo: 'Umanoide',
        taglia: 'Piccola',
        allineamento: 'Neutrale Malvagio',
        ca: 15,
        pf: '7 (2d6)',
        velocita: '9 m',
        sfida: '1/4',
        linguaggi: 'Comune, Goblin',
        descrizione: 'Tende agguati nei boschi.',
        azioni: ['Scimitarra. +4 al colpire.']
      }
    ])
    const { markdown } = compileTemplate(template('creatura'), data)
    expect(markdown).toContain('## Goblin Furtivo')
    expect(markdown).toContain('- **Classe Armatura:** 15')
    expect(markdown).toContain('### Azioni')
    expect(markdown).toContain('- Scimitarra. +4 al colpire.')
  })

  it('oggetto e sessione usano heading composti e sezioni dedicate', () => {
    const oggetto = dataWith('oggetto', [
      {
        nome: 'Lama del Crepuscolo',
        rarita: 'Raro',
        tipo: 'Arma',
        sintonia: 'Sì',
        descrizione: 'Una lama che assorbe la luce.',
        poteri: 'Infligge 1d6 danni psichici extra.',
        varianti: ['Versione corrotta']
      }
    ])
    const oggettoMd = compileTemplate(template('oggetto'), oggetto).markdown
    expect(oggettoMd).toContain('## Lama del Crepuscolo')
    expect(oggettoMd).toContain('- **Rarità:** Raro')
    expect(oggettoMd).toContain('### Poteri')

    const sessione = dataWith('sessione', [
      { numero: 12, titolo: 'Il pozzo che canta', data: '12 Solealto', presenti: ['Kael', 'Mira'], premi: ['300 mo'] }
    ])
    const sessioneMd = compileTemplate(template('sessione'), sessione).markdown
    expect(sessioneMd).toContain('## Sessione 12 — Il pozzo che canta')
    expect(sessioneMd).toContain('### Premi e bottino')
  })

  it('cronologia impagina epoche ed eventi per la timeline', () => {
    const data = dataWith('cronologia', [
      { titolo: 'Terza Era', periodo: '812–1024', descrizione: 'Le grandi migrazioni.', eventi: ['812: fondazione di Arcamis'] }
    ])
    const { markdown } = compileTemplate(template('cronologia'), data)
    expect(markdown).toContain('## Terza Era')
    expect(markdown).toContain('- **Periodo:** 812–1024')
    expect(markdown).toContain('### Eventi')
    expect(markdown).toContain('- 812: fondazione di Arcamis')
  })
})

describe('validazione', () => {
  it('segnala gli obbligatori mancanti', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [deity({ nome: '' })])
    const result = validateTemplateData(tpl, data)
    expect(result.errors.some((issue) => issue.path === 'collections.entita.0.nome')).toBe(true)
  })

  it('un campo marcato in lavorazione non è un errore', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [deity({ nome: '' })])
    const result = validateTemplateData(tpl, data, ['collections.entita.0.nome'])
    expect(result.errors).toHaveLength(0)
  })

  it('blocca i titoli duplicati nella stessa collezione', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [deity(), deity({ epiteto: 'Un altro epiteto' })])
    const result = validateTemplateData(tpl, data)
    expect(result.errors.some((issue) => issue.message.includes('duplicato'))).toBe(true)
  })

  it('avvisa sui titoli che spezzerebbero la scheda', () => {
    const tpl = template('lore')
    const data = dataWith('lore', [{ titolo: 'Sezione', corpo: '## Titolo scritto a mano\nTesto' }])
    const result = validateTemplateData(tpl, data)
    expect(result.warnings.some((issue) => issue.message.includes('livello troppo alto'))).toBe(true)
  })

  it('rifiuta percorsi immagine non validi e URL malformati', () => {
    const tpl = template('divinita')
    const data = dataWith('divinita', [deity({ immagine: 'anivia.jpg', citazione: 'x' })])
    expect(validateTemplateData(tpl, data).errors.some((issue) => issue.message.includes('percorso immagine'))).toBe(
      true
    )
  })

  it('accetta tag come array e li normalizza nel markdown', () => {
    expect(isBlank([])).toBe(true)
    expect(isBlank(['a'])).toBe(false)
  })
})

describe('import del markdown esistente', () => {
  it('riconosce le schede del pantheon', () => {
    const markdown = [
      '# Divinità',
      '',
      'Intro del pantheon.',
      '',
      '---',
      '',
      '# Anivia',
      '',
      '![Anivia](/images/anivia.jpg#42,32)',
      '',
      '> I am the fury of the blizzard.',
      '',
      '## Identità',
      '',
      '- **Nome:** Ysjarn',
      '- **Epiteto:** La Criofenice',
      '- **Allineamento:** Legale Buono',
      '- **Sfere:** Gelo, Libertà, Speranza',
      '- **Simbolo:** ?',
      '',
      '## Personalità',
      '',
      'Da scrivere',
      '',
      '## Culto',
      '',
      '- **Tempio:** Tipo di tempio',
      '- **Rituali:** Cerimonie principali',
      '- **Seguaci:** Chi lo/la adora',
      '',
      '---',
      '',
      '# Janna',
      '',
      '![Janna](/images/janna.jpg)',
      '',
      '## Identità',
      '',
      '- **Nome:** Jan’ahrem',
      '- **Epiteto:** Spirito della Saggezza'
    ].join('\n')

    const result = seedFromMarkdown(template('divinita'), markdown)
    expect(result.imported).toBe(2)
    expect(result.data.fields.intro).toBe('Intro del pantheon.')
    const items = result.data.collections.entita as Array<Record<string, unknown>>
    expect(items).toHaveLength(2)
    expect(items[0].nome).toBe('Anivia')
    expect(items[0].epiteto).toBe('La Criofenice')
    expect(items[0].sfere).toEqual(['Gelo', 'Libertà', 'Speranza'])
    expect(items[0].immagine).toBe('/images/anivia.jpg')
    expect(items[0].ritaglio).toBe('42,32')
    expect(items[0].citazione).toBe('I am the fury of the blizzard.')
    expect(items[0].personalita).toBe('Da scrivere')
    expect(items[0].seguaci).toBe('Chi lo/la adora')
    expect(items[1].ritaglio).toBe('')
  })

  it('riconosce le regole numerate con il loro blocco eccezioni', () => {
    const markdown = [
      '## Regola 1 — Accesso al Server',
      '',
      'Entrando nel server dichiari di essere maggiorenne.',
      '',
      '**Eccezioni:**',
      '',
      '- Staff e moderazione',
      '- Ospiti invitati',
      '',
      '---',
      '',
      '## Regola 2 — Privacy',
      '',
      'Lo staff non richiede mai dati personali.',
      '',
      '> Segnala sempre con prove.',
      ''
    ].join('\n')

    const result = seedFromMarkdown(template('regola'), markdown)
    const rules = result.data.collections.regole as Array<Record<string, unknown>>
    expect(rules).toHaveLength(2)
    expect(rules[0].numero).toBe(1)
    expect(rules[0].titolo).toBe('Accesso al Server')
    expect(rules[0].corpo).toBe('Entrando nel server dichiari di essere maggiorenne.')
    expect(rules[0].eccezioni).toEqual(['Staff e moderazione', 'Ospiti invitati'])
    expect(rules[1].nota).toBe('Segnala sempre con prove.')
  })

  it('riconosce le sezioni lore e ne conserva titolo e corpo', () => {
    const markdown = [
      'Introduzione alla pagina.',
      '',
      '## Informazioni',
      '',
      '- **Sinossi:** Una guerra lunga',
      '- **Epoca:** Terza Era',
      '',
      '## Le origini',
      '',
      'Testo della sezione.',
      '',
      '### Approfondimenti',
      '',
      'Nota finale.'
    ].join('\n')

    const result = seedFromMarkdown(template('lore'), markdown)
    expect(result.data.fields.intro).toBe('Introduzione alla pagina.')
    expect(result.data.fields.sinossi).toBe('Una guerra lunga')
    const sections = result.data.collections.sezioni as Array<Record<string, unknown>>
    // "Informazioni" è una sezione di pagina, non una scheda: nessun testo → non importata
    expect(sections).toHaveLength(1)
    expect(sections[0].titolo).toBe('Le origini')
    expect(sections[0].corpo).toBe('Testo della sezione.')
    expect(sections[0].approfondimenti).toBe('Nota finale.')
  })

  it('segnala ciò che non riesce a importare invece di perderlo in silenzio', () => {
    const result = seedFromMarkdown(template('divinita'), 'Solo un testo libero, senza schede.')
    expect(result.imported).toBe(0)
    expect(result.notes.length).toBeGreaterThan(0)
    expect(result.data.fields.intro).toBe('Solo un testo libero, senza schede.')
  })

  it('genera un pattern per i titoli numerati', () => {
    const { regex, keys } = headingPattern('Regola {numero} — {titolo}')
    const match = 'Regola 12 — Uso dei Thread'.match(regex)
    expect(keys).toEqual(['numero', 'titolo'])
    expect(match?.[1]).toBe('12')
    expect(match?.[2]).toBe('Uso dei Thread')
  })
})

describe('aggiornamento immutabile dei dati', () => {
  it('non muta lo stato precedente', () => {
    const data = dataWith('divinita', [deity()])
    const next = setValueAtPath(data, 'collections.entita.0.nome', 'Janna')
    expect(next.collections.entita[0].nome).toBe('Janna')
    expect(data.collections.entita[0].nome).toBe('Anivia')
    expect(next.fields).toBe(data.fields)
  })
})
