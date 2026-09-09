<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { scannerApi } from '@/shared/api'
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
    ui.toast('Errore scan: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

const typeLabel = (t: string) => {
  if (t === 'broken') return '🔗 Link rotti'
  if (t === 'alt') return '🖼 Immagini senza alt'
  return t
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
        <div v-if="loading" class="arc-empty-side">Scan in corso…</div>
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
    </AdminOnly>
  </section>
</template>
