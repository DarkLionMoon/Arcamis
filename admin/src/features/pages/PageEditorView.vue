<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore, useEditorStore, useRegistryStore, useUIStore } from '@/app/store'
import { errorText, registryApi } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
import { useUnsavedGuard } from '@/shared/guard'
import { CODE_SNIPPET, STATBLOCK_SNIPPET, TABLE_SNIPPET } from '@/shared/markdownCommands'
import { compressImage, mediaName, uploadImage } from '@/shared/api/media'
import CodeMirrorEditor from '@/features/interface/components/CodeMirrorEditor.vue'
import MarkdownPreview from '@/features/interface/components/MarkdownPreview.vue'
import VIcon from '@/shared/components/VIcon.vue'
import BlockEditor from './editor/BlockEditor.vue'
import EditorStatusBar from './editor/EditorStatusBar.vue'
import EditorToolbar from './editor/EditorToolbar.vue'
import MediaDrawer from './editor/MediaDrawer.vue'
import ShortcutsDialog from './editor/ShortcutsDialog.vue'
import TemplateForm from './editor/TemplateForm.vue'
import TemplatePicker from './editor/TemplatePicker.vue'
import VersionsPanel from './editor/VersionsPanel.vue'
import WorkflowPanel from './editor/WorkflowPanel.vue'
import { usePageEditor } from './editor/usePageEditor'
import type { WorkflowActionId } from './workflow'
import type { PageRegistryEntry } from '@/types'
import type { CodeMirrorHandle } from '@/features/interface/components/codemirrorHandle'
import { LAYOUT_OPTIONS, LAYOUT_PRESETS, presetFor, type LayoutPreset } from './layouts'
import { blockIssues, parseBlocks, serializeBlocks, type Block } from './blocks'

const route = useRoute()
const router = useRouter()
const editor = useEditorStore()
const ui = useUIStore()
const auth = useAuthStore()

const {
  loading,
  saveState,
  firstError,
  page,
  template,
  templateMissing,
  data,
  drafts,
  markdown,
  validation,
  stats,
  dirty,
  undoAvailable,
  redoAvailable,
  workflowStatus,
  workflowLabel,
  isPublicPage,
  runWorkflowAction,
  load,
  setField,
  toggleDraft,
  addItem,
  removeItem,
  moveItem,
  undo,
  redo,
  applyTemplate,
  removeTemplate,
  setMode,
  save,
  restoreVersion,
  updateMeta,
  startAutosave
} = usePageEditor()

const key = computed(() => String(route.params.key || ''))
const cmRef = ref<CodeMirrorHandle | null>(null)

const showShortcuts = ref(false)
const showDetails = ref(false)
const showPicker = ref(false)
const linkOpen = ref(false)
const linkUrl = ref('')

const mediaOpen = ref(false)
const mediaPath = ref('')
const mediaForMarkdown = ref(false)

const structure = computed(() => editor.mode === 'structure' && Boolean(template.value && data.value))
const markdownReadonly = computed(() => Boolean(template.value))
const previewOpen = computed(() => editor.previewOpen)

/* ── Modalità blocchi (pagine libere) ──
   I blocchi sono una vista sul markdown: si rileggono dal contenuto solo
   quando la modalità torna su Blocchi e il testo è cambiato altrove
   (markdown, caricamento pagina). Ogni modifica riserializza subito, così
   anteprima e salvataggio vedono lo stesso testo. */
const blocks = ref<Block[]>([])
let blocksSource: string | null = null
const blocksMode = computed(() => editor.mode === 'structure' && !template.value && !page.value?.template)

function syncBlocksFromContent(): void {
  const content = page.value?.content ?? ''
  if (blocksSource === content) return
  blocks.value = parseBlocks(content)
  blocksSource = content
}

function onBlocksUpdate(next: Block[]): void {
  blocks.value = next
  const markdown = serializeBlocks(next)
  blocksSource = markdown
  editor.setContent(markdown)
}

const pageBlocks = computed<Block[]>(() => {
  if (template.value) return []
  return blocksMode.value ? blocks.value : parseBlocks(page.value?.content || '')
})
const blocksIncomplete = computed(() => pageBlocks.value.filter((block) => blockIssues(block).length).length)
const blocksFilled = computed(() => pageBlocks.value.length - blocksIncomplete.value)

/* Descrizione breve della modalità attiva, accanto ai tab. */
const paneHint = computed(() => {
  if (structure.value) return template.value?.collections[0]?.label || 'Campi'
  if (blocksMode.value) return 'blocchi visuali'
  return markdownReadonly.value ? 'generato dal modello' : 'testo libero'
})

