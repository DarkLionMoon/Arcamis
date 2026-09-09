<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps<{ content: string; toc?: boolean }>()

declare global {
  interface Window {
    mdRender?: (md: string) => string
    mdToc?: (md: string) => Array<{ id: string; text: string; level: number }>
    DOMPurify?: typeof DOMPurify
  }
}

const loaded = ref(false)

async function ensureRenderer() {
  if (window.mdRender) {
    loaded.value = true
    return
  }
  try {
    const res = await fetch('/scripts/js/md-render.js')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const code = await res.text()
    const script = document.createElement('script')
    script.textContent = code
    document.head.appendChild(script)
    script.remove()
  } catch {
    loaded.value = false
  }
  loaded.value = !!window.mdRender
}

const html = computed(() => {
  if (!window.mdRender) return ''
  let out = window.mdRender(props.content || '')
  if (window.DOMPurify) out = window.DOMPurify.sanitize(out)
  return out
})

const tocItems = computed(() => {
  if (!props.toc || !window.mdToc) return []
  return window.mdToc(props.content || '')
})

watch(loaded, (ok) => {
  /* re-render once the renderer is available */
  void ok
})

ensureRenderer()
</script>

<template>
  <div class="arc-md-preview">
    <div v-if="!loaded" class="arc-empty-side">Preparazione anteprima…</div>
    <template v-else>
      <nav v-if="tocItems.length" class="arc-md-toc">
        <a v-for="t in tocItems" :key="t.id" :href="'#' + t.id">{{ t.text }}</a>
      </nav>
      <div class="n-content" v-html="html"></div>
    </template>
  </div>
</template>

<style scoped>
.arc-md-preview {
  height: 100%;
  overflow: auto;
  padding: 16px 20px;
  line-height: 1.6;
}

.arc-md-toc {
  position: sticky;
  top: 0;
  background: var(--panel, #10141c);
  border: 1px solid var(--border, #1d2430);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  z-index: 2;
}

.arc-md-toc a {
  color: inherit;
  opacity: 0.75;
  text-decoration: none;
}

.arc-md-toc a:hover {
  opacity: 1;
  color: #e6c471;
}
</style>
