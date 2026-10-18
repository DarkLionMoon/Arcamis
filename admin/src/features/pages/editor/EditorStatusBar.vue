<script setup lang="ts">
import { computed } from 'vue'

import VIcon from '@/shared/components/VIcon.vue'

const props = defineProps<{
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: string | null
  dirty: boolean
  words: number
  chars: number
  errors: number
  warnings: number
  drafts: number
  filled: number
  total: number
  autosave: boolean
}>()

const emit = defineEmits<{ (e: 'toggle-autosave'): void }>()

const savedLabel = computed(() => {
  if (props.saveState === 'saving') return 'Salvataggio…'
  if (props.saveState === 'error') return 'Salvataggio non riuscito'
  if (props.dirty) return 'Modifiche non salvate'
  if (!props.lastSavedAt) return 'Nessun salvataggio'
  const date = new Date(props.lastSavedAt)
  if (Number.isNaN(date.getTime())) return 'Tutte le modifiche salvate'
  return `Salvato ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
})

const stateClass = computed(() => {
  if (props.saveState === 'saving') return 'is-saving'
  if (props.saveState === 'error') return 'is-error'
  if (props.dirty) return 'is-dirty'
  return 'is-saved'
})

const completion = computed(() => (props.total ? Math.round((props.filled / props.total) * 100) : 100))
</script>

<template>
  <footer class="arc-statusbar">
    <span class="arc-status-state" :class="stateClass">
      <span class="arc-dot"></span>
      {{ savedLabel }}
    </span>

    <span class="arc-status-sep"></span>
    <span>{{ words }} parole</span>
    <span>{{ chars }} caratteri</span>

    <span v-if="total" class="arc-status-sep"></span>
    <span v-if="total" class="arc-status-progress" :title="`${filled} campi compilati su ${total}`">
      {{ filled }}/{{ total }} campi · {{ completion }}%
    </span>

    <span class="arc-status-sep"></span>
    <span v-if="errors" class="arc-status-issue is-error">
      <VIcon name="alert" :size="13" /> {{ errors }} da correggere
    </span>
    <span v-if="warnings" class="arc-status-issue is-warn">
      <VIcon name="alert" :size="13" /> {{ warnings }} avvisi
    </span>
    <span v-if="drafts" class="arc-status-issue is-draft">
      <VIcon name="eye" :size="13" /> {{ drafts }} in lavorazione
    </span>
    <span v-if="!errors && !warnings && !drafts" class="arc-status-issue is-ok">
      <VIcon name="check" :size="13" /> nessun problema
    </span>

    <span class="arc-toolbar-spacer"></span>

    <label class="arc-status-autosave" title="Salva automaticamente ogni 15 secondi">
      <input type="checkbox" :checked="autosave" @change="emit('toggle-autosave')" />
      autosave
    </label>
  </footer>
</template>
