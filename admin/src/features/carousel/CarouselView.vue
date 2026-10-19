<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { carouselApi, compressImage, errorText, mediaName, uploadImage } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
import { CAROUSEL_MAX_SLIDES, CAROUSEL_SEED_SLIDES, useCarouselStore, useUIStore } from '@/app/store'
import { useUnsavedGuard } from '@/shared/guard'
import MediaDrawer from '@/features/pages/editor/MediaDrawer.vue'
import VIcon from '@/shared/components/VIcon.vue'
import type { CarouselButton, CarouselConfig, CarouselSlideFull } from '@/types'

/* ════════════════════════════════════════════════════════════════
   Editor del carousel della home — manifest dinamico.

   Numero, ordine, visibilità e contenuti delle slide più le
   impostazioni di rotazione vivono in un unico manifest KV
   (`admin_carousel`), salvato in una sola scrittura atomica.
   Finché il manifest non esiste il sito usa i suoi hardcoded e qui
   si parte dai seed + gli override legacy già presenti.
   ════════════════════════════════════════════════════════════════ */

interface SlideForm extends CarouselSlideFull {}

const carousel = useCarouselStore()
const ui = useUIStore()

const forms = ref<SlideForm[]>([])
/* Secondi nel form (il server ragiona in millisecondi). */
const settings = reactive({ intervalSec: 6, pauseOnHover: true })
const savedSnapshot = ref('')
const managed = ref(false)
const loading = ref(true)
const saving = ref(false)
const pickerIdx = ref<number | null>(null)
const draggingIdx = ref<number | null>(null)

const pickerOpen = computed({
  get: () => pickerIdx.value !== null,
  set: (open: boolean) => {
    if (!open) pickerIdx.value = null
  }
})

function cloneSlide(slide: CarouselSlideFull): SlideForm {
  return {
    id: slide.id,
    label: slide.label || slide.id,
    img: slide.img || '',
    tag: slide.tag || '',
    tit: slide.tit || '',
    sub: slide.sub || '',
    desc: slide.desc || '',
    btns: (slide.btns || []).map((btn) => ({ label: btn.label || '', href: btn.href || '' })),
    hidden: slide.hidden === true
  }
}

function snapshot(): string {
  return JSON.stringify({
    slides: forms.value,
    settings: { intervalSec: settings.intervalSec, pauseOnHover: settings.pauseOnHover }
  })
}

function markClean(): void {
  savedSnapshot.value = snapshot()
}

const dirty = computed(() => savedSnapshot.value !== '' && savedSnapshot.value !== snapshot())

useUnsavedGuard(() => dirty.value, 'modifiche al carousel non salvate')

const visibleCount = computed(() => forms.value.filter((f) => !f.hidden).length)

async function load(): Promise<void> {
  loading.value = true
  try {
    const config = await carouselApi.getConfig()
    carousel.setConfig({ slides: config.slides, settings: config.settings }, config.managed)
    managed.value = config.managed
    /* Le slide normalizzate dallo store (mai undefined): un manifest
       salvato prima dell'aggiunta di un campo non deve rompere il salvataggio. */
    const slides = config.slides.length
      ? carousel.slides
      : CAROUSEL_SEED_SLIDES.map((s) => ({ ...s, btns: s.btns.map((b) => ({ ...b })) }))
    forms.value = slides.map(cloneSlide)
    settings.intervalSec = Math.min(30, Math.max(2, Math.round((config.settings?.intervalMs ?? 6000) / 1000)))
    settings.pauseOnHover = config.settings?.pauseOnHover ?? true
    markClean()
  } catch (e) {
    ui.toast('Errore caricamento carousel: ' + errorText(e), 'error')
  } finally {
    loading.value = false
  }
}

/* ── Slide: CRUD, riordino, visibilità ── */
function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function addSlide(): void {
  if (forms.value.length >= CAROUSEL_MAX_SLIDES) {
    ui.toast(`Massimo ${CAROUSEL_MAX_SLIDES} slide`, 'warning')
    return
  }
  let base = 'nuova-slide'
  let id = base
  let n = 2
  const taken = new Set(forms.value.map((f) => f.id))
  while (taken.has(id)) id = `${base}-${n++}`
  forms.value.push({
    id,
    label: `Slide ${forms.value.length + 1} — nuova`,
    img: '',
    tag: '',
    tit: '',
    sub: '',
    desc: '',
    btns: [],
    hidden: false
  })
}

