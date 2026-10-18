<script setup lang="ts">
import VIcon from '@/shared/components/VIcon.vue'

defineProps<{
  mode: 'structure' | 'markdown'
  canUndo: boolean
  canRedo: boolean
  previewOpen: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'command', name: string): void
  (e: 'pick-image'): void
  (e: 'toggle-preview'): void
  (e: 'help'): void
}>()

interface Tool {
  name: string
  icon: string
  label: string
  keys?: string
}

const historyTools: Tool[] = [
  { name: 'undo', icon: 'undo', label: 'Annulla', keys: 'Ctrl+Z' },
  { name: 'redo', icon: 'redo', label: 'Ripeti', keys: 'Ctrl+Shift+Z' }
]

const markdownTools: Array<{ group: string; tools: Tool[] }> = [
  {
    group: 'Testo',
    tools: [
      { name: 'bold', icon: 'bold', label: 'Grassetto', keys: 'Ctrl+B' },
      { name: 'italic', icon: 'italic', label: 'Corsivo', keys: 'Ctrl+I' },
      { name: 'strike', icon: 'strike', label: 'Barrato', keys: 'Ctrl+Shift+X' }
    ]
  },
  {
    group: 'Struttura',
    tools: [
      { name: 'h2', icon: 'heading', label: 'Titolo H2' },
      { name: 'h3', icon: 'heading', label: 'Titolo H3' },
      { name: 'list', icon: 'list', label: 'Elenco' },
      { name: 'quote', icon: 'quote', label: 'Citazione' }
    ]
  },
  {
    group: 'Inserisci',
    tools: [
      { name: 'link', icon: 'link', label: 'Link', keys: 'Ctrl+K' },
      { name: 'image', icon: 'image', label: 'Immagine dalla libreria' },
      { name: 'code', icon: 'code', label: 'Blocco codice' },
      { name: 'table', icon: 'table', label: 'Tabella' }
    ]
  }
]
</script>

<template>
  <div class="arc-toolbar">
    <div class="arc-toolbar-group">
      <button
        v-for="tool in historyTools"
        :key="tool.name"
        class="arc-tool"
        type="button"
        :title="tool.label + (tool.keys ? ' (' + tool.keys + ')' : '')"
        :aria-label="tool.label"
        :disabled="tool.name === 'undo' ? !canUndo : !canRedo"
        @click="emit(tool.name as 'undo' | 'redo')"
      >
        <VIcon :name="tool.icon" :size="15" />
      </button>
    </div>

    <template v-if="mode === 'markdown' && !readonly">
      <div v-for="group in markdownTools" :key="group.group" class="arc-toolbar-group">
        <button
          v-for="tool in group.tools"
          :key="tool.name"
          class="arc-tool"
          type="button"
          :title="tool.label + (tool.keys ? ' (' + tool.keys + ')' : '')"
          :aria-label="tool.label"
          @click="tool.name === 'image' ? emit('pick-image') : emit('command', tool.name)"
        >
          <VIcon :name="tool.icon" :size="15" />
        </button>
      </div>
    </template>

    <span class="arc-toolbar-spacer"></span>

    <button
      class="arc-tool"
      type="button"
      :class="{ active: previewOpen }"
      :aria-pressed="previewOpen"
      title="Mostra o nascondi l'anteprima"
      @click="emit('toggle-preview')"
    >
      <VIcon name="eye" :size="15" />
    </button>
    <button class="arc-tool" type="button" title="Scorciatoie da tastiera" @click="emit('help')">
      <VIcon name="keyboard" :size="15" />
    </button>
  </div>
</template>
