<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { trashApi } from '@/shared/api'
import { useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import type { TrashItem } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const saving = ref<string | null>(null)
const items = ref<TrashItem[]>([])

async function load() {
  loading.value = true
  try {
    items.value = await trashApi.list()
  } catch (e) {
    ui.toast('Errore caricamento cestino: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

async function restore(item: TrashItem) {
  saving.value = item.pageKey
  try {
    await trashApi.restore(item.pageKey)
    items.value = items.value.filter(x => x.pageKey !== item.pageKey)
    ui.toast('Pagina ripristinata', 'success')
  } catch (e) {
    ui.toast('Errore ripristino: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = null
  }
}

async function emptyOne(item: TrashItem) {
  if (!confirm(`Eliminare definitivamente "${item.pageKey}"?`)) return
  saving.value = item.pageKey
  try {
    await trashApi.empty(item.pageKey)
    items.value = items.value.filter(x => x.pageKey !== item.pageKey)
    ui.toast('Eliminata definitivamente', 'success')
  } catch (e) {
    ui.toast('Errore: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = null
  }
}

async function emptyAll() {
  if (!confirm('Svuotare completamente il cestino?')) return
  try {
    await trashApi.empty()
    items.value = []
    ui.toast('Cestino svuotato', 'success')
  } catch (e) {
    ui.toast('Errore: ' + (e instanceof Error ? e.message : String(e)), 'error')
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Cestino</h1>
      <div class="arc-head-actions">
        <button class="btn btn-d" type="button" :disabled="!items.length" @click="emptyAll">Svuota cestino</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <AdminOnly>
      <div class="arc-panel">
      <table class="arc-table">
        <thead>
          <tr><th>Pagina</th><th>Eliminata</th><th>Da</th><th style="text-align:right">Azioni</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="4">Caricamento…</td></tr>
          <tr v-for="item in items" :key="item.pageKey">
            <td><code>{{ item.pageKey }}</code></td>
            <td>{{ item.deletedAt ? new Date(item.deletedAt).toLocaleString('it-IT') : '—' }}</td>
            <td>{{ item.deletedBy || '—' }}</td>
            <td style="text-align:right">
              <button class="btn btn-p btn-sm" type="button" :disabled="saving === item.pageKey" @click="restore(item)">♻️ Ripristina</button>
              <button class="btn btn-d btn-sm" type="button" :disabled="saving === item.pageKey" @click="emptyOne(item)">🗑</button>
            </td>
          </tr>
          <tr v-if="!loading && !items.length"><td colspan="4" class="arc-empty-side">Cestino vuoto.</td></tr>
        </tbody>
      </table>
    </div>
    </AdminOnly>
  </section>
</template>