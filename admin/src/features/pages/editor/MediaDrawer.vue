<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { useUIStore } from '@/app/store'
import { compressImage, errorText, formatBytes, mediaApi, mediaName, mediaUrl, uploadImage } from '@/shared/api'
import VIcon from '@/shared/components/VIcon.vue'
import type { GHFile } from '@/types'

const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'pick', path: string): void }>()

const ui = useUIStore()
const loading = ref(false)
const loaded = ref(false)
const uploading = ref(false)
const query = ref('')
const items = ref<GHFile[]>([])
const searchInput = ref<HTMLInputElement | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = q ? items.value.filter((file) => (file.name || '').toLowerCase().includes(q)) : items.value
  return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

async function load(): Promise<void> {
  loading.value = true
  try {
    items.value = await mediaApi.list()
    loaded.value = true
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Libreria non caricata' })
  } finally {
    loading.value = false
  }
}

async function upload(files: File[]): Promise<void> {
  if (!files.length) return
  uploading.value = true
  try {
    const dataUri = await compressImage(files[0])
    const path = await uploadImage(dataUri, mediaName(files[0].name))
    ui.toast('Immagine caricata', 'success')
    await load()
    choose(path)
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Upload non riuscito' })
  } finally {
    uploading.value = false
  }
}

function pickFile(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => void upload(Array.from(input.files || []))
  input.click()
}

function onDrop(event: DragEvent): void {
  event.preventDefault()
  void upload(Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/')))
}

function choose(path: string): void {
  emit('pick', path)
  emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      window.removeEventListener('keydown', onKeydown)
      return
    }
    window.addEventListener('keydown', onKeydown)
    if (!loaded.value) await load()
    await nextTick()
    searchInput.value?.focus()
  }
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="open" class="arc-drawer-backdrop" @click.self="emit('close')">
    <aside class="arc-drawer" role="dialog" aria-modal="true" aria-label="Libreria immagini">
      <header class="arc-drawer-head">
        <div>
          <h2 class="arc-drawer-title">Libreria immagini</h2>
          <p class="arc-drawer-sub">{{ title || 'Scegli un file o caricane uno nuovo' }}</p>
        </div>
        <button class="arc-icon-btn" type="button" aria-label="Chiudi" @click="emit('close')">
          <VIcon name="close" :size="16" />
        </button>
      </header>

      <div class="arc-drawer-tools">
        <input ref="searchInput" v-model="query" class="in" placeholder="🔎 Cerca immagine…" />
        <button class="btn btn-p btn-sm" type="button" :disabled="uploading" @click="pickFile">
          <VIcon name="plus" :size="14" />
          {{ uploading ? 'Carico…' : 'Carica' }}
        </button>
      </div>

      <div class="arc-drawer-drop" @dragover.prevent @drop="onDrop">Trascina qui un'immagine (WebP, max 1920 px)</div>

      <div v-if="loading" class="arc-drawer-loading">
        <span class="arc-skel-bar" style="width: 60%"></span>
        <span class="arc-skel-block"></span>
      </div>

      <div v-else-if="filtered.length" class="arc-drawer-grid">
        <button
          v-for="file in filtered"
          :key="file.sha"
          class="arc-drawer-item"
          type="button"
          :title="file.name"
          @click="choose(mediaUrl(file.name))"
        >
          <img :src="mediaUrl(file.name)" :alt="file.name" loading="lazy" />
          <span class="arc-drawer-name">{{ file.name }}</span>
          <span class="arc-drawer-size">{{ formatBytes(file.size) }}</span>
        </button>
      </div>

      <p v-else class="arc-empty-side">
        {{ items.length ? 'Nessuna immagine corrisponde alla ricerca.' : 'Nessun file in images/.' }}
      </p>
    </aside>
  </div>
</template>
