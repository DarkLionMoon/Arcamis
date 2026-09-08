import { createRouter, createWebHashHistory } from 'vue-router'

import AdminLayout from '@/features/interface/layout/AdminLayout.vue'
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

export const router = createRouter({
  history: createWebHashHistory('/admin/app.html'),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        { path: 'pagine', name: 'pages', component: PageListView },
        { path: 'editor/:key', name: 'editor', component: PageEditorView },
        { path: 'mapa', name: 'map', component: MapEditorView },
        { path: 'carousel', name: 'carousel', component: CarouselView },
        { path: 'copertine', name: 'covers', component: CoversView },
        { path: 'navigazione', name: 'navigation', component: NavigationView },
        { path: 'interfaccia', name: 'interface', component: InterfaceView },
        { path: 'impostazioni', name: 'settings', component: SettingsView },
        { path: 'media', name: 'media', component: MediaView },
        { path: 'cestino', name: 'trash', component: TrashView },
        { path: 'changelog', name: 'changelog', component: ChangelogView },
        { path: 'audit', name: 'audit', component: AuditView },
        { path: 'link-scanner', name: 'link-scanner', component: LinkScannerView },
        { path: 'trova-sostituisci', name: 'global-replace', component: GlobalReplaceView },
        { path: 'media-orfani', name: 'orphan-media', component: OrphanMediaView },
        { path: 'backup', name: 'backup', component: BackupView },
        { path: 'utenti', name: 'users', component: UsersView }
      ]
    }
  ]
})