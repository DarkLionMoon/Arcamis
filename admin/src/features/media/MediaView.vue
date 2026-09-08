<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { ghApi, compressImage, uploadImage } from '@/shared/api'
import { useUIStore } from '@/app/store'
import type { GHFile } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const uploading = ref(false)
const items = ref<GHFile[]>([])
const filter = ref('')
const uploadingName = ref('')

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(f => (f.name || '').toLowerCase().includes(q) || (f.path || '').toLowerCase().includes(q))
})

const sorted = computed(() => {
  return [...filtered.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

async function load() {
  loading.value = true
  try {
    const list = await ghApi.list('images')
    items.value = list.filter(f => f.type === 'file')
  } catch (e) {
    ui.toast('Errore caricamento media: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

async function upload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = async () => {
    const files = Array.from(input.files || [])
    if (!files.length) return
    uploading.value = true
    for (const file of files) {
      uploadingName.value = file.name
      try {
        const dataUri = await compressImage(file)
        const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[a-zA-Z0-9]+$/, '') + '-' + Date.now() + '.webp'
        await uploadImage(dataUri, name)
        ui.toast('Caricata: ' + name, 'success')
      } catch (e) {
        ui.toast('Errore upload ' + file.name + ': ' + (e instanceof Error ? e.message : String(e)), 'error')
      }
    }
    uploading.value = false
    uploadingName.value = ''
    void load()
  }
  input.click()
}

async function removeFile(f: GHFile) {
  if (!confirm(`Eliminare "${f.name}" dal repo?`)) return
  try {
    await ghApi.delete(f.path, `admin: delete media ${f.name}`, f.sha)
    items.value = items.value.filter(x => x.path !== f.path)
    ui.toast('Eliminata', 'success')
  } catch (e) {
    ui.toast('Errore: ' + (e instanceof Error ? e.message : String(e)), 'error')
  }
}

function urlOf(f: GHFile) {
  return '/images/' + f.name
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Media</h1>
      <div class="arc-head-actions">
        <button class="btn btn-p" type="button" :disabled="uploading" @click="upload">⬆ Carica</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <div class="arc-panel" style="margin-bottom:16px">
      <input v-model="filter" class="in" style="width:100%" placeholder="🔎 Cerca immagine…" />
    </div>

    <div v-if="loading || uploading" class="arc-empty-side">
      {{ uploading ? 'Caricamento ' + uploadingName + '…' : 'Caricamento…' }}
    </div>

    <div v-else class="arc-media-grid">
      <div v-for="f in sorted" :key="f.sha" class="arc-card arc-media-card">
        <div class="arc-media-thumb">
          <a :href="urlOf(f)" target="_blank" rel="noreferrer">
            <img :src="urlOf(f)" :alt="f.name" loading="lazy" />
          </a>
        </div>
        <div class="arc-media-name" :title="f.path">{{ f.name }}</div>
        <div style="font-size:11px;opacity:.55">{{ (f.size / 1024).toFixed(1) }} kB</div>
        <button class="btn btn-d btn-sm" type="button" style="width:100%;margin-top:8px" @click="removeFile(f)">🗑 Elimina</button>
      </div>
    </div>

    <div v-if="!loading && !sorted.length" class="arc-empty-side">Nessun file nella cartella images/.</div>
  </section>
</template>