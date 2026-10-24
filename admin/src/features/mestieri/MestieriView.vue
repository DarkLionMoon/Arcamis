<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { confirmAction } from '@/shared/confirm'
import { errorText, pagesApi } from '@/shared/api'
import { useUnsavedGuard } from '@/shared/guard'
import { useUIStore } from '@/app/store'
import type { PageContent } from '@/types'

/* La pagina Mestieri è markdown: ogni `# Nome` è una scheda con i campi
   `**Patente:**`, `**Livello di maestria:**`, `**Categoria:**` e
   `**Rendita di fornitura:**`, seguiti dalle tabelle di dettaglio.
   Qui i campi diventano un form; il salvataggio ricompila lo stesso
   markdown che il sito legge con il motore `explore`. */

interface Mestiere {
  nome: string
  patente: string
  livello: string
  categoria: string
  rendita: string
  dettaglio: string
}

const ui = useUIStore()
const page = ref<PageContent | null>(null)
const intro = ref('')
const items = ref<Mestiere[]>([])
const saved = ref('')
const loading = ref(true)
const saving = ref(false)
const editing = ref<number | null>(null)
const adding = ref(false)
const form = reactive<Mestiere>({ nome: '', patente: '', livello: '', categoria: '', rendita: '', dettaglio: '' })

const dirty = computed(() => !!page.value && JSON.stringify({ intro: intro.value, items: items.value }) !== saved.value)

const blank = (): Mestiere => ({ nome: '', patente: '', livello: '', categoria: '', rendita: '', dettaglio: '' })

function snapshot() {
  saved.value = JSON.stringify({ intro: intro.value, items: items.value })
}

