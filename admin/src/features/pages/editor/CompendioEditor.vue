<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  cardGroup,
  createCard,
  parseCompendio,
  serializeCompendio,
  updateCard,
  updateMeta,
  type CompendioCard,
  type CompendioDoc,
  type CompendioKind
} from '../compendio'
import VIcon from '@/shared/components/VIcon.vue'

const props = defineProps<{ content: string; pageKey: string }>()
const emit = defineEmits<{ (e: 'update:content', value: string): void }>()

const kind: CompendioKind = /sottoclassi/.test(props.pageKey) ? 'sottoclassi' : 'specie'
const doc = ref<CompendioDoc>(parseCompendio(props.content, kind))
const open = ref<Set<string>>(new Set())
const query = ref('')
const activeId = ref<string | null>(null)

watch(
  () => props.content,
  (value) => {
    /* Il parent riscrive il contenuto dopo ogni commit: ricaricare qui
       riporterebbe il cursore a zero. Si rilegge solo se il markdown
       esterno è davvero diverso da quello prodotto dal form. */
    if (serializeCompendio(doc.value) !== value) doc.value = parseCompendio(value, kind)
  }
)

function commit(): void {
  emit('update:content', serializeCompendio(doc.value))
}

function value(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function toggle(id: string): void {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
  if (next.has(id)) activeId.value = id
}

function replaceCard(index: number, next: CompendioCard): void {
  doc.value.parts = doc.value.parts.map((part, position) => (position === index ? next : part))
}

function setTitle(index: number, card: CompendioCard, event: Event): void {
  replaceCard(index, updateCard(card, { title: value(event) }, kind))
  commit()
}

function setBody(index: number, card: CompendioCard, event: Event): void {
  replaceCard(index, updateCard(card, { body: value(event) }, kind))
  commit()
}

function setMeta(index: number, card: CompendioCard, event: Event): void {
  replaceCard(index, updateMeta(card, value(event), kind))
  commit()
}

function addCard(): void {
  const card = createCard(kind)
  doc.value.parts.push(card)
  open.value = new Set([...open.value, card.id])
  activeId.value = card.id
  commit()
  requestAnimationFrame(() => focusCard(card.id))
}

function removeCard(index: number): void {
  const part = doc.value.parts[index]
  if (!part || part.kind !== 'card') return
  if (!window.confirm(`Eliminare la scheda «${part.title}»?`)) return
  doc.value.parts.splice(index, 1)
  commit()
}

function moveCard(index: number, offset: number): void {
  const target = index + offset
  if (target < 0 || target >= doc.value.parts.length) return
  const next = [...doc.value.parts]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  doc.value.parts = next
  commit()
}

function updateRaw(index: number, raw: string): void {
  const part = doc.value.parts[index]
  if (!part || part.kind !== 'raw') return
  part.raw = raw
  commit()
}

function setIntro(event: Event): void {
  doc.value.intro = value(event)
  commit()
}

function focusCard(id: string): void {
  const element = document.getElementById('cmp-card-' + id)
  element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

function jump(id: string): void {
  activeId.value = id
  if (!open.value.has(id)) open.value = new Set([...open.value, id])
  focusCard(id)
}

function outline(body: string): string[] {
  return body
    .split('\n')
    .filter((line) => /^#{2,3}\s+\S/.test(line))
    .map((line) => line.replace(/^#{2,3}\s+/, '').trim())
    .slice(0, 6)
}

const cards = computed(() => doc.value.parts.filter((part): part is CompendioCard => part.kind === 'card'))
const visibleCards = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return cards.value
  return cards.value.filter(
    (card) =>
      card.title.toLowerCase().includes(needle) ||
      (card.meta?.value || '').toLowerCase().includes(needle) ||
      card.body.toLowerCase().includes(needle)
  )
})

/* Il catalogo conserva l'ordine del documento e mostra il conteggio
   reale per classe/tipologia: è l'indice da cui si apre ogni scheda. */
const groups = computed(() => {
  const map = new Map<string, CompendioCard[]>()
  for (const card of visibleCards.value) {
    const group = cardGroup(card, kind)
    if (!map.has(group)) map.set(group, [])
    map.get(group)!.push(card)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'it'))
})

function indexOf(card: CompendioCard): number {
  return doc.value.parts.findIndex((part) => part.id === card.id)
}
</script>

<template>
  <section class="arc-compendio">
    <div class="arc-compendio-head">
      <div>
        <h2>{{ kind === 'sottoclassi' ? 'Sottoclassi' : 'Specie' }} homebrew</h2>
        <p class="arc-hint">
          {{ cards.length }} schede reali, raggruppate per {{ kind === 'sottoclassi' ? 'classe' : 'tipologia' }}. Ogni
          scheda conserva tabelle, tratti e livelli.
        </p>
      </div>
      <button class="btn btn-soft btn-sm" type="button" @click="addCard">
        <VIcon name="plus" :size="14" /> Nuova scheda
      </button>
    </div>

    <label class="arc-field">
      <span class="arc-label">Introduzione</span>
      <textarea class="in" rows="3" :value="doc.intro" @input="setIntro" />
    </label>

    <div class="arc-compendio-layout">
      <aside class="arc-compendio-nav" aria-label="Catalogo delle schede">
        <input v-model="query" class="in" type="search" placeholder="Cerca specie, classe, tratto…" />
        <div v-for="[group, entries] in groups" :key="group" class="arc-compendio-group">
          <div class="arc-compendio-group-title">{{ group }} <span>{{ entries.length }}</span></div>
          <button
            v-for="card in entries"
            :key="card.id"
            class="arc-compendio-link"
            :class="{ active: activeId === card.id }"
            type="button"
            @click="jump(card.id)"
          >
            <span>{{ card.title }}</span>
            <small v-if="card.meta?.value">{{ card.meta.value }}</small>
          </button>
        </div>
        <p v-if="!groups.length" class="arc-hint">Nessuna scheda corrisponde alla ricerca.</p>
      </aside>

      <div class="arc-compendio-list">
        <article
          v-for="card in visibleCards"
          :id="'cmp-card-' + card.id"
          :key="card.id"
          class="arc-compendio-card"
          :class="{ 'is-open': open.has(card.id) }"
        >
          <header class="arc-compendio-card-head" @click="toggle(card.id)">
            <span class="arc-compendio-index">{{ indexOf(card) + 1 }}</span>
            <div class="arc-compendio-card-title">
              <strong>{{ card.title || 'Scheda senza titolo' }}</strong>
              <span v-if="card.meta?.value" class="arc-compendio-badge">{{ card.meta.value }}</span>
            </div>
            <span class="arc-compendio-tools">
              <button
                class="arc-icon-btn"
                type="button"
                title="Sposta su"
                aria-label="Sposta scheda su"
                :disabled="indexOf(card) === 0"
                @click.stop="moveCard(indexOf(card), -1)"
              >
                <VIcon name="up" :size="13" />
              </button>
              <button
                class="arc-icon-btn"
                type="button"
                title="Sposta giù"
                aria-label="Sposta scheda giù"
                :disabled="indexOf(card) === doc.parts.length - 1"
                @click.stop="moveCard(indexOf(card), 1)"
              >
                <VIcon name="down" :size="13" />
              </button>
              <button
                class="arc-icon-btn is-danger"
                type="button"
                title="Elimina scheda"
                aria-label="Elimina scheda"
                @click.stop="removeCard(indexOf(card))"
              >
                <VIcon name="trash" :size="13" />
              </button>
              <button
                class="arc-icon-btn"
                type="button"
                :aria-expanded="open.has(card.id)"
                :aria-label="open.has(card.id) ? 'Chiudi scheda' : 'Apri scheda'"
                @click.stop="toggle(card.id)"
              >
                <VIcon :name="open.has(card.id) ? 'down' : 'chevron'" :size="14" />
              </button>
            </span>
          </header>

          <div v-if="open.has(card.id)" class="arc-compendio-card-body">
            <div class="arc-compendio-fields">
              <label class="arc-field">
                <span class="arc-label">Nome della scheda</span>
                <input class="in" :value="card.title" @input="setTitle(indexOf(card), card, $event)" />
              </label>
              <label v-if="card.meta" class="arc-field">
                <span class="arc-label">{{ card.meta.label }}</span>
                <input class="in" :value="card.meta.value" @input="setMeta(indexOf(card), card, $event)" />
              </label>
            </div>

            <div v-if="outline(card.body).length" class="arc-compendio-outline">
              <span>Sezioni:</span>
              <code v-for="section in outline(card.body)" :key="section">{{ section }}</code>
            </div>

            <label class="arc-field">
              <span class="arc-label">
                Tratti, descrizione e privilegi (markdown della scheda)
              </span>
              <textarea
                class="in arc-compendio-body"
                :rows="Math.min(20, Math.max(8, card.body.split('\n').length))"
                :value="card.body"
                @input="setBody(indexOf(card), card, $event)"
              />
            </label>
          </div>
        </article>

        <article
          v-for="part in doc.parts.filter((candidate) => candidate.kind === 'raw')"
          :key="part.id"
          class="arc-compendio-card is-raw"
        >
          <header class="arc-compendio-card-head is-static">
            <span class="arc-compendio-index">!</span>
            <div class="arc-compendio-card-title">
              <strong>Sezione non riconosciuta</strong>
              <span class="arc-compendio-badge">markdown preservato</span>
            </div>
          </header>
          <div class="arc-compendio-card-body">
            <textarea
              v-if="part.kind === 'raw'"
              class="in arc-compendio-body"
              rows="8"
              :value="part.raw"
              @input="updateRaw(doc.parts.indexOf(part), value($event))"
            />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.arc-compendio-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.arc-compendio-head h2 {
  font-family: 'Cinzel', serif;
  font-size: 16px;
  color: var(--accent, #c89b3c);
  margin-bottom: 4px;
}
.arc-compendio-layout {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  margin-top: 14px;
}
.arc-compendio-nav {
  position: sticky;
  top: 12px;
  max-height: calc(100vh - 220px);
  overflow: auto;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.16));
  border-radius: 8px;
  background: var(--asurface-2, rgba(200, 155, 60, 0.025));
  padding: 8px;
}
.arc-compendio-nav .in {
  margin-bottom: 8px;
}
.arc-compendio-group {
  margin-bottom: 10px;
}
.arc-compendio-group-title {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 7px;
  color: var(--text-muted, #b0a080);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.arc-compendio-link {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  padding: 5px 7px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--text, #e8dcc0);
  text-align: left;
  cursor: pointer;
}
.arc-compendio-link:hover,
.arc-compendio-link.active {
  background: var(--accent-soft, rgba(200, 155, 60, 0.14));
}
.arc-compendio-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
.arc-compendio-link small {
  color: var(--text-muted, #b0a080);
  font-size: 10px;
}
.arc-compendio-list {
  min-width: 0;
}
.arc-compendio-card {
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.16));
  border-radius: 8px;
  margin-bottom: 8px;
  background: var(--asurface, rgba(200, 155, 60, 0.025));
  overflow: hidden;
  scroll-margin: 90px;
}
.arc-compendio-card-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  min-height: 42px;
  cursor: pointer;
}
.arc-compendio-card-head.is-static {
  cursor: default;
}
.arc-compendio-index {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex: none;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.22));
  border-radius: 50%;
  color: var(--text-muted, #b0a080);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.arc-compendio-card-title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.arc-compendio-card-title strong {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  color: var(--text, #e8dcc0);
}
.arc-compendio-badge {
  padding: 1px 6px;
  border: 1px solid var(--aline, rgba(200, 155, 60, 0.22));
  border-radius: 999px;
  color: var(--text-muted, #b0a080);
  font-size: 10px;
}
.arc-compendio-tools {
  margin-left: auto;
  display: flex;
  gap: 1px;
}
.arc-compendio-card-body {
  padding: 0 12px 14px;
  border-top: 1px solid var(--aline, rgba(200, 155, 60, 0.1));
}
.arc-compendio-fields {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 12px;
}
.arc-compendio-card-body .arc-field {
  margin-top: 12px;
}
.arc-compendio-outline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
  color: var(--text-muted, #b0a080);
  font-size: 11px;
}
.arc-compendio-outline code {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--asurface-2, rgba(200, 155, 60, 0.08));
  font-size: 10px;
}
.arc-compendio-body {
  width: 100%;
  font-family: var(--afont-mono, 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace);
  font-size: 12px;
  line-height: 1.6;
  resize: vertical;
}
@media (max-width: 900px) {
  .arc-compendio-layout {
    grid-template-columns: 1fr;
  }
  .arc-compendio-nav {
    position: relative;
    top: 0;
    max-height: 220px;
  }
  .arc-compendio-fields {
    grid-template-columns: 1fr;
  }
}
</style>
