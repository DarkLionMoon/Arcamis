/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Typed API Client
   All GitHub API operations via server-side proxy (no PAT in browser)
   ════════════════════════════════════════════════════════════════ */

import { useAuthStore } from '@/app/store'
import type {
  GHFile,
  PageContent,
  MapData,
  CoversMap,
  AnalyticsData,
  AuditEntry,
  DeployStatus,
  User,
  UserRole,
  SiteSettings,
  WebhookConfig,
  GhTokenStatus,
  TrashItem,
  ScanIssue,
  OrphanMediaItem
} from '@/types'

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────
const CONTENT_PATH = 'content/pages'
const API_BASE = '/api'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function getAuthHeaders(): HeadersInit {
  const auth = useAuthStore()
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  if (auth.csrfToken) {
    headers['X-CSRF-Token'] = auth.csrfToken
  }
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error(error.error || `Request failed: ${response.status}`)
  }
  return response.json()
}

function b64encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

function b64decode(str: string): string {
  return decodeURIComponent(escape(atob(str)))
}

// ──────────────────────────────────────────────
// GitHub Proxy API
// ──────────────────────────────────────────────
export const ghApi = {
  // GET file
  async get(path: string, ref?: string): Promise<{ content: string; sha: string }> {
    const params = new URLSearchParams({ path })
    if (ref) params.set('ref', ref)
    const response = await fetch(`${API_BASE}/gh?${params}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // PUT file (create or update)
  async put(
    path: string,
    message: string,
    content: string,
    sha?: string | null
  ): Promise<{ content: { sha: string } }> {
    const response = await fetch(`${API_BASE}/gh`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action: 'put',
        payload: { path, message, content: b64encode(content), sha: sha || null }
      })
    })
    return handleResponse(response)
  },

  // PUT binary file (images)
  async putBinary(path: string, message: string, dataUri: string): Promise<{ content: { sha: string } }> {
    const match = dataUri.match(/^data:[^;]+;base64,(.*)$/)
    const response = await fetch(`${API_BASE}/gh`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action: 'binary',
        payload: { path, message, content: match ? match[1] : dataUri, sha: null }
      })
    })
    return handleResponse(response)
  },

  // DELETE file
  async delete(path: string, message: string, sha: string): Promise<void> {
    const response = await fetch(`${API_BASE}/gh`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'delete', payload: { path, message, sha } })
    })
    await handleResponse(response)
  },

  // Multi-file commit
  async commitMulti(
    files: Array<{ path: string; content: string }>,
    message: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/gh`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action: 'commit_multi',
        payload: { files, message }
      })
    })
    await handleResponse(response)
  },

  // Get directory listing
  async list(path: string): Promise<GHFile[]> {
    const response = await fetch(`${API_BASE}/gh?path=${encodeURIComponent(path)}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get commit history
  async commits(path: string, perPage = 25): Promise<Array<{ sha: string; commit: { author: { date: string }; message: string } }>> {
    const response = await fetch(`${API_BASE}/gh`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'commits', payload: { path, per_page: perPage } })
    })
    return handleResponse(response)
  },

  // CI Status
  async ciStatus(): Promise<DeployStatus | null> {
    try {
      const response = await fetch(`${API_BASE}/gh`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'ci_status', payload: {} })
      })
      return handleResponse(response)
    } catch {
      return null
    }
  }
}

// ──────────────────────────────────────────────
// Auth API
// ──────────────────────────────────────────────
export const authApi = {
  async login(username: string, password: string, remember = false): Promise<{ role: UserRole }> {
    const response = await fetch(`${API_BASE}/admin?action=login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember })
    })
    return handleResponse(response)
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/admin?action=logout`, {
      method: 'POST',
      credentials: 'include'
    })
  },

  async getCsrf(): Promise<{ token: string }> {
    const response = await fetch(`${API_BASE}/admin?action=get_csrf`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE}/admin?action=get_users`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async saveUsers(users: User[]): Promise<void> {
    const response = await fetch(`${API_BASE}/admin?action=set_users`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ users })
    })
    await handleResponse(response)
  }
}

// ──────────────────────────────────────────────
// Pages API
// ──────────────────────────────────────────────
export const pagesApi = {
  async get(key: string): Promise<PageContent> {
    const data = await ghApi.get(`${CONTENT_PATH}/${key}.json`)
    return JSON.parse(b64decode(data.content))
  },

  async save(page: PageContent, message: string): Promise<{ sha: string }> {
    const result = await ghApi.put(
      `${CONTENT_PATH}/${page.k}.json`,
      message,
      JSON.stringify(page, null, 2),
      page.sha
    )
    return { sha: result.content.sha }
  },

  async create(page: PageContent, message: string): Promise<{ sha: string }> {
    const result = await ghApi.put(
      `${CONTENT_PATH}/${page.k}.json`,
      message,
      JSON.stringify(page, null, 2),
      null
    )
    return { sha: result.content.sha }
  },

  async delete(key: string, sha: string, message: string): Promise<void> {
    await ghApi.delete(`${CONTENT_PATH}/${key}.json`, message, sha)
  },

  async list(): Promise<GHFile[]> {
    return ghApi.list(CONTENT_PATH)
  },

  async getHistory(key: string): Promise<Array<{ sha: string; commit: { author: { date: string }; message: string } }>> {
    return ghApi.commits(`${CONTENT_PATH}/${key}.json`)
  },

  async getAt(key: string, ref: string): Promise<PageContent> {
    const data = await ghApi.get(`${CONTENT_PATH}/${key}.json`, ref)
    return JSON.parse(b64decode(data.content))
  }
}

