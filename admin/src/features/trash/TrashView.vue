<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { errorText, trashApi } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
import { useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import SkeletonRows from '@/shared/components/SkeletonRows.vue'
import type { TrashItem } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const busy = ref<string | null>(null)
const items = ref<TrashItem[]>([])
const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    (item) =>
      item.pageKey.toLowerCase().includes(q) ||
      (item.title || '').toLowerCase().includes(q) ||
      (item.deletedBy || '').toLowerCase().includes(q)
  )
})

/** "2 ore fa" è più utile di un timestamp quando si cerca un recupero. */
function relativeTime(value?: string): string {
  if (!value) return '—'
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return '—'
  const diffMinutes = Math.round((Date.now() - then) / 60000)
  if (diffMinutes < 1) return 'adesso'
  if (diffMinutes < 60) return `${diffMinutes} min fa`
  const hours = Math.round(diffMinutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} ${days === 1 ? 'giorno' : 'giorni'} fa`
  return new Date(value).toLocaleDateString('it-IT')
}

function absoluteTime(value?: string): string {
  return value ? new Date(value).toLocaleString('it-IT') : '—'
}

async function load() {
  loading.value = true
  try {
    items.value = await trashApi.list()
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Cestino non caricato' })
  } finally {
    loading.value = false
  }
}

async function restore(item: TrashItem) {
  busy.value = item.pageKey
  try {
    await trashApi.restore(item.pageKey)
    items.value = items.value.filter((x) => x.pageKey !== item.pageKey)
    ui.toast(`«${item.title || item.pageKey}» ripristinata`, 'success')
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Ripristino non riuscito' })
  } finally {
    busy.value = null
  }
}

async function emptyOne(item: TrashItem) {
  const ok = await confirmAction({
    title: 'Eliminazione definitiva',
    message: `Eliminare per sempre «${item.title || item.pageKey}»?`,
    detail: 'Il contenuto viene rimosso dall’archivio del cestino: non sarà più recuperabile dal pannello.',
    keyword: item.pageKey,
    confirmLabel: 'Elimina definitivamente',
    danger: true
  })
  if (!ok) return
  busy.value = item.pageKey
  try {
    await trashApi.empty(item.pageKey)
    items.value = items.value.filter((x) => x.pageKey !== item.pageKey)
    ui.toast('Elemento eliminato definitivamente', 'success')
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Eliminazione non riuscita' })
  } finally {
    busy.value = null
  }
}

async function emptyAll() {
  const count = items.value.length
  const ok = await confirmAction({
    title: 'Svuota cestino',
    message: `Eliminare definitivamente tutti i ${count} elementi del cestino?`,
    detail: 'L’operazione svuota l’archivio: nessun elemento sarà più recuperabile.',
    keyword: 'SVUOTA',
    confirmLabel: 'Svuota cestino',
    danger: true
  })
  if (!ok) return
  busy.value = '*'
  try {
    await trashApi.empty()
    items.value = []
    ui.toast('Cestino svuotato', 'success')
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Svuotamento non riuscito' })
  } finally {
    busy.value = null
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Cestino</h1>
      <div class="arc-head-actions">
        <button class="btn btn-d" type="button" :disabled="!items.length || busy === '*'" @click="emptyAll">
          {{ busy === '*' ? 'Svuotamento…' : 'Svuota cestino' }}
        </button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <AdminOnly>
      <div class="arc-panel" style="margin-bottom: 16px; display: flex; gap: 10px; flex-wrap: wrap">
        <input
          v-model="search"
          class="in"
          style="flex: 1; min-width: 220px"
          placeholder="🔎 Cerca per pagina o autore…"
        />
        <span style="align-self: center; font-size: 12px; opacity: 0.6">
          {{ filtered.length }} / {{ items.length }} elementi
        </span>
      </div>

      <div class="arc-panel">
        <table class="arc-table">
          <thead>
            <tr>
              <th>Pagina</th>
              <th>Eliminata</th>
              <th>Da</th>
              <th style="text-align: right">Azioni</th>
            </tr>
          </thead>
          <SkeletonRows v-if="loading" :cols="4" :rows="3" label="Caricamento cestino" />
          <tbody v-else>
            <tr v-for="item in filtered" :key="item.pageKey">
              <td>
                <code>{{ item.pageKey }}</code>
                <div v-if="item.title" style="font-size: 12px; opacity: 0.65">{{ item.title }}</div>
              </td>
              <td :title="absoluteTime(item.deletedAt)">{{ relativeTime(item.deletedAt) }}</td>
              <td>{{ item.deletedBy || '—' }}</td>
              <td style="text-align: right; white-space: nowrap">
                <button class="btn btn-p btn-sm" type="button" :disabled="busy === item.pageKey" @click="restore(item)">
                  {{ busy === item.pageKey ? 'Ripristino…' : '♻️ Ripristina' }}
                </button>
                <button
                  class="btn btn-d btn-sm"
                  type="button"
                  :disabled="busy === item.pageKey"
                  :aria-label="'Elimina definitivamente ' + item.pageKey"
                  @click="emptyOne(item)"
                >
                  🗑
                </button>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="4" class="arc-empty-side">
                {{ items.length ? 'Nessun risultato per la ricerca.' : 'Cestino vuoto.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminOnly>
  </section>
</template>
