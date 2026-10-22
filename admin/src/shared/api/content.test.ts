import { afterEach, describe, expect, it, vi } from 'vitest'

import { pagesApi } from './content'
import { ghApi } from './github'
import type { PageContent } from '@/types'

const PAGE: PageContent = {
  k: 'pantheon',
  title: 'Pantheon',
  icon: '🛐',
  content: '# Divinità',
  layout: 'pantheon',
  lastModified: '2026-10-01T00:00:00.000Z'
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pagesApi · salvataggio di una pagina esistente', () => {
  it('conserva lo sha restituito da GitHub in lettura', async () => {
    vi.spyOn(ghApi, 'get').mockResolvedValue({
      content: Buffer.from(JSON.stringify(PAGE), 'utf8').toString('base64'),
      sha: 'sha-page'
    })

    await expect(pagesApi.get('pantheon')).resolves.toMatchObject({ k: 'pantheon', sha: 'sha-page' })
  })

  it('rimanda lo sha nel PUT, così GitHub aggiorna invece di creare', async () => {
    const put = vi.spyOn(ghApi, 'put').mockResolvedValue({ content: { sha: 'sha-new' } })

    await pagesApi.save({ ...PAGE, sha: 'sha-page' }, 'admin: update page pantheon')

    expect(put).toHaveBeenCalledWith(
      'content/pages/pantheon.json',
      'admin: update page pantheon',
      expect.stringContaining('"k": "pantheon"'),
      'sha-page'
    )
    const document = String(put.mock.calls[0][2])
    expect(document).not.toContain('"sha"')
  })
})
