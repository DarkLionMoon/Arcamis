<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore, useUIStore } from '@/app/store'
import { authApi } from '@/shared/api'
import GlobalSearch from '@/features/interface/components/GlobalSearch.vue'

const auth = useAuthStore()
const ui = useUIStore()
const router = useRouter()
const sidebarOpen = ref(false)
const searchOpen = ref(false)

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = !searchOpen.value
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))

const roleLabel = computed(() => {
  switch (auth.role) {
    case 'admin': return 'Admin'
    case 'editor': return 'Editor'
    default: return 'Visualizzatore'
  }
})

async function logout() {
  try { await authApi.logout() } catch { /* best effort */ }
  auth.clearAuth()
  ui.toast('Logout effettuato', 'info')
  router.push('/login')
}

function closeSidebar() {
  sidebarOpen.value = false
}

interface NavItem { label: string; to: string; icon: string; minRole?: 'admin' | 'editor' }
const groups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Pannello',
    items: [
      { label: 'Dashboard', to: '/', icon: '📊' },
      { label: 'Utenti', to: '/utenti', icon: '👥', minRole: 'admin' }
    ]
  },
  {
    title: 'Contenuti',
    items: [
      { label: 'Pagine', to: '/pagine', icon: '📄' },
      { label: 'Copertine', to: '/copertine', icon: '🖼' }
    ]
  },
  {
    title: 'Feature',
    items: [
      { label: 'Mappa', to: '/mapa', icon: '📍' },
      { label: 'Carousel', to: '/carousel', icon: '🎠' }
    ]
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Navigazione', to: '/navigazione', icon: '🧭', minRole: 'admin' },
      { label: 'Interfaccia', to: '/interfaccia', icon: '⚙️', minRole: 'admin' },
      { label: 'Impostazioni', to: '/impostazioni', icon: '🔧', minRole: 'admin' }
    ]
  },
  {
    title: 'Contenuto',
    items: [
      { label: 'Media', to: '/media', icon: '📁' },
      { label: 'Cestino', to: '/cestino', icon: '🗑', minRole: 'admin' },
      { label: 'Changelog', to: '/changelog', icon: '📋' }
    ]
  },
  {
    title: 'Sicurezza',
    items: [
      { label: 'Audit', to: '/audit', icon: '🔍', minRole: 'admin' },
      { label: 'Link Scanner', to: '/link-scanner', icon: '🔗', minRole: 'admin' },
      { label: 'Trova & Sostituisci', to: '/trova-sostituisci', icon: '♻️', minRole: 'admin' },
      { label: 'Media orfani', to: '/media-orfani', icon: '🖼', minRole: 'admin' },
      { label: 'Backup', to: '/backup', icon: '💾', minRole: 'admin' }
    ]
  }
]

function visible(items: NavItem[]) {
  if (auth.role === 'admin') return items
  return items.filter(i => !i.minRole || auth.role === i.minRole)
}
</script>

<template>
  <div class="arc-app">
    <aside class="arc-sidebar" :class="{ open: sidebarOpen }">
      <div class="arc-brand">Arcamis <span>Admin</span></div>

      <nav class="arc-nav">
        <template v-for="group in groups" :key="group.title">
          <div class="arc-nav-group-title">{{ group.title }}</div>
          <router-link
            v-for="item in visible(group.items)"
            :key="item.to"
            :to="item.to"
            class="arc-nav-link"
            active-class="active"
            @click="closeSidebar"
          >{{ item.icon }} {{ item.label }}</router-link>
        </template>
      </nav>

      <div class="arc-side-foot">Shell Vue · migrazione in corso</div>
    </aside>

    <div class="arc-main">
      <header class="arc-topbar">
        <button class="arc-topbar-burger btn btn-soft btn-sm" type="button" @click="sidebarOpen = !sidebarOpen">☰</button>
        <span class="arc-topbar-title">Pannello</span>
        <div class="arc-topbar-user">
          <span class="arc-role" :class="auth.role">
            {{ auth.user || 'admin' }} · {{ roleLabel }}
          </span>
          <button class="btn btn-soft btn-sm" type="button" @click="logout">Logout</button>
        </div>
      </header>

      <main class="arc-content">
        <router-view />
      </main>
    </div>

    <GlobalSearch :open="searchOpen" @close="searchOpen = false" />

    <div class="arc-toasts">
      <transition-group name="arc-toast">
        <div
          v-for="t in ui.toasts"
          :key="t.id"
          class="arc-toast"
          :class="'arc-toast--' + t.type"
        >
          {{ t.message }}
        </div>
      </transition-group>
    </div>
  </div>
</template>