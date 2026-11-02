import { describe, it, expect } from 'vitest'
import { collectionIndex } from '../lib/collection-search.mjs'

describe('collection search', () => {
  it('links directly to Caserma, the Oste drawer and approved catalog entries', () => {
    const entries = collectionIndex(process.cwd())
    expect(entries.find(e => e.title === 'Caserma')).toMatchObject({
      category: 'Lavori', url: '/personaggio/lavori#lavori/caserma'
    })
    expect(entries.find(e => e.title === 'Oste')).toMatchObject({
      category: 'Mestieri', url: '/personaggio/mestieri#mestieri/oste'
    })
    expect(entries.some(e => e.category === 'Materiale Approvato' && e.title === 'Aarakocra')).toBe(true)
    expect(entries.every(e => e.url.startsWith('/') && e.title)).toBe(true)
  })
})
