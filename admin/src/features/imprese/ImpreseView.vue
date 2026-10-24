<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { confirmAction } from '@/shared/confirm'
import { errorText, pagesApi } from '@/shared/api'
import { useUnsavedGuard } from '@/shared/guard'
import { useUIStore } from '@/app/store'
import type { PageContent } from '@/types'

/* La pagina Imprese è un'app: i dati di gioco (livelli, patenti,
   strutture, forniture, sanzioni, eventi) vivono in `page.data`, non nel
   JS. Questa vista li scorre e li modifica campo per campo; il salvataggio
   riscrive il JSON che `imprese.js` riceve al montaggio. */

type Row = Record<string, unknown>
type ListKey = 'livelli' | 'patenti' | 'strutture' | 'fornitura' | 'sanzioni' | 'eventi' | 'tiriEvento' | 'sponsaggio'

const LISTS: Array<{ key: ListKey; label: string; summary: string[] }> = [
  { key: 'livelli', label: 'Livelli', summary: ['name', 'patente', 'fee'] },
  { key: 'patenti', label: 'Patenti', summary: ['sigla', 'nome', 'totale'] },
  { key: 'strutture', label: 'Strutture', summary: ['nome', 'lv', 'cost'] },
  { key: 'fornitura', label: 'Forniture', summary: ['pat', 'cost', 'rent'] },
  { key: 'sanzioni', label: 'Sanzioni', summary: ['tipo', 'name', 'multa'] },
  { key: 'eventi', label: 'Eventi', summary: ['nome', 'stagione', 'mese'] },
  { key: 'tiriEvento', label: 'Tiri evento', summary: ['range', 'nome', 'effetto'] },
  { key: 'sponsaggio', label: 'Sponsorizzazioni', summary: ['livello', 'dt', 'costo'] }
]

const ui = useUIStore()
const page = ref<PageContent | null>(null)
const data = ref<Record<string, Row[]>>({})
const tab = ref<ListKey>('livelli')
const loading = ref(true)
const saving = ref(false)
const editing = ref<number | null>(null)
const adding = ref(false)
const draft = ref<Row>({})
const saved = ref('')

const rows = computed<Row[]>(() => (Array.isArray(data.value[tab.value]) ? data.value[tab.value] : []))
const currentList = computed(() => LISTS.find((list) => list.key === tab.value)!)
const dirty = computed(() => JSON.stringify(data.value) !== saved.value)

const isScalar = (value: unknown) => ['string', 'number', 'boolean'].includes(typeof value)
const scalarKeys = (row: Row | undefined) => Object.keys(row || {}).filter((key) => isScalar((row || {})[key]))

function snapshot() {
  saved.value = JSON.stringify(data.value)
}

function display(row: Row, key: string) {
  const value = row[key]
  return value === undefined || value === '' ? '—' : String(value)
}

async function load() {
  loading.value = true
  try {
    const doc = await pagesApi.get('imprese')
    page.value = doc
    data.value = JSON.parse(JSON.stringify(doc.data || {})) as Record<string, Row[]>
    snapshot()
  } catch (error) {
    ui.toast(errorText(error), 'error', { title: 'Imprese non caricate' })
  } finally {
    loading.value = false
  }
}

function startEdit(index: number) {
  adding.value = false
  editing.value = index
  draft.value = JSON.parse(JSON.stringify(rows.value[index])) as Row
}

function startAdd() {
  editing.value = null
  adding.value = true
  const template = rows.value[0] || {}
  const row: Row = {}
  for (const key of Object.keys(template)) {
    const value = template[key]
    if (Array.isArray(value)) row[key] = []
    else if (typeof value === 'number') row[key] = 0
    else if (typeof value === 'boolean') row[key] = false
    else row[key] = ''
  }
  draft.value = row
}

function cancel() {
  editing.value = null
  adding.value = false
  draft.value = {}
}

function apply() {
  if (!Object.keys(draft.value).length) {
    ui.toast('Nessun campo da salvare', 'error')
    return
  }
  const list = [...rows.value]
  if (editing.value !== null) list.splice(editing.value, 1, { ...draft.value })
  else list.push({ ...draft.value })
  data.value = { ...data.value, [tab.value]: list }
  cancel()
}

