import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './app/router'
import { useAuthStore } from './app/store'
import './shared/styles/arc-admin-app.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const auth = useAuthStore()
auth.restoreFromSession()

app.mount('#arc-admin-app')