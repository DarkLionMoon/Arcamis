<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { adminUrl, errorText, request } from '@/shared/api'
import { useUIStore } from '@/app/store'

interface FeedbackItem {
  id: string
  category: string
  message: string
  email?: string | null
  page?: string
  createdAt?: string
  country?: string | null
  locale?: string | null
  userAgent?: string | null
}

interface FeedbackResponse {
  ok?: boolean
  items?: FeedbackItem[]
  counts?: Record<string, number>
  cursor?: string | null
  listComplete?: boolean
}

const CATEGORIES = [
  { value: 'bug', label: 'Bug', icon: '🐞' },
  { value: 'feature', label: 'Idea', icon: '💡' },
  { value: 'ux', label: 'UI/UX', icon: '🎨' },
  { value: 'general', label: 'Generale', icon: '💬' }
] as const

const PAGE_SIZE = 25

const ui = useUIStore()
const loading = ref(true)
const loadingMore = ref(false)
const items = ref<FeedbackItem[]>([])
const counts = ref<Record<string, number>>({})
const cursor = ref<string | null>(null)
const listComplete = ref(true)
const filterCategory = ref('')

const visibleItems = computed(() => items.value)

function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })
}

async function load(reset = true): Promise<void> {
  if (reset) {
    loading.value = true
    cursor.value = null
  } else {
    loadingMore.value = true
  }
  try {
    const res = (await request(
      adminUrl('get_feedback', {
        category: filterCategory.value || undefined,
        limit: PAGE_SIZE,
        cursor: reset ? undefined : cursor.value || undefined
      })
    )) as FeedbackResponse
    const next = Array.isArray(res.items) ? res.items : []
    items.value = reset ? next : [...items.value, ...next]
    counts.value = res.counts || {}
    cursor.value = res.cursor || null
    listComplete.value = res.listComplete !== false
  } catch (e) {
    ui.toast(errorText(e), 'error', { title: 'Feedback non caricati' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function setCategory(value: string): void {
  if (filterCategory.value === value) return
  filterCategory.value = value
  void load(true)
}

onMounted(() => {
  void load(true)
})
</script>

<template>
  <section class="fba">
    <header class="fba__head">
      <div>
        <h1 class="fba__title">Feedback</h1>
        <p class="fba__sub">
          Messaggi inviati dal widget pubblico. Restano in KV per 180 giorni.
        </p>
      </div>
      <button class="fba__refresh" type="button" :disabled="loading" @click="load(true)">
        {{ loading ? 'Carico…' : 'Aggiorna' }}
      </button>
    </header>

    <div class="fba__filters" role="group" aria-label="Filtra per categoria">
      <button
        type="button"
        class="fba__chip"
        :class="{ 'is-active': filterCategory === '' }"
        :aria-pressed="filterCategory === ''"
        @click="setCategory('')"
      >
        Tutti
      </button>
      <button
        v-for="cat in CATEGORIES"
        :key="cat.value"
        type="button"
        class="fba__chip"
        :class="{ 'is-active': filterCategory === cat.value }"
        :aria-pressed="filterCategory === cat.value"
        @click="setCategory(cat.value)"
      >
        <span aria-hidden="true">{{ cat.icon }}</span> {{ cat.label }}
        <span v-if="counts[cat.value]" class="fba__chip-count">{{ counts[cat.value] }}</span>
      </button>
    </div>

    <p v-if="loading" class="fba__state" role="status">Caricamento feedback…</p>
    <p v-else-if="!visibleItems.length" class="fba__state">
      Nessun feedback ricevuto{{ filterCategory ? ' per questa categoria' : '' }}.
    </p>

    <ul v-else class="fba__list">
      <li v-for="item in visibleItems" :key="item.id" class="fba-card">
        <div class="fba-card__top">
          <span class="fba-card__cat" :data-cat="item.category">
            {{ categoryLabel(item.category) }}
          </span>
          <time class="fba-card__time" :datetime="item.createdAt || ''">
            {{ formatDate(item.createdAt) }}
          </time>
        </div>
        <p class="fba-card__msg">{{ item.message }}</p>
        <div class="fba-card__meta">
          <span v-if="item.page">Pagina: <code>{{ item.page }}</code></span>
          <a v-if="item.email" class="fba-card__mail" :href="`mailto:${item.email}`">
            {{ item.email }}
          </a>
          <span v-else>Nessun contatto</span>
        </div>
      </li>
    </ul>

    <button
      v-if="!loading && !listComplete && visibleItems.length"
      class="fba__more"
      type="button"
      :disabled="loadingMore"
      @click="load(false)"
    >
      {{ loadingMore ? 'Carico…' : 'Carica altri' }}
    </button>
  </section>
</template>

<style scoped>
.fba {
  padding: 24px;
  max-width: 1040px;
}
.fba__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.fba__title {
  margin: 0;
  font-size: 22px;
  color: var(--afg-1, #f0e6d2);
}
.fba__sub {
  margin: 4px 0 0;
  color: var(--afg-3, #a99a78);
  font-size: 13px;
}
.fba__refresh {
  padding: 8px 14px;
  border: 1px solid var(--line, rgba(200, 155, 60, 0.28));
  background: transparent;
  color: var(--afg-1, #f0e6d2);
  border-radius: 4px;
  cursor: pointer;
}
.fba__refresh:disabled {
  opacity: 0.6;
  cursor: progress;
}
.fba__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.fba__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--line, rgba(200, 155, 60, 0.22));
  border-radius: 999px;
  background: transparent;
  color: var(--afg-3, #a99a78);
  font-size: 13px;
  cursor: pointer;
}
.fba__chip.is-active {
  border-color: var(--gold, #c89b3c);
  color: var(--gold-3, #e8c86a);
  background: rgba(200, 155, 60, 0.1);
}
.fba__chip-count {
  font-size: 11px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(200, 155, 60, 0.18);
}
.fba__state {
  padding: 28px 0;
  text-align: center;
  color: var(--afg-3, #a99a78);
}
.fba__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.fba-card {
  border: 1px solid var(--line, rgba(200, 155, 60, 0.18));
  background: var(--panel, rgba(255, 255, 255, 0.02));
  border-radius: 6px;
  padding: 14px 16px;
}
.fba-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.fba-card__cat {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(200, 155, 60, 0.14);
  color: var(--gold-3, #e8c86a);
}
.fba-card__cat[data-cat='bug'] {
  background: rgba(200, 70, 60, 0.16);
  color: #e8a59f;
}
.fba-card__cat[data-cat='feature'] {
  background: rgba(80, 140, 220, 0.16);
  color: #a9c8f0;
}
.fba-card__cat[data-cat='ux'] {
  background: rgba(140, 100, 220, 0.16);
  color: #c3b0ec;
}
.fba-card__time {
  font-size: 12px;
  color: var(--afg-3, #a99a78);
}
.fba-card__msg {
  margin: 0 0 10px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.55;
  color: var(--afg-1, #f0e6d2);
}
.fba-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--afg-3, #a99a78);
}
.fba-card__meta code {
  color: var(--gold-3, #e8c86a);
}
.fba-card__mail {
  color: var(--gold-3, #e8c86a);
}
.fba__more {
  margin-top: 14px;
  width: 100%;
  padding: 10px;
  border: 1px dashed var(--line, rgba(200, 155, 60, 0.3));
  background: transparent;
  color: var(--afg-2, #c9b98f);
  border-radius: 5px;
  cursor: pointer;
}
</style>
