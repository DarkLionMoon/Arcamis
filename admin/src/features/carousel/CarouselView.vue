<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { carouselApi, compressImage, errorText, mediaName, uploadImage } from '@/shared/api'
import { useCarouselStore, useUIStore } from '@/app/store'
import { useUnsavedGuard } from '@/shared/guard'
import MediaDrawer from '@/features/pages/editor/MediaDrawer.vue'
import VIcon from '@/shared/components/VIcon.vue'
import type { CarouselButton, CarouselSlide, CarouselSlideUpdate } from '@/types'

/* ════════════════════════════════════════════════════════════════
   Editor del carousel della home.

   Le slide vivono in KV: immagine (`admin_cover_<key>`), testi
   (`_meta`) e bottoni (`_btns`). Qui si modificano tutti e tre con
   anteprima immediata nella card; il salvataggio è una sola chiamata
   per slide, così non può restare un'immagine nuova con testi vecchi.
   I valori di default (store) restano segnaposto finché non li cambi.
   ════════════════════════════════════════════════════════════════ */

interface SlideForm {
  key: string
  label: string
  defTag: string
  defTit: string
  defDesc: string
  defBtns: CarouselButton[]
  img: string
  tag: string
  tit: string
  desc: string
  btns: CarouselButton[]
  /** true quando l'immagine è stata scelta/incollata: solo allora va salvata. */
  imageTouched: boolean
}

const carousel = useCarouselStore()
const ui = useUIStore()

const forms = reactive<Record<string, SlideForm>>({})
const savedSnapshots = reactive<Record<string, string>>({})
const loading = ref(true)
const savingKey = ref<string | null>(null)
const pickerKey = ref<string | null>(null)
const draggingKey = ref<string | null>(null)

const pickerOpen = computed({
  get: () => pickerKey.value !== null,
  set: (open: boolean) => {
    if (!open) pickerKey.value = null
  }
})

function definition(key: string): CarouselSlide | undefined {
  return carousel.slides.find((slide) => slide.key === key)
}

function blankForm(key: string): SlideForm {
  const def = definition(key)
  return {
    key,
    label: def?.label || key,
    defTag: def?.defTag || '',
    defTit: def?.defTit || '',
    defDesc: def?.defDesc || '',
    defBtns: (def?.defBtns || []).map((btn) => ({ ...btn })),
    img: '',
    tag: '',
    tit: '',
    desc: '',
    btns: [],
    imageTouched: false
  }
}

function snapshotFor(form: SlideForm): string {
  return JSON.stringify({ img: form.img, tag: form.tag, tit: form.tit, desc: form.desc, btns: form.btns })
}

function markClean(form: SlideForm): void {
  savedSnapshots[form.key] = snapshotFor(form)
}

function isDirty(form: SlideForm): boolean {
  return savedSnapshots[form.key] !== undefined && savedSnapshots[form.key] !== snapshotFor(form)
}

const dirty = computed(() => Object.values(forms).some((form) => isDirty(form)))

useUnsavedGuard(() => dirty.value, 'modifiche al carousel non salvate')

async function load(): Promise<void> {
  loading.value = true
  try {
    const slides = await carouselApi.getSlides()
    const keys = slides.length ? slides.map((slide) => slide.key) : carousel.slides.map((slide) => slide.key)
    for (const key of Object.keys(forms)) delete forms[key]
    for (const key of keys) {
      const config = slides.find((slide) => slide.key === key)
      const form = blankForm(key)
      if (config) {
        form.img = config.img || ''
        form.tag = config.meta?.tag || ''
        form.tit = config.meta?.tit || ''
        form.desc = config.meta?.desc || ''
        form.btns = (config.btns || []).map((btn) => ({ label: btn.label || '', href: btn.href || '' }))
      }
      if (!form.btns.length) form.btns = form.defBtns.map((btn) => ({ ...btn }))
      forms[key] = form
      markClean(form)
    }
  } catch (e) {
    ui.toast('Errore caricamento carousel: ' + errorText(e), 'error')
  } finally {
    loading.value = false
  }
}

