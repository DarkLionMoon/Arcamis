<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { errorText, questsApi } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
import { useUnsavedGuard } from '@/shared/guard'
import { useUIStore } from '@/app/store'
import type { Quest, QuestStatus } from '@/types'

/* Bacheca missioni: le quest vivono in content/quests.json, lo stato di
   accettazione resta nel browser dei giocatori (localStorage del sito). */
const ui = useUIStore()

const loading = ref(true)
const saving = ref(false)
const quests = ref<Quest[]>([])
const sha = ref<string | null>(null)
const dirty = ref(false)
const editingIdx = ref<number | null>(null)
const adding = ref(false)

const STATUSES: Array<{ value: QuestStatus; label: string }> = [
  { value: 'aperta', label: '🟢 Aperta' },
  { value: 'attiva', label: '🟡 In corso' },
  { value: 'completata', label: '✅ Completata' }
]

const blank: Quest = {
  id: '',
  titolo: '',
  descrizione: '',
  ricompensa: '',
  livello: '',
  stato: 'aperta',
  master: '',
  tag: []
}
const form = reactive<Quest>({ ...blank, tag: [] })
const tagText = ref('')

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

useUnsavedGuard(() => dirty.value, 'missioni non salvate')

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await questsApi.get()
    quests.value = res.quests
    sha.value = res.sha
    dirty.value = false
    cancelEdit()
  } catch (e) {
    ui.toast('Errore caricamento missioni: ' + errorText(e), 'error')
  } finally {
    loading.value = false
  }
}

function startAdd(): void {
  adding.value = true
  editingIdx.value = null
  Object.assign(form, { ...blank, tag: [] })
  tagText.value = ''
}

function startEdit(idx: number): void {
  adding.value = false
  editingIdx.value = idx
  const q = quests.value[idx]
  Object.assign(form, { ...q, tag: [...(q.tag || [])] })
  tagText.value = (q.tag || []).join(', ')
}

function cancelEdit(): void {
  adding.value = false
  editingIdx.value = null
}

function applyForm(): void {
  const titolo = form.titolo.trim()
  if (!titolo) {
    ui.toast('Il titolo è obbligatorio', 'error')
    return
  }
  const id =
    editingIdx.value !== null ? quests.value[editingIdx.value].id : `q-${slugify(titolo) || Date.now().toString(36)}`
  const entry: Quest = {
    id,
    titolo,
    descrizione: form.descrizione.trim(),
    ricompensa: form.ricompensa.trim(),
    livello: form.livello.trim(),
    stato: form.stato,
    master: form.master.trim(),
    tag: tagText.value
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  }
  if (editingIdx.value !== null) quests.value[editingIdx.value] = entry
  else quests.value.unshift(entry)
  dirty.value = true
  cancelEdit()
  ui.toast('Missione aggiornata — ricorda di salvare', 'success')
}

async function remove(idx: number): Promise<void> {
  const ok = await confirmAction({
    title: 'Elimina missione',
    message: `Eliminare «${quests.value[idx].titolo}» dalla bacheca?`,
    detail: 'La rimozione diventa effettiva solo salvando.',
    confirmLabel: 'Elimina missione',
    danger: true
  })
  if (!ok) return
  quests.value.splice(idx, 1)
  dirty.value = true
  cancelEdit()
}

function move(idx: number, dir: -1 | 1): void {
  const next = idx + dir
  if (next < 0 || next >= quests.value.length) return
  const [item] = quests.value.splice(idx, 1)
  quests.value.splice(next, 0, item)
  dirty.value = true
}

