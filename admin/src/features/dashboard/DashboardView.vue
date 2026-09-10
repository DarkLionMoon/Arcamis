<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { analyticsApi, decodeBase64Utf8, deployApi, ghApi } from '@/shared/api'
import { useAnalyticsStore, useDeployStore, useRegistryStore, useUIStore } from '@/app/store'
import VIcon from '@/shared/components/VIcon.vue'
import type { IconName } from '@/shared/icons'
import type { RegistryData } from '@/types'

const analytics = useAnalyticsStore()
const deploy = useDeployStore()
const registry = useRegistryStore()
const ui = useUIStore()

const pageCount = ref(0)
const error = ref<string | null>(null)

async function loadDashboard() {
  try {
    const [a, d, reg] = await Promise.all([
      analyticsApi.getAnalytics(),
      deployApi.getStatus(),
      ghApi.get('content/pages/registry.json')
    ])
    analytics.setData(a)
    deploy.setStatus(d)
    const parsed = JSON.parse(decodeBase64Utf8(reg.content)) as RegistryData
    registry.setRegistry(parsed.pages, parsed.sections || [], parsed.ui)
    pageCount.value = parsed.pages?.length ?? 0
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    error.value = msg
    ui.toast('Errore caricamento dashboard: ' + msg, 'error')
  }
}

const deployLabel = computed(() => {
  const s = deploy.status?.status
  if (!s) return '—'
  switch (s) {
    case 'idle':
      return 'Pronto'
    case 'queued':
      return 'In coda'
    case 'running':
    case 'building':
      return 'In corso'
    case 'success':
    case 'published':
    case 'ok':
      return 'Completato'
    case 'error':
    case 'failed':
      return 'Errore'
    default:
      return s
  }
})

const quickActions: Array<{ label: string; to: string; icon: IconName; desc: string }> = [
  { label: 'Pagine', to: '/pagine', icon: 'pages', desc: 'Crea e modifica' },
  { label: 'Copertine', to: '/copertine', icon: 'covers', desc: 'Gestisci copertine' },
  { label: 'Media', to: '/media', icon: 'media', desc: 'Libreria file' },
  { label: 'Navigazione', to: '/navigazione', icon: 'navigate', desc: 'Ordina menu' }
]

onMounted(loadDashboard)
</script>

<template>
  <section class="arc-dashboard">
    <h1 class="arc-page-title">Dashboard</h1>

    <div v-if="error" class="arc-alert arc-alert--error">
      Impossibile contattare l'API (serve una sessione admin attiva). {{ error }}
    </div>

    <div class="arc-cards">
      <div class="arc-card arc-card--stat">
        <div class="arc-stat-ico"><VIcon :name="'dashboard'" :size="20" /></div>
        <div>
          <div class="arc-card-label">Visualizzazioni totali</div>
          <div class="arc-card-value">{{ analytics.data?.total ?? '—' }}</div>
        </div>
      </div>
      <div class="arc-card arc-card--stat">
        <div class="arc-stat-ico"><VIcon :name="'pages'" :size="20" /></div>
        <div>
          <div class="arc-card-label">Pagine nel registro</div>
          <div class="arc-card-value">{{ pageCount || '—' }}</div>
        </div>
      </div>
      <div class="arc-card arc-card--stat">
        <div class="arc-stat-ico"><VIcon :name="'settings'" :size="20" /></div>
        <div>
          <div class="arc-card-label">Stato deploy</div>
          <div
            class="arc-card-value"
            :class="deploy.status ? 'arc-status-' + deploy.status.status : ''"
          >
            {{ deployLabel }}
          </div>
        </div>
      </div>
    </div>

    <div class="arc-quick-title">Azioni rapide</div>
    <div class="arc-quick-grid">
      <router-link v-for="a in quickActions" :key="a.to" :to="a.to" class="arc-quick">
        <span class="arc-quick-ico"><VIcon :name="a.icon" :size="18" /></span>
        <span>
          <span class="arc-quick-label">{{ a.label }}</span>
          <span class="arc-quick-desc">{{ a.desc }}</span>
        </span>
        <span class="arc-quick-chev"><VIcon :name="'chevron'" :size="14" /></span>
      </router-link>
    </div>

    <div v-if="analytics.data?.pages?.length" class="arc-panel">
      <h2 class="arc-panel-title">Pagine più viste</h2>
      <table class="arc-table">
        <thead>
          <tr>
            <th>Pagina</th>
            <th>Visualizzazioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in analytics.data.pages.slice(0, 10)" :key="p.pageKey">
            <td>{{ p.pageKey }}</td>
            <td>{{ p.views }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>