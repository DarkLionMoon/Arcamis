import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

import AdminLayout from '@/features/interface/layout/AdminLayout.vue'
import LoginView from '@/features/auth/LoginView.vue'
import { useAuthStore, useUIStore } from '@/app/store'
import { checkSession } from '@/shared/api'
import { canAccess, deniedMessage, type RequiredRole } from './roles'
import DashboardView from '@/features/dashboard/DashboardView.vue'
import MapEditorView from '@/features/map/MapEditorView.vue'
import CarouselView from '@/features/carousel/CarouselView.vue'
import UsersView from '@/features/users/UsersView.vue'
import PageListView from '@/features/pages/PageListView.vue'
import PageEditorView from '@/features/pages/PageEditorView.vue'
import CoversView from '@/features/covers/CoversView.vue'
import AuditView from '@/features/audit/AuditView.vue'
import NavigationView from '@/features/navigation/NavigationView.vue'
import InterfaceView from '@/features/interface/InterfaceView.vue'
import SettingsView from '@/features/settings/SettingsView.vue'
import ChangelogView from '@/features/changelog/ChangelogView.vue'
import MediaView from '@/features/media/MediaView.vue'
import TrashView from '@/features/trash/TrashView.vue'
import LinkScannerView from '@/features/scanner/LinkScannerView.vue'
import GlobalReplaceView from '@/features/scanner/GlobalReplaceView.vue'
import OrphanMediaView from '@/features/scanner/OrphanMediaView.vue'
import BackupView from '@/features/system/BackupView.vue'

/* `minRole` è l'unica dichiarazione di permesso: la stessa funzione
   `canAccess()` filtra la sidebar e blocca la rotta. */
const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: LoginView },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardView },
      { path: 'pagine', name: 'pages', component: PageListView },
      { path: 'editor/:key', name: 'editor', component: PageEditorView, meta: { minRole: 'editor' } },
      { path: 'mapa', name: 'map', component: MapEditorView, meta: { minRole: 'editor' } },
      { path: 'carousel', name: 'carousel', component: CarouselView, meta: { minRole: 'editor' } },
      { path: 'copertine', name: 'covers', component: CoversView, meta: { minRole: 'editor' } },
      { path: 'navigazione', name: 'navigation', component: NavigationView, meta: { minRole: 'admin' } },
      { path: 'interfaccia', name: 'interface', component: InterfaceView, meta: { minRole: 'admin' } },
      { path: 'impostazioni', name: 'settings', component: SettingsView, meta: { minRole: 'admin' } },
      { path: 'media', name: 'media', component: MediaView },
      { path: 'cestino', name: 'trash', component: TrashView, meta: { minRole: 'admin' } },
      { path: 'changelog', name: 'changelog', component: ChangelogView, meta: { minRole: 'editor' } },
      { path: 'audit', name: 'audit', component: AuditView, meta: { minRole: 'admin' } },
      { path: 'link-scanner', name: 'link-scanner', component: LinkScannerView, meta: { minRole: 'admin' } },
      { path: 'trova-sostituisci', name: 'global-replace', component: GlobalReplaceView, meta: { minRole: 'admin' } },
      { path: 'media-orfani', name: 'orphan-media', component: OrphanMediaView, meta: { minRole: 'admin' } },
      { path: 'backup', name: 'backup', component: BackupView, meta: { minRole: 'admin' } },
      { path: 'utenti', name: 'users', component: UsersView, meta: { minRole: 'admin' } }
    ]
  },
  /* Un hash sbagliato non deve lasciare una pagina bianca. */
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createWebHashHistory('/admin/app.html'),
  routes
})

let sessionVerified = false

/** Forza una nuova verifica lato server (usato dopo login/logout/401). */
export function resetSessionCheck(): void {
  sessionVerified = false
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.name === 'login') {
    if (auth.isAuthenticated && !sessionVerified) {
      const session = await checkSession()
      if (session?.ok && session.user && session.role) {
        auth.setAuth(session.user, session.role, session.csrf || '')
        sessionVerified = true
        return { name: 'dashboard' }
      }
      auth.clearAuth()
    }
    return true
  }

  if (!auth.isAuthenticated || !sessionVerified) {
    const session = await checkSession()
    if (session?.ok && session.user && session.role) {
      auth.setAuth(session.user, session.role, session.csrf || '')
      sessionVerified = true
    } else {
      auth.clearAuth()
      sessionVerified = false
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }

  /* RBAC: il ruolo viene dal server, il requisito dalla rotta. */
  const minRole = to.meta.minRole as RequiredRole | undefined
  if (minRole && !canAccess(auth.role, minRole)) {
    useUIStore().toast(deniedMessage(minRole), 'warning', { title: 'Accesso negato' })
    return { name: 'dashboard' }
  }

  return true
})
