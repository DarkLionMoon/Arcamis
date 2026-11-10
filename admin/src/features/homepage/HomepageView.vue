<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useUIStore } from '@/app/store'
import { errorText } from '@/shared/api'
import { homepageApi } from '@/shared/api/homepage'
import { registryApi } from '@/shared/api/content'
import { confirmAction } from '@/shared/confirm'
import { useUnsavedGuard } from '@/shared/guard'
import {
  HOMEPAGE_TYPES,
  SECTION_TYPE_LABELS,
  defaultHomepage,
  homepageHash,
  normalizeHomepage,
  renderHomepageSections
} from '@/shared/homepage'
import type {
  HomepageConfig,
  HomepageCta,
  HomepageFaction,
  HomepageGuild,
  HomepageLink,
  HomepageSection,
  HomepageSectionType,
  HomepageStep,
  HomepageWikiGroup
} from '@/shared/homepage'
import MediaDrawer from '@/features/pages/editor/MediaDrawer.vue'

/* ════════════════════════════════════════════════════════════════
   HOMEPAGE BUILDER

   Le sezioni della home vivono in content/homepage.json (una sola
   configurazione, nessuna seconda home). Qui si modificano testi,
   card, CTA, visibilità e ordine; l'anteprima usa lo stesso
   renderer del build pubblico, quindi ciò che si vede è ciò che
   viene pubblicato.

   Il carousel/hero non è duplicato: resta nel suo editor (manifest
   KV) e questo pannello ci rimanda.
   ════════════════════════════════════════════════════════════════ */

type Device = 'desktop' | 'tablet' | 'mobile'

interface EditableSection extends HomepageSection {
  showMap: boolean
  guildsTitle: string
  factions: HomepageFaction[]
  guilds: HomepageGuild[]
  footerText: string
  links: HomepageLink[]
  steps: HomepageStep[]
  cta: HomepageCta[]
  groups: HomepageWikiGroup[]
}

interface Draft {
  savedAt: string
  sections: HomepageSection[]
}

const DRAFT_KEY = 'arc-homepage-draft-v1'
const DEVICE_WIDTH: Record<Device, string> = { desktop: '100%', tablet: '768px', mobile: '390px' }
const VERIFY_ATTEMPTS = 8
const VERIFY_DELAY_MS = 15_000

const ui = useUIStore()

const sections = ref<EditableSection[]>([])
const published = ref<HomepageConfig | null>(null)
const publishedHash = ref('')
const sha = ref('')
const loading = ref(true)
const saving = ref(false)
const expanded = ref<string | null>(null)
const previewOpen = ref(true)
const device = ref<Device>('desktop')
const pages = ref<Array<{ id: string; label: string; path: string }>>([])
const draftNotice = ref('')
const newType = ref<HomepageSectionType>('steps')
const historyOpen = ref(false)
const history = ref<Array<{ sha: string; date: string; message: string }>>([])
const historyLoading = ref(false)
const picker = ref<{ group: number; card: number } | null>(null)

const siteState = ref<{ state: 'unknown' | 'ok' | 'stale'; message: string }>({
  state: 'unknown',
  message: ''
})
const verification = ref<{ state: 'idle' | 'pending' | 'ok' | 'failed'; message: string }>({
  state: 'idle',
  message: ''
})

let draftTimer: ReturnType<typeof setTimeout> | null = null
let verifyTimer: ReturnType<typeof setTimeout> | null = null

/* ── Modello editabile ───────────────────────────────────────── */

function toEditable(section: HomepageSection): EditableSection {
  return {
    ...section,
    showMap: section.type === 'marche' ? (section.showMap ?? true) : false,
    guildsTitle: section.guildsTitle ?? '',
    factions: section.factions ?? [],
    guilds: section.guilds ?? [],
    footerText: section.footerText ?? '',
    links: section.links ?? [],
    steps: section.steps ?? [],
    cta: section.cta ?? [],
    groups: section.groups ?? []
  }
}

const configValue = computed<HomepageConfig>(() => ({
  version: 1,
  updatedAt: null,
  sections: sections.value
}))

const dirty = computed(
  () => !loading.value && publishedHash.value !== '' && homepageHash(configValue.value) !== publishedHash.value
)

const visibleCount = computed(() => sections.value.filter((section) => section.visible).length)

const addableTypes = computed(() =>
  HOMEPAGE_TYPES.filter((type) => type !== 'marche' || !sections.value.some((section) => section.type === 'marche'))
)

const pagePaths = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const page of pages.value) map[page.id] = page.path.replace(/^\/+/, '')
  return map
})

useUnsavedGuard(() => dirty.value, 'modifiche alla homepage non pubblicate')

function typeLabel(type: HomepageSectionType): string {
  return SECTION_TYPE_LABELS[type] || type
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function uniqueId(base: string): string {
  let id = base || 'sezione'
  let n = 2
  const taken = new Set(sections.value.map((section) => section.id))
  while (taken.has(id)) id = `${base}-${n++}`
  return id
}

/* ── Caricamento e bozza locale ──────────────────────────────── */

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Draft
    if (!parsed || !Array.isArray(parsed.sections) || !parsed.sections.length) return null
    return parsed
  } catch {
    return null
  }
}

function writeDraft(): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: new Date().toISOString(), sections: sections.value }))
  } catch {
    /* storage pieno o negato: la bozza locale è solo una comodità */
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignorato */
  }
}

