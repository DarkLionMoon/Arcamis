<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { confirmAction } from '@/shared/confirm'
import { errorText, glossaryApi, type GlossaryTerm } from '@/shared/api'
import { useUnsavedGuard } from '@/shared/guard'
import { useUIStore } from '@/app/store'

const ui = useUIStore()
const terms = ref<GlossaryTerm[]>([])
const sha = ref<string>()
const loading = ref(true)
const saving = ref(false)
const editing = ref<string | null>(null)
const adding = ref(false)
const filter = ref('')
const form = reactive<GlossaryTerm>({ key: '', title: '', excerpt: '', pageLink: '', iconId: '' })
const saved = ref('')
const dirty = computed(() => JSON.stringify(terms.value) !== saved.value)
const filtered = computed(() => {
  const q = filter.value.trim().toLocaleLowerCase()
  return terms.value
    .map((term, index) => ({ term, index }))
    .filter(
      ({ term }) => !q || [term.key, term.title, term.excerpt].some((value) => value.toLocaleLowerCase().includes(q))
    )
})

function snapshot() {
  saved.value = JSON.stringify(terms.value)
}
async function load() {
  loading.value = true
  try {
    const doc = await glossaryApi.get()
    terms.value = doc.terms.map((term) => ({ ...term }))
    sha.value = doc.sha
    snapshot()
  } catch (error) {
    ui.toast(errorText(error), 'error', { title: 'Glossario non caricato' })
  } finally {
    loading.value = false
  }
}
function startAdd() {
  adding.value = true
  editing.value = null
  Object.assign(form, { key: '', title: '', excerpt: '', pageLink: '', iconId: '' })
}
function startEdit(term: GlossaryTerm) {
  adding.value = false
  editing.value = term.key
  Object.assign(form, term)
}
function cancel() {
  adding.value = false
  editing.value = null
}
function apply() {
  const item = {
    key: form.key.trim().toLocaleLowerCase(),
    title: form.title.trim(),
    excerpt: form.excerpt.trim(),
    pageLink: form.pageLink.trim(),
    iconId: form.iconId.trim()
  }
  if (!item.key || !item.title || !item.excerpt) {
    ui.toast('Chiave, titolo ed estratto sono obbligatori', 'error')
    return
  }
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]{0,79}$/u.test(item.key)) {
    ui.toast('Chiave non valida (max 80 caratteri)', 'error')
    return
  }
  if (item.pageLink && !/^(\/|https?:\/\/)/i.test(item.pageLink)) {
    ui.toast('Il link deve iniziare con / o https://', 'error')
    return
  }
  const duplicate = terms.value.some((term) => term.key === item.key && term.key !== editing.value)
  if (duplicate) {
    ui.toast('Chiave già presente', 'error')
    return
  }
  if (editing.value) {
    const idx = terms.value.findIndex((term) => term.key === editing.value)
    if (idx >= 0) terms.value.splice(idx, 1, item)
  } else terms.value.push(item)
  cancel()
}
async function remove(term: GlossaryTerm) {
  const ok = await confirmAction({
    title: 'Elimina termine',
    message: `Eliminare «${term.title}»?`,
    detail: 'I riferimenti [[chiave]] rimasti nel markdown saranno mostrati come testo semplice.',
    confirmLabel: 'Elimina termine',
    danger: true
  })
  if (ok) terms.value = terms.value.filter((item) => item.key !== term.key)
}
async function save() {
  if (!dirty.value || saving.value) return
  saving.value = true
  try {
    const result = await glossaryApi.save(terms.value, sha.value)
    sha.value = result.sha
    snapshot()
    ui.toast('Glossario salvato — deploy in corso', 'success')
  } catch (error) {
    ui.toast(errorText(error), 'error', { title: 'Salvataggio non riuscito' })
  } finally {
    saving.value = false
  }
}
useUnsavedGuard(() => dirty.value, 'modifiche al glossario non salvate')
onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Glossario</h1>
      <div class="arc-head-actions">
        <button class="btn btn-p" type="button" :disabled="saving || !dirty" @click="save">💾 Salva</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
        <button class="btn btn-soft" type="button" @click="startAdd">＋ Nuovo termine</button>
      </div>
    </div>
    <p class="arc-hint">
      I termini sono referenziabili nel markdown con <code>[[chiave]]</code>. Le chiavi mancanti restano testo semplice.
    </p>
    <div v-if="adding || editing !== null" class="arc-panel">
      <h2 class="arc-panel-title">{{ adding ? 'Nuovo termine' : 'Modifica termine' }}</h2>
      <div class="arc-form-grid">
        <label class="arc-fld"
          ><span>Chiave</span
          ><input v-model="form.key" class="in" :disabled="editing !== null" placeholder="es. classe armatura"
        /></label>
        <label class="arc-fld"
          ><span>Titolo</span><input v-model="form.title" class="in" placeholder="Classe Armatura"
        /></label>
        <label class="arc-fld" style="grid-column: 1/-1"
          ><span>Estratto breve</span><textarea v-model="form.excerpt" class="in" rows="3" />
        </label>
        <label class="arc-fld"
          ><span>Link pagina estesa</span><input v-model="form.pageLink" class="in" placeholder="/regole o https://…"
        /></label>
        <label class="arc-fld"
          ><span>ID icona sprite</span><input v-model="form.iconId" class="in" placeholder="shield"
        /></label>
      </div>
      <div class="arc-form-actions">
        <button class="btn btn-soft btn-sm" type="button" @click="cancel">Annulla</button><span style="flex: 1"></span
        ><button class="btn btn-p btn-sm" type="button" @click="apply">Applica</button>
      </div>
    </div>
    <div class="arc-panel">
      <div style="display: flex; gap: 10px; margin-bottom: 14px">
        <input v-model="filter" class="in" placeholder="Cerca termine…" /><span class="arc-chip"
          >{{ filtered.length }} termini</span
        >
      </div>
      <div v-if="loading" class="arc-empty-side">Caricamento…</div>
      <div v-for="{ term } in filtered" :key="term.key" class="arc-changelog-item">
        <div style="flex: 1; min-width: 0">
          <div class="arc-changelog-head">
            <strong>{{ term.title }}</strong
            ><code>{{ term.key }}</code>
          </div>
          <p class="arc-hint">{{ term.excerpt }}</p>
          <small>{{ term.iconId || 'Nessuna icona' }} · {{ term.pageLink || 'Nessun link' }}</small>
        </div>
        <div class="arc-form-actions">
          <button class="btn btn-soft btn-sm" type="button" @click="startEdit(term)">Modifica</button
          ><button class="btn btn-d btn-sm" type="button" @click="remove(term)">Elimina</button>
        </div>
      </div>
      <div v-if="!loading && !filtered.length" class="arc-empty-side">
        {{ terms.length ? 'Nessun risultato.' : 'Glossario vuoto: aggiungi il primo termine.' }}
      </div>
    </div>
  </section>
</template>
