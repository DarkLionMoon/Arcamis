<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { carouselApi } from '@/shared/api'
import { useCarouselStore, useUIStore } from '@/app/store'

const carousel = useCarouselStore()
const ui = useUIStore()

const loading = ref(true)
const savingKey = ref<string | null>(null)
const covers = reactive<Record<string, string>>({})
const urls = reactive<Record<string, string>>({})

async function load() {
  loading.value = true
  try {
    const cv = await carouselApi.getCovers()
    for (const k of Object.keys(covers)) delete covers[k]
    Object.assign(covers, cv)
    for (const slide of carousel.slides) {
      urls[slide.key] = slidesCoverKey(slide.key) in cv ? cv[slidesCoverKey(slide.key)] : ''
    }
  } catch (e) {
    ui.toast('Errore caricamento carousel: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

function slidesCoverKey(slideKey: string): string {
  return slideKey
}

async function setCover(slideKey: string, value: string) {
  savingKey.value = slideKey
  try {
    const ok = await carouselApi.saveCover(slideKey, value)
    if (ok) {
      covers[slideKey] = value
      urls[slideKey] = value
      ui.toast('Copertina salvata — deploy in corso (~30s)', 'success')
    }
  } catch (e) {
    ui.toast('Errore salvataggio: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    savingKey.value = null
  }
}

function resetCover(slideKey: string) {
  urls[slideKey] = ''
  setCover(slideKey, '')
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Carousel Homepage</h1>
      <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
    </div>

    <div class="arc-panel" style="margin-bottom:16px">
      <p class="arc-hint">
        Copertine delle slide del carousel in home. Titolo, descrizione e pulsanti hanno valori di default
        definiti nello store (slide — vedi pannello legacy per la modifica avanzata).
      </p>
    </div>

    <div v-if="loading" class="arc-empty-side">Caricamento…</div>

    <div v-else class="arc-carousel-grid">
      <div v-for="slide in carousel.slides" :key="slide.key" class="arc-card arc-carousel-card">
        <div class="arc-carousel-img">
          <img
            v-if="covers[slide.key]"
            :src="covers[slide.key]"
            :alt="slide.label"
          />
          <span v-else class="arc-carousel-img--empty">{{ slide.defTit }}</span>
        </div>
        <div class="arc-card-label">{{ slide.label }}</div>
        <div class="arc-card-value arc-carousel-title">{{ slide.defTit }}</div>
        <p class="arc-carousel-desc">{{ slide.defDesc }}</p>

        <label class="arc-fld">
          <span>URL immagine</span>
          <input v-model="urls[slide.key]" class="in" placeholder="/images/… o https://…" />
        </label>
        <div class="arc-form-actions">
          <button class="btn btn-soft btn-sm" type="button" :disabled="savingKey === slide.key" @click="resetCover(slide.key)">
            Reset
          </button>
          <span style="flex:1"></span>
          <button class="btn btn-p btn-sm" type="button" :disabled="savingKey === slide.key" @click="setCover(slide.key, (urls[slide.key] || '').trim())">
            💾 Salva copertina
          </button>
        </div>
      </div>
    </div>
  </section>
</template>