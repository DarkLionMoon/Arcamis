<script setup lang="ts">
/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Pannello del flusso di pubblicazione

   Traduce gli stati di `features/pages/workflow.ts` in controlli:
   cosa è la pagina adesso, chi può farla avanzare, quando esce, e
   chi l'ha chiesta o approvata. Nessuna decisione qui: le azioni
   ammesse arrivano da `availableActions(ruolo, stato)`.
   ════════════════════════════════════════════════════════════════ */

import { computed, ref, watch } from 'vue'

import {
  availableActions,
  formatWhen,
  fromLocalInput,
  isDue,
  scheduleHint,
  statusMeta,
  statusOf,
  toLocalInput,
  validateSchedule,
  type WorkflowAction,
  type WorkflowActionId
} from '@/features/pages/workflow'
import type { PageContent, UserRole } from '@/types'

const props = defineProps<{
  page: PageContent
  role: UserRole
  /** Blocca le azioni mentre si salva o quando la pagina non è salvabile. */
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'action', payload: { id: WorkflowActionId; publishAt?: string; note?: string }): void
}>()

const now = ref(Date.now())
const note = ref('')
const publishAtLocal = ref('')
const scheduleTouched = ref(false)

/* Si riparte dal documento solo quando cambia qualcosa del flusso
   (pagina, stato, data, revisione): un watch profondo azzererebbe la
   nota a ogni battitura nei campi del modello. */
watch(
  () => [props.page.k, props.page.status, props.page.publishAt, props.page.review] as const,
  () => {
    const page = props.page
    now.value = Date.now()
    note.value = page.review?.note || ''
    publishAtLocal.value = toLocalInput(page.publishAt)
    scheduleTouched.value = false
  },
  { immediate: true }
)

const status = computed(() => statusOf(props.page, now.value))
const meta = computed(() => statusMeta(status.value))
const due = computed(() => isDue(props.page, now.value))
const actions = computed<WorkflowAction[]>(() => availableActions(props.role, status.value))

const canSchedule = computed(() => actions.value.some((action) => action.id === 'schedule'))
const scheduleError = computed(() => (scheduleTouched.value ? validateSchedule(fromLocalInput(publishAtLocal.value), now.value)?.message || '' : ''))

const whenText = computed(() => {
  if (status.value === 'scheduled') return `${formatWhen(props.page.publishAt)} (${scheduleHint(props.page, now.value)})`
  if (due.value) return `Data raggiunta: ${formatWhen(props.page.publishAt)}`
  return ''
})

const trail = computed(() => {
  const review = props.page.review
  const rows: Array<{ label: string; value: string }> = []
  if (review?.requestedBy) rows.push({ label: 'In revisione da', value: `${review.requestedBy} · ${formatWhen(review.requestedAt)}` })
  if (review?.reviewedBy) rows.push({ label: 'Revisionata da', value: `${review.reviewedBy} · ${formatWhen(review.reviewedAt)}` })
  return rows
})

function label(action: WorkflowAction): string {
  if (action.id === 'schedule' && status.value === 'scheduled') return 'Riprogramma'
  return action.label
}

function run(action: WorkflowAction): void {
  if (props.disabled) return
  if (action.id === 'schedule') {
    scheduleTouched.value = true
    const publishAt = fromLocalInput(publishAtLocal.value)
    if (validateSchedule(publishAt, now.value)) return
    emit('action', { id: action.id, publishAt, note: note.value })
    return
  }
  emit('action', { id: action.id, note: note.value })
}
</script>

<template>
  <section class="arc-workflow" aria-label="Flusso di pubblicazione">
    <header class="arc-workflow-head">
      <span class="arc-chip" :class="'arc-status-' + status">
        {{ meta.label }}
      </span>
      <span v-if="whenText" class="arc-workflow-when">{{ whenText }}</span>
    </header>

    <p class="arc-field-help">{{ meta.hint }}</p>

    <p v-if="due" class="arc-field-msg is-warning">
      La data è passata e la pagina è pubblica, ma l'ultima build è precedente: menu, sitemap e prerender si allineano al
      prossimo deploy.
    </p>

    <label v-if="canSchedule" class="arc-fld">
      <span>Pubblica il</span>
      <input v-model="publishAtLocal" class="in" type="datetime-local" @change="scheduleTouched = true" />
      <small v-if="scheduleError" class="arc-field-msg is-error">{{ scheduleError }}</small>
      <small v-else class="arc-field-help">
        Alla data indicata la pagina diventa pubblica da sola. Menu, sitemap e prerender si allineano alla build
        successiva.
      </small>
    </label>

    <label class="arc-fld">
      <span>Nota di revisione</span>
      <textarea
        v-model="note"
        class="in"
        rows="2"
        placeholder="Cosa manca, o cosa deve controllare chi riprende il lavoro"
      ></textarea>
      <small class="arc-field-help">Viaggia con l'azione: la legge chi apre la pagina dopo di te.</small>
    </label>

    <div class="arc-workflow-actions">
      <button
        v-for="action in actions"
        :key="action.id"
        class="btn btn-sm"
        type="button"
        :class="action.danger ? 'btn-d' : action.id === 'approve' || action.id === 'publish' ? 'btn-p' : 'btn-soft'"
        :disabled="disabled"
        @click="run(action)"
      >
        {{ label(action) }}
      </button>
      <span v-if="!actions.length" class="arc-field-help">Il tuo ruolo non può cambiare lo stato di questa pagina.</span>
    </div>

    <dl v-if="trail.length" class="arc-workflow-trail">
      <div v-for="row in trail" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
  </section>
</template>
