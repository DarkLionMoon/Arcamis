/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — system.ts
   Autenticazione, impostazioni, audit, analytics, cestino, scanner,
   backup e stato del deploy.
   ════════════════════════════════════════════════════════════════ */

import { API_BASE, adminUrl, request } from './http'
import type {
  AnalyticsData,
  AuditEntry,
  DeployStatus,
  GhTokenStatus,
  OrphanMediaItem,
  ScanIssue,
  SiteSettings,
  TrashItem,
  User,
  UserRole,
  WebhookConfig
} from '@/types'

/* ── Autenticazione ─────────────────────────────────────────── */

export const authApi = {
  /** Il login è l'unica chiamata senza CSRF: la sessione non esiste ancora. */
  async login(username: string, password: string, remember = false): Promise<{ role: UserRole; csrf: string }> {
    return request<{ role: UserRole; csrf: string }>(adminUrl('login'), {
      method: 'POST',
      body: { username, password, remember },
      csrf: false
    })
  },

  async logout(): Promise<void> {
    await request(adminUrl('logout'), { method: 'POST' })
  },

  async getCsrf(): Promise<{ csrf: string }> {
    return request<{ csrf: string }>(adminUrl('get_csrf'))
  },

  async getUsers(): Promise<User[]> {
    const result = await request<{ users?: User[] }>(adminUrl('get_users'))
    return result.users || []
  },

  async saveUsers(users: User[]): Promise<void> {
    await request(adminUrl('set_users'), { method: 'POST', body: { users } })
  }
}

/** Verifica la sessione lato server: mai fidarsi di sessionStorage. */
export async function checkSession(): Promise<{
  ok: boolean
  user?: string
  role?: UserRole
  csrf?: string
} | null> {
  try {
    return await request(adminUrl('check'))
  } catch {
    return null
  }
}

/* ── Impostazioni del sito ─────────────────────────────────── */

export const settingsApi = {
  async getSettings(): Promise<SiteSettings> {
    const json = await request<{ settings?: SiteSettings }>(adminUrl('get_site_settings'))
    return json.settings || {}
  },

  async saveSettings(settings: SiteSettings): Promise<void> {
    await request(adminUrl('set_site_settings'), { method: 'POST', body: { settings } })
  },

  async getWebhook(): Promise<WebhookConfig> {
    const result = await request<{ configured?: boolean; enabled?: boolean; url?: string }>(adminUrl('get_webhook'))
    return { webhookUrl: result.url, enabled: result.enabled, configured: result.configured }
  },

  async setWebhook(webhookUrl: string, enabled: boolean): Promise<void> {
    await request(adminUrl('set_webhook'), { method: 'POST', body: { webhookUrl, enabled } })
  },

  async testWebhook(): Promise<{ ok: boolean; message?: string }> {
    return request(adminUrl('test_webhook'), { method: 'POST', body: {} })
  },

  async getGhTokenStatus(): Promise<GhTokenStatus> {
    return request(adminUrl('gh_token_status'))
  },

  async setGhToken(token: string): Promise<void> {
    await request(adminUrl('set_gh_token'), { method: 'POST', body: { token } })
  }
}

/* ── Analytics ─────────────────────────────────────────────── */

export const analyticsApi = {
  async getAnalytics(): Promise<AnalyticsData> {
    const result = await request<{ total: number; pages: AnalyticsData['pages'] }>(adminUrl('get_analytics'))
    return { ...result, series: [] }
  },

  async getTimeSeries(days = 30): Promise<{ series: Array<{ date: string; views: number }> }> {
    return request(adminUrl('get_analytics_timeseries', { days }))
  }
}

/* ── Audit log ─────────────────────────────────────────────── */

export const auditApi = {
  async getLog(): Promise<{ entries: AuditEntry[] }> {
    return request(adminUrl('get_log'))
  },

  /** L'identità la aggiunge il server dalla sessione: qui non si invia nulla. */
  async log(action: string, target: string, extra: Record<string, unknown> = {}): Promise<void> {
    await request(adminUrl('audit'), { method: 'POST', body: { action, target, extra } })
  }
}

/* ── Cestino ───────────────────────────────────────────────── */

export const trashApi = {
  async list(): Promise<TrashItem[]> {
    const json = await request<{ items?: TrashItem[] }>(adminUrl('list_trash'))
    return json.items || []
  },

  async restore(pageKey: string): Promise<void> {
    await request(adminUrl('restore_trash'), { method: 'POST', body: { pageKey } })
  },

  async empty(pageKey?: string): Promise<void> {
    await request(adminUrl('empty_trash'), { method: 'POST', body: pageKey ? { pageKey } : {} })
  }
}

/* ── Scanner (link rotti e media orfani) ───────────────────── */

export const scannerApi = {
  async scanLinks(): Promise<{ issues: ScanIssue[]; total: number }> {
    return request(adminUrl('scan_links'))
  },

  async findOrphanMedia(): Promise<{ orphans: OrphanMediaItem[] }> {
    return request(adminUrl('find_orphan_media'))
  },

  async deleteOrphanMedia(filenames: string[]): Promise<void> {
    await request(adminUrl('delete_orphan_media'), { method: 'POST', body: { filenames } })
  }
}

/* ── Backup ────────────────────────────────────────────────── */

export const backupApi = {
  async create(): Promise<Array<{ path: string; size?: number }>> {
    return request(adminUrl('backup_content'))
  }
}

/* ── Deploy ────────────────────────────────────────────────── */

export const deployApi = {
  /** Stato dell'ultimo deploy Cloudflare Pages (o `configured: false`). */
  async getStatus(): Promise<DeployStatus> {
    return request<DeployStatus>(`${API_BASE}/deploy`, { timeoutMs: 12_000 })
  }
}

/* ── Audit della navigazione ───────────────────────────────── */

export const navAuditApi = {
  async analyze(): Promise<{ issues: Array<Record<string, unknown>> }> {
    return request(adminUrl('nav_audit'))
  },

  async applyFixes(fixes: Record<string, unknown>): Promise<void> {
    await request(adminUrl('nav_audit_fix'), { method: 'POST', body: fixes })
  }
}
