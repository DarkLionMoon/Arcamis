<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useUIStore } from '@/app/store'
import {
  BUILT_IN_TEMPLATES,
  allTemplates,
  importTemplateText,
  removeCustomTemplate,
  type PageTemplate
} from '@/features/pages/templates'
import { confirmAction } from '@/shared/confirm'
import VIcon from '@/shared/components/VIcon.vue'
import type { SectionRegistryEntry } from '@/types'

const props = defineProps<{
  open: boolean
  mode?: 'create' | 'apply'
  existingKeys?: string[]
  sections?: SectionRegistryEntry[]
  currentTemplateId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', payload: { templateId: string | null; title: string; key: string; icon: string; section: string }): void
  (e: 'apply', templateId: string): void
}>()

const ui = useUIStore()
const step = ref<'pick' | 'details'>('pick')
const selected = ref<PageTemplate | null>(null)
const form = ref({ title: '', key: '', icon: '📄', section: '' })
const importOpen = ref(false)
const importText = ref('')
const importError = ref('')
const version = ref(0)

const templates = computed(() => {
  /* `version` forza il ricalcolo dopo import/rimozione di un modello. */
  void version.value
  return allTemplates()
})

const customIds = computed(
  () => new Set(templates.value.filter((tpl) => !BUILT_IN_TEMPLATES.includes(tpl)).map((tpl) => tpl.id))
)

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const keyError = computed(() => {
  const key = form.value.key.trim()
  if (!key) return ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) return 'Solo minuscole, numeri e trattini.'
  if ((props.existingKeys || []).includes(key)) return 'Esiste già una pagina con questa chiave.'
  return ''
})

const titleError = computed(() => (form.value.title.trim() ? '' : 'Il titolo è obbligatorio.'))

watch(
  () => props.open,
  (open) => {
    if (!open) return
    step.value = 'pick'
    selected.value = null
    importOpen.value = false
    importText.value = ''
    importError.value = ''
    form.value = { title: '', key: '', icon: '📄', section: '' }
  }
)

function choose(template: PageTemplate | null): void {
  if (props.mode === 'apply') {
    if (template) emit('apply', template.id)
    emit('close')
    return
  }
  selected.value = template
  form.value = {
    title: '',
    key: '',
    icon: template?.icon || '📄',
    section: ''
  }
  step.value = 'details'
}

function suggestKey(): void {
  if (form.value.key.trim()) return
  form.value.key = slugify(form.value.title)
}

function submit(): void {
  suggestKey()
  if (titleError.value || keyError.value) {
    ui.toast(titleError.value || keyError.value, 'error')
    return
  }
  emit('create', {
    templateId: selected.value?.id ?? null,
    title: form.value.title.trim(),
    key: form.value.key.trim() || slugify(form.value.title),
    icon: form.value.icon.trim() || '📄',
    section: form.value.section
  })
}

function importTemplate(): void {
  importError.value = ''
  try {
    const template = importTemplateText(importText.value)
    version.value++
    importText.value = ''
    importOpen.value = false
    ui.toast(`Modello «${template.label}» importato`, 'success')
  } catch (e) {
    importError.value = e instanceof Error ? e.message : String(e)
  }
}

async function removeCustom(template: PageTemplate, event: MouseEvent): Promise<void> {
  event.stopPropagation()
  const ok = await confirmAction({
    title: 'Elimina modello personalizzato',
    message: `Rimuovere «${template.label}» dai modelli salvati?`,
    detail: 'Le pagine che lo usano restano intatte: il markdown è già compilato.',
    confirmLabel: 'Rimuovi modello',
    danger: true
  })
  if (!ok) return
  removeCustomTemplate(template.id)
  version.value++
  if (selected.value?.id === template.id) step.value = 'pick'
}
</script>

