<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { carouselApi, registryApi, compressImage, uploadImage } from '@/shared/api'
import { useUIStore } from '@/app/store'
import type { PageRegistryEntry } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const savingKey = ref<string | null>(null)
const state = reactive<{ pages: PageRegistryEntry[]; covers: Record<string, string>; urls: Record<string, string> }>({
  pages: [],
  covers: {},
  urls: {}
})

async function load() {
  loading.value = true
  try {
    const reg = await registryApi.get()
    state.pages = reg.pages || []
    const cv = await carouselApi.getCovers().catch(() => ({}))
    state.covers = cv || {}
    for (const p of state.pages) {
      state.urls[p.id] = state.covers[p.id] || ''
    }
  } catch (e) {
    ui.toast('Errore caricamento: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

async function saveCover(pageId: string) {
  savingKey.value = pageId
  try {
    const ok = await carouselApi.saveCover(pageId, (state.urls[pageId] || '').trim())
    if (ok) {
      state.covers[pageId] = (state.urls[pageId] || '').trim()
      ui.toast('Copertina salvata — deploy in corso (~30s)', 'success')
    }
  } catch (e) {
    ui.toast('Errore salvataggio: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    savingKey.value = null
  }
}

async function resetCover(pageId: string) {
  state.urls[pageId] = ''
  savingKey.value = pageId
  try {
    await carouselApi.saveCover(pageId, '')
    delete state.covers[pageId]
    ui.toast('Copertina rimossa', 'success')
  } catch (e) {
    ui.toast('Errore rimozione: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    savingKey.value = null
  }
}

async function pickImage(pageId: string) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const dataUri = await compressImage(file)
      const name = 'cover-' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const url = await uploadImage(dataUri, name)
      state.urls[pageId] = url
      await saveCover(pageId)
    } catch (e) {
      ui.toast('Errore upload: ' + (e instanceof Error ? e.message : String(e)), 'error')
    }
  }
  input.click()
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Copertine</h1>
      <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
    </div>

    <div class="arc-panel" style="margin-bottom:16px">
      <p class="arc-hint">Anteprime delle card delle pagine. Il percorso usato è <code>pages/<em>slug</em>.json</code>; l'immagine viene mostrata in homepage e nelle card.</p>
    </div>

    <div v-if="loading" class="arc-empty-side">Caricamento…</div>

    <div v-else class="arc-covers-grid">
      <div v-for="p in state.pages" :key="p.id" class="arc-card">
        <div class="arc-covers-thumb">
          <img v-if="state.covers[p.id]" :src="state.covers[p.id]" :alt="p.l" />
          <span v-else class="arc-carousel-img--empty">{{ p.i || '📄' }} {{ p.l }}</span>
        </div>
        <div class="arc-card-value" style="font-size:15px">{{ p.l }}</div>
        <div style="font-size:11px;opacity:.5;margin-bottom:8px">{{ p.k }}</div>
        <label class="arc-fld">
          <span>URL</span>
          <input v-model="state.urls[p.id]" class="in" placeholder="/images/… o https://…" />
        </label>
        <div class="arc-form-actions">
          <button class="btn btn-soft btn-sm" type="button" :disabled="savingKey === p.id" @click="pickImage(p.id)">🖼 Carica</button>
          <button class="btn btn-soft btn-sm" type="button" :disabled="savingKey === p.id" @click="resetCover(p.id)">Reset</button>
          <span style="flex:1"></span>
          <button class="btn btn-p btn-sm" type="button" :disabled="savingKey === p.id" @click="saveCover(p.id)">💾</button>
        </div>
      </div>
    </div>
  </section>
</template>