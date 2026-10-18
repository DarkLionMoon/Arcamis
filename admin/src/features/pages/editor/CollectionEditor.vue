<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { interpolateHeading } from '@/features/pages/templates/compile'
import { itemFieldPath, type FieldValue, type TemplateCollection } from '@/features/pages/templates/schema'
import type { ValidationIssue } from '@/features/pages/templates/validate'
import TemplateField from './TemplateField.vue'
import VIcon from '@/shared/components/VIcon.vue'

const props = defineProps<{
  collection: TemplateCollection
  items: Array<Record<string, FieldValue>>
  drafts: string[]
  issueMap: Record<string, ValidationIssue>
  disabled?: boolean
  /** Indici da mostrare quando il filtro di TemplateForm è attivo; `null` = tutti. */
  visible?: number[] | null
}>()

const emit = defineEmits<{
  (e: 'update', path: string, value: FieldValue): void
  (e: 'toggle-draft', path: string): void
  (e: 'add'): void
  (e: 'remove', index: number): void
  (e: 'move', from: number, to: number): void
  (e: 'pick-media', path: string): void
}>()

const open = ref<Set<number>>(new Set([0]))
const lastCount = ref(props.items.length)

watch(
  () => props.items.length,
  (count) => {
    if (count > lastCount.value) {
      open.value = new Set([...open.value, count - 1])
    } else if (count < lastCount.value) {
      open.value = new Set([...open.value].filter((index) => index < count))
    }
    lastCount.value = count
  }
)

/* Una scheda con errori si apre da sola: l'errore deve essere visibile,
   non nascosto in una card chiusa. */
watch(
  () => props.issueMap,
  (map) => {
    const next = new Set(open.value)
    for (const path of Object.keys(map)) {
      const parts = path.split('.')
      if (parts[0] === 'collections' && parts[1] === props.collection.key && parts[2]) {
        next.add(Number(parts[2]))
      }
    }
    open.value = next
  },
  { deep: true }
)

function isOpen(index: number): boolean {
  return open.value.has(index)
}

function toggle(index: number): void {
  const next = new Set(open.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  open.value = next
}

function pathFor(index: number, key: string): string {
  return itemFieldPath(props.collection.key, index, key)
}

function titleOf(record: Record<string, FieldValue>, index: number): string {
  const title = interpolateHeading(props.collection.item.heading, props.collection.fields, record)
  return title || `Nuova ${props.collection.singular} ${index + 1}`
}

function issueFor(index: number, key: string): ValidationIssue | undefined {
  return props.issueMap[pathFor(index, key)]
}

function itemDraftCount(index: number): number {
  const prefix = `collections.${props.collection.key}.${index}.`
  return props.drafts.filter((path) => path.startsWith(prefix)).length
}

function itemErrorCount(index: number): number {
  const prefix = `collections.${props.collection.key}.${index}.`
  return Object.values(props.issueMap).filter(
    (issue) => issue.severity === 'error' && issue.path.startsWith(prefix)
  ).length
}

const totalErrors = computed(() => Object.values(props.issueMap).filter((issue) => issue.severity === 'error').length)

/* Il filtro agisce sull'indice: le schede nascoste restano nei dati e la
   numerazione non cambia, così gli errori restano ancorati alla scheda giusta. */
const shownItems = computed(() => {
  const indexes =
    props.visible === null || props.visible === undefined
      ? props.items.map((_, index) => index)
      : props.visible.filter((index) => index < props.items.length)
  return indexes.map((index) => ({ index, record: props.items[index] }))
})
</script>

<template>
  <section class="arc-collection">
    <header class="arc-collection-head">
      <div>
        <h2 class="arc-collection-title">
          {{ collection.label }}
          <span class="arc-collection-count">{{ items.length }}</span>
        </h2>
        <p v-if="collection.description" class="arc-collection-desc">{{ collection.description }}</p>
      </div>
      <div class="arc-collection-actions">
        <button
          class="btn btn-soft btn-sm"
          type="button"
          :disabled="disabled || (collection.max !== undefined && items.length >= collection.max)"
          @click="emit('add')"
        >
          <VIcon name="plus" :size="14" /> Aggiungi {{ collection.singular }}
        </button>
      </div>
    </header>

    <p v-if="!items.length" class="arc-collection-empty">
      Nessuna scheda: aggiungi la prima {{ collection.singular }} per iniziare.
    </p>
    <p v-else-if="!shownItems.length" class="arc-collection-empty">
      Nessuna scheda corrisponde al filtro.
    </p>

    <article
      v-for="{ index, record } in shownItems"
      :key="index"
      class="arc-item"
      :class="{ 'is-open': isOpen(index) }"
    >
      <header class="arc-item-head" @click="toggle(index)">
        <span class="arc-item-index">{{ index + 1 }}</span>
        <span class="arc-item-title">{{ titleOf(record, index) }}</span>
        <span v-if="itemDraftCount(index)" class="arc-item-badge is-draft">
          <VIcon name="eye" :size="12" /> {{ itemDraftCount(index) }} in lavorazione
        </span>
        <span v-if="itemErrorCount(index)" class="arc-item-badge is-error">
          <VIcon name="alert" :size="12" /> {{ itemErrorCount(index) }}
        </span>
        <span class="arc-item-tools">
          <button
            class="arc-icon-btn"
            type="button"
            title="Sposta su"
            :disabled="index === 0 || disabled"
            @click.stop="emit('move', index, index - 1)"
          >
            <VIcon name="up" :size="14" />
          </button>
          <button
            class="arc-icon-btn"
            type="button"
            title="Sposta giù"
            :disabled="index === items.length - 1 || disabled"
            @click.stop="emit('move', index, index + 1)"
          >
            <VIcon name="down" :size="14" />
          </button>
          <button
            class="arc-icon-btn is-danger"
            type="button"
            :title="'Elimina ' + collection.singular"
            :disabled="disabled"
            @click.stop="emit('remove', index)"
          >
            <VIcon name="trash" :size="14" />
          </button>
          <button class="arc-icon-btn" type="button" :aria-expanded="isOpen(index)" @click.stop="toggle(index)">
            <VIcon :name="isOpen(index) ? 'down' : 'chevron'" :size="14" />
          </button>
        </span>
      </header>

      <div v-if="isOpen(index)" class="arc-item-body">
        <TemplateField
          v-for="field in collection.fields"
          :key="field.key"
          :field="field"
          :model-value="record[field.key]"
          :path="pathFor(index, field.key)"
          :draft="drafts.includes(pathFor(index, field.key))"
          :issue="issueFor(index, field.key)"
          @update:model-value="emit('update', pathFor(index, field.key), $event)"
          @toggle-draft="emit('toggle-draft', pathFor(index, field.key))"
          @pick-media="emit('pick-media', pathFor(index, field.key))"
        />
        <p v-if="totalErrors > 0 && itemErrorCount(index)" class="arc-item-footnote">
          Correggi i campi segnati in rosso prima di salvare.
        </p>
      </div>
    </article>
  </section>
</template>
