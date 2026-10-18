<script setup lang="ts">
import { computed, ref } from 'vue'

import MediaDrawer from './MediaDrawer.vue'
import VIcon from '@/shared/components/VIcon.vue'
import { BLOCK_LABELS, CALLOUT_TONES, blockIssues, isKnownTone, makeBlock, type Block, type BlockType } from '../blocks'

/* ════════════════════════════════════════════════════════════════
   Editor a blocchi

   Ogni modifica produce un nuovo array di blocchi: il genitore lo
   serializza in markdown (blocks.ts) e l'anteprima a destra mostra
   subito il risultato del renderer vero. I blocchi sono ordinabili
   col trascinamento della maniglia o con le frecce (tastiera).
   ════════════════════════════════════════════════════════════════ */

const props = defineProps<{ blocks: Block[] }>()
const emit = defineEmits<{
  (e: 'update:blocks', blocks: Block[]): void
  (e: 'mark-draft'): void
}>()

const ADD_ORDER: BlockType[] = [
  'heading',
  'paragraph',
  'callout',
  'accordion',
  'cards',
  'gallery',
  'image',
  'table',
  'divider'
]

const adding = ref<BlockType>('paragraph')
const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

type MediaTarget =
  | { kind: 'image'; blockId: string }
  | { kind: 'gallery'; blockId: string; imageIndex: number }
  | { kind: 'card'; blockId: string; cardIndex: number }
  | { kind: 'new-gallery'; blockId: string }

const mediaTarget = ref<MediaTarget | null>(null)
const mediaOpen = computed({
  get: () => mediaTarget.value !== null,
  set: (open: boolean) => {
    if (!open) mediaTarget.value = null
  }
})

const issueCount = computed(() => props.blocks.reduce((total, block) => total + blockIssues(block).length, 0))

function commit(next: Block[]): void {
  emit('update:blocks', next)
}

function replace(blockId: string, patch: Partial<Block>): void {
  commit(props.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)))
}

function addBlock(): void {
  commit([...props.blocks, makeBlock(adding.value)])
}

/** Scorciatoia dello stato vuoto: un paragrafo pronto da scrivere. */
function addParagraph(): void {
  adding.value = 'paragraph'
  addBlock()
}

function removeBlock(blockId: string): void {
  commit(props.blocks.filter((block) => block.id !== blockId))
}

function duplicateBlock(blockId: string): void {
  const index = props.blocks.findIndex((block) => block.id === blockId)
  if (index < 0) return
  const copy = JSON.parse(JSON.stringify(props.blocks[index])) as Block
  copy.id = makeBlock('paragraph').id
  const next = [...props.blocks]
  next.splice(index + 1, 0, copy)
  commit(next)
}

function move(from: number, to: number): void {
  if (from === to || to < 0 || to >= props.blocks.length) return
  const next = [...props.blocks]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  commit(next)
}

