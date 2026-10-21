<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { analyticsApi, deployApi, errorText, ghApi, decodeBase64Utf8 } from '@/shared/api'
import { useAnalyticsStore, useDeployStore, useRegistryStore, useUIStore } from '@/app/store'
import { statusOf } from '@/features/pages/workflow'
import VIcon from '@/shared/components/VIcon.vue'
import type { IconName } from '@/shared/icons'
import type { RegistryData } from '@/types'

const analytics = useAnalyticsStore()
const deploy = useDeployStore()
const registry = useRegistryStore()
const ui = useUIStore()

const pageCount = ref(0)
const error = ref<string | null>(null)
const series = ref<Array<{ date: string; views: number }>>([])
const refreshing = ref(false)

async function loadDashboard() {
  try {
    const [a, d, reg, ts] = await Promise.all([
      analyticsApi.getAnalytics(),
      deployApi.getStatus().catch(() => null),
      ghApi.get('content/pages/registry.json'),
      analyticsApi.getTimeSeries(30).catch(() => ({ series: [] }))
    ])
    analytics.setData(a)
    if (d) deploy.setStatus(d)
    series.value = ts.series || []
    const parsed = JSON.parse(decodeBase64Utf8(reg.content)) as RegistryData
    registry.setRegistry(parsed.pages, parsed.sections || [], parsed.ui)
    pageCount.value = parsed.pages?.length ?? 0
    error.value = null
  } catch (e) {
    error.value = errorText(e)
    ui.toast(errorText(e), 'error', { title: 'Dashboard non caricata' })
  }
}

/** Ricontrolla lo stato del deploy senza ricaricare tutto il pannello. */
async function refreshDeploy() {
  refreshing.value = true
  try {
    const status = await deployApi.getStatus()
    deploy.setStatus(status)
    deploy.startTimer(45)
    ui.toast(
      status.configured === false
        ? 'Token Cloudflare non configurato: stato deploy non disponibile'
        : 'Stato deploy aggiornato',
      status.configured === false ? 'warning' : 'success'
    )
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Deploy' })
  } finally {
    refreshing.value = false
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
    case 'failure':
    case 'failed':
      return 'Errore'
    default:
      return s
  }
})

const deployTone = computed(() => {
  const s = deploy.status?.status
  if (!s) return ''
  if (['success', 'published', 'ok'].includes(s)) return 'is-good'
  if (['error', 'failure', 'failed'].includes(s)) return 'is-bad'
  if (['running', 'building', 'queued'].includes(s)) return 'is-warn'
  return ''
})

const lastDeploy = computed(() => {
  const created = deploy.status?.created_on
  if (!created) return ''
  const when = new Date(created)
  return Number.isNaN(when.getTime()) ? '' : when.toLocaleString('it-IT')
})

/** Sparkline 30 giorni: SVG inline, nessuna libreria di grafici. */
const sparkline = computed(() => {
  const values = series.value.map((p) => p.views)
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const step = 100 / (values.length - 1)
  const points = values.map((v, i) => `${(i * step).toFixed(2)},${(30 - (v / max) * 28).toFixed(2)}`)
  const total = values.reduce((sum, v) => sum + v, 0)
  return { points: points.join(' '), total, max }
})

/* ── Operatività redazione: conteggi dal registro caricato sopra ── */
const opsCounts = computed(() => {
  const counts = { draft: 0, review: 0, scheduled: 0, published: 0 }
  for (const entry of registry.pages) counts[statusOf(entry)]++
  return counts
})

const nextScheduled = computed(() => {
  let best: string | null = null
  for (const entry of registry.pages) {
    if (statusOf(entry) === 'scheduled' && entry.publishAt && (!best || entry.publishAt < best)) {
      best = entry.publishAt
    }
  }
  if (!best) return ''
  const date = new Date(best)
  return Number.isNaN(date.getTime()) ? best : date.toLocaleString('it-IT')
})

const quickActions: Array<{ label: string; to: string; icon: IconName; desc: string }> = [
  { label: 'Pagine', to: '/pagine', icon: 'pages', desc: 'Crea e modifica' },
  { label: 'Copertine', to: '/copertine', icon: 'covers', desc: 'Gestisci copertine' },
  { label: 'Media', to: '/media', icon: 'media', desc: 'Libreria file' },
  { label: 'Navigazione', to: '/navigazione', icon: 'navigate', desc: 'Ordina menu' }
]

