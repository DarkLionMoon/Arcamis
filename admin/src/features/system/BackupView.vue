<script setup lang="ts">
import { ref } from 'vue'

import { backupApi } from '@/shared/api'
import { useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'

const ui = useUIStore()

const loading = ref(false)
const count = ref(0)

async function createBackup() {
  loading.value = true
  try {
    const data = await backupApi.create()
    count.value = Array.isArray(data) ? data.length : 0
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'arcamis-backup-' + new Date().toISOString().slice(0, 10) + '.json'
    a.click()
    URL.revokeObjectURL(url)
    ui.toast('Backup scaricato', 'success')
  } catch (e) {
    ui.toast('Errore backup: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Backup</h1>
    </div>

    <AdminOnly>
      <div class="arc-panel" style="max-width:520px">
      <p class="arc-hint">Scarica un JSON con tutti i contenuti delle pagine dal repository. Il download parte immediatamente.</p>
      <div class="arc-form-actions" style="margin-top:16px">
        <button class="btn btn-p" type="button" :disabled="loading" @click="createBackup">
          {{ loading ? 'Creazione in corso…' : '⬇ Scarica backup' }}
        </button>
      </div>
      <p v-if="count" style="font-size:12px;opacity:.6;margin-top:8px">{{ count }} pagine incluse.</p>
    </div>
    </AdminOnly>
  </section>
</template>