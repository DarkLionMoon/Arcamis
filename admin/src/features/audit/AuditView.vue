<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { auditApi } from '@/shared/api'
import { useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import type { AuditEntry } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const entries = ref<AuditEntry[]>([])
const filterAction = ref('')
const filterTarget = ref('')
const actions = computed(() => Array.from(new Set(entries.value.map(e => e.action || '').filter(Boolean))).sort())

const filtered = computed(() => {
  const fa = filterAction.value.trim()
  const ft = filterTarget.value.trim().toLowerCase()
  return entries.value.filter(e =>
    (!fa || e.action === fa) &&
    (!ft || String(e.target || '').toLowerCase().includes(ft))
  )
})

const icon = (a: string) => {
  const map: Record<string, string> = {
    save_page: '💾', create_page: '📄', delete_page: '🗑', set_users: '👥',
    set_cover: '🖼', cover_page: '🖼', save_mappins: '📍', set_site_settings: '⚙️',
    set_webhook: '🔗', set_gh_token: '🔑', restore_trash: '♻️', empty_trash: '🧹',
    login: '🔓', logout: '🔒'
  }
  return map[a] || '◦'
}

const color = (a: string) => {
  const map: Record<string, string> = {
    save_page: '#8fceaa', create_page: '#8fceaa', delete_page: '#e28383',
    empty_trash: '#e28383', set_gh_token: '#e6c471', login: '#b7bfcc'
  }
  return map[a] || undefined
}

async function load() {
  loading.value = true
  try {
    const res = await auditApi.getLog()
    entries.value = res.entries || []
  } catch (e) {
    ui.toast('Errore caricamento log: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  const rows = [['timestamp', 'azione', 'oggetto', 'utente', 'ruolo', 'extra'].join(';')]
  for (const e of filtered.value) {
    rows.push([
      e.timestamp || '',
      e.action || '',
      String(e.target || ''),
      e.user || '',
      e.role || '',
      JSON.stringify(e.extra || '')
    ].join(';'))
  }
  const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'arcamis-audit.csv'
  a.click()
  URL.revokeObjectURL(url)
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
      <div class="arc-panel" style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap">
      <select v-model="filterAction" class="in" style="max-width:220px">
        <option value="">Tutte le azioni</option>
        <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
      </select>
      <input v-model="filterTarget" class="in" style="flex:1;min-width:200px" placeholder="🔎 Filtra per oggetto…" />
      <span style="align-self:center;font-size:12px;opacity:.6">{{ filtered.length }} eventi</span>
    </div>

    <div class="arc-panel">
      <table class="arc-table">
        <thead>
          <tr><th>Quando</th><th></th><th>Azione</th><th>Oggetto</th><th>Utente</th><th>Dettagli</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6">Caricamento…</td></tr>
          <tr v-for="e in filtered" :key="e.timestamp + String(e.action) + String(e.target)">
            <td style="white-space:nowrap;font-size:12px">{{ new Date(e.timestamp || Date.now()).toLocaleString('it-IT') }}</td>
            <td :style="{ color: color(e.action || '') }" style="text-align:center">{{ icon(e.action || '') }}</td>
            <td><code>{{ e.action }}</code></td>
            <td>{{ e.target || '—' }}</td>
            <td>{{ e.user || '—' }}</td>
            <td style="font-size:12px;opacity:.7">{{ e.extra ? JSON.stringify(e.extra).slice(0, 60) : '' }}</td>
          </tr>
          <tr v-if="!loading && !filtered.length"><td colspan="6" class="arc-empty-side">Nessun evento.</td></tr>
        </tbody>
      </table>
    </div>
    </AdminOnly>
  </section>
</template>