/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — homepage.ts (API)

   La configurazione della homepage vive in `content/homepage.json`,
   versionata su GitHub come il resto dei contenuti. Il salvataggio
   passa dal proxy /api/gh (token server-side, ruolo editor/admin);
   la lettura pubblica è statica, quindi il sito non dipende da API.

   `verifyPublished` chiude il ciclo: dopo il commit controlla che la
   home servita online porti l'impronta della configurazione salvata.
   ════════════════════════════════════════════════════════════════ */

import { ApiError } from './http'
import { decodeBase64Utf8, ghApi } from './github'
import { HOMEPAGE_PATH, defaultHomepage, homepageHash, normalizeHomepage } from '../homepage'
import type { HomepageConfig, HomepageValidation } from '../homepage'

export interface HomepageDoc {
  config: HomepageConfig
  sha: string
  hash: string
  /** 'github' = file versionato; 'default' = file assente, valori del sito. */
  source: 'github' | 'default'
  warnings: string[]
}

export interface HomepageVerify {
  /** true solo se la home online contiene l'impronta attesa. */
  ok: boolean
  /** Impronta trovata nell'HTML pubblicato, se presente. */
  found: string | null
}

function parseDoc(raw: string): HomepageValidation {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { config: defaultHomepage(), errors: ['content/homepage.json non è JSON valido'], warnings: [] }
  }
  return normalizeHomepage(parsed)
}

export const homepageApi = {
  /** Configurazione pubblicata (branch main), con sha per l'aggiornamento. */
  async get(): Promise<HomepageDoc> {
    try {
      const data = await ghApi.get(HOMEPAGE_PATH)
      const { config, warnings, errors } = parseDoc(decodeBase64Utf8(data.content))
      return { config, sha: data.sha, hash: homepageHash(config), source: 'github', warnings: [...warnings, ...errors] }
    } catch (error) {
      /* File non ancora creato: la home usa i default del sito. */
      if (error instanceof ApiError && error.status === 404) {
        const config = defaultHomepage()
        return { config, sha: '', hash: homepageHash(config), source: 'default', warnings: [] }
      }
      throw error
    }
  },

  /** Valida e committa la configurazione. Torna sha e impronta. */
  async save(config: HomepageConfig, sha?: string): Promise<{ sha: string; hash: string; config: HomepageConfig }> {
    const { config: normalized, errors } = normalizeHomepage({
      ...config,
      updatedAt: new Date().toISOString()
    })
    if (errors.length) throw new Error(errors.join(' '))
    const visible = normalized.sections.filter((section) => section.visible).length
    const result = await ghApi.put(
      HOMEPAGE_PATH,
      `admin: homepage (${visible} sezioni visibili)`,
      JSON.stringify(normalized, null, 2) + '\n',
      sha || undefined
    )
    return { sha: result.content.sha, hash: homepageHash(normalized), config: normalized }
  },

  /** Cronologia dei commit del file (la versione è il commit stesso). */
  async history(): Promise<Array<{ sha: string; date: string; message: string }>> {
    const commits = await ghApi.commits(HOMEPAGE_PATH, 20)
    return commits.map((entry) => ({
      sha: entry.sha,
      date: entry.commit.author.date,
      message: entry.commit.message
    }))
  },

  /** Configurazione a un commit precedente (da ricaricare e ripubblicare). */
  async getAt(ref: string): Promise<HomepageConfig> {
    const data = await ghApi.get(HOMEPAGE_PATH, ref)
    return parseDoc(decodeBase64Utf8(data.content)).config
  },

  /**
   * Verifica reale del pubblicato: la home online contiene
   * `<!-- homepage:<impronta> -->`, scritto dal build. Nessun
   * "pubblicato" dichiarato senza questa conferma.
   */
  async verifyPublished(hash: string): Promise<HomepageVerify> {
    const response = await fetch(`/?v=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'text/html' },
      credentials: 'same-origin'
    })
    if (!response.ok) return { ok: false, found: null }
    const html = await response.text()
    const match = html.match(/<!-- homepage:([0-9a-f]{8}) -->/)
    return { ok: Boolean(match && match[1] === hash), found: match ? match[1] : null }
  },

  /** Solo validazione, senza scrivere nulla. */
  validate(config: HomepageConfig): HomepageValidation {
    return normalizeHomepage(config)
  }
}