// ──────────────────────────────────────────────
// Registry API
// ──────────────────────────────────────────────
export const registryApi = {
  async get(): Promise<{ pages: any[]; sections?: any[]; ui?: any; sitemap?: any; sha?: string }> {
    const data = await ghApi.get('content/pages/registry.json')
    const parsed = JSON.parse(b64decode(data.content)) as { pages: any[]; sections?: any[]; ui?: any; sitemap?: any }
    return { ...parsed, sha: data.sha }
  },

  async save(pages: any[], ui?: any, message = 'admin: update registry'): Promise<{ sha: string }> {
    const current = await this.get()
    const { sha: _sha, ...rest } = current
    const payload = { ...rest, pages, ui: ui || rest.ui }
    const result = await ghApi.put(
      'content/pages/registry.json',
      message,
      JSON.stringify(payload, null, 2) + '\n',
      current.sha
    )
    return { sha: result.content.sha }
  }
}

// ──────────────────────────────────────────────
// Map API
// ──────────────────────────────────────────────
export const mapApi = {
  async get(): Promise<MapData> {
    try {
      const data = await ghApi.get('content/mappins.json')
      return JSON.parse(b64decode(data.content))
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
    const result = await ghApi.put(
      'content/mappins.json',
      message,
      JSON.stringify(data, null, 2) + '\n',
      sha
    )
    return { sha: result.content.sha }
  }
}

// ──────────────────────────────────────────────
// Carousel API (KV storage)
// ──────────────────────────────────────────────
export const carouselApi = {
  async getCovers(): Promise<Record<string, string>> {
    const response = await fetch(`${API_BASE}/admin?action=get_covers`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async saveCover(key: string, value: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/admin?action=set_cover`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pageId: key, coverUrl: value })
    })
    const result = await handleResponse<{ ok: boolean }>(response)
    return result.ok
  }
}

// ──────────────────────────────────────────────
// Covers API (page covers)
// ──────────────────────────────────────────────
export const coversApi = {
  async getCovers(): Promise<CoversMap> {
    return carouselApi.getCovers()
  },

  async saveCover(pageId: string, url: string): Promise<boolean> {
    return carouselApi.saveCover(pageId, url)
  }
}

// ──────────────────────────────────────────────
// Analytics API
// ──────────────────────────────────────────────
export const analyticsApi = {
  async getAnalytics(): Promise<AnalyticsData> {
    const response = await fetch(`${API_BASE}/admin?action=get_analytics`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async getTimeSeries(days = 30): Promise<{ series: Array<{ date: string; views: number }> }> {
    const response = await fetch(`${API_BASE}/admin?action=get_analytics_timeseries&days=${days}`, {
      credentials: 'include'
    })
    return handleResponse(response)
  }
}

// ──────────────────────────────────────────────
// Audit API
// ──────────────────────────────────────────────
export const auditApi = {
  async getLog(): Promise<{ entries: AuditEntry[] }> {
    const response = await fetch(`${API_BASE}/admin?action=get_log`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async log(action: string, target: string, extra: Record<string, unknown> = {}): Promise<void> {
    const auth = useAuthStore()
    await fetch(`${API_BASE}/admin?action=audit`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action,
        target,
        extra,
        user: auth.user,
        role: auth.role
      })
    })
  }
}

// ──────────────────────────────────────────────
// Backup API
// ──────────────────────────────────────────────
export const backupApi = {
  async create(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/admin?action=backup_content`, {
      credentials: 'include'
    })
    return handleResponse(response)
  }
}

// ──────────────────────────────────────────────
// Deploy API
// ──────────────────────────────────────────────
export const deployApi = {
  async getStatus(): Promise<DeployStatus> {
    const response = await fetch(`${API_BASE}/deploy`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async trigger(): Promise<void> {
    await fetch(`${API_BASE}/deploy`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders()
    })
  }
}

// ──────────────────────────────────────────────
// Search API
// ──────────────────────────────────────────────
export const searchApi = {
  async searchContent(query: string): Promise<Array<{ k: string; title: string; icon: string; content: string }>> {
    const response = await fetch(`${API_BASE}/admin?action=search_content&q=${encodeURIComponent(query)}`, {
      credentials: 'include'
    })
    return handleResponse(response)
  }
}

// ──────────────────────────────────────────────
// Navigation Audit API
// ──────────────────────────────────────────────
export const navAuditApi = {
  async analyze(): Promise<any> {
    const response = await fetch(`${API_BASE}/admin?action=nav_audit`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async applyFixes(fixes: any): Promise<void> {
    const response = await fetch(`${API_BASE}/admin?action=nav_audit_fix`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(fixes)
    })
    await handleResponse(response)
  }
}

// ──────────────────────────────────────────────
// Layouts Registry API
// ──────────────────────────────────────────────
export const layoutsApi = {
  async get(): Promise<Record<string, any>> {
    try {
      const data = await ghApi.get('content/layouts/registry.json')
      return JSON.parse(b64decode(data.content))
    } catch {
      return {}
    }
  },

  async save(registry: Record<string, any>, message = 'admin: update layouts'): Promise<{ sha: string }> {
    const current = await this.get().catch(() => ({ sha: null }))
    const result = await ghApi.put(
      'content/layouts/registry.json',
      message,
      JSON.stringify(registry, null, 2) + '\n',
      current.sha || null
    )
    return { sha: result.content.sha }
  }
}

// ──────────────────────────────────────────────
// Image Upload Helpers
// ──────────────────────────────────────────────
export async function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/webp', quality))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadImage(dataUri: string, filename: string): Promise<string> {
  await ghApi.putBinary(`images/${filename}`, `admin: upload image ${filename}`, dataUri)
  return `/images/${filename}`
}

// ──────────────────────────────────────────────
// Session Check API
// ──────────────────────────────────────────────
export async function checkSession(): Promise<{ user: string; role: UserRole } | null> {
  try {
    const response = await fetch(`${API_BASE}/admin?action=check`, {
      credentials: 'include'
    })
    return handleResponse(response)
  } catch {
    return null
  }
}

// ──────────────────────────────────────────────
// Site Settings API
// ──────────────────────────────────────────────
export const settingsApi = {
  async getSettings(): Promise<SiteSettings> {
    const response = await fetch(`${API_BASE}/admin?action=get_site_settings`, {
      credentials: 'include'
    })
    const json = await handleResponse<{ settings: SiteSettings }>(response)
    return json.settings || {}
  },

  async saveSettings(settings: SiteSettings): Promise<void> {
    const response = await fetch(`${API_BASE}/admin?action=set_site_settings`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings })
    })
    await handleResponse(response)
  },

  async getWebhook(): Promise<WebhookConfig> {
    const response = await fetch(`${API_BASE}/admin?action=get_webhook`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async setWebhook(webhookUrl: string, enabled: boolean): Promise<void> {
    const response = await fetch(`${API_BASE}/admin?action=set_webhook`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ webhookUrl, enabled })
    })
    await handleResponse(response)
  },

  async testWebhook(): Promise<{ ok: boolean; message?: string }> {
    const response = await fetch(`${API_BASE}/admin?action=test_webhook`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: '{}'
    })
    return handleResponse(response)
  },

  async getGhTokenStatus(): Promise<GhTokenStatus> {
    const response = await fetch(`${API_BASE}/admin?action=gh_token_status`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async setGhToken(token: string): Promise<void> {
    const response = await fetch(`${API_BASE}/admin?action=set_gh_token`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token })
    })
    await handleResponse(response)
  }
}

