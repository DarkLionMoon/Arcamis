<script setup lang="ts">
import { computed, ref } from 'vue'

import { isBlank } from '@/features/pages/templates/compile'
import {
  itemFieldPath,
  pageFieldPath,
  type FieldValue,
  type PageTemplate,
  type TemplateData,
  /* Alias: `TemplateField` è anche il nome del componente di campo. */
  type TemplateField as TemplateFieldDef
} from '@/features/pages/templates/schema'
import type { ValidationIssue } from '@/features/pages/templates/validate'
import VIcon from '@/shared/components/VIcon.vue'
import CollectionEditor from './CollectionEditor.vue'
import TemplateField from './TemplateField.vue'

const props = defineProps<{
  template: PageTemplate
  data: TemplateData
  drafts: string[]
  issues: ValidationIssue[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', path: string, value: FieldValue): void
  (e: 'toggle-draft', path: string): void
  (e: 'pick-media', path: string): void
  (e: 'add-item', collection: string): void
  (e: 'remove-item', collection: string, index: number): void
  (e: 'move-item', collection: string, from: number, to: number): void
}>()

/* Un solo errore visibile per campo: prima il bloccante, poi l'avviso. */
const issueMap = computed<Record<string, ValidationIssue>>(() => {
  const map: Record<string, ValidationIssue> = {}
  for (const issue of props.issues) {
    if (!issue.path) continue
    const existing = map[issue.path]
    if (!existing || (existing.severity === 'warning' && issue.severity === 'error')) map[issue.path] = issue
  }
  return map
})

function draftOf(path: string): boolean {
  return props.drafts.includes(path)
}

/* ─────────────── Filtro rapido ───────────────
   Un modello può avere decine di campi: la ricerca serve a saltare a quello
   giusto senza scorrere. Il filtro è solo di visualizzazione e non nasconde
   mai nulla in silenzio: il conteggio dice quanti campi restano fuori. */
const query = ref('')
const onlyMissing = ref(false)

function matchesField(field: TemplateFieldDef, value: FieldValue, issue?: ValidationIssue): boolean {
  if (onlyMissing.value) {
    return isBlank(value) || Boolean(issue) || draftOf(field.key)
  }
  const needle = query.value.trim().toLowerCase()
  if (!needle) return true
  const haystack = [field.label, field.help, field.placeholder, field.key, String(value ?? '')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}

const visiblePageFields = computed(() =>
  props.template.page.fields.filter((field) =>
    matchesField(field, props.data.fields[field.key], issueMap.value[pageFieldPath(field.key)])
  )
)

const visibleItems = computed<Record<string, number[]>>(() => {
  const result: Record<string, number[]> = {}
  for (const collection of props.template.collections) {
    const items = props.data.collections[collection.key] || []
    const index = items
      .map((_, position) => position)
      .filter((position) => {
        const record = items[position]
        if (!query.value.trim() && !onlyMissing.value) return true
        return collection.fields.some((field) =>
          matchesField(field, record[field.key], issueMap.value[itemFieldPath(collection.key, position, field.key)])
        )
      })
    if (index.length) result[collection.key] = index
  }
  return result
})

const hiddenCount = computed(() => {
  let hidden = props.template.page.fields.length - visiblePageFields.value.length
  for (const collection of props.template.collections) {
    const total = (props.data.collections[collection.key] || []).length
    hidden += total - (visibleItems.value[collection.key]?.length ?? 0)
  }
  return hidden
})

const filtering = computed(() => Boolean(query.value.trim()) || onlyMissing.value)

/** Primo campo che blocca il salvataggio: ci si arriva anche da qui. */
const firstErrorPath = computed(() => {
  const issues = props.issues.filter((issue) => issue.severity === 'error' && issue.path)
  for (const issue of issues) if (document.getElementById('f-' + issue.path)) return issue.path
  return ''
})

function goToFirstError(): void {
  const path = firstErrorPath.value
  if (!path) return
  const element = document.getElementById('f-' + path) as HTMLElement | null
  element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  element?.focus?.()
}
</script>

<template>
  <div class="arc-template-form">
    <div class="arc-form-filter">
      <span class="arc-form-filter-search">
        <VIcon name="search" :size="14" />
        <input v-model="query" class="in" type="search" placeholder="Cerca un campo…" aria-label="Cerca un campo del modello" />
      </span>
      <button
        class="btn btn-soft btn-sm"
        type="button"
        :aria-pressed="onlyMissing"
        :class="{ 'is-active': onlyMissing }"
        title="Mostra solo i campi da completare"
        @click="onlyMissing = !onlyMissing"
      >
        <VIcon name="eye" :size="14" /> Solo da completare
      </button>
      <span class="arc-toolbar-spacer"></span>
      <span v-if="filtering" class="arc-form-filter-count">
        {{ hiddenCount }} camp{{ hiddenCount === 1 ? 'o' : 'i' }} nascost{{ hiddenCount === 1 ? 'o' : 'i' }}
        <button class="arc-link" type="button" @click="query = ''; onlyMissing = false">azzera filtro</button>
      </span>
      <button v-if="firstErrorPath" class="btn btn-d btn-sm" type="button" title="Vai al primo campo da correggere" @click="goToFirstError">
        <VIcon name="alert" :size="14" /> Primo errore
      </button>
    </div>

    <section v-if="template.page.fields.length" class="arc-form-card">
      <header class="arc-form-card-head">
        <h2 class="arc-form-card-title">{{ template.label }}</h2>
        <p class="arc-form-card-sub">{{ template.description }}</p>
      </header>
      <div class="arc-form-grid">
        <TemplateField
          v-for="field in visiblePageFields"
          :key="field.key"
          :field="field"
          :model-value="data.fields[field.key]"
          :path="pageFieldPath(field.key)"
          :draft="draftOf(pageFieldPath(field.key))"
          :issue="issueMap[pageFieldPath(field.key)]"
          @update:model-value="emit('update', pageFieldPath(field.key), $event)"
          @toggle-draft="emit('toggle-draft', pageFieldPath(field.key))"
          @pick-media="emit('pick-media', pageFieldPath(field.key))"
        />
      </div>
    </section>

    <CollectionEditor
      v-for="collection in template.collections"
      :key="collection.key"
      :collection="collection"
      :items="data.collections[collection.key] || []"
      :visible="filtering ? visibleItems[collection.key] || [] : null"
      :drafts="drafts"
      :issue-map="issueMap"
      :disabled="disabled"
      @update="(path, value) => emit('update', path, value)"
      @toggle-draft="(path) => emit('toggle-draft', path)"
      @pick-media="(path) => emit('pick-media', path)"
      @add="emit('add-item', collection.key)"
      @remove="(index) => emit('remove-item', collection.key, index)"
      @move="(from, to) => emit('move-item', collection.key, from, to)"
    />
  </div>
</template>