/* ── Bottoni ── */
function addButton(form: SlideForm): void {
  if (form.btns.length >= 3) {
    ui.toast('Massimo 3 bottoni per slide', 'warning')
    return
  }
  form.btns.push({ label: '', href: '' })
}

function removeButton(form: SlideForm, index: number): void {
  form.btns.splice(index, 1)
}

/* ── Immagine ── */
function setImage(form: SlideForm, path: string): void {
  form.img = path
  form.imageTouched = true
}

function onImageInput(form: SlideForm, event: Event): void {
  form.img = (event.target as HTMLInputElement).value
  form.imageTouched = true
}

function onPick(path: string): void {
  const form = pickerKey.value ? forms[pickerKey.value] : null
  if (form) setImage(form, path)
}

async function onDrop(form: SlideForm, event: DragEvent): Promise<void> {
  draggingKey.value = null
  const file = Array.from(event.dataTransfer?.files || []).find((f) => f.type.startsWith('image/'))
  if (!file) return
  try {
    const path = await uploadImage(await compressImage(file), mediaName(file.name))
    setImage(form, path)
    ui.toast('Immagine caricata — ricordati di salvare la slide', 'success')
  } catch (e) {
    ui.toast('Upload non riuscito: ' + errorText(e), 'error')
  }
}

function clearImage(form: SlideForm): void {
  form.img = ''
  form.imageTouched = true
}

/* ── Salvataggio ── */
function payloadFor(form: SlideForm): CarouselSlideUpdate {
  const payload: CarouselSlideUpdate = {
    key: form.key,
    meta: { tag: form.tag.trim(), tit: form.tit.trim(), desc: form.desc.trim() },
    btns: form.btns
      .map((btn) => ({ label: btn.label.trim(), href: btn.href.trim() }))
      .filter((btn) => btn.label || btn.href)
  }
  if (form.imageTouched) payload.img = form.img.trim()
  return payload
}

async function save(form: SlideForm): Promise<void> {
  if (savingKey.value) return
  const payload = payloadFor(form)
  const emptyLabel = payload.btns?.some((btn) => !btn.label)
  if (emptyLabel) {
    ui.toast('Ogni bottone ha bisogno di un testo', 'error')
    return
  }
  savingKey.value = form.key
  try {
    const ok = await carouselApi.saveSlide(payload)
    if (!ok) throw new Error('risposta non valida')
    form.imageTouched = false
    markClean(form)
    ui.toast('Slide salvata — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore salvataggio: ' + errorText(e), 'error')
  } finally {
    savingKey.value = null
  }
}

/** Riporta la slide ai valori di default del sito (cancella le chiavi KV). */
async function reset(form: SlideForm): Promise<void> {
  if (savingKey.value) return
  savingKey.value = form.key
  try {
    const ok = await carouselApi.saveSlide({ key: form.key, img: '', meta: {}, btns: [] })
    if (!ok) throw new Error('risposta non valida')
    forms[form.key] = blankForm(form.key)
    markClean(forms[form.key])
    ui.toast('Slide riportata ai valori di default', 'success')
  } catch (e) {
    ui.toast('Errore reset: ' + errorText(e), 'error')
  } finally {
    savingKey.value = null
  }
}

