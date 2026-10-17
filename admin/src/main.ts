import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { resetSessionCheck, router } from './app/router'
import { useAuthStore, useUIStore } from './app/store'
import { onUnauthorized } from './shared/api'
import './shared/styles/arc-admin-app.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const auth = useAuthStore()
auth.restoreFromSession()

/* Reazione unica alla sessione scaduta: invece di far fallire in cascata
   ogni pannello con un errore, si chiude la sessione locale e si torna
   al login conservando la destinazione. */
onUnauthorized(() => {
  const ui = useUIStore()
  const wasAuthenticated = auth.isAuthenticated
  auth.clearAuth()
  resetSessionCheck()
  if (wasAuthenticated) ui.toast('Sessione scaduta: accedi di nuovo', 'warning', { title: 'Sessione' })
  if (router.currentRoute.value.name !== 'login') {
    void router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
  }
})

app.mount('#arc-admin-app')
