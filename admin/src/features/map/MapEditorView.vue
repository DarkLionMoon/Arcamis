<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { mapApi } from '@/shared/api'
import { useMapStore, useUIStore } from '@/app/store'
import type { MapPin } from '@/types'

const map = useMapStore()
const ui = useUIStore()

const container = ref<HTMLElement | null>(null)
const mapUrl = ref('')
const selectedIndex = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

const dirty = computed(() => map.dirty)

const editForm = reactive({
  name: '',
  type: 'village' as MapPin['type'],
  desc: '',
  left: '0%',
  top: '0%',
  sub: '',
  pageId: '',
  explored: false
})

const selected = computed<MapPin | null>(() => {
  return selectedIndex.value === null ? null : (map.pins[selectedIndex.value] ?? null)
})

async function load() {
  loading.value = true
  try {
    const data = await mapApi.get()
    map.setMapData(data)
    mapUrl.value = data.mapImage
  } catch (e) {
    ui.toast('Errore caricamento mappa: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

onMounted(load)

/* ── click sulla mappa → nuova puntina ── */
interface Point {
  x: number
  y: number
}
function toPercent(e: PointerEvent | MouseEvent): Point | null {
  const el = container.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
  return { x, y }
}

function onMapClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.arc-pin')) return
  const p = toPercent(e)
  if (!p) return
  map.addPin({
    id: 'pin-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    left: p.x.toFixed(2) + '%',
    top: p.y.toFixed(2) + '%',
    type: 'village',
    name: 'Nuova puntina',
    desc: '',
    explored: false,
    sub: '',
    pageId: ''
  })
  selectPin(map.pins.length - 1)
  ui.toast('Puntina aggiunta — modifica i dettagli', 'success')
}

/* ── drag & drop ── */
let dragging = false
let dragIndex = -1
let dragOffsetX = 0
let dragOffsetY = 0

function onPinPointerDown(index: number, e: PointerEvent) {
  const el = container.value
  if (!el) return
  dragging = true
  dragIndex = index
  const pinEl = e.currentTarget as HTMLElement
  const rect = pinEl.getBoundingClientRect()
  const cRect = el.getBoundingClientRect()
  dragOffsetX = e.clientX - (rect.left + rect.width / 2 - cRect.left)
  dragOffsetY = e.clientY - (rect.top + rect.height / 2 - cRect.top)
  pinEl.setPointerCapture(e.pointerId)
}

function onPinPointerMove(e: PointerEvent) {
  if (!dragging || dragIndex < 0) return
  const p = toPercent(e)
  if (!p) return
  const pin = map.pins[dragIndex]
  if (!pin) return
  const left = Math.max(
    0,
    Math.min(100, p.x - (dragOffsetX / (container.value?.getBoundingClientRect().width ?? 1)) * 100)
  )
  const top = Math.max(
    0,
    Math.min(100, p.y - (dragOffsetY / (container.value?.getBoundingClientRect().height ?? 1)) * 100)
  )
  pin.left = left.toFixed(2) + '%'
  pin.top = top.toFixed(2) + '%'
}

function onPinPointerUp() {
  dragging = false
  dragIndex = -1
}

/* ── selezione / form ── */
function selectPin(index: number) {
  const pin = map.pins[index]
  if (!pin) return
  selectedIndex.value = index
  editForm.name = pin.name
  editForm.type = pin.type
  editForm.desc = pin.desc
  editForm.left = pin.left
  editForm.top = pin.top
  editForm.sub = pin.sub || ''
  editForm.pageId = pin.pageId || ''
  editForm.explored = !!pin.explored
}

function closeEdit() {
  if (map.dirty) {
    ui.toast('Ricorda di salvare le modifiche', 'warning')
  }
  selectedIndex.value = null
}

function savePin() {
  if (selectedIndex.value === null) return
  const name = editForm.name.trim()
  if (!name) {
    ui.toast('Il nome è obbligatorio', 'error')
    return
  }
  map.updatePin(selectedIndex.value, {
    name,
    type: editForm.type,
    desc: editForm.desc.trim(),
    left: editForm.left.trim() || '50%',
    top: editForm.top.trim() || '50%',
    sub: editForm.sub.trim(),
    pageId: editForm.pageId.trim(),
    explored: editForm.explored
  })
  ui.toast('Puntina aggiornata — ricorda di salvare', 'success')
}

function deletePin() {
  if (selectedIndex.value === null) return
  if (!confirm('Eliminare questa puntina?')) return
  map.deletePin(selectedIndex.value)
  selectedIndex.value = null
  ui.toast('Puntina eliminata — ricorda di salvare', 'success')
}

/* ── immagine / salvataggio ── */
function applyMapUrl() {
  const url = mapUrl.value.trim()
  if (!url) {
    ui.toast('Inserisci un URL', 'error')
    return
  }
  map.setMapImage(url)
  ui.toast('Immagine mappa aggiornata — ricorda di salvare', 'success')
}

async function save() {
  saving.value = true
  try {
    await mapApi.save({ mapImage: map.mapImage, pins: map.pins })
    ui.toast('Salvato nel repo — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore di salvataggio: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Editor Mappa</h1>
      <div class="arc-head-actions">
        <button v-if="dirty" class="btn btn-p" type="button" :disabled="saving" @click="save">💾 Salva</button>
        <button class="btn btn-soft" type="button" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <div class="arc-panel arc-map-panel">
      <div class="arc-form-row">
        <input v-model="mapUrl" class="in" style="flex: 1" placeholder="/mappa.webp" />
        <button class="btn btn-soft btn-sm" type="button" @click="applyMapUrl">Applica URL</button>
      </div>
      <p class="arc-hint">
        Clicca sulla mappa per aggiungere una puntina. Trascina per spostare. Click su una puntina per editarla.
      </p>
    </div>

    <div class="arc-map-wrap">
      <div ref="container" class="arc-map-canvas" :class="{ 'arc-map-canvas--dirty': dirty }" @click="onMapClick">
        <img v-if="map.mapImage" :src="map.mapImage" alt="Mappa" class="arc-map-img" draggable="false" />
        <div class="arc-map-loading" v-if="loading">Caricamento…</div>

        <button
          v-for="(pin, idx) in map.pins"
          :key="pin.id"
          type="button"
          class="arc-pin"
          :class="{ 'arc-pin--active': selectedIndex === idx }"
          :style="{ left: pin.left, top: pin.top, '--pc': map.typeColor(pin.type) }"
          @click.stop="selectPin(idx)"
          @pointerdown="onPinPointerDown(idx, $event)"
          @pointermove="onPinPointerMove"
          @pointerup="onPinPointerUp"
          @pointercancel="onPinPointerUp"
        >
          <span class="arc-pin-dot"></span>
          <span class="arc-pin-label">{{ pin.name }}</span>
        </button>
      </div>

      <aside class="arc-map-edit">
        <template v-if="selected">
          <h3 class="arc-panel-title">📍 {{ selected.name }}</h3>
          <div class="arc-form-grid">
            <label class="arc-fld">
              <span>Nome</span>
              <input v-model="editForm.name" class="in" />
            </label>
            <label class="arc-fld">
              <span>Tipo</span>
              <select v-model="editForm.type" class="in">
                <option v-for="t in map.pinTypes" :key="t.v" :value="t.v">{{ t.l }}</option>
              </select>
            </label>
          </div>
          <label class="arc-fld">
            <span>Descrizione</span>
            <textarea v-model="editForm.desc" class="in" rows="2" style="resize: vertical"></textarea>
          </label>
          <div class="arc-form-grid">
            <label class="arc-fld">
              <span>Posizione X</span>
              <input v-model="editForm.left" class="in" />
            </label>
            <label class="arc-fld">
              <span>Posizione Y</span>
              <input v-model="editForm.top" class="in" />
            </label>
          </div>
          <div class="arc-form-grid">
            <label class="arc-fld">
              <span>Sub-mappa</span>
              <input v-model="editForm.sub" class="in" placeholder="foglia, smari…" />
            </label>
            <label class="arc-fld">
              <span>ID pagina wiki</span>
              <input v-model="editForm.pageId" class="in" placeholder="pag-xxx" />
            </label>
          </div>
          <label class="arc-toggle-line">
            <input v-model="editForm.explored" type="checkbox" />
            Esplorata
          </label>
          <div class="arc-form-actions">
            <button class="btn btn-d btn-sm" type="button" @click="deletePin">🗑 Elimina</button>
            <span style="flex: 1"></span>
            <button class="btn btn-soft btn-sm" type="button" @click="closeEdit">Chiudi</button>
            <button class="btn btn-p btn-sm" type="button" @click="savePin">Salva</button>
          </div>
        </template>
        <div v-else class="arc-empty-side">Seleziona o aggiungi una puntina per modificarla</div>
        <div class="arc-pin-count">Puntine: {{ map.pins.length }}</div>
      </aside>
    </div>
  </section>
</template>