function scheduleDraftSave(): void {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(writeDraft, 700)
}

watch(sections, () => {
  if (loading.value) return
  if (dirty.value) scheduleDraftSave()
}, { deep: true })

async function load(): Promise<void> {
  loading.value = true
  draftNotice.value = ''
  try {
    const doc = await homepageApi.get()
    sha.value = doc.sha
    published.value = doc.config
    publishedHash.value = doc.hash
    sections.value = doc.config.sections.map(toEditable)
    if (doc.warnings.length) ui.toast(doc.warnings.join(' '), 'warning', { title: 'Configurazione homepage' })

    const draft = readDraft()
    if (draft && homepageHash({ version: 1, updatedAt: null, sections: draft.sections }) !== doc.hash) {
      sections.value = draft.sections.map(toEditable)
      draftNotice.value = draft.savedAt
    }

    if (!expanded.value) expanded.value = sections.value[0]?.id ?? null
    await checkSiteState()
  } catch (e) {
    ui.toast('Homepage non caricata: ' + errorText(e), 'error')
  } finally {
    loading.value = false
  }
}

async function loadPages(): Promise<void> {
  try {
    const registry = await registryApi.get()
    pages.value = (registry.pages || []).map((page) => ({
      id: page.id,
      label: page.l,
      path: (page as { path?: string }).path || ''
    }))
  } catch {
    /* il selettore pagine è un aiuto, non un requisito */
  }
}

async function checkSiteState(): Promise<void> {
  try {
    const result = await homepageApi.verifyPublished(publishedHash.value)
    if (result.ok) {
      siteState.value = { state: 'ok', message: 'Il sito online serve la configurazione pubblicata.' }
    } else if (result.found) {
      siteState.value = {
        state: 'stale',
        message: `Il sito online serve un'altra versione (${result.found}): un deploy potrebbe essere in corso.`
      }
    } else {
      siteState.value = {
        state: 'unknown',
        message: 'Impronta non rilevata in questa anteprima locale: la verifica funziona sul sito pubblicato.'
      }
    }
  } catch {
    siteState.value = { state: 'unknown', message: 'Verifica del pubblicato non disponibile da questa anteprima.' }
  }
}

/* ── Sezioni: visibilità, ordine, duplicazione, eliminazione ─── */

function toggleVisible(section: EditableSection): void {
  section.visible = !section.visible
}

function move(index: number, dir: -1 | 1): void {
  const to = index + dir
  if (to < 0 || to >= sections.value.length) return
  const [moved] = sections.value.splice(index, 1)
  sections.value.splice(to, 0, moved)
}

function moveItem<T>(items: T[], index: number, dir: -1 | 1): void {
  const to = index + dir
  if (to < 0 || to >= items.length) return
  const [moved] = items.splice(index, 1)
  items.splice(to, 0, moved)
}

function duplicate(section: EditableSection): void {
  if (section.type === 'marche') {
    ui.toast('La sezione con la mappa è unica: duplicarla creerebbe due mappe con gli stessi ID.', 'warning')
    return
  }
  const index = sections.value.indexOf(section)
  const copy = JSON.parse(JSON.stringify(section)) as EditableSection
  copy.id = uniqueId(`${section.id}-copia`)
  copy.label = `${section.label} (copia)`.slice(0, 120)
  sections.value.splice(index + 1, 0, copy)
  expanded.value = copy.id
}

async function remove(section: EditableSection): Promise<void> {
  const ok = await confirmAction({
    title: 'Elimina sezione',
    message: `Eliminare «${section.label}» dalla homepage?`,
    detail: 'La sezione sparisce dal sito al salvataggio. Potrai ripristinare le sezioni predefinite in seguito.',
    confirmLabel: 'Elimina sezione',
    danger: true
  })
  if (!ok) return
  const index = sections.value.indexOf(section)
  if (index >= 0) sections.value.splice(index, 1)
}

function addSection(): void {
  const type = newType.value
  if (type === 'marche' && sections.value.some((section) => section.type === 'marche')) {
    ui.toast('La sezione mappa esiste già', 'warning')
    return
  }
  const base = defaultHomepage().sections.find((section) => section.type === type)
  const template = base ? toEditable(base) : null
  const section: EditableSection = template
    ? { ...JSON.parse(JSON.stringify(template)) }
    : toEditable({
        id: `${type}-1`,
        type,
        label: typeLabel(type),
        visible: true,
        divider: false,
        eyebrow: '',
        title: '',
        description: ''
      })
  section.id = uniqueId(`${type}-nuova`)
  section.label = `${typeLabel(type)} (nuova)`
  section.visible = true
  sections.value.push(section)
  expanded.value = section.id
}

async function restoreDefaults(): Promise<void> {
  const ok = await confirmAction({
    title: 'Ripristina sezioni predefinite',
    message: 'Riaggiungere le sezioni predefinite mancanti?',
    detail: 'Le sezioni già presenti non vengono toccate. Nulla va online finché non salvi.',
    confirmLabel: 'Ripristina'
  })
  if (!ok) return
  const present = new Set(sections.value.map((section) => section.type))
  const missing = defaultHomepage().sections.filter((section) => !present.has(section.type))
  if (!missing.length) {
    ui.toast('Nessuna sezione predefinita mancante', 'info')
    return
  }
  sections.value.push(...missing.map((section) => toEditable(section)))
  ui.toast(`${missing.length} sezioni ripristinate`, 'success')
}

