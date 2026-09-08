<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { registryApi } from '@/shared/api'
import { useRegistryStore, useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import type { UIBottomNavItem, UIAction } from '@/types'

const registry = useRegistryStore()
const ui = useUIStore()

const loading = ref(true)
const saving = ref(false)
const drawerSearch = ref(true)
const items = ref<UIBottomNavItem[]>([])

async function load() {
  loading.value = true
  try {
    const data = await registryApi.get()
    registry.setRegistry(data.pages || [], data.sections || [], data.ui)
    items.value = (data.ui?.bottomNav || []).map(i => ({ ...i }))
    drawerSearch.value = data.ui?.drawerSearch !== false
  } catch (e) {
    ui.toast('Errore caricamento: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

function addItem() {
  items.value.push({ icon: '➕', label: 'Nuova voce', action: 'home' })
}

function move(idx: number, dir: number) {
  const to = idx + dir
  if (to < 0 || to >= items.value.length) return
  const [m] = items.value.splice(idx, 1)
  items.value.splice(to, 0, m)
}

function remove(idx: number) {
  items.value.splice(idx, 1)
}

const actionsMap: Array<{ v: UIAction; l: string }> = [
  { v: 'home', l: 'Home' },
  { v: 'drawer', l: 'Drawer (menu)' },
  { v: 'options', l: 'Opzioni' },
  { v: 'page', l: 'Pagina' },
  { v: 'url', l: 'URL esterno' }
]

async function save() {
  saving.value = true
  try {
    registry.setUIConfig({ bottomNav: items.value, drawerSearch: drawerSearch.value })
    await registryApi.save(registry.pages, registry.uiConfig, 'admin: update ui config')
    ui.toast('Interfaccia salvata — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore salvataggio: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Interfaccia</h1>
      <div class="arc-head-actions">
        <button class="btn btn-p" type="button" :disabled="saving" @click="save">💾 Salva</button>
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <AdminOnly>
      <div class="arc-panel" style="margin-bottom:16px">
      <h3 class="arc-panel-title">Barra di navigazione in basso (sito mobile)</h3>
      <label class="arc-toggle-line">
        <input v-model="drawerSearch" type="checkbox" />
        Mostra ricerca nel drawer
      </label>
    </div>

    <div class="arc-panel">
      <div class="arc-form-actions" style="margin-bottom:10px">
        <strong style="font-size:14px">Voci ({{ items.length }})</strong>
        <span style="flex:1"></span>
        <button class="btn btn-soft btn-sm" type="button" @click="addItem">+ Aggiungi voce</button>
      </div>
      <div v-for="(item, idx) in items" :key="idx" class="arc-navrow">
        <div class="arc-navrow-move">
          <button class="btn btn-soft btn-sm" type="button" :disabled="idx === 0" @click="move(idx, -1)">↑</button>
          <button class="btn btn-soft btn-sm" type="button" :disabled="idx === items.length - 1" @click="move(idx, 1)">↓</button>
        </div>
        <input v-model="item.icon" class="in" style="max-width:64px" placeholder="🏰" />
        <input v-model="item.label" class="in" style="max-width:180px" placeholder="Etichetta" />
        <select v-model="item.action" class="in" style="max-width:160px">
          <option v-for="a in actionsMap" :key="a.v" :value="a.v">{{ a.l }}</option>
        </select>
        <input
          v-if="item.action === 'page' || item.action === 'url'"
          v-model="item.target"
          class="in"
          style="flex:1;min-width:120px"
          :placeholder="item.action === 'page' ? 'pag-xxx' : 'https://…'"
        />
        <span v-else style="flex:1"></span>
        <button class="btn btn-d btn-sm" type="button" @click="remove(idx)">🗑</button>
      </div>
      <div v-if="!items.length" class="arc-empty-side">Nessuna voce. Aggiungine una.</div>
    </div>
    </AdminOnly>
  </section>
</template>