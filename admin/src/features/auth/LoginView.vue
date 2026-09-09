<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { authApi } from '@/shared/api'
import { useAuthStore, useUIStore } from '@/app/store'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUIStore()
const form = reactive({ username: '', password: '', remember: true })
const loading = ref(false)
const error = ref('')

async function login() {
  if (!form.username.trim() || !form.password) {
    error.value = 'Inserisci username e password.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const result = await authApi.login(form.username.trim(), form.password, form.remember)
    auth.setAuth(form.username.trim(), result.role, result.csrf)
    ui.toast('Accesso effettuato', 'success')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Accesso non riuscito.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="arc-auth-page">
    <form class="arc-auth-card" @submit.prevent="login">
      <div class="arc-auth-brand">ARCAMIS <span>ADMIN</span></div>
      <h1>Accedi</h1>
      <p class="arc-hint">Gestisci contenuti, media e configurazione della wiki.</p>
      <label class="arc-fld">
        <span>Username</span>
        <input v-model="form.username" class="in" autocomplete="username" autofocus />
      </label>
      <label class="arc-fld">
        <span>Password</span>
        <input v-model="form.password" class="in" type="password" autocomplete="current-password" />
      </label>
      <label class="arc-toggle-line"> <input v-model="form.remember" type="checkbox" /> Ricordami </label>
      <div v-if="error" class="arc-alert arc-alert--error" role="alert">{{ error }}</div>
      <button class="btn btn-p" type="submit" :disabled="loading">
        {{ loading ? 'Accesso…' : 'Accedi' }}
      </button>
    </form>
  </main>
</template>
