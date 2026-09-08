<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { registryApi, pagesApi, carouselApi } from '@/shared/api'
import { useCoversStore, useRegistryStore, useUIStore } from '@/app/store'
import type { PageRegistryEntry, SectionRegistryEntry } from '@/types'

const router = useRouter()
const registry = useRegistryStore()
const covers = useCoversStore()
const ui = useUIStore()

const loading = ref(true)
const savingNew = ref(false)
const searchQuery = ref('')
const showNewModal = ref(false)

const newPage = reactive({
  key: '',
  label: '',
  icon: '📄',
  section: '',
  dropdown: false
})

interface RegistryBundle {
  pages: PageRegistryEntry[]
  sections: SectionRegistryEntry[]
  ui?: unknown
  sha?: string
}

const bundle = ref<RegistryBundle | null>(null)

const filteredPages = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return registry.pages
  return registry.pages.filter(p =>
    (p.l || '').toLowerCase().includes(q) || (p.k || '').toLowerCase().includes(q) || (p.id || '').toLowerCase().includes(q)
  )
})

const groupedPages = computed(() => {
  const groups = new Map<string, PageRegistryEntry[]>()
  for (const p of filteredPages.value) {
    const g = p.sec || '—'
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(p)
  }
  return Array.from(groups.entries()).sort((a, b) => {
    if (a[0] === '—') return 1
    if (b[0] === '—') return -1
    return a[0].localeCompare(b[0])
  })
})

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function load() {
  loading.value = true
  try {
    const data = await registryApi.get()
    bundle.value = data as RegistryBundle
    registry.setRegistry(data.pages as PageRegistryEntry[], (data.sections as SectionRegistryEntry[]) || [], data.ui)
    const coversMap = await carouselApi.getCovers().catch(() => ({}))
    covers.setCovers(coversMap || {})
  } catch (e) {
    ui.toast('Errore caricamento pagine: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

function openPage(key: string) {
  router.push({ name: 'editor', params: { key } })
}

async function deletePage(p: PageRegistryEntry) {
  if (!confirm(`Eliminare la pagina "${p.l}" dal registro?`)) return
  try {
    registry.removePage(p.k)
    await registryApi.save(registry.pages)
    ui.toast('Pagina rimossa dal registro — ricorda di eliminare il file', 'success')
  } catch (e) {
    ui.toast('Errore: ' + (e instanceof Error ? e.message : String(e)), 'error')
  }
}

async function createPage() {
  const key = (newPage.key || slugify(newPage.label)).trim()
  const label = newPage.label.trim()
  if (!key || !label) {
    ui.toast('Nome e chiave obbligatori', 'error')
    return
  }
  if (registry.pages.some(p => p.k === key)) {
    ui.toast('Chiave già esistente', 'error')
    return
  }
  savingNew.value = true
  try {
    const now = new Date().toISOString()
    const content: Record<string, unknown> = {
      k: key,
      title: label,
      icon: newPage.icon || '📄',
      content: '',
      lastModified: now,
      isDraft: true,
      layout: ''
    }
    await pagesApi.create(content as never, `admin: create page ${key}`)
    registry.addPage({
      k: key,
      l: label,
      i: newPage.icon || '📄',
      id: 'pag-' + key,
      sec: newPage.section || undefined,
      sub: '',
      c: 1,
      layout: ''
    } as PageRegistryEntry)
    await registryApi.save(registry.pages)
    showNewModal.value = false
    newPage.key = ''
    newPage.label = ''
    ui.toast('Pagina creata — apri per compilare', 'success')
    router.push({ name: 'editor', params: { key } })
  } catch (e) {
    ui.toast('Errore creazione: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    savingNew.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Pagine</h1>
      <div class="arc-head-actions">
        <button class="btn btn-p" type="button" @click="showNewModal = true">+ Nuova pagina</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <div class="arc-panel" style="margin-bottom:16px">
      <input v-model="searchQuery" class="in" style="width:100%" placeholder="🔎 Cerca pagina…" />
    </div>

    <div v-if="loading" class="arc-empty-side">Caricamento…</div>

    <div v-for="[group, pages] in groupedPages" :key="group" class="arc-panel" style="margin-bottom:16px">
      <h3 class="arc-panel-title">Gruppo: {{ group }} <span style="opacity:.5">({{ pages.length }})</span></h3>
      <table class="arc-table">
        <tbody>
          <tr v-for="p in pages" :key="p.k">
            <td style="width:34px;font-size:20px">{{ p.i || '📄' }}</td>
            <td>
              <strong>{{ p.l || p.k }}</strong>
              <div style="font-size:12px;opacity:.5">{{ p.k }} · {{ p.id }}{{ p.layout ? ' · layout ' + p.layout : '' }}</div>
            </td>
            <td style="width:60px;text-align:right">
              <img
                v-if="covers.covers[p.id]"
                :src="covers.covers[p.id]"
                alt="cover"
                style="width:52px;height:32px;object-fit:cover;border-radius:6px;border:1px solid var(--border,#1d2430)"
              />
            </td>
            <td style="width:180px">
              <a :href="'/' + (p.id)" target="_blank" rel="noreferrer" style="font-size:12px;opacity:.7">sito ↗</a>
            </td>
            <td style="width:150px;text-align:right">
              <button class="btn btn-p btn-sm" type="button" @click="openPage(p.k)">✏️ Modifica</button>
              <button class="btn btn-d btn-sm" type="button" @click="deletePage(p)">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && registry.pages.length === 0" class="arc-empty-side">Nessuna pagina nel registro.</div>

    <div v-if="showNewModal" class="arc-modal-backdrop">
      <div class="arc-modal">
        <h3 class="arc-panel-title">Nuova pagina</h3>
        <div class="arc-form-grid">
          <label class="arc-fld">
            <span>Titolo</span>
            <input v-model="newPage.label" class="in" />
          </label>
          <label class="arc-fld">
            <span>Chiave (slug, vuoto = auto)</span>
            <input v-model="newPage.key" class="in" :placeholder="slugify(newPage.label) || 'pag-chiave'" />
          </label>
          <label class="arc-fld">
            <span>Icona</span>
            <input v-model="newPage.icon" class="in" placeholder="📄" />
          </label>
          <label class="arc-fld">
            <span>Sezione</span>
            <select v-model="newPage.section" class="in">
              <option value="">— nessuna —</option>
              <option v-for="s in registry.sections" :key="s.v" :value="s.v">{{ s.l }}</option>
            </select>
          </label>
        </div>
        <div class="arc-form-actions">
          <span style="flex:1"></span>
          <button class="btn btn-soft btn-sm" type="button" @click="showNewModal = false">Annulla</button>
          <button class="btn btn-p btn-sm" type="button" :disabled="savingNew" @click="createPage">Crea</button>
        </div>
      </div>
    </div>
  </section>
</template>