<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { ghApi } from '@/shared/api'
import { useUIStore } from '@/app/store'
import type { ChangelogEntry } from '@/types'

const ui = useUIStore()

const loading = ref(true)
const saving = ref(false)
const entries = ref<ChangelogEntry[]>([])
const editingIdx = ref<number | null>(null)
const adding = ref(false)

const blank: ChangelogEntry = { versione: '', sottoversione: '', patch: '', title: '', date: '', content: '' }
const form = reactive<ChangelogEntry>({ ...blank })

function b64decode(str: string): string {
  return decodeURIComponent(escape(atob(str)))
}

async function load() {
  loading.value = true
  try {
    const data = await ghApi.get('content/changelog.json')
    const parsed = JSON.parse(b64decode(data.content))
    entries.value = Array.isArray(parsed.entries) ? parsed.entries : []
  } catch {
    entries.value = []
  } finally {
    loading.value = false
  }
}

function versionLabel(e: ChangelogEntry) {
  const parts = [e.versione, e.sottoversione, e.patch].filter(Boolean)
  return parts.length ? 'v' + parts.join('.') : '—'
}

function startAdd() {
  adding.value = true
  editingIdx.value = null
  Object.assign(form, { ...blank, date: new Date().toISOString().slice(0, 10) })
}

function startEdit(idx: number) {
  adding.value = false
  editingIdx.value = idx
  Object.assign(form, entries.value[idx])
}

function cancelEdit() {
  adding.value = false
  editingIdx.value = null
}

function remove(idx: number) {
  if (!confirm(`Eliminare l'entry ${versionLabel(entries.value[idx])}?`)) return
  entries.value.splice(idx, 1)
  ui.toast('Entry rimossa — ricordati di salvare', 'success')
}

async function save() {
  saving.value = true
  try {
    const payload = JSON.stringify({ entries: entries.value }, null, 2) + '\n'
    await ghApi.put('content/changelog.json', 'admin: update changelog', payload)
    ui.toast('Changelog salvato — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore salvataggio: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = false
  }
}

function applyForm() {
  const cleaned: ChangelogEntry = {
    versione: form.versione.trim(),
    sottoversione: form.sottoversione.trim(),
    patch: form.patch.trim(),
    title: form.title.trim(),
    date: form.date.trim(),
    content: form.content.trim()
  }
  if (!cleaned.title && !cleaned.versione) {
    ui.toast('Titolo o versione obbligatoria', 'error')
    return
  }
  if (editingIdx.value !== null) {
    entries.value[editingIdx.value] = cleaned
  } else {
    entries.value.unshift(cleaned)
  }
  adding.value = false
  editingIdx.value = null
  ui.toast('Entry pronta — ricordati di salvare', 'success')
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Changelog</h1>
      <div class="arc-head-actions">
        <button class="btn btn-p btn-sm" type="button" :disabled="saving" @click="save">💾 Salva</button>
        <button class="btn btn-soft" type="button" @click="load">⟳ Aggiorna</button>
        <button class="btn btn-p" type="button" @click="startAdd">+ Nuova entry</button>
      </div>
    </div>

    <div v-if="loading" class="arc-empty-side">Caricamento…</div>

    <div v-if="adding || editingIdx !== null" class="arc-panel" style="margin-bottom: 16px">
      <h3 class="arc-panel-title">{{ adding ? 'Nuova entry' : 'Modifica entry' }}</h3>
      <div class="arc-form-grid">
        <label class="arc-fld"><span>Versione</span><input v-model="form.versione" class="in" placeholder="1" /></label>
        <label class="arc-fld"
          ><span>Sottoversione</span><input v-model="form.sottoversione" class="in" placeholder="2"
        /></label>
        <label class="arc-fld"><span>Patch</span><input v-model="form.patch" class="in" placeholder="0" /></label>
        <label class="arc-fld"><span>Data</span><input v-model="form.date" type="date" class="in" /></label>
        <label class="arc-fld" style="grid-column: 1 / -1"
          ><span>Titolo</span><input v-model="form.title" class="in"
        /></label>
        <label class="arc-fld" style="grid-column: 1 / -1"
          ><span>Contenuto (markdown)</span><textarea v-model="form.content" class="in" rows="6"></textarea>
        </label>
      </div>
      <div class="arc-form-actions">
        <button class="btn btn-soft btn-sm" type="button" @click="cancelEdit">Annulla</button>
        <span style="flex: 1"></span>
        <button class="btn btn-p btn-sm" type="button" @click="applyForm">OK</button>
      </div>
    </div>

    <div class="arc-panel">
      <div v-for="(e, idx) in entries" :key="versionLabel(e) + idx" class="arc-changelog-item">
        <div style="flex: 1">
          <div class="arc-changelog-head">
            <strong>{{ versionLabel(e) }}</strong>
            <span v-if="e.title" style="margin-left: 8px">{{ e.title }}</span>
            <span style="margin-left: auto; font-size: 12px; opacity: 0.5">{{ e.date || '' }}</span>
          </div>
          <p v-if="e.content" style="font-size: 13px; opacity: 0.8; white-space: pre-wrap; margin: 6px 0 0">
            {{ e.content }}
          </p>
        </div>
        <div class="arc-form-actions">
          <button class="btn btn-soft btn-sm" type="button" @click="startEdit(idx)">✏️</button>
          <button class="btn btn-d btn-sm" type="button" @click="remove(idx)">🗑</button>
        </div>
      </div>
      <div v-if="!entries.length" class="arc-empty-side">Nessuna entry.</div>
    </div>
  </section>
</template>
