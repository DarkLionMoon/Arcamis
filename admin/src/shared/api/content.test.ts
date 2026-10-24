import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { pagesApi, registryApi } from './content'
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

describe('registryApi · sezioni della topbar', () => {
  it('scrive le sezioni nell’ordine scelto, non quelle del file', async () => {
    const current = {
      root: 'root',
      guild: 'guild',
      pages: [],
      sections: [{ v: 'regole', l: 'Regole' }],
      lavori: [],
      ui: { bottomNav: [], drawerSearch: true }
    }
    vi.spyOn(ghApi, 'get').mockResolvedValue({
      content: Buffer.from(JSON.stringify(current), 'utf8').toString('base64'),
      sha: 'sha-registry'
    })
    const put = vi.spyOn(ghApi, 'put').mockResolvedValue({ content: { sha: 'sha-next' } })

    await registryApi.save(
      [],
      [
        { v: 'lore', l: 'Lore' },
        { v: 'regole', l: 'Regole' }
      ]
    )

    const document = JSON.parse(String(put.mock.calls[0][2])) as { sections: unknown }
    expect(document.sections).toEqual([
      { v: 'lore', l: 'Lore' },
      { v: 'regole', l: 'Regole' }
    ])
  })
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

  it('recupera lo SHA prima del PUT se manca nello stato di una pagina esistente', async () => {
    const get = vi.spyOn(ghApi, 'get').mockResolvedValue({ content: '', sha: 'sha-current' })
    const put = vi.spyOn(ghApi, 'put').mockResolvedValue({ content: { sha: 'sha-new' } })

    await pagesApi.save(PAGE, 'admin: update page pantheon')

    expect(get).toHaveBeenCalledWith('content/pages/pantheon.json')
    expect(put).toHaveBeenCalledWith(
      'content/pages/pantheon.json',
      'admin: update page pantheon',
      expect.stringContaining('"k": "pantheon"'),
      'sha-current'
    )
  })

  it('omette completamente sha nelle richieste di creazione', async () => {
    setActivePinia(createPinia())
    const put = vi.spyOn(ghApi, 'put').mockResolvedValue({ content: { sha: 'sha-new' } })
    await pagesApi.create({ ...PAGE, k: 'nuova', sha: undefined }, 'admin: create page nuova')
    expect(put).toHaveBeenCalledWith(
      'content/pages/nuova.json',
      'admin: create page nuova',
      expect.stringContaining('"k": "nuova"')
    )
    expect(put.mock.calls[0]).toHaveLength(3)
    expect(put.mock.calls[0][2]).not.toContain('"sha"')
  })
})