watch(
  () => [editor.mode, template.value?.id, page.value?.k] as const,
  () => {
    if (blocksMode.value) syncBlocksFromContent()
  }
)

const saveLabel = computed(() => {
  if (saveState.value === 'saving') return 'Salvataggio…'
  if (saveState.value === 'error') return 'Salvataggio non riuscito'
  if (dirty.value) return 'Modifiche non salvate'
  return 'Tutto salvato'
})

const saveClass = computed(() => {
  if (saveState.value === 'saving') return 'is-saving'
  if (saveState.value === 'error') return 'is-error'
  return dirty.value ? 'is-dirty' : 'is-saved'
})

function backToList(): void {
  void router.push({ name: 'pages' })
}

function openMediaForField(path: string): void {
  mediaPath.value = path
  mediaForMarkdown.value = false
  mediaOpen.value = true
}

function openMediaForMarkdown(): void {
  mediaPath.value = ''
  mediaForMarkdown.value = true
  mediaOpen.value = true
}

function onMediaPick(path: string): void {
  if (mediaForMarkdown.value) {
    cmRef.value?.insertImage(path, cmRef.value.selectedText() || 'immagine')
    return
  }
  setField(mediaPath.value, path)
}

function runCommand(name: string): void {
  const cm = cmRef.value
  switch (name) {
    case 'bold':
      cm?.wrap('**', 'grassetto')
      break
    case 'italic':
      cm?.wrap('*', 'corsivo')
      break
    case 'strike':
      cm?.wrap('~~', 'barrato')
      break
    case 'h2':
      cm?.prefix('## ')
      break
    case 'h3':
      cm?.prefix('### ')
      break
    case 'list':
      cm?.prefix('- ')
      break
    case 'quote':
      cm?.prefix('> ')
      break
    case 'code':
      cm?.insertSnippet(CODE_SNIPPET)
      break
    case 'table':
      cm?.insertSnippet(TABLE_SNIPPET)
      break
    case 'statblock':
      cm?.insertSnippet(STATBLOCK_SNIPPET)
      break
    case 'link':
      linkOpen.value = true
      break
    default:
      break
  }
}

/* ── Suggerimenti [[wiki]] ── */
interface WikiSuggest {
  query: string
  x: number
  y: number
}

const registry = useRegistryStore()
const wikiSuggest = ref<WikiSuggest | null>(null)

async function onWikiSuggest(suggest: WikiSuggest | null): Promise<void> {
  wikiSuggest.value = suggest
  if (suggest && !registry.pages.length) {
    try {
      const doc = await registryApi.get()
      registry.setRegistry(doc.pages as PageRegistryEntry[], doc.sections || [], doc.ui)
    } catch {
      /* registro non leggibile: nessun suggerimento */
    }
  }
}

const wikiHits = computed(() => {
  const q = (wikiSuggest.value?.query || '').trim().toLowerCase()
  return registry.pages
    .filter(
      (entry) =>
        entry.path && (!q || (entry.l || '').toLowerCase().includes(q) || (entry.k || '').toLowerCase().includes(q))
    )
    .slice(0, 8)
})

function insertWikiLink(entry: PageRegistryEntry): void {
  cmRef.value?.replaceWikiLink(entry.l || entry.k, '/' + (entry.path || entry.k))
  wikiSuggest.value = null
}

/* ── Drag-and-drop di immagini nel testo ── */
async function onDropFiles(files: File[]): Promise<void> {
  for (const file of files) {
    try {
      const dataUri = await compressImage(file)
      const path = await uploadImage(dataUri, mediaName(file.name))
      cmRef.value?.insertImage(path, file.name.replace(/\.[a-zA-Z0-9]+$/, '') || 'immagine')
      ui.toast('Immagine caricata nel testo', 'success')
    } catch (e) {
      ui.toast('Upload fallito: ' + errorText(e), 'error')
    }
  }
}

function insertLink(): void {
  const url = linkUrl.value.trim()
  if (!url) return
  cmRef.value?.insertLink(url)
  linkOpen.value = false
  linkUrl.value = ''
  ui.toast('Link inserito', 'success')
}

async function requestMode(next: 'structure' | 'markdown'): Promise<void> {
  const ok = await setMode(next)
  if (!ok) return
  if (next === 'structure' && blocksMode.value) syncBlocksFromContent()
  await nextTick()
  if (next === 'markdown') cmRef.value?.focus()
}

