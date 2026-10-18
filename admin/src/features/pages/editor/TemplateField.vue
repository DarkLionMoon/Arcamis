<script setup lang="ts">
import { computed, ref } from 'vue'

import type { TemplateField } from '@/features/pages/templates/schema'
import type { ValidationIssue } from '@/features/pages/templates/validate'
import VIcon from '@/shared/components/VIcon.vue'

const props = defineProps<{
  field: TemplateField
  modelValue: unknown
  path: string
  draft?: boolean
  issue?: ValidationIssue
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
  (e: 'toggle-draft'): void
  (e: 'pick-media'): void
}>()

const tagInput = ref('')
const isWide = computed(() => props.field.type === 'markdown' || props.field.type === 'image')

/* Il segno «in lavorazione» serve sui campi vuoti: su un campo già
   compilato sarebbe solo rumore su ogni riga del modulo. */
const isEmptyValue = computed(() => {
  const value = props.modelValue
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.every((item) => !String(item).trim())
  return false
})

function textValue(): string {
  return typeof props.modelValue === 'string' ? props.modelValue : String(props.modelValue ?? '')
}

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement | HTMLTextAreaElement).value)
}

function addTag(): void {
  const candidate = tagInput.value.trim()
  if (!candidate) return
  const current = Array.isArray(props.modelValue) ? props.modelValue : []
  if (!current.includes(candidate)) emit('update:modelValue', [...current, candidate])
  tagInput.value = ''
}

function onTagKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag()
    return
  }
  if (event.key === 'Backspace' && !tagInput.value) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : []
    if (current.length) emit('update:modelValue', current.slice(0, -1))
  }
}

function removeTag(index: number): void {
  const current = Array.isArray(props.modelValue) ? props.modelValue : []
  emit(
    'update:modelValue',
    current.filter((_, i) => i !== index)
  )
}

const tags = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

const imagePath = computed(() => textValue())
</script>

<template>
  <div class="arc-field" :class="{ 'arc-field--wide': isWide, 'is-invalid': issue?.severity === 'error' }">
    <div class="arc-field-head">
      <label class="arc-field-label" :for="'f-' + path">
        {{ field.label }}
        <span v-if="field.required" class="arc-required" aria-hidden="true">*</span>
      </label>
      <button
        v-if="isEmptyValue || draft"
        class="arc-draft-toggle"
        :class="{ active: draft }"
        type="button"
        :aria-pressed="draft"
        :title="draft ? 'Rimuovi il segno «in lavorazione»' : 'Segna il campo come in lavorazione'"
        @click="emit('toggle-draft')"
      >
        <VIcon name="eye" :size="13" />
        {{ draft ? 'In lavorazione' : 'Da completare' }}
      </button>
    </div>

    <select v-if="field.type === 'select'" :id="'f-' + path" class="in" :value="textValue()" @change="onInput">
      <option value="">—</option>
      <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>

    <label v-else-if="field.type === 'boolean'" class="arc-check">
      <input type="checkbox" :checked="modelValue === true" @change="emit('update:modelValue', !modelValue)" />
      <span>Attivo</span>
    </label>

    <input
      v-else-if="field.type === 'number'"
      :id="'f-' + path"
      class="in arc-input-number"
      type="number"
      min="0"
      :value="textValue()"
      :placeholder="field.placeholder"
      @input="onInput"
    />

    <div v-else-if="field.type === 'image'" class="arc-media-field">
      <div v-if="imagePath" class="arc-media-thumb">
        <img :src="imagePath" :alt="field.label" loading="lazy" />
      </div>
      <div class="arc-media-controls">
        <input
          :id="'f-' + path"
          class="in"
          :value="imagePath"
          :placeholder="field.placeholder || '/images/immagine.webp'"
          @input="onInput"
        />
        <div class="arc-media-actions">
          <button class="btn btn-soft btn-sm" type="button" @click="emit('pick-media')">
            <VIcon name="media" :size="14" /> Scegli
          </button>
          <button
            v-if="imagePath"
            class="btn btn-soft btn-sm"
            type="button"
            title="Rimuovi immagine"
            @click="emit('update:modelValue', '')"
          >
            <VIcon name="trash" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="field.type === 'tags'" class="arc-tags">
      <span v-for="(tag, index) in tags" :key="tag + index" class="arc-tag">
        {{ tag }}
        <button type="button" :aria-label="'Rimuovi ' + tag" @click="removeTag(index)">
          <VIcon name="close" :size="11" />
        </button>
      </span>
      <input
        :id="'f-' + path"
        v-model="tagInput"
        class="arc-tag-input"
        :placeholder="field.placeholder || 'Aggiungi e premi Invio'"
        @keydown="onTagKeydown"
        @blur="addTag"
      />
    </div>

    <textarea
      v-else-if="field.type === 'markdown'"
      :id="'f-' + path"
      class="in arc-textarea-mono"
      :rows="field.rows || 4"
      :value="textValue()"
      :placeholder="field.placeholder"
      @input="onInput"
    ></textarea>

    <input
      v-else
      :id="'f-' + path"
      class="in"
      :value="textValue()"
      :placeholder="field.placeholder"
      :maxlength="field.maxLength"
      @input="onInput"
    />

    <p v-if="issue" class="arc-field-msg" :class="'is-' + issue.severity">
      {{ issue.message }}
    </p>
    <p v-else-if="field.help" class="arc-field-help">{{ field.help }}</p>
    <p v-if="field.type === 'markdown' && !issue" class="arc-field-hint">
      Markdown · <kbd>Ctrl</kbd>+<kbd>B</kbd> grassetto
    </p>
  </div>
</template>
