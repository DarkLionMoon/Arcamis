/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — content.ts
   Contenuti editoriali: pagine, registro di navigazione, mappa,
   carousel, copertine, layout e ricerca full-text.
   ════════════════════════════════════════════════════════════════ */

import { adminUrl, request } from './http'
import { decodeBase64Utf8, ghApi } from './github'
import type {
  CarouselConfig,
  CarouselConfigResponse,
  CoversMap,
  GHFile,
  LayoutRegistryEntry,
  MapData,
  PageContent,
  PageRegistryEntry,
  SectionRegistryEntry,
  UIConfig
} from '@/types'

const CONTENT_PATH = 'content/pages'

export interface RegistryDoc {
  pages: PageRegistryEntry[]
  sections?: SectionRegistryEntry[]
  ui?: UIConfig
  sitemap?: unknown
  sha?: string
}

/* Campi del flusso di pubblicazione, come li espone l'endpoint. */
export type PageWorkflowStatus = Pick<PageContent, 'status' | 'publishAt' | 'isDraft' | 'review'>

/**
 * Stato del flusso di tutte le pagine in una chiamata: la lista del
 * pannello mostra i chip giusti anche quando il registro è indietro
 * (pagine create prima di questo flusso, o scritture fallite).
 */
export const statusApi = {
  async getAll(): Promise<Record<string, PageWorkflowStatus>> {
    return request<Record<string, PageWorkflowStatus>>(adminUrl('pages_status'))
  }
}

export const pagesApi = {
  async get(key: string): Promise<PageContent> {
    const data = await ghApi.get(`${CONTENT_PATH}/${key}.json`)
    /* Lo sha va conservato: senza, il PUT di un file esistente viene
       interpretato come creazione e GitHub risponde 422. */
    return { ...(JSON.parse(decodeBase64Utf8(data.content)) as PageContent), sha: data.sha }
  },

  async save(page: PageContent, message: string): Promise<{ sha: string }> {
    /* `sha` è un dato di trasporto di GitHub, non del documento. Se la
       pagina è esistente ma lo SHA è andato perso nello stato locale, lo
       rilegge prima del PUT: GitHub rifiuta un aggiornamento senza sha (422). */
    const { sha: pageSha, ...document } = page
    const sha = pageSha || (await ghApi.get(`${CONTENT_PATH}/${page.k}.json`)).sha
    const result = await ghApi.put(`${CONTENT_PATH}/${page.k}.json`, message, JSON.stringify(document, null, 2), sha)
    return { sha: result.content.sha }
  },

  async create(page: PageContent, message: string): Promise<{ sha: string }> {
    const { sha: _sha, ...document } = page
    const result = await ghApi.put(`${CONTENT_PATH}/${page.k}.json`, message, JSON.stringify(document, null, 2))
    return { sha: result.content.sha }
  },

  async delete(key: string, sha: string, message: string): Promise<void> {
    await ghApi.delete(`${CONTENT_PATH}/${key}.json`, message, sha)
  },

  async list(): Promise<GHFile[]> {
    return ghApi.list(CONTENT_PATH)
  },

  async getHistory(
    key: string
  ): Promise<Array<{ sha: string; commit: { author: { date: string }; message: string } }>> {
    return ghApi.commits(`${CONTENT_PATH}/${key}.json`)
  },

  async getAt(key: string, ref: string): Promise<PageContent> {
    const data = await ghApi.get(`${CONTENT_PATH}/${key}.json`, ref)
    return { ...(JSON.parse(decodeBase64Utf8(data.content)) as PageContent), sha: data.sha }
  }
}

export const registryApi = {
  async get(): Promise<RegistryDoc> {
    const data = await ghApi.get('content/pages/registry.json')
    const parsed = JSON.parse(decodeBase64Utf8(data.content)) as Omit<RegistryDoc, 'sha'>
    return { ...parsed, sha: data.sha }
  },

  /** Salva il registro: pagine, sezioni della topbar e configurazione UI.
   *  `sections` e `ui` sono opzionali: chi tocca solo le pagine non deve
   *  sovrascrivere una modifica concorrente alla navigazione. */
  async save(
    pages: PageRegistryEntry[],
    sections?: SectionRegistryEntry[],
    ui?: UIConfig,
    message = 'admin: update registry'
  ): Promise<{ sha: string }> {
    const current = await this.get()
    const { sha: _sha, ...rest } = current
    const payload = { ...rest, pages, sections: sections || rest.sections, ui: ui || rest.ui }
    const result = await ghApi.put(
      'content/pages/registry.json',
      message,
      JSON.stringify(payload, null, 2) + '\n',
      current.sha
    )
    return { sha: result.content.sha }
  }
}

