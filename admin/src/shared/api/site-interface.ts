/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — site-interface.ts (API)

   Identità, footer e testi globali vivono in `content/interface.json`,
   versionato su GitHub come il resto dei contenuti. Il salvataggio
   passa dal proxy /api/gh (token server-side, ruolo editor/admin);
   il sito pubblico legge l'HTML generato dal build, non questa API.

   `verifyPublished` chiude il ciclo: dopo il commit controlla che la
   home servita online porti l'impronta della configurazione salvata.
   ════════════════════════════════════════════════════════════════ */

import { ApiError } from './http'
import { decodeBase64Utf8, ghApi } from './github'
import { SITE_INTERFACE_PATH, defaultSiteInterface, normalizeSiteInterface, siteInterfaceHash } from '../site-interface'
import type { SiteInterfaceConfig, SiteInterfaceValidation } from '../site-interface'

export interface SiteInterfaceDoc {
  config: SiteInterfaceConfig
  sha: string
  hash: string
  /** 'github' = file versionato; 'default' = file assente, valori del sito. */
  source: 'github' | 'default'
  warnings: string[]
}

export interface SiteInterfaceVerify {
  /** true solo se la home online contiene l'impronta attesa. */
  ok: boolean
  /** Impronta trovata nell'HTML pubblicato, se presente. */
  found: string | null
}

function parseDoc(raw: string): SiteInterfaceValidation {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { config: defaultSiteInterface(), errors: ['content/interface.json non è JSON valido'], warnings: [] }
  }
  return normalizeSiteInterface(parsed)
}

export const siteInterfaceApi = {
  /** Configurazione pubblicata (branch main), con sha per l'aggiornamento. */
  async get(): Promise<SiteInterfaceDoc> {
    try {
      const data = await ghApi.get(SITE_INTERFACE_PATH)
      const { config, warnings, errors } = parseDoc(decodeBase64Utf8(data.content))
      return {
        config,
        sha: data.sha,
        hash: siteInterfaceHash(config),
        source: 'github',
        warnings: [...warnings, ...errors]
      }
    } catch (error) {
      /* File non ancora creato: il sito usa i default del codice. */
      if (error instanceof ApiError && error.status === 404) {
        const config = defaultSiteInterface()
        return { config, sha: '', hash: siteInterfaceHash(config), source: 'default', warnings: [] }
      }
      throw error
    }
  },

  /** Valida e committa la configurazione. Torna sha e impronta. */
  async save(
    config: SiteInterfaceConfig,
    sha?: string
  ): Promise<{ sha: string; hash: string; config: SiteInterfaceConfig }> {
    const { config: normalized, errors } = normalizeSiteInterface({
      ...config,
      updatedAt: new Date().toISOString()
    })
    if (errors.length) throw new Error(errors.join(' '))
    const result = await ghApi.put(
      SITE_INTERFACE_PATH,
      `admin: interfaccia (${normalized.site.name})`,
      JSON.stringify(normalized, null, 2) + '\n',
      sha || undefined
    )
    return { sha: result.content.sha, hash: siteInterfaceHash(normalized), config: normalized }
  },

  /** Cronologia dei commit del file (la versione è il commit stesso). */
  async history(): Promise<Array<{ sha: string; date: string; message: string }>> {
    const commits = await ghApi.commits(SITE_INTERFACE_PATH, 20)
    return commits.map((entry) => ({
      sha: entry.sha,
      date: entry.commit.author.date,
      message: entry.commit.message
    }))
  },

  /** Configurazione a un commit precedente (da ricaricare e ripubblicare). */
  async getAt(ref: string): Promise<SiteInterfaceConfig> {
    const data = await ghApi.get(SITE_INTERFACE_PATH, ref)
    return parseDoc(decodeBase64Utf8(data.content)).config
  },

  /**
   * Verifica reale del pubblicato: la home online contiene
   * `<!-- interface:<impronta> -->`, scritto dal build. Nessun
   * "pubblicato" dichiarato senza questa conferma.
   */
  async verifyPublished(hash: string): Promise<SiteInterfaceVerify> {
    const response = await fetch(`/?v=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'text/html' },
      credentials: 'same-origin'
    })
    if (!response.ok) return { ok: false, found: null }
    const html = await response.text()
    const match = html.match(/<!-- interface:([0-9a-f]{8}) -->/)
    return { ok: Boolean(match && match[1] === hash), found: match ? match[1] : null }
  },

  /** Solo validazione, senza scrivere nulla. */
  validate(config: SiteInterfaceConfig): SiteInterfaceValidation {
    return normalizeSiteInterface(config)
  }
}
