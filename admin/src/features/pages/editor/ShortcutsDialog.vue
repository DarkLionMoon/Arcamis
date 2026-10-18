<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

import VIcon from '@/shared/components/VIcon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const groups: Array<{ title: string; items: Array<{ keys: string[]; label: string }> }> = [
  {
    title: 'Salvataggio e navigazione',
    items: [
      { keys: ['Ctrl', 'S'], label: 'Salva la pagina' },
      { keys: ['Ctrl', 'K'], label: 'Ricerca globale nel pannello' },
      { keys: ['Esc'], label: 'Chiude dialoghi e cassetti' }
    ]
  },
  {
    title: 'Formattazione markdown',
    items: [
      { keys: ['Ctrl', 'B'], label: 'Grassetto' },
      { keys: ['Ctrl', 'I'], label: 'Corsivo' },
      { keys: ['Ctrl', 'Shift', 'X'], label: 'Barrato' },
      { keys: ['Ctrl', 'K'], label: 'Link sulla selezione' },
      { keys: ['Ctrl', 'Z'], label: 'Annulla' },
      { keys: ['Ctrl', 'Shift', 'Z'], label: 'Ripeti' },
      { keys: ['Tab'], label: 'Indenta la riga' }
    ]
  },
  {
    title: 'Moduli strutturati',
    items: [
      { keys: ['Tab'], label: 'Campo successivo' },
      { keys: ['Invio'], label: 'Aggiunge il tag scritto' },
      { keys: ['Backspace'], label: 'Rimuove l’ultimo tag a campo vuoto' }
    ]
  }
]

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  }
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="open" class="arc-modal-backdrop" @click.self="emit('close')">
    <div class="arc-modal arc-shortcuts" role="dialog" aria-modal="true" aria-label="Scorciatoie da tastiera">
      <header class="arc-modal-head">
        <h2 class="arc-modal-title">Scorciatoie da tastiera</h2>
        <button class="arc-icon-btn" type="button" aria-label="Chiudi" @click="emit('close')">
          <VIcon name="close" :size="16" />
        </button>
      </header>
      <div v-for="group in groups" :key="group.title" class="arc-shortcuts-group">
        <h3>{{ group.title }}</h3>
        <dl>
          <div v-for="item in group.items" :key="item.label" class="arc-shortcut-row">
            <dt>
              <kbd v-for="(key, index) in item.keys" :key="key"
                >{{ key }}<span v-if="index < item.keys.length - 1">+</span></kbd
              >
            </dt>
            <dd>{{ item.label }}</dd>
          </div>
        </dl>
      </div>
      <p class="arc-hint">Su macOS usa ⌘ al posto di Ctrl.</p>
    </div>
  </div>
</template>