export const mapApi = {
  async get(): Promise<MapData> {
    try {
      const data = await ghApi.get('content/mappins.json')
      return JSON.parse(decodeBase64Utf8(data.content)) as MapData
    } catch {
      return { mapImage: '/mappa.webp', pins: [] }
    }
  },

  async save(data: MapData, message = 'admin: update mappins'): Promise<{ sha: string }> {
    let sha: string | null = null
    try {
      sha = (await ghApi.get('content/mappins.json')).sha
    } catch {
      /* file non ancora esistente */
    }
    const result = await ghApi.put('content/mappins.json', message, JSON.stringify(data, null, 2) + '\n', sha)
    return { sha: result.content.sha }
  }
}

/** Copertine e carousel sono configurati in KV, non nel repository. */
export const carouselApi = {
  async getCovers(): Promise<CoversMap> {
    return request<CoversMap>(adminUrl('get_covers'))
  },

  async saveCover(key: string, value: string): Promise<boolean> {
    const result = await request<{ ok: boolean }>(adminUrl('set_cover'), {
      method: 'POST',
      body: { pageId: key, coverUrl: value }
    })
    return !!result.ok
  },

  /** Manifest completo: slide dinamiche + impostazioni di rotazione. */
  async getConfig(): Promise<CarouselConfigResponse> {
    const result = await request<CarouselConfigResponse>(adminUrl('get_carousel_config'))
    return {
      managed: !!result.managed,
      slides: Array.isArray(result.slides) ? result.slides : [],
      settings: result.settings || { intervalMs: 6000, pauseOnHover: true }
    }
  },

  /** Salva l'intero manifest in una sola scrittura atomica. */
  async saveConfig(config: CarouselConfig): Promise<boolean> {
    const result = await request<{ ok: boolean }>(adminUrl('set_carousel_config'), {
      method: 'POST',
      body: config
    })
    return !!result.ok
  },

  /** Cancella il manifest: il sito torna agli hardcoded. */
  async resetConfig(): Promise<boolean> {
    const result = await request<{ ok: boolean }>(adminUrl('set_carousel_config'), {
      method: 'POST',
      body: { reset: true }
    })
    return !!result.ok
  }
}

export const coversApi = {
  getCovers: carouselApi.getCovers,
  saveCover: carouselApi.saveCover
}

export const layoutsApi = {
  async get(): Promise<Record<string, LayoutRegistryEntry>> {
    try {
      const data = await ghApi.get('content/layouts/registry.json')
      return JSON.parse(decodeBase64Utf8(data.content)) as Record<string, LayoutRegistryEntry>
    } catch {
      return {}
    }
  },

  async save(
    registry: Record<string, LayoutRegistryEntry>,
    message = 'admin: update layouts'
  ): Promise<{ sha: string }> {
    let sha: string | null = null
    try {
      sha = (await ghApi.get('content/layouts/registry.json')).sha
    } catch {
      /* file non ancora esistente */
    }
    const result = await ghApi.put(
      'content/layouts/registry.json',
      message,
      JSON.stringify(registry, null, 2) + '\n',
      sha
    )
    return { sha: result.content.sha }
  }
}

export interface GlossaryTerm {
  key: string
  title: string
  excerpt: string
  pageLink: string
  iconId: string
}

export interface GlossaryDoc {
  terms: GlossaryTerm[]
  sha?: string
}

export const glossaryApi = {
  async get(): Promise<GlossaryDoc> {
    try {
      const data = await ghApi.get('content/glossary.json')
      const parsed = JSON.parse(decodeBase64Utf8(data.content)) as GlossaryDoc
      return { terms: Array.isArray(parsed.terms) ? parsed.terms : [], sha: data.sha }
    } catch (error) {
      if (error instanceof Error && /404|not found/i.test(error.message)) return { terms: [] }
      throw error
    }
  },
  async save(terms: GlossaryTerm[], sha?: string, message = 'admin: update glossary'): Promise<{ sha: string }> {
    const result = await ghApi.put('content/glossary.json', message, JSON.stringify({ terms }, null, 2) + '\n', sha)
    return { sha: result.content.sha }
  }
}

export const searchApi = {
  async searchContent(query: string): Promise<Array<{ k: string; title: string; icon: string; content: string }>> {
    return request(adminUrl('search_content', { q: query }))
  }
}
