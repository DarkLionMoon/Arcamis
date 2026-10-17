/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — http.ts
   Unico punto di uscita verso le API: cookie di sessione, token CSRF,
   timeout, errori tipizzati e reazione uniforme alla sessione scaduta.

   Prima ogni client ripeteva `fetch(... credentials ... headers ...)`
   e `handleResponse`: un errore di rete senza timeout poteva lasciare
   la UI in "Caricamento…" per sempre e un 401 non veniva distinto da
   un errore applicativo.
   ════════════════════════════════════════════════════════════════ */

import { useAuthStore } from '@/app/store'

export const API_BASE = '/api'
export const DEFAULT_TIMEOUT_MS = 20_000

/** Errore HTTP con stato e codice, così i chiamanti possono distinguere
 *  un problema di permessi da un errore di rete o di validazione. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 0, code = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  get isAuth(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isTimeout(): boolean {
    return this.code === 'timeout'
  }

  get isOffline(): boolean {
    return this.code === 'network'
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** Oggetto serializzato in JSON; per GET viene ignorato. */
  body?: unknown
  timeoutMs?: number
  signal?: AbortSignal
  /** Invia il token CSRF (default: true per le scritture, false per le letture). */
  csrf?: boolean
}

/** Una sola reazione alla sessione scaduta, registrata da main.ts. */
let unauthorizedHandler: (() => void) | null = null

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler
}

function csrfHeader(enabled: boolean): Record<string, string> {
  if (!enabled) return {}
  const token = useAuthStore().csrfToken
  return token ? { 'X-CSRF-Token': token } : {}
}

function errorMessage(payload: unknown, status: number, statusText: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as { error?: unknown; message?: unknown }
    if (typeof record.error === 'string' && record.error) return record.error
    if (typeof record.message === 'string' && record.message) return record.message
  }
  return statusText || `HTTP ${status}`
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Esegue una richiesta JSON verso le API, con cookie di sessione,
 * timeout e gestione centralizzata degli errori.
 */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options
  const csrf = options.csrf ?? method !== 'GET'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)
  const abortFromCaller = () => controller.abort('caller')
  signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const headers: Record<string, string> = { Accept: 'application/json', ...csrfHeader(csrf) }
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    })

    const payload = await parseBody(response)

    if (!response.ok) {
      const error = new ApiError(
        errorMessage(payload, response.status, response.statusText),
        response.status,
        typeof payload === 'object' && payload ? String((payload as { code?: unknown }).code ?? '') : ''
      )
      if (error.isAuth) unauthorizedHandler?.()
      throw error
    }

    return payload as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    if (controller.signal.aborted) {
      throw new ApiError(
        signal?.aborted ? 'Richiesta annullata' : `Timeout dopo ${timeoutMs / 1000}s`,
        0,
        signal?.aborted ? 'aborted' : 'timeout'
      )
    }
    throw new ApiError(e instanceof Error ? e.message : 'Errore di rete', 0, 'network')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

/** URL di una action di /api/admin. */
export function adminUrl(action: string, params: Record<string, string | number | undefined> = {}): string {
  const search = new URLSearchParams({ action })
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  return `${API_BASE}/admin?${search.toString()}`
}

/** Messaggio pronto per un toast, a partire da un errore qualsiasi. */
export function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.isAuth) return 'Sessione scaduta: effettua di nuovo il login'
    if (e.isTimeout) return 'Il server non ha risposto in tempo'
    if (e.isOffline) return 'Connessione al server non riuscita'
    return e.message
  }
  return e instanceof Error ? e.message : String(e)
}
