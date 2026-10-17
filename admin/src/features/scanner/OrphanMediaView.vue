<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { errorText, formatBytes, mediaUrl, scannerApi } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
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
    ui.toast(errorText(e), 'error', { title: 'Scansione non riuscita' })
  } finally {
    loading.value = false
  }
}

function toggleAll(v: boolean) {
  for (const o of orphans.value) selected.value[o.filename] = v
}

async function deleteSelected() {
  const list = orphans.value.filter((o) => selected.value[o.filename]).map((o) => o.filename)
  if (!list.length) {
    ui.toast('Nessun file selezionato', 'error')
    return
  }
  const ok = await confirmAction({
    title: 'Elimina media orfani',
    message: `Eliminare definitivamente ${list.length} file dal repository?`,
    detail: 'Nessuna pagina li referenzia. Il commit di eliminazione non è reversibile dal pannello.',
    keyword: 'ELIMINA',
    confirmLabel: 'Elimina file',
    danger: true
  })
  if (!ok) return
  deleting.value = true
  try {
    await scannerApi.deleteOrphanMedia(list)
    ui.toast(`${list.length} file eliminati`, 'success')
    orphans.value = orphans.value.filter((o) => !selected.value[o.filename])
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Eliminazione non riuscita' })
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
        <button class="btn btn-d" type="button" :disabled="deleting || !orphans.length" @click="deleteSelected">
          🗑 Elimina selezionati
        </button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Scansiona</button>
      </div>
    </div>

    <AdminOnly>
      <div class="arc-panel" style="margin-bottom: 16px">
        <div class="arc-form-actions" style="flex-wrap: wrap">
          <strong>{{ orphans.length }} file non referenziati</strong>
          <span style="flex: 1"></span>
          <button class="btn btn-soft btn-sm" type="button" @click="toggleAll(true)">Tutti</button>
          <button class="btn btn-soft btn-sm" type="button" @click="toggleAll(false)">Nessuno</button>
        </div>
      </div>

      <div v-if="loading" class="arc-panel">
        <span class="arc-skel-bar" style="width: 38%"></span>
        <span class="arc-skel-block"></span>
        <span class="arc-skel-block" style="width: 64%"></span>
      </div>

      <div v-else class="arc-panel">
        <div v-for="o in orphans" :key="o.filename" class="arc-changelog-item">
          <label class="arc-toggle-line" style="margin: 0">
            <input v-model="selected[o.filename]" type="checkbox" />
          </label>
          <img
            :src="mediaUrl(o.filename)"
            :alt="o.filename"
            loading="lazy"
            style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px"
          />
          <div style="flex: 1">
            <div class="arc-changelog-head">
              <code>{{ o.filename }}</code>
              <span style="margin-left: auto; font-size: 12px; opacity: 0.5">
                {{ formatBytes(o.size) }} · {{ o.path }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="!orphans.length" class="arc-empty-side">Nessun file orfano. 🎉</div>
      </div>
    </AdminOnly>
  </section>
</template>