/* ── Drag & drop ─────────────────────────────────────────────── */

const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)

function onDragStart(index: number, event: DragEvent): void {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(index: number): void {
  if (dragIndex.value === null || dragIndex.value === index) return
  dropIndex.value = index
}

function onDrop(index: number): void {
  const from = dragIndex.value
  if (from === null || from === index) {
    resetDrag()
    return
  }
  const [moved] = sections.value.splice(from, 1)
  sections.value.splice(index, 0, moved)
  resetDrag()
  expanded.value = moved.id
}

function resetDrag(): void {
  dragIndex.value = null
  dropIndex.value = null
}

/* ── Elementi ripetibili ────────────────────────────────────── */

function addFaction(section: EditableSection): void {
  section.factions.push({ icon: '⚜️', name: 'Nuova fazione', description: '', active: true })
}

function addGuild(section: EditableSection): void {
  section.guilds.push({ icon: '🏛️', name: 'Nuova gilda', role: '', color: 'rgba(200,155,60,.6)' })
}

function addLink(section: EditableSection): void {
  section.links.push({ label: 'Nuovo link', href: '/', external: false })
}

function addStep(section: EditableSection): void {
  section.steps.push({ icon: '✦', title: 'Nuovo passo', description: '' })
}

function addCta(section: EditableSection): void {
  section.cta.push({ label: 'Nuovo pulsante', href: '/', external: false, kind: '' })
}

function addGroup(section: EditableSection): void {
  section.groups.push({ title: 'Nuovo gruppo', cards: [] })
}

function addCard(group: HomepageWikiGroup): void {
  group.cards.push({ icon: '✦', name: 'Nuova card', description: '', pageId: '', image: '' })
}

/* ── Immagini dei card wiki ──────────────────────────────────── */

const pickerOpen = computed({
  get: () => picker.value !== null,
  set: (open: boolean) => {
    if (!open) picker.value = null
  }
})

function openPicker(groupIndex: number, cardIndex: number): void {
  picker.value = { group: groupIndex, card: cardIndex }
}

function onPick(path: string): void {
  const target = picker.value
  if (!target) return
  const group = sections.value.find((section) => section.type === 'wiki')?.groups[target.group]
  const card = group?.cards[target.card]
  if (card) card.image = path
}

/* ── Anteprima ──────────────────────────────────────────────── */

const PREVIEW_CSS = ['fonts', 'style-base', 'theme-v2', 'shell-v2', 'style-home', 'style-fx', 'style-ui']
const PREVIEW_MAP =
  '<div style="margin:18px 0 0;padding:26px;border:1px dashed rgba(200,155,60,.35);color:#b8a97e;font-size:14px">Mappa interattiva: il sito pubblico reinserisce qui la mappa reale con i punti gestiti in Mappa.</div>'

const previewDoc = computed(() => {
  const links = PREVIEW_CSS.map((name) => `<link rel="stylesheet" href="/scripts/css/${name}.css">`).join('\n  ')
  const body = renderHomepageSections(configValue.value, { mapHtml: PREVIEW_MAP, pagePaths: pagePaths.value })
  return [
    '<!DOCTYPE html><html lang="it" data-theme="dark"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `  ${links}`,
    '  <style>html,body{margin:0;background:#080a0e;color:#e8e4da}body{font-family:"Crimson Pro",Georgia,serif}',
    '.vp{display:block;padding-bottom:48px}.hsec,.arcadia-sec{box-sizing:border-box}',
    '.hp-note{margin:14px 18px 0;padding:10px 14px;border:1px solid rgba(200,155,60,.25);font-size:12px;letter-spacing:.06em;color:#c8b483;text-transform:uppercase}',
    '</style></head><body><div id="hv" class="vp">',
    '<div class="hp-note">Anteprima sezioni · hero e carousel esclusi (gestiti in Carousel Homepage)</div>',
    body,
    '</div></body></html>'
  ].join('\n')
})

/* ── Salvataggio, verifica, cronologia ───────────────────────── */

const dirtyCount = computed(() => {
  if (!published.value) return sections.value.length
  return sections.value.filter((section) => {
    const previous = published.value?.sections.find((item) => item.id === section.id)
    return !previous || JSON.stringify(previous) !== JSON.stringify(stripEditable(section))
  }).length
})

function stripEditable(section: EditableSection): HomepageSection {
  return normalizeHomepage({ version: 1, sections: [section] }).config.sections[0] || section
}

async function save(): Promise<void> {
  if (saving.value) return
  const validation = normalizeHomepage(configValue.value)
  if (validation.errors.length) {
    ui.toast(validation.errors.join(' '), 'error', { title: 'Controlla la configurazione' })
    return
  }
  if (validation.warnings.length) ui.toast(validation.warnings.join(' '), 'warning')
  if (!validation.config.sections.length) {
    ui.toast('La homepage non ha sezioni da pubblicare', 'error')
    return
  }
  const visible = validation.config.sections.filter((section) => section.visible).length
  const ok = await confirmAction({
    title: 'Pubblica la homepage',
    message: 'Salvare e pubblicare la homepage?',
    detail: `${visible} sezioni visibili · commit su GitHub e deploy Cloudflare automatico (~30s).`,
    confirmLabel: 'Salva e pubblica'
  })
  if (!ok) return

  saving.value = true
  try {
    const result = await homepageApi.save(validation.config, sha.value)
    sha.value = result.sha
    published.value = result.config
    publishedHash.value = result.hash
    sections.value = result.config.sections.map(toEditable)
    clearDraft()
    draftNotice.value = ''
    ui.toast('Homepage salvata: commit creato, deploy in corso', 'success')
    startVerification(result.hash)
  } catch (e) {
    ui.toast('Salvataggio non riuscito: ' + errorText(e), 'error')
  } finally {
    saving.value = false
  }
}

function stopVerification(): void {
  if (verifyTimer) clearTimeout(verifyTimer)
  verifyTimer = null
}

function startVerification(hash: string): void {
  stopVerification()
  void verify(hash, 1)
}

async function verify(hash: string, attempt: number): Promise<void> {
  verification.value = {
    state: 'pending',
    message: attempt === 1 ? 'Verifico la homepage pubblicata…' : `Deploy non ancora visibile · tentativo ${attempt}/${VERIFY_ATTEMPTS}…`
  }
  try {
    const result = await homepageApi.verifyPublished(hash)
    if (result.ok) {
      verification.value = { state: 'ok', message: 'Pubblicata e verificata: la home online serve questa versione.' }
      siteState.value = { state: 'ok', message: 'Il sito online serve la configurazione pubblicata.' }
      return
    }
    if (!result.found) {
      verification.value = {
        state: 'failed',
        message: 'Impronta non trovata nella home online: verifica dal sito pubblicato (non da un’anteprima locale).'
      }
      return
    }
  } catch (e) {
    verification.value = { state: 'failed', message: 'Verifica non riuscita: ' + errorText(e) }
    return
  }
  if (attempt >= VERIFY_ATTEMPTS) {
    verification.value = {
      state: 'failed',
      message: 'Commit creato ma il deploy non risulta ancora attivo. Riprova con «Verifica ora» tra qualche minuto.'
    }
    return
  }
  verifyTimer = setTimeout(() => void verify(hash, attempt + 1), VERIFY_DELAY_MS)
}

function verifyNow(): void {
  if (!publishedHash.value) return
  startVerification(publishedHash.value)
}

async function toggleHistory(): Promise<void> {
  historyOpen.value = !historyOpen.value
  if (!historyOpen.value) return
  historyLoading.value = true
  try {
    history.value = await homepageApi.history()
  } catch (e) {
    ui.toast('Cronologia non disponibile: ' + errorText(e), 'error')
  } finally {
    historyLoading.value = false
  }
}

async function restore(entry: { sha: string; date: string; message: string }): Promise<void> {
  const ok = await confirmAction({
    title: 'Carica dalla cronologia',
    message: `Caricare la homepage del commit ${entry.sha.slice(0, 7)}?`,
    detail: 'La configurazione viene caricata nell’editor: non va online finché non la salvi.',
    confirmLabel: 'Carica'
  })
  if (!ok) return
  try {
    const config = await homepageApi.getAt(entry.sha)
    sections.value = config.sections.map(toEditable)
    expanded.value = sections.value[0]?.id ?? null
    ui.toast('Versione caricata: controlla l’anteprima e salva per pubblicarla', 'success')
  } catch (e) {
    ui.toast('Ripristino non riuscito: ' + errorText(e), 'error')
  }
}

function discardDraft(): void {
  if (!published.value) return
  sections.value = published.value.sections.map(toEditable)
  draftNotice.value = ''
  clearDraft()
  ui.toast('Bozza locale scartata', 'info')
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('it-IT')
}

onMounted(async () => {
  await Promise.all([load(), loadPages()])
})

onBeforeUnmount(() => {
  stopVerification()
  if (draftTimer) clearTimeout(draftTimer)
})
</script>

<template>
  <section class="arc-dashboard hp-view">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Homepage</h1>
      <div class="arc-head-actions">
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Ricarica</button>
        <router-link class="btn btn-soft" to="/carousel">🎠 Carousel</router-link>
        <button class="btn btn-soft" type="button" :aria-pressed="previewOpen" @click="previewOpen = !previewOpen">
          {{ previewOpen ? 'Nascondi anteprima' : 'Mostra anteprima' }}
        </button>
        <button class="btn btn-p" type="button" :disabled="saving || !dirty" @click="save">
          {{ saving ? 'Salvo…' : '💾 Salva e pubblica' }}
        </button>
      </div>
    </div>

    <div class="arc-panel hp-intro">
      <div class="hp-status">
        <span class="arc-chip" :class="{ 'is-dirty': dirty }">
          {{ dirty ? `Modifiche non salvate (${dirtyCount} sezioni)` : 'Nessuna modifica — allineata al pubblicato' }}
        </span>
        <span v-if="sections.length" class="arc-chip">{{ visibleCount }}/{{ sections.length }} sezioni visibili</span>
        <span v-if="siteState.state !== 'unknown'" class="arc-chip" :class="{ 'is-dirty': siteState.state !== 'ok' }">
          {{ siteState.state === 'ok' ? 'Sito allineato' : 'Sito da aggiornare' }}
        </span>
      </div>
      <p class="arc-hint">
        Sezioni, testi, card e CTA della home pubblica. Le modifiche restano in bozza finché non premi
        <strong>Salva e pubblica</strong>: il commit aggiorna <code>content/homepage.json</code> e il deploy rigenera
        l'HTML statico (la home funziona anche senza JavaScript). Hero e carousel hanno il loro editor: qui non vengono
        duplicati.
      </p>
      <p v-if="siteState.message" class="arc-hint" :class="{ 'hp-warn': siteState.state !== 'ok' }">{{ siteState.message }}</p>
    </div>

    <div v-if="draftNotice" class="arc-panel hp-banner">
      <span>📝 Bozza locale del {{ formatDate(draftNotice) }}: non è ancora pubblicata.</span>
      <button class="btn btn-soft btn-sm" type="button" @click="discardDraft">Scarta bozza</button>
    </div>

    <div v-if="verification.state !== 'idle'" class="arc-panel hp-banner" :class="'is-' + verification.state">
      <span>{{ verification.message }}</span>
      <button class="btn btn-soft btn-sm" type="button" :disabled="verification.state === 'pending'" @click="verifyNow">
        Verifica ora
      </button>
    </div>

    <div v-if="loading" class="arc-empty-side">Caricamento homepage…</div>

    <div v-else class="hp-layout" :class="{ 'has-preview': previewOpen }">
      <div class="hp-sections">
        <div
          v-for="(section, index) in sections"
          :key="section.id"
          class="hp-section"
          :class="{
            'is-hidden': !section.visible,
            'is-dragging': dragIndex === index,
            'is-target': dropIndex === index && dragIndex !== index,
            'is-open': expanded === section.id
          }"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragover.prevent="onDragOver(index)"
          @drop.prevent="onDrop(index)"
          @dragend="resetDrag"
        >
          <div class="hp-section-head">
            <span class="hp-drag" title="Trascina per riordinare" aria-hidden="true">⠿</span>
            <div class="hp-section-name">
              <strong>{{ section.label }}</strong>
              <small>{{ typeLabel(section.type) }} · {{ section.visible ? 'Visibile' : 'Nascosta' }}</small>
            </div>
            <div class="hp-section-actions">
              <button class="arc-icon-btn" type="button" title="Sposta su" :disabled="index === 0" @click="move(index, -1)">↑</button>
              <button
                class="arc-icon-btn"
                type="button"
                title="Sposta giù"
                :disabled="index === sections.length - 1"
                @click="move(index, 1)"
              >
                ↓
              </button>
              <button
                class="arc-icon-btn"
                type="button"
                :title="section.visible ? 'Nascondi sezione' : 'Mostra sezione'"
                @click="toggleVisible(section)"
              >
                {{ section.visible ? '👁' : '🚫' }}
              </button>
              <button class="arc-icon-btn" type="button" title="Duplica sezione" @click="duplicate(section)">⧉</button>
              <button class="arc-icon-btn" type="button" title="Elimina sezione" @click="remove(section)">🗑</button>
              <button
                class="btn btn-soft btn-sm"
                type="button"
                :aria-expanded="expanded === section.id"
                @click="expanded = expanded === section.id ? null : section.id"
              >
                {{ expanded === section.id ? 'Chiudi' : 'Modifica' }}
              </button>
            </div>
          </div>

          <div v-if="expanded === section.id" class="hp-form">
            <div class="arc-form-grid" style="grid-template-columns: 1fr 1fr">
              <label class="arc-fld">
                <span>Nome nel pannello</span>
                <input v-model="section.label" class="in" maxlength="120" />
              </label>
              <label class="arc-fld">
                <span>Id sezione (stabile)</span>
                <input :value="section.id" class="in" disabled />
              </label>
            </div>

            <div class="arc-form-grid" style="grid-template-columns: 1fr 1fr">
              <label class="arc-fld">
                <span>Etichetta piccola (eyebrow)</span>
                <input v-model="section.eyebrow" class="in" maxlength="120" placeholder="es. Il Regno" />
              </label>
              <label class="arc-fld">
                <span>Titolo della sezione</span>
                <input v-model="section.title" class="in" maxlength="200" placeholder="es. ARCADIA" />
              </label>
            </div>

            <label class="arc-fld">
              <span>Descrizione</span>
              <textarea v-model="section.description" class="in" rows="3" maxlength="1200"></textarea>
              <small class="arc-field-help">Testo semplice. **grassetto dorato**, *corsivo*, invio per andare a capo.</small>
            </label>

            <div class="arc-form-grid" style="grid-template-columns: 1fr 1fr">
              <label class="arc-toggle-line"><input v-model="section.visible" type="checkbox" /> Visibile sul sito</label>
              <label class="arc-toggle-line">
                <input v-model="section.divider" type="checkbox" /> Separatore dorato sopra la sezione
              </label>
            </div>

            <!-- Mappa -->
            <template v-if="section.type === 'marche'">
              <label class="arc-toggle-line">
                <input v-model="section.showMap" type="checkbox" /> Mostra la mappa interattiva
              </label>
              <p class="arc-hint">
                Punti, immagini e sottoviste della mappa si gestiscono in <router-link to="/mapa">Mappa</router-link>; qui
                decidi solo se mostrarla nella home.
              </p>
            </template>

            <!-- Arcadia -->
            <template v-else-if="section.type === 'arcadia'">
              <div class="hp-block">
                <div class="hp-block-head">
                  <h3>Fazioni</h3>
                  <button class="btn btn-soft btn-sm" type="button" @click="addFaction(section)">+ Fazione</button>
                </div>
                <div v-for="(faction, i) in section.factions" :key="'faction-' + i" class="hp-row hp-row--faction">
                  <input v-model="faction.icon" class="in hp-icon" maxlength="24" aria-label="Icona" />
                  <input v-model="faction.name" class="in" maxlength="120" placeholder="Nome" aria-label="Nome" />
                  <input v-model="faction.description" class="in" maxlength="500" placeholder="Descrizione" aria-label="Descrizione" />
                  <label class="arc-toggle-line hp-inline"><input v-model="faction.active" type="checkbox" /> attiva</label>
                  <button class="arc-icon-btn" type="button" title="Sposta su" :disabled="i === 0" @click="moveItem(section.factions, i, -1)">↑</button>
                  <button class="arc-icon-btn" type="button" title="Rimuovi" @click="section.factions.splice(i, 1)">✕</button>
                </div>
                <p v-if="!section.factions.length" class="arc-hint">Nessuna fazione: la griglia non viene mostrata.</p>
              </div>

              <div class="hp-block">
                <div class="hp-block-head">
                  <label class="arc-fld hp-grow">
                    <span>Titolo del gruppo gilde</span>
                    <input v-model="section.guildsTitle" class="in" maxlength="120" placeholder="es. Le Grandi Gilde" />
                  </label>
                  <button class="btn btn-soft btn-sm" type="button" @click="addGuild(section)">+ Gilda</button>
                </div>
                <div v-for="(guild, i) in section.guilds" :key="'guild-' + i" class="hp-row hp-row--guild">
                  <input v-model="guild.icon" class="in hp-icon" maxlength="24" aria-label="Icona" />
                  <input v-model="guild.name" class="in" maxlength="120" placeholder="Nome" aria-label="Nome" />
                  <input v-model="guild.role" class="in" maxlength="160" placeholder="Ruolo" aria-label="Ruolo" />
                  <input v-model="guild.color" class="in hp-color" maxlength="60" placeholder="rgba(200,155,60,.6)" aria-label="Colore barra" />
                  <button class="arc-icon-btn" type="button" title="Sposta su" :disabled="i === 0" @click="moveItem(section.guilds, i, -1)">↑</button>
                  <button class="arc-icon-btn" type="button" title="Rimuovi" @click="section.guilds.splice(i, 1)">✕</button>
                </div>
                <p v-if="!section.guilds.length" class="arc-hint">Nessuna gilda: il gruppo non viene mostrato.</p>
              </div>
            </template>

            <!-- Novità -->
            <template v-else-if="section.type === 'news'">
              <label class="arc-fld">
                <span>Testo a sinistra nel footer della sezione</span>
                <input v-model="section.footerText" class="in" maxlength="300" />
              </label>
              <div class="hp-block">
                <div class="hp-block-head">
                  <h3>Link in fondo alla sezione</h3>
                  <button class="btn btn-soft btn-sm" type="button" :disabled="section.links.length >= 6" @click="addLink(section)">
                    + Link
                  </button>
                </div>
                <div v-for="(link, i) in section.links" :key="'link-' + i" class="hp-row hp-row--link">
                  <input v-model="link.label" class="in" maxlength="80" placeholder="Etichetta" aria-label="Etichetta" />
                  <input v-model="link.href" class="in" maxlength="2048" placeholder="/novita oppure https://…" aria-label="Destinazione" />
                  <label class="arc-toggle-line hp-inline"><input v-model="link.external" type="checkbox" /> esterno</label>
                  <button class="arc-icon-btn" type="button" title="Rimuovi" @click="section.links.splice(i, 1)">✕</button>
                </div>
                <p class="arc-hint">
                  Le tre card della sezione sono generate automaticamente dal changelog pubblicato: resta una sola fonte.
                </p>
              </div>
            </template>

            <!-- Guida rapida -->
            <template v-else-if="section.type === 'steps'">
              <div class="hp-block">
                <div class="hp-block-head">
                  <h3>Passi</h3>
                  <button class="btn btn-soft btn-sm" type="button" :disabled="section.steps.length >= 8" @click="addStep(section)">
                    + Passo
                  </button>
                </div>
                <div v-for="(step, i) in section.steps" :key="'step-' + i" class="hp-row hp-row--step">
                  <input v-model="step.icon" class="in hp-icon" maxlength="24" aria-label="Icona" />
                  <input v-model="step.title" class="in" maxlength="120" placeholder="Titolo" aria-label="Titolo" />
                  <input v-model="step.description" class="in" maxlength="500" placeholder="Descrizione" aria-label="Descrizione" />
                  <button class="arc-icon-btn" type="button" title="Sposta su" :disabled="i === 0" @click="moveItem(section.steps, i, -1)">↑</button>
                  <button class="arc-icon-btn" type="button" title="Rimuovi" @click="section.steps.splice(i, 1)">✕</button>
                </div>
              </div>
              <div class="hp-block">
                <div class="hp-block-head">
                  <h3>Pulsanti finali</h3>
                  <button class="btn btn-soft btn-sm" type="button" :disabled="section.cta.length >= 4" @click="addCta(section)">
                    + Pulsante
                  </button>
                </div>
                <div v-for="(button, i) in section.cta" :key="'cta-' + i" class="hp-row hp-row--cta">
                  <input v-model="button.label" class="in" maxlength="80" placeholder="Testo" aria-label="Testo" />
                  <input v-model="button.href" class="in" maxlength="2048" placeholder="/personaggio/… oppure https://…" aria-label="Destinazione" />
                  <label class="arc-toggle-line hp-inline"><input v-model="button.external" type="checkbox" /> esterno</label>
                  <label class="arc-toggle-line hp-inline"><input v-model="button.kind" type="checkbox" true-value="discord" false-value="" /> icona Discord</label>
                  <button class="arc-icon-btn" type="button" title="Rimuovi" @click="section.cta.splice(i, 1)">✕</button>
                </div>
              </div>
            </template>

            <!-- Wiki completa -->
            <template v-else-if="section.type === 'wiki'">
              <label class="arc-fld">
                <span>Etichetta del pulsante che apre la sezione</span>
                <input v-model="section.title" class="in" maxlength="200" />
              </label>
              <div v-for="(group, gi) in section.groups" :key="'group-' + gi" class="hp-block">
                <div class="hp-block-head">
                  <input v-model="group.title" class="in hp-grow" maxlength="120" placeholder="Titolo gruppo" aria-label="Titolo gruppo" />
                  <button class="btn btn-soft btn-sm" type="button" @click="addCard(group)">+ Card</button>
                  <button class="arc-icon-btn" type="button" title="Sposta gruppo su" :disabled="gi === 0" @click="moveItem(section.groups, gi, -1)">↑</button>
                  <button class="arc-icon-btn" type="button" title="Rimuovi gruppo" @click="section.groups.splice(gi, 1)">✕</button>
                </div>
                <div v-for="(card, ci) in group.cards" :key="'card-' + gi + '-' + ci" class="hp-card-row">
                  <div class="hp-row hp-row--card">
                    <input v-model="card.icon" class="in hp-icon" maxlength="24" placeholder="🌟" aria-label="Icona" />
                    <input v-model="card.name" class="in" maxlength="120" placeholder="Nome card" aria-label="Nome" />
                    <input v-model="card.description" class="in" maxlength="500" placeholder="Descrizione" aria-label="Descrizione" />
                    <select v-model="card.pageId" class="in" aria-label="Pagina collegata">
                      <option value="">Nessuna pagina</option>
                      <option v-for="page in pages" :key="page.id" :value="page.id">{{ page.label }} — {{ page.path || '—' }}</option>
                    </select>
                    <button class="arc-icon-btn" type="button" title="Rimuovi card" @click="group.cards.splice(ci, 1)">✕</button>
                  </div>
                  <div class="hp-row hp-row--card-media">
                    <input v-model="card.image" class="in" maxlength="2048" placeholder="Immagine di copertina (facoltativa)" aria-label="Immagine" />
                    <button class="btn btn-soft btn-sm" type="button" @click="openPicker(gi, ci)">Libreria</button>
                    <button v-if="card.image" class="arc-icon-btn" type="button" title="Rimuovi immagine" @click="card.image = ''">✕</button>
                    <a v-if="card.pageId && pagePaths[card.pageId]" class="arc-hint" :href="'/' + pagePaths[card.pageId]" target="_blank" rel="noopener">
                      Apri pagina ↗
                    </a>
                  </div>
                </div>
                <p v-if="!group.cards.length" class="arc-hint">Nessuna card in questo gruppo.</p>
              </div>
              <button v-if="section.groups.length < 12" class="btn btn-soft btn-sm" type="button" @click="addGroup(section)">
                + Gruppo
              </button>
            </template>
          </div>
        </div>

        <div class="hp-add">
          <select v-model="newType" class="in hp-select" aria-label="Tipo di nuova sezione">
            <option v-for="type in addableTypes" :key="type" :value="type">{{ typeLabel(type) }}</option>
          </select>
          <button class="btn btn-soft" type="button" @click="addSection">+ Aggiungi sezione</button>
          <span class="hp-grow"></span>
          <button class="btn btn-soft" type="button" @click="restoreDefaults">↺ Ripristina predefinite</button>
          <button class="btn btn-soft" type="button" @click="toggleHistory">🕘 Cronologia</button>
        </div>

        <div v-if="historyOpen" class="arc-panel hp-history">
          <div class="hp-block-head">
            <h3>Cronologia di content/homepage.json</h3>
            <button class="btn btn-soft btn-sm" type="button" @click="historyOpen = false">Chiudi</button>
          </div>
          <p v-if="historyLoading" class="arc-hint">Caricamento…</p>
          <ul v-else>
            <li v-for="entry in history" :key="entry.sha">
              <div>
                <strong>{{ entry.message }}</strong>
                <small>{{ formatDate(entry.date) }} · {{ entry.sha.slice(0, 7) }}</small>
              </div>
              <button class="btn btn-soft btn-sm" type="button" @click="restore(entry)">Carica</button>
            </li>
          </ul>
          <p v-if="!historyLoading && !history.length" class="arc-hint">Nessun commit per questo file.</p>
        </div>
      </div>

      <aside v-if="previewOpen" class="hp-preview" aria-label="Anteprima homepage">
        <div class="hp-preview-head">
          <span class="hp-preview-title">Anteprima live</span>
          <div class="hp-devices" role="group" aria-label="Dimensione anteprima">
            <button v-for="size in (['desktop', 'tablet', 'mobile'] as Device[])" :key="size" class="hp-device" type="button"
              :class="{ active: device === size }" :aria-pressed="device === size" @click="device = size">
              {{ size === 'desktop' ? '🖥' : size === 'tablet' ? '📱+' : '📱' }}
              <span>{{ size }}</span>
            </button>
          </div>
        </div>
        <div class="hp-frame-wrap">
          <iframe
            class="hp-frame"
            :style="{ width: DEVICE_WIDTH[device] }"
            :srcdoc="previewDoc"
            title="Anteprima della homepage"
            loading="lazy"
          ></iframe>
        </div>
        <p class="arc-hint">
          Stessi CSS e stesso renderer del sito. La mappa e il carousel reali vengono inseriti dal build pubblico; qui
          restano segnaposto.
        </p>
      </aside>
    </div>

    <MediaDrawer
      :open="pickerOpen"
      title="Scegli l'immagine della card"
      @close="picker = null"
      @pick="onPick"
    />
  </section>