async function save(): Promise<void> {
  saving.value = true
  try {
    const res = await questsApi.save(quests.value, sha.value)
    sha.value = res.sha
    dirty.value = false
    ui.toast('Bacheca salvata — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore salvataggio: ' + errorText(e), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Bacheca Missioni</h1>
      <div class="arc-head-actions">
        <button v-if="dirty" class="btn btn-p" type="button" :disabled="saving" @click="save">💾 Salva</button>
        <button class="btn btn-soft" type="button" @click="startAdd">＋ Nuova missione</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>
    <p class="arc-hint">
      Le accettazioni dei party restano nei browser dei giocatori: qui gestisci lo stato ufficiale.
    </p>

    <div v-if="loading" class="arc-panel">
      <span class="arc-skel-bar" style="width: 40%"></span>
      <span class="arc-skel-block"></span>
    </div>

    <div v-if="adding || editingIdx !== null" class="arc-panel" style="margin-bottom: 16px">
      <h3 class="arc-panel-title">{{ editingIdx !== null ? 'Modifica missione' : 'Nuova missione' }}</h3>
      <div class="arc-form-grid">
        <label class="arc-fld">
          <span>Titolo *</span>
          <input v-model="form.titolo" class="in" placeholder="Le rune violacee" maxlength="80" />
        </label>
        <label class="arc-fld">
          <span>Stato</span>
          <select v-model="form.stato" class="in">
            <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>
      </div>
      <label class="arc-fld">
        <span>Descrizione</span>
        <textarea v-model="form.descrizione" class="in" rows="3" style="resize: vertical"></textarea>
      </label>
      <div class="arc-form-grid">
        <label class="arc-fld">
          <span>Ricompensa</span>
          <input v-model="form.ricompensa" class="in" placeholder="300 mo + oggetto" maxlength="80" />
        </label>
        <label class="arc-fld">
          <span>Livello</span>
          <input v-model="form.livello" class="in" placeholder="3-5" maxlength="12" />
        </label>
      </div>
      <div class="arc-form-grid">
        <label class="arc-fld">
          <span>Master</span>
          <input v-model="form.master" class="in" placeholder="Chi la gestisce" maxlength="40" />
        </label>
        <label class="arc-fld">
          <span>Tag (separati da virgola)</span>
          <input v-model="tagText" class="in" placeholder="esplorazione, mistero" maxlength="120" />
        </label>
      </div>
      <div class="arc-form-actions">
        <button class="btn btn-soft btn-sm" type="button" @click="cancelEdit">Annulla</button>
        <span style="flex: 1"></span>
        <button class="btn btn-p btn-sm" type="button" @click="applyForm">Applica</button>
      </div>
    </div>

    <div v-for="(quest, i) in quests" :key="quest.id" class="arc-panel" style="margin-bottom: 12px">
      <div class="arc-changelog-head">
        <strong>{{ quest.titolo }}</strong>
        <span class="arc-chip">{{ STATUSES.find((s) => s.value === quest.stato)?.label || quest.stato }}</span>
        <span v-if="quest.livello" class="arc-chip">Liv. {{ quest.livello }}</span>
        <span class="arc-toolbar-spacer"></span>
        <button class="btn btn-soft btn-sm" type="button" title="Sposta su" @click="move(i, -1)">↑</button>
        <button class="btn btn-soft btn-sm" type="button" title="Sposta giù" @click="move(i, 1)">↓</button>
        <button class="btn btn-soft btn-sm" type="button" @click="startEdit(i)">Modifica</button>
        <button class="btn btn-d btn-sm" type="button" @click="remove(i)">Elimina</button>
      </div>
      <p v-if="quest.descrizione" style="font-size: 13px; margin: 8px 0 0">{{ quest.descrizione }}</p>
      <p v-if="quest.ricompensa || quest.master" style="font-size: 12px; opacity: 0.7; margin: 6px 0 0">
        <span v-if="quest.ricompensa">💰 {{ quest.ricompensa }}</span>
        <span v-if="quest.master"> · 🎭 {{ quest.master }}</span>
        <span v-if="quest.tag?.length"> · #{{ quest.tag.join(' #') }}</span>
      </p>
    </div>
    <div v-if="!loading && !quests.length" class="arc-empty-side">
      Nessuna missione: creane una per riempire la bacheca.
    </div>
  </section>
</template>
