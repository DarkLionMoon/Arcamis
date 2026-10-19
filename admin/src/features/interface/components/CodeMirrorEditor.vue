<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Compartment, EditorSelection, EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, type KeyBinding } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab, redo, undo } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { html } from '@codemirror/lang-html'
import { yaml } from '@codemirror/lang-yaml'

import {
  insertImage,
  insertLink,
  insertSnippet,
  toggleLinePrefix,
  wrapSelection,
  type EditResult,
  type EditState
} from '@/shared/markdownCommands'
import type { CodeMirrorHandle } from './codemirrorHandle'

const props = defineProps<{
  modelValue: string
  mode?: 'markdown' | 'html' | 'yaml'
  readonly?: boolean
  lineNumbers?: boolean
  wordWrap?: boolean
  fontSize?: number
  ariaLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
  (e: 'request-link'): void
  (e: 'drop-files', files: File[]): void
  (e: 'wiki-suggest', suggest: { query: string; x: number; y: number } | null): void
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
    '.cm-content': { fontFamily: 'var(--afont-mono, ui-monospace, monospace)' },
    '.cm-line': { padding: '0 2px' }
  })

function langFor(mode: string) {
  if (mode === 'html') return html()
  if (mode === 'yaml') return yaml()
  return markdown()
}

function selectionState(): EditState | null {
  if (!view) return null
  const range = view.state.selection.main
  return { text: view.state.doc.toString(), from: range.from, to: range.to }
}

/** Applica il risultato di un comando puro: testo + nuova selezione. */
function apply(result: EditResult): void {
  if (!view) return
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: result.text },
    selection: EditorSelection.range(result.from, result.to),
    scrollIntoView: true
  })
  view.focus()
}

function run(command: (state: EditState) => EditResult): boolean {
  const state = selectionState()
  if (!state) return false
  apply(command(state))
  return true
}

const shortcuts: KeyBinding[] = [
  {
    key: 'Mod-s',
    preventDefault: true,
    run: () => {
      emit('save')
      return true
    }
  },
  { key: 'Mod-b', preventDefault: true, run: () => run((state) => wrapSelection(state, '**', 'grassetto')) },
  { key: 'Mod-i', preventDefault: true, run: () => run((state) => wrapSelection(state, '*', 'corsivo')) },
  { key: 'Mod-Shift-x', preventDefault: true, run: () => run((state) => wrapSelection(state, '~~', 'barrato')) },
  { key: 'Mod-Shift-7', run: () => run((state) => toggleLinePrefix(state, '1. ')) },
  {
    key: 'Mod-k',
    preventDefault: true,
    run: () => {
      emit('request-link')
      return true
    }
  },
  {
    key: 'Escape',
    run: () => {
      emit('wiki-suggest', null)
      return false
    }
  }
]

function makeState(initial: string) {
  const sync = EditorView.updateListener.of((up) => {
    if (up.docChanged && !localUpdate) {
      emit('update:modelValue', view?.state.doc.toString() ?? initial)
      /* Suggerimento `[[Pagina`: cerca il marcatore prima del cursore. */
      const pos = up.state.selection.main.head
      const before = up.state.sliceDoc(Math.max(0, pos - 60), pos)
      const m = before.match(/\[\[([^\]\n]*)$/)
      if (!m) {
        emit('wiki-suggest', null)
        return
      }
      let x = 0
      let y = 0
      try {
        const coords = view?.coordsAtPos(pos)
        if (coords) {
          x = coords.left
          y = coords.bottom
        }
      } catch {
        /* caret non misurabile: il menu appare in alto */
      }
      emit('wiki-suggest', { query: m[1], x, y })
    }
  })
  /* Drag-and-drop di immagini dal desktop: l'upload lo fa la vista. */
  const dropFiles = EditorView.domEventHandlers({
    dragover(e) {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) e.preventDefault()
    },
    drop(e) {
      const files = e.dataTransfer ? Array.from(e.dataTransfer.files || []) : []
      const images = files.filter((f) => f.type.startsWith('image/'))
      if (!images.length) return
      e.preventDefault()
      emit('drop-files', images)
    }
  })
  return EditorState.create({
    doc: initial,
    extensions: [
      lineNumbersComp.of(props.lineNumbers === false ? [] : [lineNumbers()]),
      langFor(props.mode || 'markdown'),
      highlightActiveLine(),
      drawSelection(),
      history(),
      EditorView.contentAttributes.of({
        'aria-label': props.ariaLabel || 'Contenuto markdown',
        spellcheck: 'true'
      }),
      wrapComp.of(props.wordWrap === false ? [] : [EditorView.lineWrapping]),
      fontSizeComp.of(fontTheme(props.fontSize || 13)),
      readonlyComp.of(props.readonly ? [EditorView.editable.of(false)] : []),
      keymap.of([...shortcuts, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      sync,
      dropFiles,
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

const handle: CodeMirrorHandle = {
  focus() {
    view?.focus()
  },
  wrap(marker, placeholder) {
    run((state) => wrapSelection(state, marker, placeholder))
  },
  prefix(prefix) {
    run((state) => toggleLinePrefix(state, prefix))
  },
  insertLink(url) {
    run((state) => insertLink(state, url))
  },
  insertImage(path, alt) {
    run((state) => insertImage(state, path, alt))
  },
  insertSnippet(text) {
    run((state) => insertSnippet(state, text))
  },
  replaceWikiLink(label, path) {
    if (!view) return
    const pos = view.state.selection.main.head
    const before = view.state.sliceDoc(Math.max(0, pos - 60), pos)
    const m = before.match(/\[\[([^\]\n]*)$/)
    if (!m) {
      run((state) => insertLink(state, path, label))
      return
    }
    const from = pos - m[0].length
    const snippet = `[${label}](${path})`
    view.dispatch({
      changes: { from, to: pos, insert: snippet },
      selection: EditorSelection.cursor(from + snippet.length),
      scrollIntoView: true
    })
    view.focus()
  },
  undo() {
    if (view) undo(view)
  },
  redo() {
    if (view) redo(view)
  },
  selectedText() {
    if (!view) return ''
    const range = view.state.selection.main
    return view.state.sliceDoc(range.from, range.to)
  },
  revealLine(line) {
    if (!view) return
    const target = Math.min(Math.max(line, 0), view.state.doc.lines - 1)
    const info = view.state.doc.line(target + 1)
    view.dispatch({
      selection: EditorSelection.cursor(info.from),
      effects: EditorView.scrollIntoView(info.from, { y: 'center' })
    })
    view.focus()
  }
}

defineExpose<CodeMirrorHandle>(handle)
</script>

<template>
  <div ref="host" class="arc-cm-host"></div>
</template>

<style scoped>
.arc-cm-host {
  height: 100%;
  min-height: 160px;
  overflow: auto;
  background: var(--asurface);
}

.arc-cm-host :deep(.cm-editor) {
  height: 100%;
}

.arc-cm-host :deep(.cm-scroller) {
  padding: 10px 0 60px;
  line-height: 1.65;
}

.arc-cm-host :deep(.cm-gutters) {
  background: var(--asurface);
  border-right: 1px solid var(--aline);
  color: var(--afg-3);
}

.arc-cm-host :deep(.cm-activeLine) {
  background: var(--asurface-2);
}

.arc-cm-host :deep(.cm-selectionBackground),
.arc-cm-host :deep(.cm-editor.cm-focused .cm-selectionBackground) {
  background: var(--accent-soft);
}
</style>
