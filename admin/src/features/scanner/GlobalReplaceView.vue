<script setup lang="ts">
import { ref } from 'vue'

import { searchApi, pagesApi } from '@/shared/api'
import { useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'

const ui = useUIStore()

const searching = ref(false)
const query = ref('')
const results = ref<Array<{ k: string; title: string; icon: string; content: string }>>([])
const selected = ref<Record<string, boolean>>({})
const replaceText = ref('')
const replacedCount = ref(0)

async function search() {
  const q = query.value.trim()
  if (!q) return
  searching.value = true
  results.value = []
  replacedCount.value = 0
  try {
    results.value = await searchApi.searchContent(q)
  } catch (e) {
    ui.toast('Errore ricerca: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    searching.value = false
  }
}

function toggleAll(v: boolean) {
  for (const r of results.value) selected.value[r.k] = v
}

function snippet(content: string) {
  const q = query.value.trim().toLowerCase()
  const idx = content.toLowerCase().indexOf(q)
  if (idx < 0) return content.slice(0, 180)
  const start = Math.max(0, idx - 40)
  const end = Math.min(content.length, idx + q.length + 140)
  return (start > 0 ? '…' : '') + content.slice(start, end).replace(/\s+/g, ' ') + (end < content.length ? '…' : '')
}

async function doReplace() {
  const q = query.value.trim()
  if (!q) return
  const keys = results.value.filter(r => selected.value[r.k]).map(r => r.k)
  if (!keys.length) {
    ui.toast('Nessuna pagina selezionata', 'error')
    return
  }
  if (!confirm(`Sostituire "${q}" in ${keys.length} pagina/e?`)) return
  let done = 0
  for (const k of keys) {
    try {
      const page = await pagesApi.get(k)
      if (!page.content) continue
      const next = page.content.split(q).join(replaceText.value)
      if (next === page.content) continue
      page.content = next
      await pagesApi.save(page, `admin: replace "${q}" → "${replaceText.value}"`)
      done++
    } catch (e) {
      ui.toast('Errore su ' + k + ': ' + (e instanceof Error ? e.message : String(e)), 'error')
    }
  }
  replacedCount.value = done
  ui.toast(`Sostituite ${done} pagine — deploy in corso (~30s)`, 'success')
  await search()
}
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Trova &amp; Sostituisci</h1>
    </div>

    <AdminOnly>
      <div class="arc-panel" style="margin-bottom:16px">
        <div class="arc-form-actions" style="flex-wrap:wrap">
          <input v-model="query" class="in" style="flex:1;min-width:200px" placeholder="Testo da cercare…"
            @keyup.enter="search" />
          <span style="align-self:center">→</span>
          <input v-model="replaceText" class="in" style="flex:1;min-width:200px" placeholder="Testo sostitutivo…"
            @keyup.enter="doReplace" />
          <button class="btn btn-p" type="button" :disabled="searching || !query.trim()" @click="search">🔎 Cerca</button>
        </div>
      </div>

      <div v-if="searching" class="arc-empty-side">Ricerca in corso…</div>

      <template v-if="!searching && results.length">
        <div class="arc-panel" style="margin-bottom:16px">
          <div class="arc-form-actions" style="flex-wrap:wrap">
            <strong>{{ results.length }} pagine trovate</strong>
            <span v-if="replacedCount" style="color:#8fceaa">→ {{ replacedCount }} sostituite</span>
            <span style="flex:1"></span>
            <button class="btn btn-soft btn-sm" type="button" @click="toggleAll(true)">Seleziona tutte</button>
            <button class="btn btn-soft btn-sm" type="button" @click="toggleAll(false)">Deseleziona</button>
            <button class="btn btn-p btn-sm" type="button" :disabled="!replaceText" @click="doReplace">♻️ Sostituisci nelle selezionate</button>
          </div>
        </div>

        <div class="arc-panel">
          <div v-for="r in results" :key="r.k" class="arc-changelog-item">
            <label class="arc-toggle-line" style="margin:0">
              <input v-model="selected[r.k]" type="checkbox" />
            </label>
            <div style="flex:1">
              <div class="arc-changelog-head">
                <strong>{{ r.icon }} {{ r.title }}</strong>
                <code style="margin-left:8px;font-size:12px;opacity:.5">{{ r.k }}</code>
              </div>
              <p style="font-size:13px;opacity:.8;margin:6px 0 0">{{ snippet(r.content) }}</p>
            </div>
          </div>
        </div>
      </template>

      <div v-if="!searching && !results.length" class="arc-empty-side">Nessuna ricerca effettuata.</div>
    </AdminOnly>
  </section>
</template>