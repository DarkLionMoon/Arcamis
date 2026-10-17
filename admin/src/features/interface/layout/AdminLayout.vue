<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore, useEditorStore, useMapStore, useUIStore } from '@/app/store'
import { authApi, errorText } from '@/shared/api'
import { theme, toggleTheme } from '@/shared/theme'
import GlobalSearch from '@/features/interface/components/GlobalSearch.vue'
import ToastHost from '@/shared/components/ToastHost.vue'
import VIcon from '@/shared/components/VIcon.vue'
import { canAccess } from '@/app/router/roles'
import type { IconName } from '@/shared/icons'

const auth = useAuthStore()
const ui = useUIStore()
const editor = useEditorStore()
const map = useMapStore()
const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)
const searchOpen = ref(false)

/* Modifiche pendenti in qualunque punto del pannello: visibili in topbar
   così l'utente capisce perché la navigazione chiede conferma. */
const pending = computed(() => editor.hasUnsavedChanges || map.dirty)

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = !searchOpen.value
    return
  }
  if (e.key === 'Escape' && sidebarOpen.value) sidebarOpen.value = false
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
  } catch (e) {
    /* best effort: la sessione locale viene comunque chiusa */
    ui.toast(errorText(e), 'warning', { title: 'Logout' })
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
      { label: 'Copertine', to: '/copertine', icon: 'covers', minRole: 'editor' },
      { label: 'Media', to: '/media', icon: 'media' },
      { label: 'Cestino', to: '/cestino', icon: 'trash', minRole: 'admin' }
    ]
  },
  {
    title: 'Feature',
    items: [
      { label: 'Mappa', to: '/mapa', icon: 'map', minRole: 'editor' },
      { label: 'Carousel', to: '/carousel', icon: 'carousel', minRole: 'editor' },
      { label: 'Changelog', to: '/changelog', icon: 'changelog', minRole: 'editor' }
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
  return items.filter((item) => canAccess(auth.role, item.minRole))
}

function normalize(p: string) {
  return p === '/' ? '/' : p.replace(/\/+$/, '')
}

const pageTitle = computed(() => {
  for (const g of groups) {
    const hit = g.items.find((i) => normalize(i.to) === normalize(route.path))
    if (hit) return hit.label
  }
  if (route.name === 'editor') return 'Editor pagina'
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

      <nav id="arc-nav" class="arc-nav">
        <template v-for="group in groups" :key="group.title">
          <template v-if="visible(group.items).length">
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
        </template>
      </nav>

      <div class="arc-side-foot">
        <span class="arc-side-foot-dot"></span>
        Shell Vue · build prod
      </div>
    </aside>

    <button
      v-if="sidebarOpen"
      class="arc-sidebar-backdrop"
      type="button"
      aria-label="Chiudi navigazione"
      @click="closeSidebar"
    ></button>

    <div class="arc-main">
      <header class="arc-topbar">
        <button
          class="arc-topbar-burger btn btn-soft btn-sm"
          type="button"
          :aria-expanded="sidebarOpen"
          aria-controls="arc-nav"
          aria-label="Apri o chiudi la navigazione"
          @click="sidebarOpen = !sidebarOpen"
        >
          ☰
        </button>
        <span class="arc-topbar-title">{{ pageTitle }}</span>
        <span v-if="pending" class="arc-pending" title="Ci sono modifiche non ancora salvate">
          ● modifiche non salvate
        </span>
        <div class="arc-topbar-user">
          <span class="arc-topbar-hint"><kbd>⌘K</kbd> Cerca</span>
          <button
            class="btn btn-soft btn-sm arc-theme-toggle"
            type="button"
            :aria-pressed="theme === 'dark'"
            :title="theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'"
            @click="toggleTheme"
          >
            <VIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="15" />
            {{ theme === 'dark' ? 'Chiaro' : 'Scuro' }}
          </button>
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
    <ToastHost />
  </div>
</template>
