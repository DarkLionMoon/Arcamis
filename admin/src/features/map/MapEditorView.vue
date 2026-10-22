<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { mapApi } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
import { useUnsavedGuard } from '@/shared/guard'
import { useMapStore, useUIStore } from '@/app/store'
import type { MapPin } from '@/types'
import { dragPosition, formatPercent, grabOffset, parsePercent, pointFromClient, type PercentPoint } from './coords'
import { mapDataError, parseMapData } from './schema'

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

/* Puntine spostate e non salvate: la navigazione lo segnala. */
useUnsavedGuard(() => map.dirty, 'puntine non salvate sulla mappa')

onMounted(load)

/* ── click sulla mappa → nuova puntina ── */
/* `getBoundingClientRect()` del canvas è l'unico sistema di riferimento:
   clientX/clientY sono viewport, la percentuale è relativa al box visibile
   (quindi scroll e zoom del browser sono già inclusi). */
function toPercent(e: PointerEvent | MouseEvent): PercentPoint | null {
  const el = container.value
  if (!el) return null
  return pointFromClient(e.clientX, e.clientY, el.getBoundingClientRect())
}

function onMapClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.arc-pin')) return
  const p = toPercent(e)
  if (!p) return
  map.addPin({
    id: 'pin-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    left: formatPercent(p.x),
    top: formatPercent(p.y),
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

/* ── drag & drop ──
   L'offset si misura in punti percentuali tra il cursore e il centro della
   puntina: sommarlo/sottrarlo in percentuale evita di mescolare coordinate
   del viewport e coordinate del canvas (il bug che mandava la Y a 0%). */
let dragging = false
let dragIndex = -1
let grab: PercentPoint = { x: 0, y: 0 }

function onPinPointerDown(index: number, e: PointerEvent) {
  const pin = map.pins[index]
  const point = toPercent(e)
  if (!pin || !point) return
  dragging = true
  dragIndex = index
  grab = grabOffset(point, { x: parsePercent(pin.left), y: parsePercent(pin.top) })
  const pinEl = e.currentTarget as HTMLElement
  try {
    pinEl.setPointerCapture(e.pointerId)
  } catch {
    /* puntatore sintetico o già rilasciato: il drag funziona lo stesso */
  }
}

function onPinPointerMove(e: PointerEvent) {
  if (!dragging || dragIndex < 0) return
  const point = toPercent(e)
  const pin = map.pins[dragIndex]
  if (!point || !pin) return
  e.preventDefault()
  const next = dragPosition(point, grab)
  pin.left = formatPercent(next.x)
  pin.top = formatPercent(next.y)
  /* Il form aperto deve seguire la puntina mentre la si trascina. */
  if (selectedIndex.value === dragIndex) {
    editForm.left = pin.left
    editForm.top = pin.top
  }
}

function onPinPointerUp() {
  if (dragging && dragIndex >= 0) {
    /* Il click può non arrivare dopo un trascinamento: riallinea il form
       alla posizione finale, così X/Y mostrano ciò che è stato salvato. */
    selectPin(dragIndex)
  }
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
    left: formatPercent(parsePercent(editForm.left)),
    top: formatPercent(parsePercent(editForm.top)),
    sub: editForm.sub.trim(),
    pageId: editForm.pageId.trim(),
    explored: editForm.explored
  })
  ui.toast('Puntina aggiornata — ricorda di salvare', 'success')
}

async function deletePin() {
  if (selectedIndex.value === null) return
  const pin = map.pins[selectedIndex.value]
  const ok = await confirmAction({
    title: 'Elimina puntina',
    message: `Eliminare la puntina «${pin?.name || 'senza nome'}»?`,
    detail: 'La rimozione diventa effettiva solo salvando la mappa.',
    confirmLabel: 'Elimina puntina',
    danger: true
  })
  if (!ok) return
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
  if (!/^(\/|https?:\/\/)/.test(url)) {
    ui.toast('Usa un percorso locale (/mappa.webp) o un URL http(s)', 'error')
    return
  }
  map.setMapImage(url)
  ui.toast('Immagine mappa aggiornata — ricorda di salvare', 'success')
}

async function save() {
  const payload = { mapImage: map.mapImage, pins: map.pins }
  const invalid = mapDataError(payload)
  if (invalid) {
    ui.toast('Mappa non valida: ' + invalid, 'error')
    return
  }
  saving.value = true
  try {
    await mapApi.save(parseMapData(payload))
    map.markSaved()
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
        <img
          v-if="map.mapImage"
          :src="map.mapImage"
          alt="Mappa"
          class="arc-map-img"
          loading="lazy"
          decoding="async"
          draggable="false"
        />
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
              <span>Posizione X (%)</span>
              <input v-model="editForm.left" class="in" inputmode="decimal" placeholder="50.00" />
            </label>
            <label class="arc-fld">
              <span>Posizione Y (%)</span>
              <input v-model="editForm.top" class="in" inputmode="decimal" placeholder="50.00" />
            </label>
          </div>
          <p class="arc-hint">
            Valori in percentuale del canvas: 0% è il bordo alto/sinistro, 100% quello basso/destro.
          </p>
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
