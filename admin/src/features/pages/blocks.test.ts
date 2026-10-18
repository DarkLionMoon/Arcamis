import { describe, expect, it } from 'vitest'

import { blockIssues, makeBlock, parseBlocks, serializeBlocks, type Block } from './blocks'

const types = (blocks: Block[]) => blocks.map((block) => block.type)
const withoutIds = (blocks: Block[]) => blocks.map(({ id: _id, ...rest }) => rest)

describe('blocchi · lettura del markdown', () => {
  it('riconosce titoli, paragrafi e separatori', () => {
    const blocks = parseBlocks('# Titolo\n\nPrima riga\nseconda riga\n\n---\n\n## Sezione')
    expect(types(blocks)).toEqual(['heading', 'paragraph', 'divider', 'heading'])
    expect(blocks[0]).toMatchObject({ level: 1, text: 'Titolo' })
    expect(blocks[1].text).toBe('Prima riga\nseconda riga')
    expect(blocks[3]).toMatchObject({ level: 2, text: 'Sezione' })
  })

  it('tiene gli elenchi in un blocco markdown grezzo', () => {
    const source = '- primo\n- secondo\n  - annidato'
    const blocks = parseBlocks(source)
    expect(types(blocks)).toEqual(['raw'])
    expect(serializeBlocks(blocks)).toBe(source)
  })

  it('legge callout e accordion (anche richiusi)', () => {
    const source = '> [!WARNING] Attenzione\n> Non correre.\n\n> [!FAQ]- Domanda?\n> Risposta.'
    const blocks = parseBlocks(source)
    expect(types(blocks)).toEqual(['callout', 'accordion'])
    expect(blocks[0]).toMatchObject({ tone: 'WARNING', title: 'Attenzione', text: 'Non correre.' })
    expect(blocks[1]).toMatchObject({ tone: 'FAQ', title: 'Domanda?', text: 'Risposta.' })
    expect(serializeBlocks(blocks)).toBe(source)
  })

  it('legge una tabella con intestazioni e righe', () => {
    const blocks = parseBlocks('| Nome | Ruolo |\n| --- | --- |\n| Anivia | Dea |')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].table).toEqual({
      headers: ['Nome', 'Ruolo'],
      rows: [['Anivia', 'Dea']]
    })
  })

  it('legge immagini singole', () => {
    const blocks = parseBlocks('![La mappa](/images/mappa.webp)')
    expect(blocks[0]).toMatchObject({ type: 'image', src: '/images/mappa.webp', alt: 'La mappa' })
  })

  it('legge griglia di carte e galleria', () => {
    const cards = parseBlocks(':::cards\n### Uno\nCorpo **forte**\n\n### Due\nAltro\n:::')
    expect(cards).toHaveLength(1)
    expect(cards[0].type).toBe('cards')
    expect(cards[0].cards).toEqual([
      { title: 'Uno', body: 'Corpo **forte**' },
      { title: 'Due', body: 'Altro' }
    ])

    const gallery = parseBlocks(':::gallery\n![Prima](/images/a.webp)\n![Seconda](/images/b.webp)\n:::')
    expect(gallery[0].type).toBe('gallery')
    expect(gallery[0].images).toEqual([
      { alt: 'Prima', src: '/images/a.webp' },
      { alt: 'Seconda', src: '/images/b.webp' }
    ])
  })

  it('una griglia malformata resta markdown grezzo, non sparisce', () => {
    const source = ':::cards\nTesto senza titolo di carta\n:::'
    const blocks = parseBlocks(source)
    expect(types(blocks)).toEqual(['raw'])
    expect(blocks[0].text).toBe(source)
  })
})

describe('blocchi · scrittura del markdown', () => {
  const samples: Array<{ name: string; markdown: string }> = [
    { name: 'titoli e paragrafi', markdown: '## Sezione\n\nUn paragrafo.' },
    { name: 'callout', markdown: '> [!TIP] Scorciatoia\n> Usa Ctrl+S.' },
    { name: 'accordion', markdown: '> [!NOTE]- Perché?\n> Perché sì.' },
    { name: 'tabella', markdown: '| A | B |\n| --- | --- |\n| 1 | 2 |' },
    { name: 'immagine', markdown: '![Mappa](/images/mappa.webp)' },
    { name: 'carte', markdown: ':::cards\n### Uno\nCorpo\n\n### Due\nAltro\n:::' },
    { name: 'galleria', markdown: ':::gallery\n![Uno](/images/a.webp)\n![Due](/images/b.webp)\n:::' }
  ]

  it.each(samples)('scrive lo stesso markdown che ha letto: $name', ({ markdown }) => {
    expect(serializeBlocks(parseBlocks(markdown))).toBe(markdown)
  })

  it('è idempotente', () => {
    const source = '# A\n\nTesto\n\n> [!NOTE] Nota\n> Corpo\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- uno\n- due'
    const once = serializeBlocks(parseBlocks(source))
    const twice = serializeBlocks(parseBlocks(once))
    expect(twice).toBe(once)
    expect(withoutIds(parseBlocks(once))).toEqual(withoutIds(parseBlocks(twice)))
  })

  it('non perde righe di markdown non riconosciuto', () => {
    const source = [
      '#### Titolo fuori scala',
      '',
      '> citazione semplice',
      '',
      '- voce elenco',
      '- altra voce',
      '',
      '```js',
      'const x = 1',
      '```',
      '',
      ':::mistero',
      'contenuto sconosciuto',
      ':::',
      '',
      'Testo finale con | pipe.'
    ].join('\n')
    const serialized = serializeBlocks(parseBlocks(source))
    for (const line of source.split('\n').filter((l) => l.trim())) {
      expect(serialized, 'riga persa: ' + line).toContain(line)
    }
  })

  it('un blocco nuovo e vuoto non sporca il markdown', () => {
    expect(serializeBlocks([makeBlock('heading'), makeBlock('paragraph'), makeBlock('divider')])).toBe('---')
  })
})

describe('blocchi · campi vuoti', () => {
  it('segnala i blocchi incompleti', () => {
    expect(blockIssues(makeBlock('paragraph'))).toEqual(['Paragrafo vuoto'])
    expect(blockIssues(makeBlock('image'))).toEqual(['Immagine senza file'])
    expect(blockIssues(makeBlock('cards'))).toEqual(['Nessuna carta'])
    const untitled = makeBlock('cards')
    untitled.cards = [{ title: '', body: 'Solo corpo' }]
    expect(blockIssues(untitled)).toEqual(['Carta senza titolo'])
    expect(blockIssues(makeBlock('gallery'))).toEqual(['Galleria senza immagini'])
  })

  it('non segnala un blocco compilato', () => {
    const block = makeBlock('callout')
    block.title = 'Avviso'
    block.text = 'Testo'
    expect(blockIssues(block)).toEqual([])
  })
})