async function remove(index: number) {
  const row = rows.value[index]
  const label = String(row.nome || row.name || row.sigla || row.pat || 'questa voce')
  const ok = await confirmAction({
    title: 'Elimina voce',
    message: `Eliminare «${label}»?`,
    detail: 'La voce sparisce dalla pagina Imprese. Diventa effettivo al salvataggio.',
    confirmLabel: 'Elimina',
    danger: true
  })
  if (!ok) return
  data.value = { ...data.value, [tab.value]: rows.value.filter((_, i) => i !== index) }
}

async function save() {
  if (!page.value || saving.value || !dirty.value) return
  saving.value = true
  try {
    page.value = { ...page.value, data: data.value, lastModified: new Date().toISOString() }
    const result = await pagesApi.save(page.value, 'admin: update imprese')
    page.value.sha = result.sha
    snapshot()
    ui.toast('Imprese salvate — deploy in corso', 'success')
  } catch (error) {
    ui.toast(errorText(error), 'error', { title: 'Salvataggio non riuscito' })
  } finally {
    saving.value = false
  }
}

/* Cambiare scheda con un editor aperto perderebbe il draft. */
watch(tab, () => cancel())

useUnsavedGuard(() => dirty.value, 'modifiche alle imprese non salvate')
onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Imprese &amp; Licenze</h1>
      <div class="arc-head-actions">
        <button class="btn btn-p" type="button" :disabled="saving || !dirty" @click="save">💾 Salva</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
        <button class="btn btn-soft" type="button" :disabled="!rows.length" @click="startAdd">＋ Nuova voce</button>
      </div>
    </div>
    <p class="arc-hint">
      I dati alimentano l'app della pagina <a href="#/editor/imprese">Imprese</a>: livelli delle imprese, patenti,
      strutture, forniture, sanzioni ed eventi. Le viste narrative restano nel file della pagina.
    </p>

    <div class="arc-panel" style="margin-bottom: 16px">
      <div class="arc-form-actions" style="flex-wrap: wrap">
        <button
          v-for="list in LISTS"
          :key="list.key"
          class="btn btn-sm"
          :class="tab === list.key ? 'btn-p' : 'btn-soft'"
          type="button"
          @click="tab = list.key"
        >
          {{ list.label }}
          <span style="opacity: 0.6">({{ (data[list.key] || []).length }})</span>
        </button>
      </div>
    </div>

    <div v-if="adding || editing !== null" class="arc-panel">
      <h2 class="arc-panel-title">{{ adding ? 'Nuova voce' : 'Modifica voce' }} · {{ currentList.label }}</h2>
      <div class="arc-form-grid">
        <label
          v-for="key in scalarKeys(draft)"
          :key="key"
          class="arc-fld"
          :style="String(draft[key] || '').length > 60 ? 'grid-column: 1/-1' : ''"
        >
          <span>{{ key }}</span>
          <input v-if="typeof draft[key] === 'number'" v-model.number="draft[key]" class="in" type="number" />
          <input v-else-if="typeof draft[key] === 'boolean'" v-model="draft[key]" type="checkbox" />
          <textarea v-else-if="String(draft[key] || '').length > 60" v-model="draft[key]" class="in" rows="3" />
          <input v-else v-model="draft[key]" class="in" />
        </label>
      </div>
      <div class="arc-form-actions">
        <button class="btn btn-soft btn-sm" type="button" @click="cancel">Annulla</button><span style="flex: 1"></span
        ><button class="btn btn-p btn-sm" type="button" @click="apply">Applica</button>
      </div>
    </div>

    <div class="arc-panel">
      <h2 class="arc-panel-title">{{ currentList.label }} · {{ rows.length }}</h2>
      <div v-if="loading" class="arc-empty-side">Caricamento…</div>
      <div class="arc-table-wrap">
        <table v-if="rows.length" class="arc-table">
          <thead>
            <tr>
              <th v-for="key in currentList.summary" :key="key">{{ key }}</th>
              <th style="width: 160px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="index">
              <td v-for="key in currentList.summary" :key="key">{{ display(row, key) }}</td>
              <td>
                <div class="arc-form-actions">
                  <button class="btn btn-soft btn-sm" type="button" @click="startEdit(index)">✏️</button>
                  <button class="btn btn-d btn-sm" type="button" @click="remove(index)">🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!loading && !rows.length" class="arc-empty-side">Nessuna voce in questo elenco.</div>
    </div>
  </section>
</template>
