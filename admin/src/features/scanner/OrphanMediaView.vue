<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { scannerApi } from '@/shared/api'
import { useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import type { OrphanMediaItem } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const deleting = ref(false)
const orphans = ref<OrphanMediaItem[]>([])
const selected = ref<Record<string, boolean>>({})

async function load() {
  loading.value = true
  try {
    const res = await scannerApi.findOrphanMedia()
    orphans.value = res.orphans || []
    for (const o of orphans.value) selected.value[o.filename] = selected.value[o.filename] ?? true
  } catch (e) {
    ui.toast('Errore scan: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

function toggleAll(v: boolean) {
  for (const o of orphans.value) selected.value[o.filename] = v
}

async function deleteSelected() {
  const list = orphans.value.filter(o => selected.value[o.filename]).map(o => o.filename)
  if (!list.length) {
    ui.toast('Nessun file selezionato', 'error')
    return
  }
  if (!confirm(`Eliminare definitivamente ${list.length} file dal repo?`)) return
  deleting.value = true
  try {
    await scannerApi.deleteOrphanMedia(list)
    ui.toast(`${list.length} file eliminati`, 'success')
    orphans.value = orphans.value.filter(o => !selected.value[o.filename])
  } catch (e) {
    ui.toast('Errore: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Media orfani</h1>
      <div class="arc-head-actions">
        <button class="btn btn-d" type="button" :disabled="deleting || !orphans.length" @click="deleteSelected">🗑 Elimina selezionati</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Scansiona</button>
      </div>
    </div>

    <AdminOnly>
      <div class="arc-panel" style="margin-bottom:16px">
      <div class="arc-form-actions" style="flex-wrap:wrap">
        <strong>{{ orphans.length }} file non referenziati</strong>
        <span style="flex:1"></span>
        <button class="btn btn-soft btn-sm" type="button" @click="toggleAll(true)">Tutti</button>
        <button class="btn btn-soft btn-sm" type="button" @click="toggleAll(false)">Nessuno</button>
      </div>
    </div>

    <div v-if="loading" class="arc-empty-side">Scan in corso…</div>

    <div v-else class="arc-panel">
      <div v-for="o in orphans" :key="o.filename" class="arc-changelog-item">
        <label class="arc-toggle-line" style="margin:0">
          <input v-model="selected[o.filename]" type="checkbox" />
        </label>
        <img :src="'/images/' + o.filename" :alt="o.filename" style="width:40px;height:40px;object-fit:cover;border-radius:6px" />
        <div style="flex:1">
          <div class="arc-changelog-head">
            <code>{{ o.filename }}</code>
            <span style="margin-left:auto;font-size:12px;opacity:.5">
              {{ o.size ? (o.size / 1024).toFixed(1) + ' kB' : '' }} · {{ o.path }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="!orphans.length" class="arc-empty-side">Nessun file orfano. 🎉</div>
    </div>
    </AdminOnly>
  </section>
</template>