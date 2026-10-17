<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { auditApi, errorText } from '@/shared/api'
import { useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import SkeletonRows from '@/shared/components/SkeletonRows.vue'
import type { AuditEntry } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const entries = ref<AuditEntry[]>([])
const filterAction = ref('')
const filterTarget = ref('')
const filterUser = ref('')
const range = ref<'24h' | '7d' | '30d' | 'all'>('7d')
/** Il registro può essere lungo: si mostra a pagine, non tutto insieme. */
const pageSize = ref(25)
const visibleCount = ref(25)

const RANGE_MS: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000
}

const actions = computed(() => Array.from(new Set(entries.value.map((e) => e.action || '').filter(Boolean))).sort())

const users = computed(() => Array.from(new Set(entries.value.map((e) => e.user || '').filter(Boolean))).sort())

const filtered = computed(() => {
  const action = filterAction.value.trim()
  const target = filterTarget.value.trim().toLowerCase()
  const user = filterUser.value
  const since = range.value === 'all' ? 0 : Date.now() - RANGE_MS[range.value]
  return entries.value.filter((e) => {
    if (action && e.action !== action) return false
    if (user && e.user !== user) return false
    if (
      target &&
      !String(e.target || '')
        .toLowerCase()
        .includes(target)
    )
      return false
    if (since) {
      const when = new Date(e.timestamp || 0).getTime()
      if (Number.isNaN(when) || when < since) return false
    }
    return true
  })
})

const visible = computed(() => filtered.value.slice(0, visibleCount.value))
const hasFilters = computed(
  () => !!(filterAction.value || filterTarget.value || filterUser.value || range.value !== '7d')
)

function resetFilters() {
  filterAction.value = ''
  filterTarget.value = ''
  filterUser.value = ''
  range.value = '7d'
  visibleCount.value = pageSize.value
}

const icon = (a: string) => {
  const map: Record<string, string> = {
    save_page: '💾',
    create_page: '📄',
    delete_page: '🗑',
    set_users: '👥',
    set_cover: '🖼',
    cover_page: '🖼',
    save_mappins: '📍',
    set_site_settings: '⚙️',
    set_webhook: '🔗',
    set_gh_token: '🔑',
    restore_trash: '♻️',
    empty_trash: '🧹',
    login: '🔓',
    logout: '🔒'
  }
  return map[a] || '◦'
}

const color = (a: string) => {
  const map: Record<string, string> = {
    save_page: 'var(--good)',
    create_page: 'var(--good)',
    delete_page: 'var(--bad)',
    empty_trash: 'var(--bad)',
    set_gh_token: 'var(--warn)',
    set_users: 'var(--warn)',
    login: 'var(--afg-3)'
  }
  return map[a] || 'inherit'
}

const isDestructive = (a: string) => /^(delete_|empty_|restore_version)/.test(a || '')

async function load() {
  loading.value = true
  try {
    const res = await auditApi.getLog()
    entries.value = res.entries || []
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Registro non caricato' })
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  const rows = [['timestamp', 'azione', 'oggetto', 'utente', 'ruolo', 'extra'].join(';')]
  for (const e of filtered.value) {
    rows.push(
      [
        e.timestamp || '',
        e.action || '',
        String(e.target || ''),
        e.user || '',
        e.role || '',
        JSON.stringify(e.extra || '')
      ].join(';')
    )
  }
  const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `arcamis-audit-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ui.toast(`${filtered.value.length} eventi esportati`, 'success')
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Audit</h1>
      <div class="arc-head-actions">
        <button class="btn btn-soft btn-sm" type="button" :disabled="!filtered.length" @click="exportCsv">⬇ CSV</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <AdminOnly>
      <div class="arc-panel" style="margin-bottom: 16px">
        <div class="arc-form-grid">
          <label class="arc-fld">
            <span>Periodo</span>
            <select v-model="range" class="in">
              <option value="24h">Ultime 24 ore</option>
              <option value="7d">Ultimi 7 giorni</option>
              <option value="30d">Ultimi 30 giorni</option>
              <option value="all">Tutto</option>
            </select>
          </label>
          <label class="arc-fld">
            <span>Azione</span>
            <select v-model="filterAction" class="in">
              <option value="">Tutte le azioni</option>
              <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
            </select>
          </label>
          <label class="arc-fld">
            <span>Utente</span>
            <select v-model="filterUser" class="in">
              <option value="">Tutti gli utenti</option>
              <option v-for="u in users" :key="u" :value="u">{{ u }}</option>
            </select>
          </label>
          <label class="arc-fld">
            <span>Oggetto</span>
            <input v-model="filterTarget" class="in" placeholder="🔎 filtra per oggetto…" />
          </label>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap">
          <span style="font-size: 12px; color: var(--afg-3)">
            {{ filtered.length }} di {{ entries.length }} eventi
          </span>
          <button v-if="hasFilters" class="btn btn-soft btn-sm" type="button" @click="resetFilters">
            Azzera filtri
          </button>
        </div>
      </div>

      <div class="arc-panel">
        <table class="arc-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th></th>
              <th>Azione</th>
              <th>Oggetto</th>
              <th>Utente</th>
              <th>Dettagli</th>
            </tr>
          </thead>
          <SkeletonRows v-if="loading" :cols="6" :rows="5" label="Caricamento registro" />
          <tbody v-else>
            <tr v-for="(e, i) in visible" :key="`${e.timestamp}-${e.action}-${e.target}-${i}`">
              <td style="white-space: nowrap; font-size: 12px" :title="e.timestamp">
                {{ new Date(e.timestamp || Date.now()).toLocaleString('it-IT') }}
              </td>
              <td :style="{ color: color(e.action || '') }" style="text-align: center">{{ icon(e.action || '') }}</td>
              <td>
                <code :class="{ 'arc-audit-danger': isDestructive(e.action || '') }">{{ e.action }}</code>
              </td>
              <td>{{ e.target || '—' }}</td>
              <td>{{ e.user || '—' }}</td>
              <td style="font-size: 12px; opacity: 0.75">{{ e.extra ? JSON.stringify(e.extra).slice(0, 60) : '' }}</td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="6" class="arc-empty-side">
                {{ entries.length ? 'Nessun evento con questi filtri.' : 'Nessun evento registrato.' }}
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!loading && filtered.length > visible.length" style="text-align: center; margin-top: 12px">
          <button class="btn btn-soft btn-sm" type="button" @click="visibleCount += pageSize">
            Mostra altri {{ Math.min(pageSize, filtered.length - visible.length) }} eventi
          </button>
        </div>
      </div>
    </AdminOnly>
  </section>
</template>

<style scoped>
.arc-audit-danger {
  color: var(--bad);
}
</style>
