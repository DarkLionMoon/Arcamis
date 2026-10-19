<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { errorText, pagesApi } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
import { useUIStore } from '@/app/store'
import { diffLines, diffStats } from '@/shared/wordDiff'
import type { PageContent } from '@/types'

/* Cronologia git + snapshot nominati: confronta una versione con il testo
   corrente e la ripristina in memoria (il salvataggio resta esplicito). */
const props = defineProps<{
  pageKey: string
  page: PageContent | null
  currentMarkdown: string
}>()

const emit = defineEmits<{
  (e: 'restore', snapshot: PageContent): void
}>()

const ui = useUIStore()

const tab = ref<'history' | 'snapshots'>('history')
const loading = ref(false)
const history = ref<Array<{ sha: string; message: string; date: string }>>([])
const selectedSha = ref('')
const selected = ref<PageContent | null>(null)
const loadingVersion = ref(false)
const snapName = ref('')

interface Snapshot {
  name: string
  date: string
  content: PageContent
}

const snapshots = ref<Snapshot[]>([])
const storeKey = computed(() => `arcamis-snapshots-${props.pageKey}`)

function loadSnaps(): void {
  try {
    const raw = localStorage.getItem(storeKey.value)
    snapshots.value = raw ? (JSON.parse(raw) as Snapshot[]) : []
  } catch {
    snapshots.value = []
  }
}

function persistSnaps(): void {
  try {
    localStorage.setItem(storeKey.value, JSON.stringify(snapshots.value.slice(0, 20)))
  } catch {
    ui.toast('Snapshot non salvato: spazio locale esaurito', 'error')
  }
}

async function loadHistory(): Promise<void> {
  loading.value = true
  try {
    const commits = await pagesApi.getHistory(props.pageKey)
    history.value = commits.map((c) => ({
      sha: c.sha,
      message: c.commit?.message || '(senza messaggio)',
      date: c.commit?.author?.date || ''
    }))
  } catch (e) {
    ui.toast('Cronologia non leggibile: ' + errorText(e), 'error')
    history.value = []
  } finally {
    loading.value = false
  }
}

async function selectVersion(sha: string): Promise<void> {
  selectedSha.value = sha
  loadingVersion.value = true
  try {
    selected.value = await pagesApi.getAt(props.pageKey, sha)
  } catch (e) {
    ui.toast('Versione non leggibile: ' + errorText(e), 'error')
    selected.value = null
  } finally {
    loadingVersion.value = false
  }
}

const diff = computed(() => (selected.value ? diffLines(selected.value.content || '', props.currentMarkdown) : []))
const stats = computed(() => diffStats(diff.value))

function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('it-IT')
}

async function restoreContent(snapshot: PageContent, label: string): Promise<void> {
  const ok = await confirmAction({
    title: 'Ripristina versione',
    message: `Sostituire il contenuto corrente con «${label}»?`,
    detail: 'Le modifiche non salvate vanno perse. Il ripristino resta in memoria: salva per applicarlo.',
    confirmLabel: 'Ripristina',
    danger: true
  })
  if (!ok) return
  emit('restore', snapshot)
}

function saveSnapshot(): void {
  if (!props.page) return
  const name = snapName.value.trim() || `Snapshot ${new Date().toLocaleString('it-IT')}`
  snapshots.value.unshift({ name, date: new Date().toISOString(), content: { ...props.page } })
  snapshots.value = snapshots.value.slice(0, 20)
  snapName.value = ''
  persistSnaps()
  ui.toast(`Snapshot «${name}» salvato nel browser`, 'success')
}

function deleteSnapshot(idx: number): void {
  snapshots.value.splice(idx, 1)
  persistSnaps()
}

function resetSelection(): void {
  selectedSha.value = ''
  selected.value = null
}

watch(
  () => props.pageKey,
  () => {
    resetSelection()
    void loadHistory()
    loadSnaps()
  }
)

onMounted(() => {
  void loadHistory()
  loadSnaps()
})
</script>