async function removeSlide(index: number): Promise<void> {
  const form = forms.value[index]
  if (!form) return
  if (forms.value.length <= 1) {
    ui.toast('Serve almeno una slide', 'error')
    return
  }
  const ok = await confirmAction({
    title: 'Elimina slide',
    message: `Eliminare «${form.label || form.id}»?`,
    detail: 'La slide sparisce dal sito al salvataggio.',
    confirmLabel: 'Elimina slide',
    danger: true
  })
  if (ok) forms.value.splice(index, 1)
}

function moveSlide(index: number, dir: -1 | 1): void {
  const to = index + dir
  if (to < 0 || to >= forms.value.length) return
  const [moved] = forms.value.splice(index, 1)
  forms.value.splice(to, 0, moved)
}

function toggleHidden(form: SlideForm): void {
  if (form.hidden && visibleCount.value <= 0) return
  if (!form.hidden && visibleCount.value <= 1) {
    ui.toast('Almeno una slide deve restare visibile', 'warning')
    return
  }
  form.hidden = !form.hidden
}

function onIdInput(form: SlideForm, event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  const clean = slugifyId(raw)
  const clash = forms.value.some((f) => f !== form && f.id === clean)
  if (!clean || clash) {
    ;(event.target as HTMLInputElement).value = form.id
    if (clash) ui.toast('Id già usato da un’altra slide', 'error')
    return
  }
  form.id = clean
  ;(event.target as HTMLInputElement).value = clean
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
}

function onImageInput(form: SlideForm, event: Event): void {
  form.img = (event.target as HTMLInputElement).value
}

function onPick(path: string): void {
  const form = pickerIdx.value !== null ? forms.value[pickerIdx.value] : null
  if (form) setImage(form, path)
}

async function onDrop(form: SlideForm, event: DragEvent): Promise<void> {
  draggingIdx.value = null
  const file = Array.from(event.dataTransfer?.files || []).find((f) => f.type.startsWith('image/'))
  if (!file) return
  try {
    const path = await uploadImage(await compressImage(file), mediaName(file.name))
    setImage(form, path)
    ui.toast('Immagine caricata — ricordati di salvare', 'success')
  } catch (e) {
    ui.toast('Upload non riuscito: ' + errorText(e), 'error')
  }
}

function clearImage(form: SlideForm): void {
  form.img = ''
}

/* ── Salvataggio ── */
function payload(): CarouselConfig {
  return {
    slides: forms.value.map((form) => ({
      id: form.id,
      label: form.label.trim() || form.id,
      img: form.img.trim(),
      tag: form.tag.trim(),
      tit: form.tit.trim(),
      sub: form.sub.trim(),
      desc: form.desc.trim(),
      btns: form.btns
        .map((btn: CarouselButton) => ({ label: btn.label.trim(), href: btn.href.trim() }))
        .filter((btn: CarouselButton) => btn.label || btn.href),
      hidden: form.hidden
    })),
    settings: {
      intervalMs: Math.min(30000, Math.max(2000, Math.round(settings.intervalSec * 1000))),
      pauseOnHover: settings.pauseOnHover
    }
  }
}

async function saveAll(): Promise<void> {
  if (saving.value) return
  const config = payload()
  const emptyLabel = config.slides.some((s) => s.btns.some((b) => !b.label))
  if (emptyLabel) {
    ui.toast('Ogni bottone ha bisogno di un testo', 'error')
    return
  }
  if (!config.slides.some((s) => !s.hidden)) {
    ui.toast('Almeno una slide deve restare visibile', 'error')
    return
  }
  saving.value = true
  try {
    const ok = await carouselApi.saveConfig(config)
    if (!ok) throw new Error('risposta non valida')
    managed.value = true
    markClean()
    ui.toast('Carousel salvato — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore salvataggio: ' + errorText(e), 'error')
  } finally {
    saving.value = false
  }
}

