/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — github.ts
   Proxy server-side verso l'API GitHub (/api/gh). Il PAT resta su
   Cloudflare: il browser non lo vede mai.
   ════════════════════════════════════════════════════════════════ */

import { API_BASE, request } from './http'
import type { DeployStatus, GHFile } from '@/types'

/** Base64 UTF-8 sicuro per contenuti non ASCII. */
export function b64encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

export function decodeBase64Utf8(str: string): string {
  return decodeURIComponent(escape(atob(str)))
}

type GhAction = 'get' | 'put' | 'binary' | 'delete' | 'commit_multi' | 'commits' | 'ci_status'

interface GhPayload {
  [key: string]: unknown
}

async function gh<T>(action: GhAction, payload: GhPayload): Promise<T> {
  const result = await request<{ data: T }>(`${API_BASE}/gh`, {
    method: 'POST',
    body: { action, payload }
  })
  return result.data
}

export const ghApi = {
  /** Legge un file (o una directory) dal repository. */
  async get(path: string, ref?: string): Promise<{ content: string; sha: string; type?: string }> {
    return gh<{ content: string; sha: string; type?: string }>('get', { path, ref })
  },

  /** Crea o aggiorna un file di testo (sha per aggiornare un file esistente). */
  async put(
    path: string,
    message: string,
    content: string,
    sha?: string | null
  ): Promise<{ content: { sha: string } }> {
    return gh<{ content: { sha: string } }>('put', {
      path,
      message,
      content: b64encode(content),
      sha: sha || null
    })
  },

  /** Carica un file binario da data URI (immagini). */
  async putBinary(path: string, message: string, dataUri: string): Promise<{ content: { sha: string } }> {
    const match = dataUri.match(/^data:[^;]+;base64,(.*)$/)
    return gh<{ content: { sha: string } }>('binary', {
      path,
      message,
      content: match ? match[1] : dataUri,
      sha: null
    })
  },

  async delete(path: string, message: string, sha: string): Promise<void> {
    await gh<null>('delete', { path, message, sha })
  },

  /** Commit atomico di più file (content null = eliminazione). */
  async commitMulti(files: Array<{ path: string; content: string | null }>, message: string): Promise<void> {
    await gh<null>('commit_multi', { files, message })
  },

  /** Elenca i file di una cartella. */
  async list(path: string): Promise<GHFile[]> {
    const data = await gh<GHFile | GHFile[]>('get', { path })
    return Array.isArray(data) ? data : [data]
  },

  async commits(
    path: string,
    perPage = 25
  ): Promise<Array<{ sha: string; commit: { author: { date: string }; message: string } }>> {
    return gh<Array<{ sha: string; commit: { author: { date: string }; message: string } }>>('commits', {
      path,
      per_page: perPage
    })
  },

  /** Stato dell'ultima esecuzione CI; null se non disponibile. */
  async ciStatus(): Promise<DeployStatus | null> {
    try {
      return await gh<DeployStatus | null>('ci_status', {})
    } catch {
      return null
    }
  }
}
