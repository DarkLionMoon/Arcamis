<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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

const hits = computed<Array<Hit & { kind: 'page' | 'content'; match: string }>>(() => {
  const term = q.value.trim().toLowerCase()
  const out: Array<Hit & { kind: 'page' | 'content'; match: string }> = []
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
      .then(res => {
        fullText.value = res
        searching.value = false
      })
  }, 250)
})

watch(
  () => props.open,
  open => {
    if (open) {
      q.value = ''
      fullText.value = []
      focusIdx.value = 0
      setTimeout(() => inputEl.value?.focus(), 0)
    }
  }
)

function go(h: Hit & { kind: 'page' | 'content' }) {
  emit('close')
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
          <span class="arc-search-hit-kind">{{ h.kind === 'content' ? 'contenuto' : 'pagina' }}</span>
        </button>

        <div v-if="searching" class="arc-empty-side" style="padding:16px">Ricerca…</div>
        <div v-else-if="q && !hits.length" class="arc-empty-side" style="padding:16px">Nessun risultato.</div>
        <div v-else-if="!q" class="arc-empty-side" style="padding:16px;opacity:.4">
          Premi ↑/↓ per navigare, Invio per aprire l'editor.
        </div>
      </div>
    </div>
  </div>
</template>