// ──────────────────────────────────────────────
// Trash API
// ──────────────────────────────────────────────
export const trashApi = {
  async list(): Promise<TrashItem[]> {
    const response = await fetch(`${API_BASE}/admin?action=list_trash`, {
      credentials: 'include'
    })
    const json = await handleResponse<{ trash: TrashItem[] }>(response)
    return json.trash || []
  },

  async restore(pageKey: string): Promise<void> {
    const response = await fetch(`${API_BASE}/admin?action=restore_trash`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pageKey })
    })
    await handleResponse(response)
  },

  async empty(pageKey?: string): Promise<void> {
    const response = await fetch(`${API_BASE}/admin?action=empty_trash`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(pageKey ? { pageKey } : {})
    })
    await handleResponse(response)
  }
}

// ──────────────────────────────────────────────
// Scanner API (link check + orphan media)
// ──────────────────────────────────────────────
export const scannerApi = {
  async scanLinks(): Promise<{ issues: ScanIssue[]; total: number }> {
    const response = await fetch(`${API_BASE}/admin?action=scan_links`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async findOrphanMedia(): Promise<{ orphans: OrphanMediaItem[] }> {
    const response = await fetch(`${API_BASE}/admin?action=find_orphan_media`, {
      credentials: 'include'
    })
    return handleResponse(response)
  },

  async deleteOrphanMedia(filenames: string[]): Promise<void> {
    const response = await fetch(`${API_BASE}/admin?action=delete_orphan_media`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ filenames })
    })
    await handleResponse(response)
  }
}