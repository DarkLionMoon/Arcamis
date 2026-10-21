<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { searchApi } from '@/shared/api'
import { useRegistryStore } from '@/app/store'
import type { PageRegistryEntry } from '@/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const registry = useRegistryStore()
const router = useRouter()

const q = ref('')
const focusIdx = ref(0)
const searching = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
const fullText = ref<Array<{ k: string; title: string; icon: string }>>([])
let debounceTimer: ReturnType<typeof setTimeout> | null = null

type Hit = PageRegistryEntry | { k: string; title: string; icon: string }

type SearchHit = Hit & { kind: 'page' | 'content' | 'action'; match: string }

interface AdminAction {
  id: string
  label: string
  icon: string
  hint: string
  keywords: string
  run: () => void
}

/* Command palette: `>azione` filtra solo le azioni, altrimenti si mescolano
   ai risultati delle pagine. */
const ADMIN_ACTIONS: AdminAction[] = [
  {
    id: 'new-page',
    label: 'Nuova pagina',
    icon: '➕',
    hint: 'crea dal registro',
    keywords: 'crea nuova pagina',
    run: () => router.push('/pagine?new=1')
  },
  {
    id: 'go-dashboard',
    label: 'Vai alla dashboard',
    icon: '📊',
    hint: 'panoramica',
    keywords: 'home dashboard',
    run: () => router.push('/')
  },
  {
    id: 'go-pages',
    label: 'Vai alle pagine',
    icon: '📄',
    hint: 'elenco e stati',
    keywords: 'pagine elenco',
    run: () => router.push('/pagine')
  },
  {
    id: 'go-media',
    label: 'Vai ai media',
    icon: '🖼',
    hint: 'libreria immagini',
    keywords: 'media immagini',
    run: () => router.push('/media')
  },
  {
    id: 'go-map',
    label: 'Vai alla mappa',
    icon: '🗺',
    hint: 'puntine ed esplorazione',
    keywords: 'mappa pins',
    run: () => router.push('/mapa')
  },
  {
    id: 'go-quests',
    label: 'Vai alle missioni',
    icon: '🎯',
    hint: 'bacheca incarichi',
    keywords: 'missioni quest bacheca',
    run: () => router.push('/missioni')
  },
  {
    id: 'go-carousel',
    label: 'Vai al carousel',
    icon: '🎠',
    hint: 'slide della home',
    keywords: 'carousel slide home',
    run: () => router.push('/carousel')
  },
  {
    id: 'go-changelog',
    label: 'Vai al changelog',
    icon: '📜',
    hint: 'note di versione',
    keywords: 'changelog versioni',
    run: () => router.push('/changelog')
  },
  {
    id: 'go-scanner',
    label: 'Vai allo scanner link',
    icon: '🔗',
    hint: 'link rotti e menzioni',
    keywords: 'scanner link rotti',
    run: () => router.push('/link-scanner')
  },
  {
    id: 'go-backup',
    label: 'Vai ai backup',
    icon: '💾',
    hint: 'salvataggi contenuti',
    keywords: 'backup salvataggio',
    run: () => router.push('/backup')
  },
  {
    id: 'go-audit',
    label: "Vai all'audit",
    icon: '📋',
    hint: 'registro attività',
    keywords: 'audit log attività',
    run: () => router.push('/audit')
  },
  {
    id: 'go-users',
    label: 'Vai agli utenti',
    icon: '👥',
    hint: 'ruoli e accessi',
    keywords: 'utenti ruoli',
    run: () => router.push('/utenti')
  }
]

const actionOnly = computed(() => q.value.trim().startsWith('>'))

const actionTerm = computed(() => q.value.trim().replace(/^>\s*/, '').toLowerCase())

const actionHits = computed<SearchHit[]>(() => {
  const term = actionOnly.value ? actionTerm.value : q.value.trim().toLowerCase()
  return ADMIN_ACTIONS.filter((a) => !term || a.label.toLowerCase().includes(term) || a.keywords.includes(term)).map(
    (a) => ({ k: a.id, title: a.label, icon: a.icon, kind: 'action' as const, match: a.hint })
  )
})