function onDragStart(index: number, event: DragEvent): void {
  dragIndex.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDrop(index: number): void {
  if (dragIndex.value !== null) move(dragIndex.value, index)
  dragIndex.value = null
  overIndex.value = null
}

function endDrag(): void {
  dragIndex.value = null
  overIndex.value = null
}

function onDragLeave(index: number): void {
  if (overIndex.value === index) overIndex.value = null
}

/** Valore di input/textarea/select, senza cast nel template. */
function value(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value
}

function headingLevel(event: Event): 1 | 2 | 3 {
  const level = Number(value(event))
  return (level === 1 || level === 3 ? level : 2) as 1 | 2 | 3
}

/* ── Carte ── */
function updateCard(block: Block, cardIndex: number, patch: { title?: string; body?: string }): void {
  const cards = (block.cards || []).map((card, index) => (index === cardIndex ? { ...card, ...patch } : card))
  replace(block.id, { cards })
}

function addCard(block: Block): void {
  replace(block.id, { cards: [...(block.cards || []), { title: '', body: '' }] })
}

function removeCard(block: Block, cardIndex: number): void {
  replace(block.id, { cards: (block.cards || []).filter((_, index) => index !== cardIndex) })
}

/* ── Galleria ── */
function updateImage(block: Block, imageIndex: number, patch: { src?: string; alt?: string }): void {
  const images = (block.images || []).map((image, index) => (index === imageIndex ? { ...image, ...patch } : image))
  replace(block.id, { images })
}

function addGalleryImage(block: Block): void {
  replace(block.id, { images: [...(block.images || []), { src: '', alt: '' }] })
}

function removeGalleryImage(block: Block, imageIndex: number): void {
  replace(block.id, { images: (block.images || []).filter((_, index) => index !== imageIndex) })
}

/* ── Tabella ── */
function setHeader(block: Block, column: number, value: string): void {
  if (!block.table) return
  const headers = block.table.headers.map((header, index) => (index === column ? value : header))
  replace(block.id, { table: { ...block.table, headers } })
}

function setCell(block: Block, row: number, column: number, value: string): void {
  if (!block.table) return
  const rows = block.table.rows.map((cells, index) =>
    index === row ? cells.map((cell, col) => (col === column ? value : cell)) : cells
  )
  replace(block.id, { table: { ...block.table, rows } })
}

function addRow(block: Block): void {
  if (!block.table) return
  replace(block.id, {
    table: { ...block.table, rows: [...block.table.rows, block.table.headers.map(() => '')] }
  })
}

function addColumn(block: Block): void {
  if (!block.table) return
  const headers = [...block.table.headers, 'Nuova colonna']
  const rows = block.table.rows.map((cells) => [...cells, ''])
  replace(block.id, { table: { headers, rows } })
}

function removeRow(block: Block, row: number): void {
  if (!block.table) return
  replace(block.id, { table: { ...block.table, rows: block.table.rows.filter((_, index) => index !== row) } })
}

function removeColumn(block: Block, column: number): void {
  if (!block.table || block.table.headers.length <= 1) return
  replace(block.id, {
    table: {
      headers: block.table.headers.filter((_, index) => index !== column),
      rows: block.table.rows.map((cells) => cells.filter((_, index) => index !== column))
    }
  })
}

/* ── Media ── */
function pickForImage(block: Block): void {
  mediaTarget.value = { kind: 'image', blockId: block.id }
}

function pickForGallery(block: Block, imageIndex: number): void {
  mediaTarget.value = { kind: 'gallery', blockId: block.id, imageIndex }
}

function addGalleryPick(block: Block): void {
  mediaTarget.value = { kind: 'new-gallery', blockId: block.id }
}

function pickForCard(block: Block, cardIndex: number): void {
  mediaTarget.value = { kind: 'card', blockId: block.id, cardIndex }
}

function onMediaPick(path: string): void {
  const target = mediaTarget.value
  const block = target ? props.blocks.find((candidate) => candidate.id === target.blockId) : null
  if (!target || !block) return
  if (target.kind === 'image') replace(block.id, { src: path })
  if (target.kind === 'gallery' && block.images?.[target.imageIndex]) {
    updateImage(block, target.imageIndex, { src: path })
  }
  if (target.kind === 'new-gallery') {
    replace(block.id, { images: [...(block.images || []), { src: path, alt: '' }] })
  }
  if (target.kind === 'card' && block.cards?.[target.cardIndex]) {
    const card = block.cards[target.cardIndex]
    const line = '![' + 'immagine' + '](' + path + ')'
    updateCard(block, target.cardIndex, { body: card.body ? card.body + '\n\n' + line : line })
  }
  mediaTarget.value = null
}

function toneOptions(block: Block): Array<{ value: string; label: string }> {
  const options = [...CALLOUT_TONES]
  if (block.tone && !isKnownTone(block.tone)) options.push({ value: block.tone, label: block.tone })
  return options
}
</script>

<template>
  <div class="arc-blocks">
    <div class="arc-blocks-bar">
      <div class="arc-blocks-add">
        <select v-model="adding" class="in" aria-label="Tipo di blocco da aggiungere">
          <option v-for="type in ADD_ORDER" :key="type" :value="type">{{ BLOCK_LABELS[type] }}</option>
        </select>
        <button class="btn btn-soft btn-sm" type="button" @click="addBlock">
          <VIcon name="plus" :size="14" /> Aggiungi blocco
        </button>
      </div>
      <span class="arc-blocks-meta">
        {{ blocks.length }} blocchi
        <button class="arc-link" type="button" @click="emit('mark-draft')">Segna come bozza</button>
      </span>
    </div>

    <p v-if="issueCount" class="arc-field-msg is-warning">
      {{ issueCount }} {{ issueCount === 1 ? 'blocco da completare' : 'blocchi da completare' }} — i campi vuoti sono
      segnalati sulla card. Puoi comunque salvare la pagina come bozza.
    </p>

    <div v-if="!blocks.length" class="arc-editor-empty">
      <div class="arc-editor-empty-icon">🧱</div>
      <h2>Pagina vuota</h2>
      <p>Aggiungi un titolo o un paragrafo: i blocchi diventano markdown reale, lo stesso che legge il sito.</p>
      <button class="btn btn-p" type="button" @click="addParagraph">Aggiungi un paragrafo</button>
    </div>

    <div v-else class="arc-block-list">
      <article
        v-for="(block, index) in blocks"
        :key="block.id"
        class="arc-block"
        :class="{ 'is-over': overIndex === index, 'is-dragging': dragIndex === index }"
        @dragover.prevent="overIndex = index"
        @dragleave="onDragLeave(index)"
        @drop.prevent="onDrop(index)"
      >
        <header class="arc-block-head">
          <span
            class="arc-block-grip"
            role="button"
            tabindex="0"
            draggable="true"
            title="Trascina per riordinare"
            aria-label="Trascina il blocco per riordinarlo"
            @dragstart="onDragStart(index, $event)"
            @dragend="endDrag"
            >⠿</span
          >
          <span class="arc-block-type">{{ BLOCK_LABELS[block.type] }}</span>
          <span v-if="blockIssues(block).length" class="arc-block-issues" :title="blockIssues(block).join(' · ')">
            {{ blockIssues(block)[0] }}
          </span>
          <span class="arc-toolbar-spacer"></span>
          <button
            class="arc-icon-btn"
            type="button"
            title="Sposta su"
            aria-label="Sposta su"
            :disabled="index === 0"
            @click="move(index, index - 1)"
          >
            <VIcon name="up" :size="13" />
          </button>
          <button
            class="arc-icon-btn"
            type="button"
            title="Sposta giù"
            aria-label="Sposta giù"
            :disabled="index === blocks.length - 1"
            @click="move(index, index + 1)"
          >
            <VIcon name="down" :size="13" />
          </button>
          <button
            class="arc-icon-btn"
            type="button"
            title="Duplica"
            aria-label="Duplica blocco"
            @click="duplicateBlock(block.id)"
          >
            <VIcon name="copy" :size="13" />
          </button>
          <button
            class="arc-icon-btn"
            type="button"
            title="Elimina"
            aria-label="Elimina blocco"
            @click="removeBlock(block.id)"
          >
            <VIcon name="trash" :size="13" />
          </button>
        </header>

        <div class="arc-block-body">
          <template v-if="block.type === 'heading'">
            <div class="arc-block-inline">
              <select
                class="in arc-block-level"
                :value="block.level || 2"
                aria-label="Livello del titolo"
                @change="replace(block.id, { level: headingLevel($event) })"
              >
                <option :value="1">H1</option>
                <option :value="2">H2</option>
                <option :value="3">H3</option>
              </select>
              <input
                class="in"
                :value="block.text"
                placeholder="Titolo della sezione"
                @input="replace(block.id, { text: value($event) })"
              />
            </div>
          </template>

          <template v-else-if="block.type === 'paragraph'">
            <textarea
              class="in"
              rows="3"
              :value="block.text"
              placeholder="Scrivi il testo del paragrafo…"
              @input="replace(block.id, { text: value($event) })"
            ></textarea>
          </template>

          <template v-else-if="block.type === 'callout' || block.type === 'accordion'">
            <div class="arc-block-inline">
              <select
                class="in"
                :value="block.tone || 'NOTE'"
                aria-label="Tipo di callout"
                @change="replace(block.id, { tone: value($event) })"
              >
                <option v-for="tone in toneOptions(block)" :key="tone.value" :value="tone.value">
                  {{ tone.label }}
                </option>
              </select>
              <input
                class="in"
                :value="block.title"
                :placeholder="block.type === 'accordion' ? 'Domanda o titolo' : 'Titolo del callout'"
                @input="replace(block.id, { title: value($event) })"
              />
            </div>
            <textarea
              class="in"
              rows="3"
              :value="block.text"
              :placeholder="block.type === 'accordion' ? 'Risposta, con markdown se serve…' : 'Testo del callout…'"
              @input="replace(block.id, { text: value($event) })"
            ></textarea>
          </template>

          <template v-else-if="block.type === 'cards'">
            <div
              v-for="(card, cardIndex) in block.cards || []"
              :key="block.id + '-card-' + cardIndex"
              class="arc-subcard"
            >
              <div class="arc-block-inline">
                <input
                  class="in"
                  :value="card.title"
                  placeholder="Titolo della carta"
                  @input="updateCard(block, cardIndex, { title: value($event) })"
                />
                <button
                  class="arc-icon-btn"
                  type="button"
                  title="Immagine nella carta"
                  @click="pickForCard(block, cardIndex)"
                >
                  <VIcon name="image" :size="13" />
                </button>
                <button class="arc-icon-btn" type="button" title="Elimina carta" @click="removeCard(block, cardIndex)">
                  <VIcon name="trash" :size="13" />
                </button>
              </div>
              <textarea
                class="in"
                rows="2"
                :value="card.body"
                placeholder="Testo della carta (markdown: **forte**, elenchi, immagini…)"
                @input="updateCard(block, cardIndex, { body: value($event) })"
              ></textarea>
            </div>
            <button class="btn btn-soft btn-sm" type="button" @click="addCard(block)">+ Aggiungi carta</button>
          </template>

          <template v-else-if="block.type === 'gallery'">
            <div
              v-for="(image, imageIndex) in block.images || []"
              :key="block.id + '-img-' + imageIndex"
              class="arc-img-row"
            >
              <div class="arc-img-thumb">
                <img v-if="image.src" :src="image.src" :alt="image.alt" />
                <span v-else>🖼</span>
              </div>
              <div class="arc-img-fields">
                <input
                  class="in"
                  :value="image.src"
                  placeholder="/images/… oppure https://…"
                  @input="updateImage(block, imageIndex, { src: value($event) })"
                />
                <input
                  class="in"
                  :value="image.alt"
                  placeholder="Didascalia"
                  @input="updateImage(block, imageIndex, { alt: value($event) })"
                />
              </div>
              <button class="btn btn-soft btn-sm" type="button" @click="pickForGallery(block, imageIndex)">
                Scegli
              </button>
              <button
                class="arc-icon-btn"
                type="button"
                title="Rimuovi immagine"
                @click="removeGalleryImage(block, imageIndex)"
              >
                <VIcon name="trash" :size="13" />
              </button>
            </div>
            <button class="btn btn-soft btn-sm" type="button" @click="addGalleryPick(block)">
              + Aggiungi immagine
            </button>
          </template>

          <template v-else-if="block.type === 'image'">
            <div class="arc-img-row">
              <div class="arc-img-thumb">
                <img v-if="block.src" :src="block.src" :alt="block.alt" />
                <span v-else>🖼</span>
              </div>
              <div class="arc-img-fields">
                <input
                  class="in"
                  :value="block.src"
                  placeholder="/images/… oppure https://…"
                  @input="replace(block.id, { src: value($event) })"
                />
                <input
                  class="in"
                  :value="block.alt"
                  placeholder="Didascalia / testo alternativo"
                  @input="replace(block.id, { alt: value($event) })"
                />
              </div>
              <button class="btn btn-soft btn-sm" type="button" @click="pickForImage(block)">Scegli</button>
            </div>
          </template>

          <template v-else-if="block.type === 'table' && block.table">
            <div class="arc-table-wrap">
              <table class="arc-table-edit">
                <thead>
                  <tr>
                    <th v-for="(header, column) in block.table.headers" :key="block.id + '-h-' + column">
                      <input class="in" :value="header" @input="setHeader(block, column, value($event))" />
                      <button
                        class="arc-icon-btn"
                        type="button"
                        title="Rimuovi colonna"
                        @click="removeColumn(block, column)"
                      >
                        ✕
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in block.table.rows" :key="block.id + '-r-' + rowIndex">
                    <td v-for="(_, column) in block.table.headers" :key="block.id + '-c-' + rowIndex + '-' + column">
                      <input
                        class="in"
                        :value="row[column] || ''"
                        @input="setCell(block, rowIndex, column, value($event))"
                      />
                    </td>
                    <td>
                      <button
                        class="arc-icon-btn"
                        type="button"
                        title="Rimuovi riga"
                        @click="removeRow(block, rowIndex)"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="arc-block-inline">
              <button class="btn btn-soft btn-sm" type="button" @click="addRow(block)">+ Riga</button>
              <button class="btn btn-soft btn-sm" type="button" @click="addColumn(block)">+ Colonna</button>
            </div>
          </template>

          <template v-else-if="block.type === 'divider'">
            <div class="arc-divider-preview"><span>Separatore decorativo</span></div>
          </template>

          <template v-else>
            <p class="arc-field-help">
              Markdown non riconosciuto dai blocchi: resta intatto e viene pubblicato così com'è.
            </p>
            <textarea
              class="in arc-raw"
              rows="4"
              :value="block.text"
              spellcheck="false"
              @input="replace(block.id, { text: value($event) })"
            ></textarea>
          </template>
        </div>
      </article>
    </div>

    <MediaDrawer
      :open="mediaOpen"
      title="Scegli un'immagine per il blocco"
      @close="mediaTarget = null"
      @pick="onMediaPick"
    />
  </div>
</template>