</template>

<style scoped>
.hp-view {
  --hp-gap: 18px;
}
.hp-intro {
  display: grid;
  gap: 8px;
}
.hp-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.hp-status .arc-chip.is-dirty {
  color: #f0c674;
  border-color: rgba(240, 198, 116, 0.45);
}
.hp-hint,
.hp-warn {
  margin: 0;
}
.hp-warn {
  color: #f0c674;
}
.hp-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.hp-banner.is-ok {
  border-color: rgba(110, 200, 120, 0.45);
}
.hp-banner.is-failed {
  border-color: rgba(220, 110, 110, 0.45);
}
.hp-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--hp-gap);
  align-items: start;
}
.hp-layout.has-preview {
  grid-template-columns: minmax(0, 1fr) minmax(340px, 46%);
}
@media (max-width: 1180px) {
  .hp-layout.has-preview {
    grid-template-columns: 1fr;
  }
}
.hp-sections {
  display: grid;
  gap: 12px;
}
.hp-section {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  overflow: hidden;
}
.hp-section.is-hidden {
  opacity: 0.72;
  border-style: dashed;
}
.hp-section.is-dragging {
  opacity: 0.45;
}
.hp-section.is-target {
  box-shadow: 0 -2px 0 0 #d4af37;
}
.hp-section.is-open {
  border-color: rgba(212, 175, 55, 0.35);
}
.hp-section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: grab;
}
.hp-section-head:active {
  cursor: grabbing;
}
.hp-drag {
  color: rgba(255, 255, 255, 0.35);
  font-size: 18px;
  line-height: 1;
}
.hp-section-name {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.hp-section-name strong {
  font-size: 14px;
}
.hp-section-name small {
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.hp-section-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.hp-form {
  padding: 4px 14px 16px;
  display: grid;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.hp-block {
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  padding: 10px;
  display: grid;
  gap: 8px;
}
.hp-block-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.hp-block-head h3 {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
}
.hp-row {
  display: grid;
  gap: 6px;
  align-items: center;
}
.hp-row--faction,
.hp-row--guild,
.hp-row--step {
  grid-template-columns: 46px minmax(110px, 1fr) minmax(140px, 1.4fr) auto auto auto;
}
.hp-row--guild {
  grid-template-columns: 46px minmax(110px, 1fr) minmax(120px, 1fr) 150px auto auto;
}
.hp-row--link,
.hp-row--cta {
  grid-template-columns: minmax(120px, 1fr) minmax(160px, 1.6fr) auto auto auto;
}
.hp-row--card {
  grid-template-columns: 46px minmax(110px, 1fr) minmax(140px, 1.3fr) minmax(150px, 1fr) auto;
}
.hp-row--card-media {
  grid-template-columns: minmax(160px, 1fr) auto auto auto;
}
.hp-icon {
  text-align: center;
}
.hp-color {
  font-family: monospace;
  font-size: 11px;
}
.hp-inline {
  white-space: nowrap;
  font-size: 12px;
}
.hp-grow {
  flex: 1;
  min-width: 0;
}
.hp-card-row {
  display: grid;
  gap: 4px;
  padding: 6px 0;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
}
.hp-card-row:first-of-type {
  border-top: 0;
}
.hp-add {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0;
}
.hp-select {
  max-width: 200px;
}
.hp-history ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.hp-history li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 6px;
}
.hp-history small {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
}
.hp-preview {
  position: sticky;
  top: 12px;
  display: grid;
  gap: 8px;
}
.hp-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.hp-preview-title {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
}
.hp-devices {
  display: flex;
  gap: 4px;
}
.hp-device {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: inherit;
  border-radius: 6px;
  cursor: pointer;
}
.hp-device.active {
  border-color: rgba(212, 175, 55, 0.6);
  color: #e8d49a;
}
.hp-frame-wrap {
  display: flex;
  justify-content: center;
  background: #05070b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 8px;
  overflow: auto;
}
.hp-frame {
  height: 72vh;
  min-height: 520px;
  max-width: 100%;
  border: 0;
  background: #080a0e;
  border-radius: 6px;
}
</style>
