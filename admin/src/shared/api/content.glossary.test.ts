import { afterEach, describe, expect, it, vi } from 'vitest'

import { glossaryApi } from './content'
import { ghApi } from './github'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('glossaryApi', () => {
  it('legge e normalizza il glossario dal file content', async () => {
    vi.spyOn(ghApi, 'get').mockResolvedValue({
      content: btoa(
        unescape(
          encodeURIComponent(
            JSON.stringify({
              terms: [{ key: 'gp', title: 'GP', excerpt: 'Moneta', pageLink: '/regole', iconId: 'coin' }]
            })
          )
        )
      ),
      sha: 'glossary-sha'
    })
    await expect(glossaryApi.get()).resolves.toMatchObject({ sha: 'glossary-sha', terms: [{ key: 'gp', title: 'GP' }] })
  })

  it('salva il JSON includendo lo SHA esistente e zero riferimenti rimossi', async () => {
    const put = vi.spyOn(ghApi, 'put').mockResolvedValue({ content: { sha: 'next-sha' } })
    await glossaryApi.save([{ key: 'gp', title: 'GP', excerpt: 'Moneta', pageLink: '', iconId: '' }], 'old-sha')
    expect(put).toHaveBeenCalledWith('content/glossary.json', 'admin: update glossary', expect.any(String), 'old-sha')
    const document = JSON.parse(String(put.mock.calls[0][2]))
    expect(document.terms).toHaveLength(1)
  })
})