/* Un solo punto di scrittura per l'indice: l'handler multi-istruzione nel
   template diventava invalido appena Prettier lo riformattava. */
function toggleToc(value: boolean): void {
  if (!page.value) return
  page.value.toc = value
  updateMeta({ toc: value })
}

function applyLayoutPreset(preset: LayoutPreset): void {
  if (!page.value) return
  if (template.value) {
    ui.toast('Il layout è deciso dal modello della pagina', 'info')
    return
  }
  updateMeta({ layout: preset.layout, toc: preset.toc })
}

async function markDraft(): Promise<void> {
  if (!page.value) return
  if (workflowStatus.value === 'draft') {
    ui.toast('La pagina è già una bozza / in lavorazione', 'info')
    return
  }
  if (isPublicPage.value) {
    const ok = await confirmAction({
      title: 'Segna come bozza',
      message: 'La pagina smetterà di essere pubblica al prossimo deploy.',
      detail: 'Puoi ripubblicarla con «Approva e pubblica» dal pannello Dettagli.',
      confirmLabel: 'Segna come bozza',
      danger: true
    })
    if (!ok) return
  }
  runWorkflowAction('back-to-draft')
}

async function requestRemoveTemplate(): Promise<void> {
  const ok = await confirmAction({
    title: 'Rimuovi modello',
    message: 'Tornare al markdown libero?',
    detail:
      'La pagina mantiene il testo compilato, ma i campi strutturati vengono rimossi: potrai riapplicare un modello in seguito.',
    confirmLabel: 'Rimuovi modello',
    danger: true
  })
  if (ok) {
    removeTemplate()
    showDetails.value = false
  }
}

async function onApplyTemplate(templateId: string): Promise<void> {
  showPicker.value = false
  await applyTemplate(templateId)
}

function onWorkflowAction(payload: { id: WorkflowActionId; publishAt?: string; note?: string }): void {
  runWorkflowAction(payload.id, { publishAt: payload.publishAt, note: payload.note })
}

function saveNow(): void {
  void save()
}

function onGlobalKeydown(event: KeyboardEvent): void {
  const mod = event.metaKey || event.ctrlKey
  if (mod && event.key.toLowerCase() === 's') {
    /* CodeMirror gestisce già Ctrl+S e chiama preventDefault. */
    if (!event.defaultPrevented) {
      event.preventDefault()
      saveNow()
    }
    return
  }
  if (mod && event.shiftKey && event.key.toLowerCase() === 'p') {
    event.preventDefault()
    editor.previewOpen = !editor.previewOpen
    return
  }
  if (editor.mode === 'structure' && mod && event.key.toLowerCase() === 'z') {
    /* Dentro un campo di testo Ctrl+Z resta l'undo nativo della battitura;
       l'undo strutturato si usa dalla toolbar (o fuori dai campi). */
    const target = event.target as HTMLElement | null
    const typing = Boolean(
      target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    )
    if (typing) return
    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
    return
  }
  if (event.key === 'Escape') {
    if (wikiSuggest.value) wikiSuggest.value = null
    if (mediaOpen.value) mediaOpen.value = false
    if (linkOpen.value) linkOpen.value = false
    if (showShortcuts.value) showShortcuts.value = false
    if (showPicker.value) showPicker.value = false
    if (showDetails.value) showDetails.value = false
  }
}

watch(firstError, async (path) => {
  if (!path) return
  await nextTick()
  const element = document.getElementById('f-' + path) as HTMLElement | null
  if (!element) return
  element.scrollIntoView({ block: 'center', behavior: 'smooth' })
  element.focus?.()
})

watch(key, async (next, previous) => {
  if (!next || next === previous) return
  if (dirty.value) {
    const ok = await confirmAction({
      title: 'Modifiche non salvate',
      message: `Aprire un'altra pagina e perdere le modifiche a «${previous}»?`,
      confirmLabel: 'Apri senza salvare',
      cancelLabel: 'Resta qui',
      danger: true
    })
    if (!ok) return
  }
  await load(next)
})

useUnsavedGuard(() => dirty.value, 'modifiche non salvate sulla pagina')

onMounted(async () => {
  window.addEventListener('keydown', onGlobalKeydown)
  if (key.value) await load(key.value)
  startAutosave()
})

onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <section class="arc-workspace" :class="{ 'is-single': !previewOpen }">
    <header class="arc-ws-bar">
      <button
        class="arc-icon-btn"
        type="button"
        title="Torna alle pagine"
        aria-label="Torna alle pagine"
        @click="backToList"
      >
        ←
      </button>

      <template v-if="page">
        <input
          v-model="page.icon"
          class="arc-ws-icon"
          maxlength="4"
          aria-label="Icona della pagina"
          @input="updateMeta({ icon: page.icon })"
        />
        <input
          v-model="page.title"
          class="arc-ws-title"
          aria-label="Titolo della pagina"
          placeholder="Titolo della pagina"
          @input="updateMeta({ title: page.title })"
        />
        <span v-if="template" class="arc-chip"> {{ template.icon }} {{ template.label }} </span>
        <span v-if="templateMissing" class="arc-chip is-warning">modello non disponibile</span>
        <span
          class="arc-chip"
          :class="'arc-status-' + workflowStatus"
          :title="'Flusso di pubblicazione: ' + workflowLabel"
        >
          {{ workflowLabel }}
        </span>
        <span class="arc-ws-key"> {{ page.k }}{{ !template && page.layout ? ' · ' + page.layout : '' }} </span>
      </template>

      <span class="arc-toolbar-spacer"></span>

      <span class="arc-ws-save" :class="saveClass">
        <span class="arc-dot"></span>
        {{ saveLabel }}
      </span>

      <button
        class="btn btn-soft btn-sm"
        type="button"
        :aria-expanded="showDetails"
        title="Metadati della pagina"
        @click="showDetails = !showDetails"
      >
        <VIcon name="settings" :size="14" /> Dettagli
      </button>
      <button
        class="btn btn-p btn-sm"
        type="button"
        :disabled="saveState === 'saving' || !dirty"
        title="Salva (Ctrl+S)"
        @click="saveNow"
      >
        <VIcon name="save" :size="14" />
        {{ saveState === 'saving' ? 'Salvo…' : 'Salva' }}
      </button>
    </header>

    <div v-if="showDetails && page" class="arc-meta-panel">
      <div class="arc-fld arc-layout-field">
        <span>Layout della pagina</span>
        <div class="arc-layout-presets" role="radiogroup" aria-label="Layout della pagina">
          <button
            v-for="preset in LAYOUT_PRESETS"
            :key="preset.id"
            class="arc-layout-preset"
            type="button"
            role="radio"
            :aria-checked="presetFor(page.layout) === preset.id"
            :class="{ active: presetFor(page.layout) === preset.id }"
            :disabled="Boolean(template)"
            @click="applyLayoutPreset(preset)"
          >
            <span class="arc-layout-icon">{{ preset.icon }}</span>
            <span class="arc-layout-label">{{ preset.label }}</span>
            <span class="arc-layout-desc">{{ preset.description }}</span>
          </button>
        </div>
        <small v-if="template" class="arc-field-help">Deciso dal modello «{{ template.label }}».</small>
      </div>
      <label class="arc-fld">
        <span>Layout avanzato</span>
        <select
          v-model="page.layout"
          class="in"
          :disabled="Boolean(template)"
          @change="updateMeta({ layout: page.layout })"
        >
          <option v-for="layout in LAYOUT_OPTIONS" :key="layout.value" :value="layout.value">{{ layout.label }}</option>
        </select>
        <small class="arc-field-help">Layout specifici del sito (regolamento, pantheon, galleria…).</small>
      </label>
      <label class="arc-fld">
        <span>Indice</span>
        <label class="arc-check">
          <input type="checkbox" :checked="page.toc === true" @change="toggleToc(!page.toc)" />
          <span>Mostra l'indice dei titoli</span>
        </label>
      </label>
      <label class="arc-fld">
        <span>Descrizione SEO</span>
        <input
          v-model="page.description"
          class="in"
          placeholder="Una frase per i motori di ricerca"
          @input="updateMeta({ description: page.description })"
        />
      </label>
      <WorkflowPanel :page="page" :role="auth.role" :disabled="saveState === 'saving'" @action="onWorkflowAction" />

      <VersionsPanel :page-key="page.k" :page="page" :current-markdown="markdown" @restore="restoreVersion" />

      <div class="arc-meta-actions">
        <button class="btn btn-soft btn-sm" type="button" @click="showPicker = true">
          <VIcon name="structure" :size="14" /> {{ template ? 'Cambia modello' : 'Applica modello' }}
        </button>
        <button v-if="template" class="btn btn-soft btn-sm" type="button" @click="requestRemoveTemplate">
          <VIcon name="trash" :size="14" /> Rimuovi modello
        </button>
        <button
          v-if="workflowStatus !== 'draft'"
          class="btn btn-soft btn-sm"
          type="button"
          title="La pagina non viene pubblicata finché resta una bozza"
          @click="markDraft"
        >
          <VIcon name="eye" :size="14" /> Segna come bozza
        </button>
        <span v-else class="arc-chip arc-status-draft">Bozza / in lavorazione</span>
      </div>
    </div>

    <div v-if="loading" class="arc-ws-loading arc-panel">
      <span class="arc-skel-bar" style="width: 38%"></span>
      <span class="arc-skel-block"></span>
      <span class="arc-skel-block" style="width: 72%"></span>
    </div>

    <div v-else-if="!page" class="arc-panel">
      <div class="arc-empty-side">
        Pagina non trovata.
        <button class="btn btn-soft btn-sm" type="button" style="margin-left: 10px" @click="backToList">
          Torna alle pagine
        </button>
      </div>
    </div>

    <div v-else class="arc-ws-body">
      <div class="arc-ws-pane arc-ws-editor">
        <div class="arc-pane-head">
          <div class="arc-mode-tabs" role="tablist" aria-label="Modalità di editing">
            <button
              class="arc-mode-tab"
              type="button"
              role="tab"
              :aria-selected="editor.mode === 'structure'"
              :class="{ active: editor.mode === 'structure' }"
              @click="requestMode('structure')"
            >
              <VIcon name="structure" :size="14" /> {{ template ? 'Struttura' : 'Blocchi' }}
            </button>
            <button
              class="arc-mode-tab"
              type="button"
              role="tab"
              :aria-selected="editor.mode === 'markdown'"
              :class="{ active: editor.mode === 'markdown' }"
              @click="requestMode('markdown')"
            >
              <VIcon name="code" :size="14" /> Markdown
            </button>
          </div>
          <span class="arc-pane-hint">{{ paneHint }}</span>
        </div>

        <EditorToolbar
          :mode="editor.mode"
          :can-undo="undoAvailable"
          :can-redo="redoAvailable"
          :preview-open="previewOpen"
          :readonly="markdownReadonly"
          @undo="undo"
          @redo="redo"
          @command="runCommand"
          @pick-image="openMediaForMarkdown"
          @toggle-preview="editor.previewOpen = !editor.previewOpen"
          @help="showShortcuts = true"
        />

        <div class="arc-pane-scroll">
          <template v-if="structure && template && data">
            <p v-if="templateMissing" class="arc-warn-banner">
              Il modello «{{ page.template }}» non è più disponibile: il markdown resta salvato, ma i campi non sono
              modificabili. Applica un modello o rimuovilo.
            </p>
            <TemplateForm
              :template="template"
              :data="data"
              :drafts="drafts"
              :issues="validation.issues"
              @update="setField"
              @toggle-draft="toggleDraft"
              @pick-media="openMediaForField"
              @add-item="addItem"
              @remove-item="removeItem"
              @move-item="moveItem"
            />
            <div v-if="!template.collections.length" class="arc-panel-note">
              Questo modello non ha schede: compila i campi qui sopra.
            </div>
          </template>

          <BlockEditor
            v-else-if="blocksMode"
            :blocks="blocks"
            @update:blocks="onBlocksUpdate"
            @mark-draft="markDraft"
          />

          <div v-else-if="editor.mode === 'structure'" class="arc-editor-empty">
            <div class="arc-editor-empty-icon">🧩</div>
            <h2>Modello non disponibile</h2>
            <p>
              Il modello «{{ page.template }}» non è più caricato: il markdown salvato resta leggibile. Scegli un altro
              modello oppure rimuovilo per tornare ai blocchi liberi.
            </p>
            <button class="btn btn-p" type="button" @click="showPicker = true">Scegli un modello</button>
          </div>

          <template v-else>
            <p v-if="markdownReadonly" class="arc-warn-banner is-info">
              Il markdown è generato dal modello «{{ template?.label }}»: modifiche qui non vengono salvate. Modifica i
              campi in
              <button class="arc-link" type="button" @click="requestMode('structure')">Struttura</button> oppure rimuovi
              il modello per scrivere liberamente.
            </p>
            <CodeMirrorEditor
              ref="cmRef"
              :model-value="page.content"
              mode="markdown"
              :readonly="markdownReadonly"
              :font-size="editor.editorFontSize"
              :word-wrap="editor.wordWrap"
              :line-numbers="editor.showLineNumbers"
              aria-label="Contenuto markdown della pagina"
              class="arc-editor-cm"
              @update:model-value="editor.setContent($event)"
              @save="saveNow"
              @request-link="linkOpen = true"
              @drop-files="onDropFiles"
              @wiki-suggest="onWikiSuggest"
            />
            <div
              v-if="wikiSuggest && wikiHits.length"
              class="arc-wiki-suggest"
              :style="{ left: wikiSuggest.x + 'px', top: wikiSuggest.y + 4 + 'px' }"
              role="listbox"
              aria-label="Collega a una pagina"
            >
              <button
                v-for="hit in wikiHits"
                :key="hit.k"
                class="arc-wiki-hit"
                type="button"
                @click="insertWikiLink(hit)"
              >
                <span>{{ hit.i || '📄' }}</span>
                <span class="arc-wiki-hit-label">{{ hit.l || hit.k }}</span>
                <code>/{{ hit.path }}</code>
              </button>
            </div>
          </template>
        </div>
      </div>

      <aside v-if="previewOpen" class="arc-ws-pane arc-ws-preview" aria-label="Anteprima live">
        <div class="arc-pane-head">
          <span class="arc-preview-title"><VIcon name="eye" :size="14" /> Anteprima live</span>
          <span v-if="workflowStatus !== 'published'" class="arc-chip" :class="'arc-status-' + workflowStatus">
            {{ workflowLabel }}
          </span>
          <span class="arc-toolbar-spacer"></span>
          <span class="arc-pane-hint">{{ stats.words }} parole</span>
          <button
            class="arc-icon-btn"
            type="button"
            title="Nascondi anteprima"
            aria-label="Nascondi anteprima"
            @click="editor.previewOpen = false"
          >
            <VIcon name="close" :size="14" />
          </button>
        </div>
        <div class="arc-preview-frame">
          <MarkdownPreview :content="markdown" toc />
        </div>
      </aside>
    </div>

    <EditorStatusBar
      v-if="page"
      :save-state="saveState"
      :last-saved-at="editor.lastSavedAt"
      :dirty="dirty"
      :words="stats.words"
      :chars="stats.chars"
      :errors="validation.errors.length"
      :warnings="validation.warnings.length + (template ? 0 : blocksIncomplete)"
      :drafts="stats.drafts"
      :filled="template ? stats.filled : blocksFilled"
      :total="template ? stats.total : pageBlocks.length"
      :autosave="editor.autosaveEnabled"
      @toggle-autosave="editor.autosaveEnabled = !editor.autosaveEnabled"
    />

    <MediaDrawer
      :open="mediaOpen"
      :title="mediaForMarkdown ? 'Inserisci immagine nel testo' : 'Immagine per il campo'"
      @close="mediaOpen = false"
      @pick="onMediaPick"
    />

    <ShortcutsDialog :open="showShortcuts" @close="showShortcuts = false" />

    <TemplatePicker
      :open="showPicker"
      mode="apply"
      :current-template-id="page?.template"
      @close="showPicker = false"
      @apply="onApplyTemplate"
    />

    <div v-if="linkOpen" class="arc-modal-backdrop" @click.self="linkOpen = false">
      <div class="arc-modal arc-link-dialog" role="dialog" aria-modal="true" aria-label="Inserisci link">
        <h2 class="arc-modal-title">Inserisci link</h2>
        <input
          v-model="linkUrl"
          class="in"
          placeholder="https://… oppure /pagina"
          aria-label="URL del link"
          @keydown.enter="insertLink"
        />
        <p class="arc-hint">Con una selezione attiva nel testo, l'etichetta resta quella selezionata.</p>
        <div class="arc-modal-actions">
          <button class="btn btn-soft btn-sm" type="button" @click="linkOpen = false">Annulla</button>
          <button class="btn btn-p btn-sm" type="button" :disabled="!linkUrl.trim()" @click="insertLink">
            Inserisci
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.arc-wiki-suggest {
  position: fixed;
  z-index: 300;
  min-width: 260px;
  max-width: 340px;
  max-height: 260px;
  overflow: auto;
  background: var(--asurface-2, #141821);
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.35));
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}
.arc-wiki-hit {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 7px 8px;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.arc-wiki-hit:hover {
  background: var(--accent-soft, rgba(200, 155, 60, 0.15));
}
.arc-wiki-hit-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.arc-wiki-hit code {
  font-size: 11px;
  opacity: 0.6;
}
</style>
