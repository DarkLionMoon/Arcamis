<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { pagesApi } from '@/shared/api'
import { useEditorStore, useUIStore } from '@/app/store'
import CodeMirrorEditor from '@/features/interface/components/CodeMirrorEditor.vue'
import MarkdownPreview from '@/features/interface/components/MarkdownPreview.vue'

const route = useRoute()
const router = useRouter()
const editor = useEditorStore()
const ui = useUIStore()

const key = computed(() => String(route.params.key || ''))
const loading = ref(true)
const saving = ref(false)
const autosaveTimer = ref<ReturnType<typeof setInterval> | null>(null)
const lastSavedAt = ref<string | null>(null)

async function load(keyToLoad: string) {
  loading.value = true
  try {
    const page = await pagesApi.get(keyToLoad)
    editor.setPage(page)
    lastSavedAt.value = page.lastModified || null
  } catch (e) {
    ui.toast('Errore apertura pagina: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!editor.currentPage || saving.value) return
  saving.value = true
  try {
    const page = editor.currentPage
    const result = await pagesApi.save({ ...page, sha: page.sha }, `admin: update page ${page.k}`)
    editor.setPage({ ...editor.currentPage, sha: result.sha, lastModified: new Date().toISOString() })
    editor.markSaved()
    lastSavedAt.value = editor.currentPage.lastModified || null
    ui.toast('Pagina salvata — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore salvataggio: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = false
  }
}

function autosave() {
  if (editor.hasUnsavedChanges && !saving.value) {
    void save()
  }
}

function ensureAutosave() {
  if (autosaveTimer.value) return
  if (editor.autosaveEnabled) {
    autosaveTimer.value = setInterval(autosave, 20000)
  }
}

function backToList() {
  router.push({ name: 'pages' })
}

watch(key, (newKey, oldKey) => {
  if (newKey && newKey !== oldKey) {
    if (editor.hasUnsavedChanges) {
      if (!confirm('Ci sono modifiche non salvate. Continuare?')) return
    }
    void load(newKey)
  }
})

onMounted(() => {
  if (key.value) {
    if (editor.autosaveEnabled) ensureAutosave()
    void load(key.value)
  }
  window.addEventListener('beforeunload', warnUnsaved)
})

onBeforeUnmount(() => {
  if (autosaveTimer.value) clearInterval(autosaveTimer.value)
  window.removeEventListener('beforeunload', warnUnsaved)
})

function warnUnsaved(e: BeforeUnloadEvent) {
  if (editor.hasUnsavedChanges) {
    e.preventDefault()
    e.returnValue = ''
  }
}
</script>

<template>
  <section class="arc-page-editor">
    <template v-if="editor.currentPage">
      <div class="arc-head-row">
        <div style="display:flex;align-items:center;gap:12px;min-width:0">
          <button class="btn btn-soft btn-sm" type="button" @click="backToList">← Pagine</button>
          <h1 class="arc-page-title" style="margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            {{ editor.currentPage.icon || '📄' }} {{ editor.currentPage.title || editor.currentPage.k }}
          </h1>
        </div>
        <div class="arc-head-actions">
          <span style="font-size:12px;opacity:.6">
            {{ editor.modified ? '● modifiche non salvate' : lastSavedAt ? 'salvato' : '' }}
          </span>
          <button class="btn btn-soft btn-sm" type="button" @click="editor.toggleStructuredMode()">
            {{ editor.structuredMode ? 'Markdown' : 'Strutturato' }}
          </button>
          <button class="btn btn-p" type="button" :disabled="saving" @click="save">💾 Salva</button>
        </div>
      </div>

      <div v-if="editor.structuredMode" class="arc-panel" style="margin-bottom:16px">
        <p class="arc-hint">Editor strutturato (yaml front matter + blocchi). Campo di contenuto sotto.</p>
        <CodeMirrorEditor
          :model-value="editor.currentPage.content"
          mode="markdown"
          :font-size="editor.editorFontSize"
          :word-wrap="editor.wordWrap"
          :line-numbers="editor.showLineNumbers"
          @update:model-value="editor.setContent($event)"
          @save="save"
        />
      </div>

      <div v-else class="arc-editor-grid">
        <div class="arc-panel" style="display:flex;flex-direction:column">
          <div class="arc-form-actions" style="margin-bottom:8px">
            <button
              v-for="m in (['md','split','pv'] as const)"
              :key="m"
              class="btn btn-sm"
              :class="editor.viewMode === m ? 'btn-p' : 'btn-soft'"
              type="button"
              @click="editor.setViewMode(m)"
            >
              {{ m === 'md' ? 'Markdown' : m === 'split' ? 'Split' : 'Anteprima' }}
            </button>
            <span style="flex:1"></span>
            <label style="font-size:12px;opacity:.7;display:flex;align-items:center;gap:4px">
              <input v-model="editor.autosaveEnabled" type="checkbox" @change="ensureAutosave" /> autosave
            </label>
          </div>

          <CodeMirrorEditor
            :model-value="editor.currentPage.content"
            mode="markdown"
            :font-size="editor.editorFontSize"
            :word-wrap="editor.wordWrap"
            :line-numbers="editor.showLineNumbers"
            class="arc-editor-fill"
            @update:model-value="editor.setContent($event)"
            @save="save"
          />
        </div>

        <div class="arc-panel" v-if="editor.viewMode !== 'md'">
          <MarkdownPreview :content="editor.currentPage.content" toc />
        </div>
      </div>
    </template>

    <div v-else class="arc-empty-side">
      {{ loading ? 'Caricamento…' : 'Pagina non trovata.' }}
    </div>
  </section>
</template>