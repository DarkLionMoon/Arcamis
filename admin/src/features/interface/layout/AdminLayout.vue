<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore, useUIStore } from '@/app/store'
import { authApi } from '@/shared/api'
import GlobalSearch from '@/features/interface/components/GlobalSearch.vue'
import VIcon from '@/shared/components/VIcon.vue'
import type { IconName } from '@/shared/icons'

const auth = useAuthStore()
const ui = useUIStore()
const router = useRouter()
const route = useRoute()
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
    case 'admin':
      return 'Admin'
    case 'editor':
      return 'Editor'
    default:
      return 'Visualizzatore'
  }
})

async function logout() {
  try {
    await authApi.logout()
  } catch {
    /* best effort */
  }
  auth.clearAuth()
  ui.toast('Logout effettuato', 'info')
  await router.push('/login')
}

function closeSidebar() {
  sidebarOpen.value = false
}

interface NavItem {
  label: string
  to: string
  icon: IconName
  minRole?: 'admin' | 'editor'
}
const groups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Pannello',
    items: [
      { label: 'Dashboard', to: '/', icon: 'dashboard' },
      { label: 'Utenti', to: '/utenti', icon: 'users', minRole: 'admin' }
    ]
  },
  {
    title: 'Contenuti',
    items: [
      { label: 'Pagine', to: '/pagine', icon: 'pages' },
      { label: 'Copertine', to: '/copertine', icon: 'covers' }
    ]
  },
  {
    title: 'Feature',
    items: [
      { label: 'Mappa', to: '/mapa', icon: 'map' },
      { label: 'Carousel', to: '/carousel', icon: 'carousel' }
    ]
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Navigazione', to: '/navigazione', icon: 'navigate', minRole: 'admin' },
      { label: 'Interfaccia', to: '/interfaccia', icon: 'interface', minRole: 'admin' },
      { label: 'Impostazioni', to: '/impostazioni', icon: 'settings', minRole: 'admin' }
    ]
  },
  {
    title: 'Contenuto',
    items: [
      { label: 'Media', to: '/media', icon: 'media' },
      { label: 'Cestino', to: '/cestino', icon: 'trash', minRole: 'admin' },
      { label: 'Changelog', to: '/changelog', icon: 'changelog' }
    ]
  },
  {
    title: 'Sicurezza',
    items: [
      { label: 'Audit', to: '/audit', icon: 'audit', minRole: 'admin' },
      { label: 'Link Scanner', to: '/link-scanner', icon: 'links', minRole: 'admin' },
      { label: 'Trova & Sostituisci', to: '/trova-sostituisci', icon: 'replace', minRole: 'admin' },
      { label: 'Media orfani', to: '/media-orfani', icon: 'orphan', minRole: 'admin' },
      { label: 'Backup', to: '/backup', icon: 'backup', minRole: 'admin' }
    ]
  }
]

function visible(items: NavItem[]) {
  if (auth.role === 'admin') return items
  return items.filter((i) => !i.minRole || auth.role === i.minRole)
}

function normalize(p: string) {
  return p === '/' ? '/' : p.replace(/\/+$/, '')
}

const pageTitle = computed(() => {
  for (const g of groups) {
    const hit = g.items.find((i) => normalize(i.to) === normalize(route.path))
    if (hit) return hit.label
  }
  return 'Pannello'
})
</script>

<template>
  <div class="arc-app">
    <aside class="arc-sidebar" :class="{ open: sidebarOpen }">
      <div class="arc-brand">
        <div class="arc-logo-mark">A</div>
        <div class="arc-brand-text">
          <div class="arc-brand-name">ArcAMIS <span>Admin</span></div>
          <div class="arc-brand-sub">Pannello di amministrazione</div>
        </div>
      </div>

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
          >
            <span class="arc-nav-ico"><VIcon :name="item.icon" /></span>
            <span class="arc-nav-label">{{ item.label }}</span>
          </router-link>
        </template>
      </nav>

      <div class="arc-side-foot">
        <span class="arc-side-foot-dot"></span>
        Shell Vue · build prod
      </div>
    </aside>

    <div class="arc-main">
      <header class="arc-topbar">
        <button class="arc-topbar-burger btn btn-soft btn-sm" type="button" @click="sidebarOpen = !sidebarOpen">
          ☰
        </button>
        <span class="arc-topbar-title">{{ pageTitle }}</span>
        <div class="arc-topbar-user">
          <span class="arc-topbar-hint"><kbd>⌘K</kbd> Cerca</span>
          <span class="arc-role" :class="auth.role"> {{ auth.user || 'admin' }} · {{ roleLabel }} </span>
          <button class="btn btn-soft btn-sm" type="button" @click="logout">
            <VIcon :name="'logout'" :size="15" />
            Logout
          </button>
        </div>
      </header>

      <main class="arc-content">
        <router-view />
      </main>
    </div>

    <GlobalSearch :open="searchOpen" @close="searchOpen = false" />

    <div class="arc-toasts">
      <transition-group name="arc-toast">
        <div v-for="t in ui.toasts" :key="t.id" class="arc-toast" :class="'arc-toast--' + t.type">
          {{ t.message }}
        </div>
      </transition-group>
    </div>
  </div>
</template>