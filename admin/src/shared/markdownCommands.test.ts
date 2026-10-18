import { describe, expect, it } from 'vitest'

import { insertImage, insertLink, insertSnippet, toggleLinePrefix, wrapSelection } from './markdownCommands'

describe('wrapSelection', () => {
  it('avvolge la selezione e mantiene il testo selezionato', () => {
    const result = wrapSelection({ text: 'ciao mondo', from: 5, to: 10 }, '**')
    expect(result.text).toBe('ciao **mondo**')
    expect(result.text.slice(result.from, result.to)).toBe('mondo')
  })

  it('toglie il formato se i marker sono subito fuori dalla selezione', () => {
    const result = wrapSelection({ text: 'ciao **mondo**', from: 7, to: 12 }, '**')
    expect(result.text).toBe('ciao mondo')
    expect(result.text.slice(result.from, result.to)).toBe('mondo')
  })

  it('toglie il formato se la selezione include i marker', () => {
    const result = wrapSelection({ text: 'ciao **mondo**', from: 5, to: 14 }, '**')
    expect(result.text).toBe('ciao mondo')
    expect(result.text.slice(result.from, result.to)).toBe('mondo')
  })

  it('con il cursore inserisce il segnaposto e lo seleziona', () => {
    const result = wrapSelection({ text: 'ciao ', from: 5, to: 5 }, '*', 'corsivo')
    expect(result.text).toBe('ciao *corsivo*')
    expect(result.text.slice(result.from, result.to)).toBe('corsivo')
  })

  it('limita gli offset fuori dal testo invece di corromperlo', () => {
    const result = wrapSelection({ text: 'abc', from: 99, to: 200 }, '**')
    expect(result.text).toBe('abc**testo**')
    expect(result.text.slice(result.from, result.to)).toBe('testo')
  })
})

describe('toggleLinePrefix', () => {
  it('aggiunge il prefisso a tutte le righe non vuote della selezione', () => {
    const text = 'uno\ndue\n\ntre'
    const result = toggleLinePrefix({ text, from: 0, to: text.length }, '- ')
    expect(result.text).toBe('- uno\n- due\n\n- tre')
    expect(result.from).toBe(0)
  })

  it('rimuove il prefisso se tutte le righe lo hanno già', () => {
    const text = '- uno\n- due'
    const result = toggleLinePrefix({ text, from: 0, to: text.length }, '- ')
    expect(result.text).toBe('uno\ndue')
  })

  it('lavora solo sulla riga del cursore quando la selezione è vuota', () => {
    const text = 'prima\nseconda\nterza'
    const result = toggleLinePrefix({ text, from: 8, to: 8 }, '> ')
    expect(result.text).toBe('prima\n> seconda\nterza')
  })

  it('converte un titolo in un altro livello invece di impilarlo', () => {
    const result = toggleLinePrefix({ text: '## Titolo', from: 0, to: 0 }, '### ')
    expect(result.text).toBe('### Titolo')
  })

  it('toglie il titolo se è già a quel livello', () => {
    const result = toggleLinePrefix({ text: '### Titolo', from: 0, to: 0 }, '### ')
    expect(result.text).toBe('Titolo')
  })
})

describe('link e immagini', () => {
  it('usa la selezione come etichetta del link', () => {
    const result = insertLink({ text: 'vedi docs', from: 5, to: 9 }, 'https://example.org')
    expect(result.text).toBe('vedi [docs](https://example.org)')
    expect(result.text.slice(result.from, result.to)).toBe('docs')
  })

  it('inserisce il link con etichetta generica senza selezione', () => {
    const result = insertLink({ text: 'testo ', from: 6, to: 6 }, '/pagina')
    expect(result.text).toBe('testo [testo](/pagina)')
  })

  it('inserisce il markdown di un’immagine', () => {
    const result = insertImage({ text: '', from: 0, to: 0 }, '/images/x.webp', 'X')
    expect(result.text).toBe('![X](/images/x.webp)')
    expect(result.from).toBe(result.text.length)
  })
})

describe('insertSnippet', () => {
  it('isola lo snippet con righe vuote', () => {
    const result = insertSnippet({ text: 'testo', from: 5, to: 5 }, '---')
    expect(result.text).toBe('testo\n\n---\n\n')
    expect(result.from).toBe(result.text.length)
  })

  it('non aggiunge una riga vuota in testa a un documento vuoto', () => {
    const result = insertSnippet({ text: '', from: 0, to: 0 }, '---')
    expect(result.text).toBe('---\n\n')
  })
})