<template>
  <div class="arc-versions">
    <div class="arc-mode-tabs" role="tablist" aria-label="Cronologia e snapshot">
      <button
        class="arc-mode-tab"
        type="button"
        role="tab"
        :aria-selected="tab === 'history'"
        :class="{ active: tab === 'history' }"
        @click="tab = 'history'"
      >
        🕘 Cronologia git
      </button>
      <button
        class="arc-mode-tab"
        type="button"
        role="tab"
        :aria-selected="tab === 'snapshots'"
        :class="{ active: tab === 'snapshots' }"
        @click="tab = 'snapshots'"
      >
        📌 Snapshot ({{ snapshots.length }})
      </button>
    </div>

    <div v-if="tab === 'history'">
      <div v-if="loading" class="arc-hint">Caricamento cronologia…</div>
      <div v-else-if="!history.length" class="arc-hint">Nessun commit trovato per questa pagina.</div>
      <div v-else class="arc-versions-list">
        <button
          v-for="h in history"
          :key="h.sha"
          class="arc-versions-item"
          type="button"
          :class="{ active: h.sha === selectedSha }"
          @click="selectVersion(h.sha)"
        >
          <code>{{ h.sha.slice(0, 7) }}</code>
          <span class="arc-versions-msg">{{ h.message.split('\n')[0] }}</span>
          <span class="arc-versions-date">{{ fmtDate(h.date) }}</span>
        </button>
      </div>

      <div v-if="loadingVersion" class="arc-hint">Caricamento versione…</div>
      <div v-else-if="selected" class="arc-versions-diff">
        <div class="arc-head-row">
          <strong>Confronto con il testo corrente</strong>
          <span class="arc-hint">+{{ stats.added }} −{{ stats.removed }}</span>
          <button
            class="btn btn-p btn-sm"
            type="button"
            @click="restoreContent(selected, 'versione ' + selectedSha.slice(0, 7))"
          >
            Ripristina questa versione
          </button>
        </div>
        <div class="arc-diff">
          <div v-for="(line, i) in diff.slice(0, 400)" :key="i" class="arc-diff-line" :class="'is-' + line.kind">
            <span class="arc-diff-sign">{{ line.kind === 'add' ? '+' : line.kind === 'del' ? '−' : ' ' }}</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <code v-if="line.html" v-html="line.html"></code>
            <code v-else>{{ line.text }}</code>
          </div>
          <div v-if="diff.length > 400" class="arc-hint">… diff troncato a 400 righe</div>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="arc-versions-new">
        <input
          v-model="snapName"
          class="in"
          placeholder="Nome snapshot (es. pre-boss-finale)"
          maxlength="60"
          aria-label="Nome snapshot"
        />
        <button class="btn btn-soft btn-sm" type="button" :disabled="!page" @click="saveSnapshot">
          Salva snapshot attuale
        </button>
      </div>
      <div v-if="!snapshots.length" class="arc-hint">
        Gli snapshot vivono nel browser: perfetti prima di un grosso rimaneggiamento.
      </div>
      <div v-for="(snap, i) in snapshots" :key="snap.date + i" class="arc-versions-item">
        <span class="arc-versions-msg">📌 {{ snap.name }}</span>
        <span class="arc-versions-date">{{ fmtDate(snap.date) }}</span>
        <span class="arc-toolbar-spacer"></span>
        <button class="btn btn-soft btn-sm" type="button" @click="restoreContent(snap.content, snap.name)">
          Ripristina
        </button>
        <button class="btn btn-soft btn-sm" type="button" title="Elimina snapshot" @click="deleteSnapshot(i)">✕</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.arc-versions {
  margin-top: 14px;
  border-top: 1px solid var(--aline, rgba(200, 155, 60, 0.2));
  padding-top: 12px;
}
.arc-versions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow: auto;
  margin: 8px 0;
}
.arc-versions-item {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 8px;
  color: inherit;
  font-size: 13px;
  width: 100%;
}
button.arc-versions-item:hover {
  background: var(--asurface-2, rgba(200, 155, 60, 0.08));
}
button.arc-versions-item.active {
  border-color: var(--accent, #c89b3c);
}
.arc-versions-item code {
  font-size: 12px;
  opacity: 0.7;
}
.arc-versions-msg {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.arc-versions-date {
  font-size: 12px;
  opacity: 0.6;
  white-space: nowrap;
}
.arc-versions-diff {
  margin-top: 8px;
}
.arc-versions-diff .arc-head-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.arc-diff {
  background: var(--asurface, rgba(0, 0, 0, 0.25));
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.2));
  border-radius: 8px;
  padding: 8px;
  max-height: 320px;
  overflow: auto;
  font-size: 12.5px;
}
.arc-diff-line {
  display: flex;
  gap: 8px;
  padding: 1px 4px;
  border-radius: 4px;
}
.arc-diff-line code {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--afont-mono, ui-monospace, monospace);
}
.arc-diff-line.is-add {
  background: rgba(60, 180, 90, 0.12);
}
.arc-diff-line.is-del {
  background: rgba(200, 70, 70, 0.12);
}
.arc-diff-sign {
  opacity: 0.5;
  min-width: 12px;
}
.arc-diff-line :deep(ins) {
  background: rgba(60, 180, 90, 0.35);
  text-decoration: none;
  border-radius: 2px;
}
.arc-diff-line :deep(del) {
  background: rgba(200, 70, 70, 0.35);
  border-radius: 2px;
}
.arc-versions-new {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}
.arc-versions-new .in {
  flex: 1;
}
</style>