function parse(content: string) {
  const first = content.search(/^# /m)
  const head = (first < 0 ? content : content.slice(0, first)).trim()
  intro.value = head.replace(/\n*-{3,}\s*$/, '').trim()
  if (first < 0) return []
  return content
    .slice(first)
    .split(/^# /m)
    .slice(1)
    .map((chunk) => {
      const entry = blank()
      const lines = chunk.split('\n')
      entry.nome = (lines.shift() || '').trim()
      const body: string[] = []
      for (const line of lines) {
        const meta = line.match(/^\*\*(.+?):\*\*\s*(.*)$/)
        const label = meta ? meta[1].toLowerCase() : ''
        if (label === 'patente') entry.patente = meta![2].trim()
        else if (label.startsWith('livello')) entry.livello = meta![2].trim()
        else if (label === 'categoria') entry.categoria = meta![2].trim()
        else if (label.startsWith('rendita')) entry.rendita = meta![2].trim()
        else body.push(line)
      }
      entry.dettaglio = body
        .join('\n')
        .replace(/\n*-{3,}\s*$/, '')
        .trim()
      return entry
    })
}

function serialize(): string {
  const blocks = items.value.map((item) => {
    const lines = [`# ${item.nome}`]
    if (item.patente) lines.push(`**Patente:** ${item.patente}`)
    if (item.livello) lines.push(`**Livello di maestria:** ${item.livello}`)
    if (item.categoria) lines.push(`**Categoria:** ${item.categoria}`)
    if (item.rendita) lines.push(`**Rendita di fornitura:** ${item.rendita}`)
    if (item.dettaglio) lines.push('', item.dettaglio)
    return lines.join('\n')
  })
  return [intro.value, ...blocks].filter(Boolean).join('\n\n---\n\n') + '\n'
}

async function load() {
  loading.value = true
  try {
    const doc = await pagesApi.get('mestieri')
    page.value = doc
    items.value = parse(doc.content || '')
    snapshot()
  } catch (error) {
    ui.toast(errorText(error), 'error', { title: 'Mestieri non caricati' })
  } finally {
    loading.value = false
  }
}

function startAdd() {
  adding.value = true
  editing.value = null
  Object.assign(form, blank(), { patente: 'P.M.C. — Manifattura Comune', livello: 'L1 — Bottega Artigiana' })
}

function startEdit(index: number) {
  adding.value = false
  editing.value = index
  Object.assign(form, items.value[index])
}

function cancel() {
  adding.value = false
  editing.value = null
}

function apply() {
  const item = {
    nome: form.nome.trim(),
    patente: form.patente.trim(),
    livello: form.livello.trim(),
    categoria: form.categoria.trim(),
    rendita: form.rendita.trim(),
    dettaglio: form.dettaglio.trim()
  }
  if (!item.nome) {
    ui.toast('Il nome del mestiere è obbligatorio', 'error')
    return
  }
  const duplicate = items.value.some((other, index) => other.nome === item.nome && index !== editing.value)
  if (duplicate) {
    ui.toast('Esiste già un mestiere con questo nome', 'error')
    return
  }
  if (editing.value !== null) items.value.splice(editing.value, 1, item)
  else items.value.push(item)
  cancel()
}

async function remove(index: number) {
  const item = items.value[index]
  const ok = await confirmAction({
    title: 'Elimina mestiere',
    message: `Eliminare «${item.nome}»?`,
    detail: 'La scheda sparisce dalla pagina Mestieri. Diventa effettivo al salvataggio.',
    confirmLabel: 'Elimina mestiere',
    danger: true
  })
  if (ok) items.value.splice(index, 1)
}

async function save() {
  if (!page.value || saving.value || !dirty.value) return
  saving.value = true
  try {
    page.value = {
      ...page.value,
      content: serialize(),
      lastModified: new Date().toISOString()
    }
    const result = await pagesApi.save(page.value, 'admin: update mestieri')
    page.value.sha = result.sha
    snapshot()
    ui.toast('Mestieri salvati — deploy in corso', 'success')
  } catch (error) {
    ui.toast(errorText(error), 'error', { title: 'Salvataggio non riuscito' })
  } finally {
    saving.value = false
  }
}

useUnsavedGuard(() => dirty.value, 'modifiche ai mestieri non salvate')
onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Mestieri</h1>
      <div class="arc-head-actions">
        <button class="btn btn-p" type="button" :disabled="saving || !dirty" @click="save">💾 Salva</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
        <button class="btn btn-soft" type="button" @click="startAdd">＋ Nuovo mestiere</button>
      </div>
    </div>
    <p class="arc-hint">
      Ogni mestiere diventa una scheda della pagina <a href="#/editor/mestieri">Mestieri</a>: patente, livello di
      maestria, categoria e rendita sono le etichette mostrate nella griglia e nel dettaglio.
    </p>

    <div v-if="adding || editing !== null" class="arc-panel">
      <h2 class="arc-panel-title">{{ adding ? 'Nuovo mestiere' : 'Modifica mestiere' }}</h2>
      <div class="arc-form-grid">
        <label class="arc-fld"><span>Nome</span><input v-model="form.nome" class="in" placeholder="Oste" /></label>
        <label class="arc-fld"
          ><span>Patente</span><input v-model="form.patente" class="in" placeholder="P.M.C. — Manifattura Comune"
        /></label>
        <label class="arc-fld"
          ><span>Livello di maestria</span
          ><input v-model="form.livello" class="in" placeholder="L1 — Bottega Artigiana"
        /></label>
        <label class="arc-fld"
          ><span>Categoria</span><input v-model="form.categoria" class="in" placeholder="Cucina"
        /></label>
        <label class="arc-fld"
          ><span>Rendita di fornitura</span><input v-model="form.rendita" class="in" placeholder="15 Mo al mese"
        /></label>
        <label class="arc-fld" style="grid-column: 1/-1"
          ><span>Dettaglio (markdown)</span
          ><textarea
            v-model="form.dettaglio"
            class="in"
            rows="12"
            placeholder="#### Requisiti&#10;&#10;| … |"
          ></textarea>
        </label>
      </div>
      <div class="arc-form-actions">
        <button class="btn btn-soft btn-sm" type="button" @click="cancel">Annulla</button><span style="flex: 1"></span
        ><button class="btn btn-p btn-sm" type="button" @click="apply">Applica</button>
      </div>
    </div>

    <div class="arc-panel">
      <h2 class="arc-panel-title">{{ items.length }} mestieri</h2>
      <div v-if="loading" class="arc-empty-side">Caricamento…</div>
      <div v-for="(item, index) in items" :key="item.nome" class="arc-changelog-item">
        <div style="flex: 1; min-width: 0">
          <div class="arc-changelog-head">
            <strong>{{ item.nome }}</strong>
            <code>{{ item.patente || 'Senza patente' }}</code>
          </div>
          <p class="arc-hint">
            {{ item.livello || 'Livello non indicato' }} · {{ item.categoria || 'Senza categoria' }} ·
            {{ item.rendita || 'Nessuna rendita' }}
          </p>
        </div>
        <div class="arc-form-actions">
          <button class="btn btn-soft btn-sm" type="button" @click="startEdit(index)">Modifica</button
          ><button class="btn btn-d btn-sm" type="button" @click="remove(index)">Elimina</button>
        </div>
      </div>
      <div v-if="!loading && !items.length" class="arc-empty-side">Nessun mestiere: aggiungi la prima scheda.</div>
    </div>
  </section>
</template>