/** Cancella il manifest: il sito torna agli hardcoded. */
async function resetAll(): Promise<void> {
  if (saving.value) return
  const ok = await confirmAction({
    title: 'Reset carousel',
    message: 'Tornare alle slide predefinite del sito?',
    detail: 'Cancella numero, ordine, visibilità, contenuti e impostazioni salvati dal pannello.',
    confirmLabel: 'Reset ai default',
    danger: true
  })
  if (!ok) return
  saving.value = true
  try {
    const done = await carouselApi.resetConfig()
    if (!done) throw new Error('risposta non valida')
    await load()
    ui.toast('Carousel riportato ai valori di default', 'success')
  } catch (e) {
    ui.toast('Errore reset: ' + errorText(e), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Carousel Homepage</h1>
      <div class="arc-head-actions">
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
        <button class="btn btn-p" type="button" :disabled="saving || !dirty" @click="saveAll">
          {{ saving ? 'Salvo…' : '💾 Salva tutto' }}
        </button>
      </div>
    </div>

    <div class="arc-panel" style="margin-bottom: 16px">
      <p class="arc-hint">
        Numero, ordine, visibilità e contenuti delle slide più la rotazione automatica: l'anteprima nella card si
        aggiorna mentre scrivi e un solo salvataggio pubblica tutto.
        <span v-if="!managed">Nessun salvataggio dal pannello: il sito mostra le slide predefinite.</span>
      </p>
    </div>

    <!-- Impostazioni di rotazione -->
    <div class="arc-panel" style="margin-bottom: 16px">
      <h3 class="arc-panel-title">Rotazione automatica</h3>
      <div class="arc-form-grid" style="grid-template-columns: 1fr 1fr">
        <label class="arc-fld">
          <span>Intervallo tra le slide (secondi, 2–30)</span>
          <input v-model.number="settings.intervalSec" class="in" type="number" min="2" max="30" step="1" />
        </label>
        <label class="arc-fld arc-toggle-line" style="align-self: end">
          <input v-model="settings.pauseOnHover" type="checkbox" />
          <span>Metti in pausa quando il mouse è sopra</span>
        </label>
      </div>
    </div>

    <div v-if="loading" class="arc-empty-side">Caricamento…</div>

    <div v-else class="arc-carousel-grid">
      <div
        v-for="(form, index) in forms"
        :key="form.id"
        class="arc-card arc-carousel-card"
        :class="{ 'is-dragover': draggingIdx === index, 'is-hidden': form.hidden }"
        @dragover.prevent="draggingIdx = index"
        @dragleave="draggingIdx = null"
        @drop.prevent="onDrop(form, $event)"
      >
        <div class="arc-carousel-card-head">
          <span class="arc-card-label">{{ index + 1 }} · {{ form.label || form.id }}</span>
          <span class="arc-chip" :class="{ 'is-dirty': dirty }">
            {{ dirty ? 'Modifiche non salvate' : managed ? 'Salvato' : 'Default del sito' }}
          </span>
        </div>

        <!-- Anteprima live della slide -->
        <div class="arc-slide-preview" :style="form.img ? { backgroundImage: `url('${form.img}')` } : {}">
          <div class="arc-slide-scrim"></div>
          <div class="arc-slide-content">
            <span class="arc-slide-tag">{{ form.tag || 'Tag della slide' }}</span>
            <h3 class="arc-slide-title">{{ form.tit || 'Titolo della slide' }}</h3>
            <p v-if="form.sub" class="arc-slide-sub">{{ form.sub }}</p>
            <p class="arc-slide-desc">{{ form.desc || 'Descrizione della slide.' }}</p>
            <div class="arc-slide-btns">
              <span
                v-for="(btn, btnIndex) in form.btns.filter((b) => b.label)"
                :key="form.id + '-preview-' + btnIndex"
                class="arc-slide-btn"
              >
                {{ btn.label }}
              </span>
            </div>
          </div>
          <span v-if="!form.img" class="arc-slide-noimg">Nessuna immagine (sfondo del sito)</span>
          <span v-if="form.hidden" class="arc-slide-noimg" style="top: auto; bottom: 8px"
            >Nascosta — non andrà online</span
          >
        </div>

        <div class="arc-carousel-fields">
          <div class="arc-form-grid" style="grid-template-columns: 1fr 1fr">
            <label class="arc-fld">
              <span>Nome (solo pannello)</span>
              <input v-model="form.label" class="in" maxlength="120" />
            </label>
            <label class="arc-fld">
              <span>Id slide (unico)</span>
              <input :value="form.id" class="in" maxlength="64" @change="onIdInput(form, $event)" />
            </label>
          </div>
          <label class="arc-fld">
            <span>Tag (piccolo sopra il titolo)</span>
            <input v-model="form.tag" class="in" placeholder="Tag della slide" maxlength="200" />
          </label>
          <label class="arc-fld">
            <span>Titolo</span>
            <input v-model="form.tit" class="in" placeholder="Titolo della slide" maxlength="200" />
          </label>
          <label class="arc-fld">
            <span>Sottotitolo (tra titolo e descrizione)</span>
            <input
              v-model="form.sub"
              class="in"
              placeholder="Sottotitolo della slide"
              maxlength="200"
            />
          </label>
          <label class="arc-fld">
            <span>Descrizione</span>
            <textarea
              v-model="form.desc"
              class="in"
              rows="3"
              placeholder="Descrizione della slide."
              maxlength="800"
            ></textarea>
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
              <button class="btn btn-soft btn-sm" type="button" @click="pickerIdx = index">
                <VIcon name="image" :size="14" /> Libreria
              </button>
              <button
                v-if="form.img"
                class="btn btn-soft btn-sm"
                type="button"
                title="Rimuovi immagine"
                aria-label="Rimuovi immagine"
                @click="clearImage(form)"
              >
                ✕
              </button>
            </div>
            <small class="arc-field-help">Puoi anche trascinare un file immagine direttamente sulla card.</small>
          </label>

          <div class="arc-fld">
            <span>Bottoni</span>
            <div v-for="(btn, btnIndex) in form.btns" :key="form.id + '-btn-' + btnIndex" class="arc-btn-editor">
              <input v-model="btn.label" class="in" placeholder="Testo del bottone" maxlength="80" />
              <input v-model="btn.href" class="in" placeholder="https://… oppure /pagina" maxlength="2048" />
              <button
                class="arc-icon-btn"
                type="button"
                title="Rimuovi bottone"
                aria-label="Rimuovi bottone"
                @click="removeButton(form, btnIndex)"
              >
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
          <button
            class="btn btn-soft btn-sm"
            type="button"
            :disabled="index === 0"
            title="Sposta su"
            aria-label="Sposta su"
            @click="moveSlide(index, -1)"
          >
            ↑
          </button>
          <button
            class="btn btn-soft btn-sm"
            type="button"
            :disabled="index === forms.length - 1"
            title="Sposta giù"
            aria-label="Sposta giù"
            @click="moveSlide(index, 1)"
          >
            ↓
          </button>
          <button
            class="btn btn-soft btn-sm"
            type="button"
            :title="form.hidden ? 'Mostra slide' : 'Nascondi slide'"
            @click="toggleHidden(form)"
          >
            {{ form.hidden ? '👁 Mostra' : '🚫 Nascondi' }}
          </button>
          <button
            class="btn btn-d btn-sm"
            type="button"
            title="Elimina slide"
            aria-label="Elimina slide"
            @click="removeSlide(index)"
          >
            🗑
          </button>
          <span style="flex: 1"></span>
          <button class="btn btn-soft btn-sm" type="button" :disabled="saving" @click="resetAll">Reset tutto</button>
        </div>
      </div>
    </div>

    <div v-if="!loading" class="arc-form-actions" style="margin-top: 16px">
      <button v-if="forms.length < CAROUSEL_MAX_SLIDES" class="btn btn-p" type="button" @click="addSlide">
        + Aggiungi slide ({{ forms.length }}/{{ CAROUSEL_MAX_SLIDES }})
      </button>
      <span style="flex: 1"></span>
      <button class="btn btn-p" type="button" :disabled="saving || !dirty" @click="saveAll">
        {{ saving ? 'Salvo…' : '💾 Salva tutto' }}
      </button>
    </div>

    <MediaDrawer :open="pickerOpen" title="Scegli lo sfondo della slide" @close="pickerIdx = null" @pick="onPick" />
  </section>
</template>

<style scoped>
.arc-carousel-card.is-hidden {
  opacity: 0.75;
}
.arc-carousel-card.is-hidden .arc-slide-preview {
  filter: grayscale(0.6);
}
</style>
