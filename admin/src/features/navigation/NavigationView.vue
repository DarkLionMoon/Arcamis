<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { registryApi } from '@/shared/api'
import { useRegistryStore, useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import type { PageRegistryEntry, SectionRegistryEntry } from '@/types'

const registry = useRegistryStore()
const ui = useUIStore()

const loading = ref(true)
const saving = ref(false)
const editingKey = ref<string | null>(null)
const newSection = reactive({ v: '', l: '' })

const editForm = reactive<{ l: string; i: string; id: string; sec: string }>({ l: '', i: '', id: '', sec: '' })

function seclabel(sec: string) {
  const s = registry.sections.find(x => x.v === sec)
  return s ? `${s.l} (${s.v})` : 'Senza sezione'
}

const sectionLabel = (v: string) => registry.sections.find(x => x.v === v)?.l || v

const grouped = computed(() => {
  const g = new Map<string, PageRegistryEntry[]>()
  for (const p of registry.pages) {
    const sec = p.sec || ''
    if (!g.has(sec)) g.set(sec, [])
    g.get(sec)!.push(p)
  }
  return Array.from(g.entries()).sort((a, b) => {
    if (!a[0]) return 1
    if (!b[0]) return -1
    return a[0].localeCompare(b[0])
  })
})

async function load() {
  loading.value = true
  try {
    const data = await registryApi.get()
    registry.setRegistry(data.pages as PageRegistryEntry[], (data.sections as SectionRegistryEntry[]) || [], data.ui)
  } catch (e) {
    ui.toast('Errore caricamento: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

/* Move a page one position up/down within its own group */
function move(key: string, dir: number) {
  const idx = registry.pages.findIndex(p => p.k === key)
  if (idx < 0) return
  const sec = registry.pages[idx].sec || ''
  const same = registry.pages.map((p, i) => ({ p, i })).filter(x => (x.p.sec || '') === sec)
  const fromIdx = same.findIndex(x => x.p.k === key)
  const toIdx = fromIdx + dir
  if (toIdx < 0 || toIdx >= same.length) return
  const targetKey = same[toIdx].p.k
  const fromReal = registry.pages.findIndex(p => p.k === key)
  const toReal = registry.pages.findIndex(p => p.k === targetKey)
  const [m] = registry.pages.splice(fromReal, 1)
  registry.pages.splice(toReal, 0, m)
}

function startEdit(p: PageRegistryEntry) {
  editingKey.value = p.k
  editForm.l = p.l
  editForm.i = p.i || '📄'
  editForm.id = p.id
  editForm.sec = p.sec || ''
}

function applyEdit() {
  if (!editingKey.value) return
  registry.updatePage(editingKey.value, {
    l: editForm.l.trim() || editingKey.value,
    i: editForm.i.trim() || '📄',
    id: editForm.id.trim() || 'pag-' + editingKey.value,
    sec: editForm.sec || undefined
  })
  editingKey.value = null
  ui.toast('Modificato — ricordati di salvare', 'success')
}

async function removePage(p: PageRegistryEntry) {
  if (!confirm(`Rimuovere "${p.l}" dal registro?`)) return
  registry.removePage(p.k)
  ui.toast('Rimossa — ricordati di salvare', 'success')
}

function addSection() {
  const v = newSection.v.trim().toLowerCase()
  const l = newSection.l.trim()
  if (!v || !l) {
    ui.toast('Chiave e etichetta sezione obbligatorie', 'error')
    return
  }
  if (registry.sections.some(s => s.v === v)) {
    ui.toast('Sezione già esistente', 'error')
    return
  }
  registry.addSection({ v, l })
  newSection.v = ''
  newSection.l = ''
  ui.toast('Sezione aggiunta — ricordati di salvare', 'success')
}

function removeSection(v: string) {
  if (!confirm(`Eliminare la sezione "${sectionLabel(v)}"?`)) return
  registry.removeSection(v)
  ui.toast('Sezione rimossa — ricordati di salvare', 'success')
}

async function save() {
  saving.value = true
  try {
    await registryApi.save(registry.pages, registry.uiConfig)
    ui.toast('Navigazione salvata — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore salvataggio: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Navigazione</h1>
      <div class="arc-head-actions">
        <button class="btn btn-p" type="button" :disabled="saving" @click="save">💾 Salva registro</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <AdminOnly>
      <div class="arc-panel" style="margin-bottom:16px">
      <h3 class="arc-panel-title">Sezioni</h3>
      <div class="arc-form-actions" style="flex-wrap:wrap">
        <span v-for="s in registry.sections" :key="s.v" class="arc-chip">
          {{ s.l }} <code>{{ s.v }}</code>
          <button class="arc-chip-x" type="button" title="Elimina sezione" @click="removeSection(s.v)">✕</button>
        </span>
        <input v-model="newSection.v" class="in" style="max-width:140px" placeholder="chiave" />
        <input v-model="newSection.l" class="in" style="max-width:160px" placeholder="etichetta" />
        <button class="btn btn-soft btn-sm" type="button" @click="addSection">+ Sezione</button>
      </div>
    </div>

    <div v-if="loading" class="arc-empty-side">Caricamento…</div>

    <div v-for="[sec, pages] in grouped" :key="sec || '__'" class="arc-panel" style="margin-bottom:16px">
      <h3 class="arc-panel-title">📁 {{ seclabel(sec) }} <span style="opacity:.5">({{ pages.length }})</span></h3>
      <div class="arc-navlist">
        <div v-for="(p, idx) in pages" :key="p.k" class="arc-navrow">
          <div class="arc-navrow-move">
            <button class="btn btn-soft btn-sm" type="button" :disabled="idx === 0" @click="move(p.k, -1)">↑</button>
            <button class="btn btn-soft btn-sm" type="button" :disabled="idx === pages.length - 1" @click="move(p.k, 1)">↓</button>
          </div>
          <template v-if="editingKey === p.k">
            <input v-model="editForm.l" class="in" style="max-width:220px" placeholder="etichetta" />
            <input v-model="editForm.i" class="in" style="max-width:70px" placeholder="📄" />
            <input v-model="editForm.id" class="in" style="max-width:180px" placeholder="pag-xxx" />
            <select v-model="editForm.sec" class="in" style="max-width:160px">
              <option value="">— nessuna —</option>
              <option v-for="s in registry.sections" :key="s.v" :value="s.v">{{ s.l }}</option>
            </select>
            <button class="btn btn-p btn-sm" type="button" @click="applyEdit">OK</button>
            <button class="btn btn-soft btn-sm" type="button" @click="editingKey = null">✕</button>
          </template>
          <template v-else>
            <span class="arc-navrow-icon">{{ p.i || '📄' }}</span>
            <span class="arc-navrow-label">{{ p.l || p.k }}</span>
            <code style="font-size:12px;opacity:.5">{{ p.k }}</code>
            <span style="flex:1"></span>
            <button class="btn btn-soft btn-sm" type="button" @click="startEdit(p)">✏️</button>
            <button class="btn btn-d btn-sm" type="button" @click="removePage(p)">🗑</button>
          </template>
        </div>
      </div>
    </div>
    </AdminOnly>
  </section>
</template>