<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { errorText, formatBytes, mediaApi, mediaName, mediaUrl, compressImage, uploadImage } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
import { useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import SkeletonRows from '@/shared/components/SkeletonRows.vue'
import type { GHFile } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const uploading = ref(false)
const uploadingName = ref('')
const items = ref<GHFile[]>([])
const filter = ref('')
const preview = ref<GHFile | null>(null)
const sortBy = ref<'name' | 'size'>('name')

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  const list = q
    ? items.value.filter((f) => (f.name || '').toLowerCase().includes(q) || (f.path || '').toLowerCase().includes(q))
    : items.value
  return [...list].sort((a, b) =>
    sortBy.value === 'size' ? (b.size || 0) - (a.size || 0) : (a.name || '').localeCompare(b.name || '')
  )
})

const totalSize = computed(() => items.value.reduce((sum, f) => sum + (f.size || 0), 0))

async function load() {
  loading.value = true
  try {
    items.value = await mediaApi.list()
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Libreria non caricata' })
  } finally {
    loading.value = false
  }
}

async function upload(files: File[]) {
  if (!files.length) return
  uploading.value = true
  let done = 0
  for (const file of files) {
    uploadingName.value = file.name
    try {
      const dataUri = await compressImage(file)
      await uploadImage(dataUri, mediaName(file.name))
      done++
    } catch (e) {
      ui.toast(errorText(e), 'error', { title: `Upload di ${file.name} non riuscito` })
    }
  }
  uploading.value = false
  uploadingName.value = ''
  if (done) ui.toast(`${done} immagine/i caricate`, 'success')
  await load()
}

function pickFiles() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = () => void upload(Array.from(input.files || []))
  input.click()
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  void upload(Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/')))
}

async function removeFile(f: GHFile) {
  /* L'eliminazione è un commit sul repository: nessun cestino, quindi
     chiediamo di digitare il nome del file. */
  const ok = await confirmAction({
    title: 'Elimina file dal repository',
    message: `Eliminare definitivamente «${f.name}»?`,
    detail: 'Il file viene rimosso con un commit: l’operazione non è reversibile dal pannello.',
    keyword: f.name,
    confirmLabel: 'Elimina file',
    danger: true
  })
  if (!ok) return
  try {
    await mediaApi.remove(f)
    items.value = items.value.filter((x) => x.path !== f.path)
    if (preview.value?.path === f.path) preview.value = null
    ui.toast('File eliminato', 'success')
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Eliminazione non riuscita' })
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Media</h1>
      <div class="arc-head-actions">
        <button class="btn btn-p" type="button" :disabled="uploading" @click="pickFiles">
          {{ uploading ? `Carico ${uploadingName}…` : '⬆ Carica' }}
        </button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <AdminOnly>
      <div class="arc-panel" style="margin-bottom: 16px; display: flex; gap: 10px; flex-wrap: wrap">
        <input v-model="filter" class="in" style="flex: 1; min-width: 220px" placeholder="🔎 Cerca immagine…" />
        <select v-model="sortBy" class="in" style="max-width: 180px">
          <option value="name">Ordina per nome</option>
          <option value="size">Ordina per peso</option>
        </select>
        <span style="align-self: center; font-size: 12px; color: var(--afg-3)">
          {{ filtered.length }} file · {{ formatBytes(totalSize) }} totali
        </span>
      </div>

      <div class="arc-dropzone" :class="{ 'is-busy': uploading }" @dragover.prevent @drop="onDrop">
        Trascina qui le immagini per caricarle (vengono convertite in WebP e ridimensionate a 1920 px).
      </div>

      <div v-if="loading" class="arc-panel">
        <span class="arc-skel-bar" style="width: 40%"></span>
        <span class="arc-skel-block"></span>
        <span class="arc-skel-block" style="width: 70%"></span>
      </div>

      <div v-else class="arc-media-grid">
        <div v-for="f in filtered" :key="f.sha" class="arc-card arc-media-card">
          <button class="arc-media-thumb" type="button" :aria-label="'Anteprima ' + f.name" @click="preview = f">
            <img :src="mediaUrl(f.name)" :alt="f.name" loading="lazy" />
          </button>
          <div class="arc-media-name" :title="f.path">{{ f.name }}</div>
          <div style="font-size: 11px; color: var(--afg-3)">{{ formatBytes(f.size) }}</div>
          <button class="btn btn-d btn-sm" type="button" style="width: 100%; margin-top: 8px" @click="removeFile(f)">
            🗑 Elimina
          </button>
        </div>
      </div>

      <div v-if="!loading && !filtered.length" class="arc-empty-side">
        {{ items.length ? 'Nessuna immagine corrisponde alla ricerca.' : 'Nessun file nella cartella images/.' }}
      </div>
    </AdminOnly>

    <div v-if="preview" class="arc-modal-backdrop" @click.self="preview = null">
      <div class="arc-modal" style="max-width: 720px">
        <h2 class="arc-modal-title">{{ preview.name }}</h2>
        <img :src="mediaUrl(preview.name)" :alt="preview.name" style="width: 100%; height: auto; border-radius: 8px" />
        <p class="arc-modal-detail">{{ formatBytes(preview.size) }} · {{ preview.path }}</p>
        <div class="arc-modal-actions">
          <a class="btn btn-soft" :href="mediaUrl(preview.name)" target="_blank" rel="noreferrer">Apri originale</a>
          <button class="btn btn-soft" type="button" @click="preview = null">Chiudi</button>
        </div>
      </div>
    </div>
  </section>
</template>
