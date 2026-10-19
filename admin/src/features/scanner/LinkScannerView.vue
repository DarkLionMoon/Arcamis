<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { decodeBase64Utf8, errorText, ghApi, registryApi, scannerApi } from '@/shared/api'
import { useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import type { ScanIssue } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const issues = ref<ScanIssue[]>([])

async function load() {
  loading.value = true
  try {
    const res = await scannerApi.scanLinks()
    issues.value = res.issues || []
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Scansione non riuscita' })
  } finally {
    loading.value = false
  }
}

const typeLabel = (t: string) => {
  if (t === 'broken') return '🔗 Link rotti'
  if (t === 'alt') return '🖼 Immagini senza alt'
  return t
}

/* ── Menzioni non linkate ───────────────────────────────
   Incrocia l'indice di ricerca (ultimo deploy) con i titoli delle
   pagine: se Q nomina P ma non la linka, propone il collegamento.
   La verifica del link usa il file sorgente via API. */
interface Mention {
  fromKey: string
  fromTitle: string
  toTitle: string
  route: string
  count: number
}

const mentions = ref<Mention[]>([])
const scanningMentions = ref(false)
const mentionsDone = ref(false)

function escRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function scanMentions(): Promise<void> {
  scanningMentions.value = true
  mentionsDone.value = false
  mentions.value = []
  try {
    const [idxRes, reg] = await Promise.all([
      fetch('/content/search-index.json').then((r) => (r.ok ? r.json() : [])),
      registryApi.get()
    ])
    const idx = (Array.isArray(idxRes) ? idxRes : []) as Array<{
      id: string
      title: string
      text: string
    }>
    if (!idx.length) {
      ui.toast('Indice di ricerca non disponibile (in dev non è servito)', 'warning')
      return
    }
    const byId = new Map(reg.pages.map((entry) => ['pag-' + entry.k, entry]))
    const pairs: Mention[] = []
    for (const target of idx) {
      const title = (target.title || '').trim()
      if (title.length < 5) continue
      const entry = byId.get(target.id)
      if (!entry?.path) continue
      const route = '/' + entry.path
      let re: RegExp
      try {
        re = new RegExp(`\\b${escRe(title)}\\b`, 'gi')
      } catch {
        continue
      }
      for (const source of idx) {
        if (source.id === target.id) continue
        const matches = (source.text || '').match(re)
        if (matches) {
          pairs.push({
            fromKey: source.id.replace(/^pag-/, ''),
            fromTitle: source.title,
            toTitle: title,
            route,
            count: matches.length
          })
        }
      }
    }
    pairs.sort((a, b) => b.count - a.count)
    const checked: Mention[] = []
    for (const pair of pairs.slice(0, 30)) {
      try {
        const raw = await ghApi.get(`content/pages/${pair.fromKey}.json`)
        const content = decodeBase64Utf8(raw.content)
        if (content.includes(`(${pair.route}`)) continue
        checked.push(pair)
        if (checked.length >= 50) break
      } catch {
        /* pagina non leggibile: salta la coppia */
      }
    }
    mentions.value = checked
    mentionsDone.value = true
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Scansione menzioni non riuscita' })
  } finally {
    scanningMentions.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Scanner link</h1>
      <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Scansiona</button>
    </div>

    <AdminOnly>
      <div class="arc-panel">
        <h3 class="arc-panel-title">Problemi trovati ({{ issues.length }})</h3>
        <div v-if="loading" class="arc-scan-skel">
          <span class="arc-skel-bar" style="width: 32%"></span>
          <span class="arc-skel-block"></span>
          <span class="arc-skel-block" style="width: 72%"></span>
          <span class="arc-skel-block" style="width: 55%"></span>
        </div>
        <div v-for="issue in issues" :key="issue.pageKey + issue.type" class="arc-changelog-item">
          <div style="flex: 1">
            <div class="arc-changelog-head">
              <strong>{{ issue.pageKey }}</strong>
              <span style="margin-left: 8px">{{ typeLabel(issue.type) }}</span>
            </div>
            <p v-if="issue.broken?.length" style="font-size: 12px; opacity: 0.75; margin: 6px 0 0">
              → <code v-for="(b, i) in issue.broken.slice(0, 6)" :key="i">{{ b.target }}</code>
            </p>
            <p v-if="issue.missingAlt?.length" style="font-size: 12px; opacity: 0.75; margin: 6px 0 0">
              <code v-for="(m, i) in issue.missingAlt.slice(0, 6)" :key="i">{{ m.src }}</code>
            </p>
            <p v-if="issue.detail" style="font-size: 12px; opacity: 0.6; margin: 4px 0 0">{{ issue.detail }}</p>
          </div>
        </div>
        <div v-if="!loading && !issues.length" class="arc-empty-side">Nessun problema rilevato. 🎉</div>
      </div>

      <div class="arc-panel">
        <div class="arc-head-row" style="margin-bottom: 10px">
          <h3 class="arc-panel-title">Menzioni non linkate ({{ mentions.length }})</h3>
          <button class="btn btn-soft btn-sm" type="button" :disabled="scanningMentions" @click="scanMentions">
            {{ scanningMentions ? 'Scansione…' : '🔍 Cerca menzioni' }}
          </button>
        </div>
        <p class="arc-hint">Pagine che nominano un'altra pagina senza collegarla: un click per aprire l'editor.</p>
        <div v-for="mention in mentions" :key="mention.fromKey + mention.toTitle" class="arc-changelog-item">
          <div style="flex: 1">
            <div class="arc-changelog-head">
              <strong>{{ mention.fromTitle }}</strong>
              <span style="margin-left: 8px">nomina «{{ mention.toTitle }}» ×{{ mention.count }}</span>
            </div>
            <p style="font-size: 12px; opacity: 0.75; margin: 6px 0 0">
              Suggerito: <code>[{{ mention.toTitle }}]({{ mention.route }})</code>
            </p>
          </div>
          <router-link class="btn btn-soft btn-sm" :to="'/editor/' + mention.fromKey">Apri editor</router-link>
        </div>
        <div v-if="mentionsDone && !mentions.length" class="arc-empty-side">
          Nessuna menzione senza link. La wiki è ben collegata! 🎉
        </div>
      </div>
    </AdminOnly>
  </section>
</template>
