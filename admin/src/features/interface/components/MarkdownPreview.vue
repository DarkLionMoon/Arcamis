<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DOMPurify from 'dompurify'

/* Lo stesso renderer del sito pubblico, importato dal sorgente della wiki:
   l'anteprima non può divergere da ciò che i lettori vedranno. Prima veniva
   scaricato da /scripts/js/md-render.js, che in produzione non esiste più
   (la build genera nomi con hash) e l'anteprima restava su «Preparazione…». */
// @ts-expect-error modulo JS puro della wiki, privo di dichiarazioni di tipo
import '../../../../../scripts/js/md-render.js'

const props = defineProps<{ content: string; toc?: boolean }>()

declare global {
  interface Window {
    mdRender?: (md: string) => string
    mdToc?: (md: string) => Array<{ id: string; text: string; level: number }>
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'sezione'
}

interface TocItem {
  id: string
  text: string
  level: number
}

/* `mdRender` non emette id sui titoli e `mdToc` restituisce solo testo e
   livello: il sommario finiva per puntare a `#undefined`. Gli id vengono
   quindi assegnati qui, dopo la sanitizzazione, e il sommario nasce dagli
   stessi nodi: l'ancora esiste sempre e l'ordine è quello del documento. */
const rendered = computed<{ html: string; toc: TocItem[] }>(() => {
  if (!window.mdRender) return { html: '', toc: [] }
  const out = window.mdRender(props.content || '')
  const safe = DOMPurify.sanitize(out, {
    USE_PROFILES: { html: true, svg: true, mathml: true },
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|ftp|tel|sms|data|blob|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  })

  const holder = document.createElement('div')
  holder.innerHTML = safe
  const toc: TocItem[] = []
  const seen = new Map<string, number>()
  holder.querySelectorAll('h1, h2, h3, h4').forEach((heading) => {
    const text = (heading.textContent || '').replace(/\s+/g, ' ').trim()
    if (!text) return
    const base = slugify(text)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const id = count ? `${base}-${count + 1}` : base
    heading.id = id
    toc.push({ id, text, level: Number(heading.tagName.slice(1)) })
  })

  return { html: holder.innerHTML, toc: props.toc ? toc : [] }
})

const html = computed(() => rendered.value.html)
const tocItems = computed(() => rendered.value.toc)

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
        <a
          v-for="t in tocItems"
          :key="t.id"
          :href="'#' + t.id"
          :style="{ paddingLeft: (t.level - 1) * 10 + 'px' }"
          >{{ t.text }}</a
        >
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
