<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { errorText, calendarApi } from '@/shared/api'
import { useUnsavedGuard } from '@/shared/guard'
import { useUIStore } from '@/app/store'
import type { CalendarConfig, CalendarFeast } from '@/types'

/* Datario del mondo: mesi, settimana, epoca e feste in content/calendar.json. */
const ui = useUIStore()

const loading = ref(false)
const saving = ref(false)
const sha = ref<string | null>(null)
const dirty = ref(false)

const form = reactive<CalendarConfig>({
  epochGregorian: '2024-01-01',
  epochArcamis: { anno: 1492, mese: 0, giorno: 1 },
  mesi: [],
  giorniMese: 30,
  giorniSettimana: [],
  feste: []
})

const mesiText = ref('')
const giorniText = ref('')
const feastForm = reactive<CalendarFeast>({ mese: 0, giorno: 1, nome: '' })

useUnsavedGuard(() => dirty.value, 'calendario non salvato')

function markDirty(): void {
  dirty.value = true
}

const feastMonthName = (m: number): string => form.mesi[m] || `Mese ${m + 1}`

const sortedFeasts = computed(() =>
  form.feste.map((f, idx) => ({ ...f, idx })).sort((a, b) => a.mese - b.mese || a.giorno - b.giorno)
)

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await calendarApi.get()
    Object.assign(form, JSON.parse(JSON.stringify(res.config)))
    form.epochArcamis = { ...res.config.epochArcamis }
    mesiText.value = form.mesi.join('\n')
    giorniText.value = form.giorniSettimana.join(', ')
    sha.value = res.sha
    dirty.value = false
  } catch (e) {
    ui.toast('Errore caricamento calendario: ' + errorText(e), 'error')
  } finally {
    loading.value = false
  }
}

function applyMesi(): void {
  const mesi = mesiText.value
    .split('\n')
    .map((m) => m.trim())
    .filter(Boolean)
  if (mesi.length < 2) {
    ui.toast('Servono almeno 2 mesi', 'error')
    return
  }
  form.mesi = mesi
  /* Le feste oltre l'ultimo mese rientrano nell'ultimo disponibile. */
  for (const f of form.feste) f.mese = Math.min(f.mese, mesi.length - 1)
  markDirty()
}

function applyGiorni(): void {
  form.giorniSettimana = giorniText.value
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
  markDirty()
}

function addFeast(): void {
  const nome = feastForm.nome.trim()
  if (!nome) {
    ui.toast('Il nome della festa è obbligatorio', 'error')
    return
  }
  if (feastForm.mese < 0 || feastForm.mese >= form.mesi.length) {
    ui.toast('Mese non valido', 'error')
    return
  }
  if (feastForm.giorno < 1 || feastForm.giorno > form.giorniMese) {
    ui.toast(`Il giorno deve stare tra 1 e ${form.giorniMese}`, 'error')
    return
  }
  form.feste.push({ mese: feastForm.mese, giorno: feastForm.giorno, nome })
  feastForm.nome = ''
  markDirty()
}

function removeFeast(idx: number): void {
  form.feste.splice(idx, 1)
  markDirty()
}

async function save(): Promise<void> {
  saving.value = true
  try {
    const res = await calendarApi.save(form, sha.value)
    sha.value = res.sha
    dirty.value = false
    ui.toast('Calendario salvato — deploy in corso (~30s)', 'success')
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
      <h1 class="arc-page-title">Calendario del Mondo</h1>
      <div class="arc-head-actions">
        <button v-if="dirty" class="btn btn-p" type="button" :disabled="saving" @click="save">💾 Salva</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>
    <p class="arc-hint">Il sito converte la data reale partendo dall'epoca: cambia qui mesi, settimana e feste.</p>

    <div v-if="loading" class="arc-panel">
      <span class="arc-skel-bar" style="width: 40%"></span>
      <span class="arc-skel-block"></span>
    </div>

    <template v-else>
      <div class="arc-panel" style="margin-bottom: 16px">
        <h3 class="arc-panel-title">Epoca e struttura</h3>
        <div class="arc-form-grid">
          <label class="arc-fld">
            <span>Data reale dell'epoca (Capodanno)</span>
            <input v-model="form.epochGregorian" class="in" type="date" @change="markDirty" />
          </label>
          <label class="arc-fld">
            <span>Giorni per mese</span>
            <input v-model.number="form.giorniMese" class="in" type="number" min="1" max="60" @change="markDirty" />
          </label>
        </div>
        <div class="arc-form-grid">
          <label class="arc-fld">
            <span>Anno di Arcamis all'epoca</span>
            <input v-model.number="form.epochArcamis.anno" class="in" type="number" @change="markDirty" />
          </label>
          <label class="arc-fld">
            <span>Giorni della settimana (separati da virgola)</span>
            <input v-model="giorniText" class="in" placeholder="Lunadì, Martedì, …" @change="applyGiorni" />
          </label>
        </div>
      </div>

      <div class="arc-panel" style="margin-bottom: 16px">
        <h3 class="arc-panel-title">Mesi ({{ form.mesi.length }}, uno per riga)</h3>
        <textarea v-model="mesiText" class="in" rows="6" style="resize: vertical; width: 100%"></textarea>
        <div class="arc-form-actions" style="margin-top: 8px">
          <button class="btn btn-soft btn-sm" type="button" @click="applyMesi">Applica mesi</button>
        </div>
      </div>

      <div class="arc-panel">
        <h3 class="arc-panel-title">Feste ({{ form.feste.length }})</h3>
        <div class="arc-form-grid">
          <label class="arc-fld">
            <span>Mese</span>
            <select v-model.number="feastForm.mese" class="in">
              <option v-for="(m, i) in form.mesi" :key="i" :value="i">{{ i + 1 }} — {{ m }}</option>
            </select>
          </label>
          <label class="arc-fld">
            <span>Giorno</span>
            <input v-model.number="feastForm.giorno" class="in" type="number" min="1" :max="form.giorniMese" />
          </label>
        </div>
        <label class="arc-fld">
          <span>Nome festa</span>
          <input v-model="feastForm.nome" class="in" placeholder="Festa del Raccolto" maxlength="60" />
        </label>
        <div class="arc-form-actions" style="margin: 8px 0">
          <button class="btn btn-soft btn-sm" type="button" @click="addFeast">＋ Aggiungi festa</button>
        </div>
        <div v-for="f in sortedFeasts" :key="f.idx" class="arc-changelog-item">
          <div style="flex: 1">
            <div class="arc-changelog-head">
              <strong>🎉 {{ f.nome }}</strong>
              <span style="margin-left: 8px">{{ f.giorno }} {{ feastMonthName(f.mese) }}</span>
            </div>
          </div>
          <button class="btn btn-d btn-sm" type="button" @click="removeFeast(f.idx)">Elimina</button>
        </div>
        <div v-if="!form.feste.length" class="arc-empty-side">Nessuna festa: il calendario mostra solo i mesi.</div>
      </div>
    </template>
  </section>
</template>