function previewImage(form: SlideForm): string {
  return form.img
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Carousel Homepage</h1>
      <div class="arc-head-actions">
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <div class="arc-panel" style="margin-bottom: 16px">
      <p class="arc-hint">
        Modifica sfondo, testi e bottoni di ogni slide: l'anteprima nella card si aggiorna mentre scrivi. L'immagine può
        essere scelta dalla libreria (o trascinata sulla card) oppure incollata come URL. La modifica è attiva al
        salvataggio della singola slide.
      </p>
    </div>

    <div v-if="loading" class="arc-empty-side">Caricamento…</div>

    <div v-else class="arc-carousel-grid">
      <div
        v-for="form in Object.values(forms)"
        :key="form.key"
        class="arc-card arc-carousel-card"
        :class="{ 'is-dragover': draggingKey === form.key }"
        @dragover.prevent="draggingKey = form.key"
        @dragleave="draggingKey = null"
        @drop.prevent="onDrop(form, $event)"
      >
        <div class="arc-carousel-card-head">
          <span class="arc-card-label">{{ form.label }}</span>
          <span class="arc-chip arc-slide-state" :class="{ 'is-dirty': isDirty(form) }">
            {{ isDirty(form) ? 'Modifiche non salvate' : 'Salvata' }}
          </span>
        </div>

        <!-- Anteprima live della slide -->
        <div
          class="arc-slide-preview"
          :style="previewImage(form) ? { backgroundImage: `url('${previewImage(form)}')` } : {}"
        >
          <div class="arc-slide-scrim"></div>
          <div class="arc-slide-content">
            <span class="arc-slide-tag">{{ form.tag || form.defTag || 'Tag della slide' }}</span>
            <h3 class="arc-slide-title">{{ form.tit || form.defTit || 'Titolo della slide' }}</h3>
            <p class="arc-slide-desc">{{ form.desc || form.defDesc || 'Descrizione della slide.' }}</p>
            <div class="arc-slide-btns">
              <span
                v-for="(btn, index) in form.btns.filter((b) => b.label)"
                :key="form.key + '-preview-' + index"
                class="arc-slide-btn"
              >
                {{ btn.label }}
              </span>
            </div>
          </div>
          <span v-if="!previewImage(form)" class="arc-slide-noimg">Nessuna immagine</span>
        </div>

        <div class="arc-carousel-fields">
          <label class="arc-fld">
            <span>Tag (piccolo sopra il titolo)</span>
            <input v-model="form.tag" class="in" :placeholder="form.defTag" maxlength="200" />
          </label>
          <label class="arc-fld">
            <span>Titolo</span>
            <input v-model="form.tit" class="in" :placeholder="form.defTit" maxlength="200" />
          </label>
          <label class="arc-fld">
            <span>Descrizione</span>
            <textarea v-model="form.desc" class="in" rows="3" :placeholder="form.defDesc" maxlength="800"></textarea>
          </label>

          <label class="arc-fld">
            <span>Immagine di sfondo</span>
            <div class="arc-media-row">
              <input
                :value="form.img"
                class="in"
                placeholder="/images/… oppure https://…"
                @input="onImageInput(form, $event)"
              />
              <button class="btn btn-soft btn-sm" type="button" @click="pickerKey = form.key">
                <VIcon name="image" :size="14" /> Libreria
              </button>
              <button
                v-if="form.img"
                class="btn btn-soft btn-sm"
                type="button"
                title="Rimuovi immagine"
                @click="clearImage(form)"
              >
                ✕
              </button>
            </div>
            <small class="arc-field-help">Puoi anche trascinare un file immagine direttamente sulla card.</small>
          </label>

          <div class="arc-fld">
            <span>Bottoni</span>
            <div v-for="(btn, index) in form.btns" :key="form.key + '-btn-' + index" class="arc-btn-editor">
              <input v-model="btn.label" class="in" placeholder="Testo del bottone" maxlength="80" />
              <input v-model="btn.href" class="in" placeholder="https://… oppure /pagina" maxlength="2048" />
              <button class="arc-icon-btn" type="button" title="Rimuovi bottone" @click="removeButton(form, index)">
                ✕
              </button>
            </div>
            <button
              v-if="form.btns.length < 3"
              class="btn btn-soft btn-sm"
              type="button"
              style="margin-top: 6px"
              @click="addButton(form)"
            >
              + Aggiungi bottone
            </button>
          </div>
        </div>

        <div class="arc-form-actions">
          <button class="btn btn-soft btn-sm" type="button" :disabled="savingKey === form.key" @click="reset(form)">
            Reset
          </button>
          <span style="flex: 1"></span>
          <button
            class="btn btn-p btn-sm"
            type="button"
            :disabled="savingKey === form.key || !isDirty(form)"
            @click="save(form)"
          >
            {{ savingKey === form.key ? 'Salvo…' : '💾 Salva slide' }}
          </button>
        </div>
      </div>
    </div>

    <MediaDrawer :open="pickerOpen" title="Scegli lo sfondo della slide" @close="pickerKey = null" @pick="onPick" />
  </section>
</template>
