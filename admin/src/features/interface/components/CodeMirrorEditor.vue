<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, type KeyBinding } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { html } from '@codemirror/lang-html'
import { yaml } from '@codemirror/lang-yaml'

const props = defineProps<{
  modelValue: string
  mode?: 'markdown' | 'html' | 'yaml'
  readonly?: boolean
  lineNumbers?: boolean
  wordWrap?: boolean
  fontSize?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
}>()

const host = ref<HTMLElement | null>(null)

const lineNumbersComp = new Compartment()
const wrapComp = new Compartment()
const fontSizeComp = new Compartment()
const readonlyComp = new Compartment()

let view: EditorView | null = null
let localUpdate = false

const fontTheme = (size: number) =>
  EditorView.theme({
    '&': { fontSize: size + 'px', height: '100%' },
    '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }
  })

function langFor(mode: string) {
  if (mode === 'html') return html()
  if (mode === 'yaml') return yaml()
  return markdown()
}

const saveBindings: KeyBinding[] = [
  {
    key: 'Mod-s',
    preventDefault: true,
    run: () => {
      emit('save')
      return true
    }
  }
]

function makeState(initial: string) {
  const sync = EditorView.updateListener.of((up) => {
    if (up.docChanged && !localUpdate) {
      emit('update:modelValue', view?.state.doc.toString() ?? initial)
    }
  })
  return EditorState.create({
    doc: initial,
    extensions: [
      lineNumbersComp.of(props.lineNumbers === false ? [] : [lineNumbers()]),
      langFor(props.mode || 'markdown'),
      highlightActiveLine(),
      drawSelection(),
      EditorView.lineWrapping !== undefined
        ? wrapComp.of(props.wordWrap === false ? [] : [EditorView.lineWrapping])
        : wrapComp.of([]),
      fontSizeComp.of(fontTheme(props.fontSize || 13)),
      readonlyComp.of(props.readonly ? [EditorView.editable.of(false)] : []),
      keymap.of(saveBindings),
      sync,
      EditorView.theme({
        '&': { backgroundColor: 'transparent', color: 'inherit' },
        '&.cm-focused': { outline: 'none' }
      })
    ]
  })
}

onMounted(() => {
  if (!host.value) return
  view = new EditorView({ state: makeState(props.modelValue), parent: host.value })
  syncFromProps()
})

function syncFromProps() {
  if (!view) return
  view.dispatch({
    effects: [
      lineNumbersComp.reconfigure(props.lineNumbers === false ? [] : [lineNumbers()]),
      wrapComp.reconfigure(props.wordWrap === false ? [] : [EditorView.lineWrapping]),
      fontSizeComp.reconfigure(fontTheme(props.fontSize || 13)),
      readonlyComp.reconfigure(props.readonly ? [EditorView.editable.of(false)] : [])
    ]
  })
}

watch(
  () => props.modelValue,
  (val) => {
    if (!view) return
    const current = view.state.doc.toString()
    if (val !== current) {
      localUpdate = true
      view.dispatch({ changes: { from: 0, to: current.length, insert: val } })
      localUpdate = false
    }
  }
)

watch(() => [props.lineNumbers, props.wordWrap, props.fontSize, props.readonly], syncFromProps)
watch(
  () => props.mode,
  () => {
    if (!view) return
    const content = view.state.doc.toString()
    localUpdate = true
    view.setState(makeState(content))
    localUpdate = false
  }
)

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>

<template>
  <div ref="host" class="arc-cm-host"></div>
</template>

<style scoped>
.arc-cm-host {
  height: 100%;
  min-height: 200px;
  overflow: auto;
}

.arc-cm-host :deep(.cm-editor) {
  height: 100%;
}

.arc-cm-host :deep(.cm-scroller) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  padding: 8px 0;
}
</style>
