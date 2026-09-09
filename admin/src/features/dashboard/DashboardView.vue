<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { analyticsApi, decodeBase64Utf8, deployApi, ghApi } from '@/shared/api'
import { useAnalyticsStore, useDeployStore, useRegistryStore, useUIStore } from '@/app/store'
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

onMounted(loadDashboard)
</script>

<template>
  <section class="arc-dashboard">
    <h1 class="arc-page-title">Dashboard</h1>

    <div v-if="error" class="arc-alert arc-alert--error">
      Impossibile contattare l'API (serve una sessione admin attiva). {{ error }}
    </div>

    <div class="arc-cards">
      <div class="arc-card">
        <div class="arc-card-label">Visualizzazioni totali</div>
        <div class="arc-card-value">{{ analytics.data?.total ?? '—' }}</div>
      </div>
      <div class="arc-card">
        <div class="arc-card-label">Pagine nel registro</div>
        <div class="arc-card-value">{{ pageCount || '—' }}</div>
      </div>
      <div class="arc-card">
        <div class="arc-card-label">Stato deploy</div>
        <div class="arc-card-value" :class="deploy.status ? 'arc-status-' + deploy.status.status : ''">
          {{ deploy.status ? deploy.status.status : '—' }}
        </div>
      </div>
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