const hits = computed<SearchHit[]>(() => {
  const term = q.value.trim().toLowerCase()
  if (actionOnly.value) return actionHits.value
  const out: SearchHit[] = []
  if (term) {
    for (const p of registry.pages) {
      const k = (p.k || '').toLowerCase()
      const l = (p.l || '').toLowerCase()
      const id = (p.id || '').toLowerCase()
      if (k.includes(term) || l.includes(term) || id.includes(term)) {
        out.push({ ...p, kind: 'page', match: p.l || p.k })
      }
    }
    for (const r of fullText.value) {
      out.push({ ...r, kind: 'content', match: 'contenuto: ' + r.title })
    }
    out.push(...actionHits.value.slice(0, 3))
  } else {
    out.push(...actionHits.value.slice(0, 5))
  }
  return out
})

watch(q, () => {
  focusIdx.value = 0
  if (debounceTimer) clearTimeout(debounceTimer)
  searching.value = true
  debounceTimer = setTimeout(() => {
    const term = q.value.trim()
    if (!term) {
      fullText.value = []
      searching.value = false
      return
    }
    searchApi
      .searchContent(term)
      .catch(() => [])
      .then((res) => {
        fullText.value = res
        searching.value = false
      })
  }, 250)
})

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    q.value = ''
    fullText.value = []
    focusIdx.value = 0
    /* Focus appena il DOM è aggiornato: con setTimeout(0) i tasti
       digitati subito dopo ⌘K potevano perdersi (gara con il timer). */
    await nextTick()
    inputEl.value?.focus()
  }
)

function go(h: SearchHit) {
  emit('close')
  if (h.kind === 'action') {
    const action = ADMIN_ACTIONS.find((a) => a.id === h.k)
    action?.run()
    return
  }
  router.push('/editor/' + encodeURIComponent(h.k))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusIdx.value = Math.min(focusIdx.value + 1, hits.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusIdx.value = Math.max(focusIdx.value - 1, 0)
  } else if (e.key === 'Enter' && hits.value[focusIdx.value]) {
    e.preventDefault()
    go(hits.value[focusIdx.value])
  }
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div v-if="props.open" class="arc-search-overlay" @mousedown.self="emit('close')">
    <div class="arc-search-dialog" role="dialog" aria-label="Ricerca globale">
      <div class="arc-search-input-row">
        <span>🔎</span>
        <input
          ref="inputEl"
          v-model="q"
          class="arc-search-input"
          placeholder="Cerca pagine o contenuti…  (Esc per chiudere)"
          @keydown="onKeydown"
        />
        <button class="btn btn-soft btn-sm" type="button" @click="emit('close')">Esc</button>
      </div>

      <div class="arc-search-results">
        <button
          v-for="(h, i) in hits"
          :key="h.k + h.kind"
          class="arc-search-hit"
          :class="{ active: i === focusIdx }"
          type="button"
          @mouseenter="focusIdx = i"
          @click="go(h)"
        >
          <span>{{ h.icon || (h.kind === 'content' ? '📄' : '◦') }}</span>
          <span class="arc-search-hit-label">{{ h.title || h.l || h.k }}</span>
          <code class="arc-search-hit-key">{{ h.k }}</code>
          <span class="arc-search-hit-kind">{{
            h.kind === 'content' ? 'contenuto' : h.kind === 'action' ? 'azione' : 'pagina'
          }}</span>
        </button>

        <div v-if="searching" class="arc-empty-side" style="padding: 16px">Ricerca…</div>
        <div v-else-if="q && !hits.length" class="arc-empty-side" style="padding: 16px">Nessun risultato.</div>
        <div v-else-if="!q" class="arc-empty-side" style="padding: 16px; opacity: 0.4">
          ↑/↓ per navigare, Invio per aprire. Digita <code>&gt;</code> per le azioni.
        </div>
      </div>
    </div>
  </div>
</template>
