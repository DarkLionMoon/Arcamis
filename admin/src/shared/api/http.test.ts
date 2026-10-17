import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/app/store'
import { ApiError, adminUrl, errorText, onUnauthorized, request } from './http'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

describe('request', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().setAuth('brian', 'admin', 'csrf-abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    onUnauthorized(() => {})
  })

  /** fetch finto con parametri tipizzati: mock.calls risulta [string, RequestInit]. */
  function stubFetch(response: () => Response) {
    const mock = vi.fn(async (_url: string, _init: RequestInit): Promise<Response> => response())
    vi.stubGlobal('fetch', mock)
    return mock
  }

  it('invia cookie di sessione e token CSRF sulle scritture', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }))

    await request('/api/admin?action=set_cover', { method: 'POST', body: { a: 1 } })

    const init = fetchMock.mock.calls[0][1]
    expect(init.credentials).toBe('include')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-abc')
    expect(init.body).toBe('{"a":1}')
  })

  it('non invia il CSRF sulle letture GET', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }))

    await request('/api/admin?action=get_log')

    const init = fetchMock.mock.calls[0][1]
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBeUndefined()
    expect(init.body).toBeUndefined()
  })

  it('trasforma gli errori HTTP in ApiError con stato e messaggio del server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'CSRF token non valido' }, 403))
    )

    await expect(request('/api/admin?action=x', { method: 'POST' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: 'CSRF token non valido'
    })
  })

  it('segnala una sola volta la sessione scaduta (401)', async () => {
    const handler = vi.fn()
    onUnauthorized(handler)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'Non autenticato' }, 401))
    )

    await expect(request('/api/admin?action=get_log')).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('non chiama il gestore 401 per altri errori', async () => {
    const handler = vi.fn()
    onUnauthorized(handler)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'boom' }, 500))
    )

    await expect(request('/api/admin?action=get_log')).rejects.toBeInstanceOf(ApiError)
    expect(handler).not.toHaveBeenCalled()
  })

  it('interrompe una richiesta che supera il timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
      })
    )

    const error = await request('/api/admin?action=slow', { timeoutMs: 20 }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).isTimeout).toBe(true)
  })

  it('mappa un guasto di rete su un ApiError offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      })
    )

    const error = await request('/api/admin?action=get_log').catch((e: unknown) => e)
    expect((error as ApiError).isOffline).toBe(true)
  })

  it('accetta risposte senza corpo (204)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 }))
    )
    await expect(request('/api/deploy', { method: 'DELETE' })).resolves.toBeNull()
  })
})

describe('adminUrl', () => {
  it('costruisce la query con action e parametri', () => {
    expect(adminUrl('get_versions', { pageKey: 'lore-x' })).toBe('/api/admin?action=get_versions&pageKey=lore-x')
  })

  it('ignora parametri vuoti', () => {
    expect(adminUrl('list_drafts', { q: '', n: undefined })).toBe('/api/admin?action=list_drafts')
  })
})

describe('errorText', () => {
  it('spiega la sessione scaduta invece di mostrare la stringa tecnica', () => {
    expect(errorText(new ApiError('Non autenticato', 401))).toMatch(/Sessione scaduta/)
  })

  it('riporta il messaggio per gli altri errori applicativi', () => {
    expect(errorText(new ApiError('pageKey non valido', 400))).toBe('pageKey non valido')
  })
})