onMounted(loadDashboard)
onBeforeUnmount(() => deploy.stopTimer())
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
          <div class="arc-card-value" :class="deployTone">{{ deployLabel }}</div>
          <div v-if="deploy.timerActive" class="arc-card-hint">controllo tra {{ deploy.timerSeconds }}s</div>
        </div>
      </div>
    </div>

    <div class="arc-panel" style="margin-bottom: 16px">
      <div class="arc-head-row" style="margin-bottom: 10px">
        <h2 class="arc-panel-title">Operatività redazione</h2>
        <router-link class="btn btn-soft btn-sm" to="/pagine">Vai alle pagine</router-link>
      </div>
      <div class="arc-ops-grid">
        <router-link class="arc-ops-item" to="/pagine">
          <strong>{{ opsCounts.draft }}</strong
          ><span>Bozze</span>
        </router-link>
        <router-link class="arc-ops-item is-warn" to="/pagine">
          <strong>{{ opsCounts.review }}</strong
          ><span>In revisione</span>
        </router-link>
        <router-link class="arc-ops-item" to="/pagine">
          <strong>{{ opsCounts.scheduled }}</strong
          ><span>Programmate</span>
        </router-link>
        <router-link class="arc-ops-item" to="/link-scanner"> <strong>⟳</strong><span>Scanner link</span> </router-link>
        <router-link class="arc-ops-item" to="/missioni"> <strong>🎯</strong><span>Missioni</span> </router-link>
        <router-link class="arc-ops-item" to="/media-orfani"> <strong>🖼</strong><span>Media orfani</span> </router-link>
      </div>
      <p v-if="nextScheduled" class="arc-hint" style="margin: 8px 0 0">
        Prossima pubblicazione programmata: {{ nextScheduled }}
      </p>
    </div>

    <div class="arc-panel" style="margin-bottom: 16px">
      <div class="arc-head-row" style="margin-bottom: 10px">
        <h2 class="arc-panel-title">Visite — ultimi 30 giorni</h2>
        <div class="arc-head-actions">
          <span v-if="sparkline" style="font-size: 12px; color: var(--afg-3)">
            {{ sparkline.total }} visite · picco {{ sparkline.max }}
          </span>
          <button class="btn btn-soft btn-sm" type="button" :disabled="refreshing" @click="refreshDeploy">
            {{ refreshing ? 'Controllo…' : '⟳ Verifica deploy' }}
          </button>
        </div>
      </div>

      <svg
        v-if="sparkline"
        class="arc-spark"
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
        role="img"
        :aria-label="'Andamento delle visite negli ultimi ' + series.length + ' giorni'"
      >
        <polyline :points="sparkline.points" fill="none" stroke="var(--accent)" stroke-width="0.8" />
      </svg>
      <p v-else class="arc-hint">Serie storica non disponibile (nessuna visita registrata nel periodo).</p>

      <p class="arc-hint" style="margin-top: 10px">
        Ogni salvataggio nel pannello crea un commit: Cloudflare Pages ricostruisce il sito (~30 s) e l'edge cache viene
        invalidato per i file modificati. Non serve svuotare la cache a mano.
        <template v-if="lastDeploy"> Ultimo deploy: {{ lastDeploy }}.</template>
      </p>
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

<style scoped>
.arc-spark {
  display: block;
  width: 100%;
  height: 90px;
}

.arc-card-value.is-good {
  color: var(--good);
}

.arc-card-value.is-bad {
  color: var(--bad);
}

.arc-card-value.is-warn {
  color: var(--warn);
}

.arc-card-hint {
  font-size: 11.5px;
  color: var(--afg-3);
}

.arc-ops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}
.arc-ops-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.25));
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
}
.arc-ops-item:hover {
  border-color: var(--accent, #c89b3c);
}
.arc-ops-item strong {
  font-size: 22px;
  font-family: 'Cinzel', serif;
}
.arc-ops-item span {
  font-size: 12px;
  opacity: 0.75;
}
.arc-ops-item.is-warn strong {
  color: var(--warn, #d4a017);
}
</style>