<template>
  <div v-if="open" class="arc-modal-backdrop" @click.self="emit('close')">
    <div class="arc-modal arc-picker" role="dialog" aria-modal="true" aria-label="Modelli di pagina">
      <header class="arc-modal-head">
        <div>
          <h2 class="arc-modal-title">{{ mode === 'apply' ? 'Cambia modello' : 'Nuova pagina' }}</h2>
          <p class="arc-hint">
            {{
              mode === 'apply'
                ? 'Il testo attuale viene reimportato nei campi del modello scelto.'
                : 'Parti da un modello: i campi sono già quelli che il sito sa rendere.'
            }}
          </p>
        </div>
        <button class="arc-icon-btn" type="button" aria-label="Chiudi" @click="emit('close')">
          <VIcon name="close" :size="16" />
        </button>
      </header>

      <div v-if="step === 'pick'" class="arc-picker-grid">
        <button
          v-for="template in templates"
          :key="template.id"
          class="arc-template-card"
          :class="{ 'is-current': template.id === currentTemplateId }"
          type="button"
          @click="choose(template)"
        >
          <span class="arc-template-icon">{{ template.icon }}</span>
          <span class="arc-template-name">{{ template.label }}</span>
          <span class="arc-template-desc">{{ template.description }}</span>
          <span class="arc-template-meta">
            {{ template.collections[0]?.label || 'Campi' }} · layout {{ template.layout }}
            <span v-if="customIds.has(template.id)" class="arc-template-custom">personalizzato</span>
          </span>
          <button
            v-if="customIds.has(template.id)"
            class="arc-icon-btn is-danger arc-template-remove"
            type="button"
            title="Elimina modello personalizzato"
            @click="removeCustom(template, $event)"
          >
            <VIcon name="trash" :size="13" />
          </button>
        </button>

        <button v-if="mode === 'create'" class="arc-template-card is-free" type="button" @click="choose(null)">
          <span class="arc-template-icon">📝</span>
          <span class="arc-template-name">Pagina libera</span>
          <span class="arc-template-desc">Solo markdown, senza campi: per appunti, note o pagine fuori standard.</span>
          <span class="arc-template-meta">Editor completo · nessun modello</span>
        </button>
      </div>

      <div v-else class="arc-picker-detail">
        <div class="arc-picker-preview">
          <span class="arc-template-icon">
            {{ selected?.icon || '📝' }}
          </span>
          <div>
            <strong>{{ selected?.label || 'Pagina libera' }}</strong>
            <p>{{ selected?.description || 'Nessun modello: scrivi in markdown.' }}</p>
          </div>
        </div>

        <div class="arc-form-grid">
          <label class="arc-fld">
            <span>Titolo</span>
            <input v-model="form.title" class="in" placeholder="Il nome che vedranno i lettori" @blur="suggestKey" />
            <small v-if="titleError" class="arc-field-msg is-error">{{ titleError }}</small>
          </label>
          <label class="arc-fld">
            <span>Chiave URL</span>
            <input v-model="form.key" class="in" :placeholder="slugify(form.title) || 'la-mia-pagina'" />
            <small v-if="keyError" class="arc-field-msg is-error">{{ keyError }}</small>
            <small v-else class="arc-field-help">Nome del file in content/pages e slug della rotta.</small>
          </label>
          <label class="arc-fld">
            <span>Icona</span>
            <input v-model="form.icon" class="in" maxlength="4" />
          </label>
          <label class="arc-fld">
            <span>Sezione</span>
            <select v-model="form.section" class="in">
              <option value="">— nessuna —</option>
              <option v-for="section in sections || []" :key="section.v" :value="section.v">{{ section.l }}</option>
            </select>
          </label>
        </div>

        <div class="arc-form-actions">
          <button class="btn btn-soft btn-sm" type="button" @click="step = 'pick'">← Modelli</button>
          <span style="flex: 1"></span>
          <button class="btn btn-p" type="button" @click="submit">Crea pagina</button>
        </div>
      </div>

      <details
        v-if="mode === 'create'"
        class="arc-picker-import"
        :open="importOpen"
        @toggle="importOpen = ($event.target as HTMLDetailsElement).open"
      >
        <summary><VIcon name="code" :size="14" /> Importa un modello JSON</summary>
        <p class="arc-hint">
          Incolla un modello con lo stesso formato di quelli built-in (campi, collezioni, sezioni). Viene validato prima
          di essere salvato.
        </p>
        <textarea
          v-model="importText"
          class="in arc-textarea-mono"
          rows="6"
          placeholder='{ "version": 1, "id": … }'
        ></textarea>
        <p v-if="importError" class="arc-field-msg is-error">{{ importError }}</p>
        <button class="btn btn-soft btn-sm" type="button" :disabled="!importText.trim()" @click="importTemplate">
          Importa modello
        </button>
      </details>
    </div>
  </div>
</template>
