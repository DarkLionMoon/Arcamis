<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { authApi } from '@/shared/api'
import { useAuthStore, useUIStore } from '@/app/store'
import { hashPassword } from '@/shared/passwords'
import type { User, UserRole } from '@/types'

const auth = useAuthStore()
const ui = useUIStore()

const loading = ref(true)
const saving = ref(false)
const users = ref<ManagedUser[]>([])
const dirty = ref(false)

interface ManagedUser {
  username: string
  role: UserRole
  passwordHash?: string
  salt?: string
  created?: string
  updated?: string
}

const newUser = reactive({ username: '', password: '', role: 'editor' as UserRole })
const passwordField = reactive<Record<string, string>>({})

async function load() {
  loading.value = true
  try {
    const list = await authApi.getUsers()
    users.value = list.map((u) => ({ ...u }))
    dirty.value = false
  } catch (e) {
    ui.toast('Errore caricamento utenti: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

function markDirty() {
  dirty.value = true
}

function setRole(username: string, role: UserRole) {
  const u = users.value.find((x) => x.username === username)
  if (u) {
    u.role = role
    u.updated = new Date().toISOString()
    markDirty()
  }
}

async function setPassword(username: string) {
  const u = users.value.find((x) => x.username === username)
  const pw = (passwordField[username] || '').trim()
  if (!u) return
  if (!pw) {
    ui.toast('Password vuota', 'error')
    return
  }
  try {
    const { hash, salt } = await hashPassword(pw)
    u.passwordHash = hash
    u.salt = salt
    u.updated = new Date().toISOString()
    passwordField[username] = ''
    markDirty()
    ui.toast('Password aggiornata — ricorda di salvare', 'success')
  } catch (e) {
    ui.toast('Errore hash password: ' + (e instanceof Error ? e.message : String(e)), 'error')
  }
}

async function addUser() {
  const username = newUser.username.trim()
  const password = newUser.password.trim()
  if (!username || !password) {
    ui.toast('Username e password obbligatori', 'error')
    return
  }
  if (users.value.some((u) => u.username === username)) {
    ui.toast('Utente già esistente', 'error')
    return
  }
  try {
    const { hash, salt } = await hashPassword(password)
    users.value.push({
      username,
      role: newUser.role,
      passwordHash: hash,
      salt,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    })
    newUser.username = ''
    newUser.password = ''
    markDirty()
    ui.toast('Utente creato — ricorda di salvare', 'success')
  } catch (e) {
    ui.toast('Errore hash password: ' + (e instanceof Error ? e.message : String(e)), 'error')
  }
}

function removeUser(username: string) {
  if (username === 'admin') {
    ui.toast("L'utente admin non può essere eliminato", 'error')
    return
  }
  if (!confirm("Eliminare l'utente " + username + '?')) return
  users.value = users.value.filter((u) => u.username !== username)
  markDirty()
  ui.toast('Utente eliminato — ricorda di salvare', 'success')
}

async function save() {
  saving.value = true
  try {
    await authApi.saveUsers(users.value as User[])
    dirty.value = false
    ui.toast('Utenti salvati — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore salvataggio utenti: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Utenti</h1>
      <div class="arc-head-actions">
        <button v-if="dirty" class="btn btn-p" type="button" :disabled="saving" @click="save">💾 Salva</button>
        <button class="btn btn-soft" type="button" @click="load">⟳ Aggiorna</button>
      </div>
    </div>

    <div class="arc-alert" v-if="!auth.isAdmin">Solo gli amministratori gestiscono gli utenti.</div>

    <template v-if="auth.isAdmin">
      <div class="arc-panel" style="margin-bottom: 16px">
        <h3 class="arc-panel-title">Nuovo utente</h3>
        <div class="arc-form-grid" style="grid-template-columns: 1fr 1fr 1fr auto">
          <label class="arc-fld">
            <span>Username</span>
            <input v-model="newUser.username" class="in" placeholder="nome" />
          </label>
          <label class="arc-fld">
            <span>Password</span>
            <input v-model="newUser.password" type="password" class="in" placeholder="••••••" />
          </label>
          <label class="arc-fld">
            <span>Ruolo</span>
            <select v-model="newUser.role" class="in">
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <button class="btn btn-p" type="button" style="align-self: end" @click="addUser">+ Aggiungi</button>
        </div>
      </div>

      <div class="arc-panel">
        <h3 class="arc-panel-title">Utenti esistenti ({{ users.length }})</h3>
        <table class="arc-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Ruolo</th>
              <th>Password</th>
              <th>Creato</th>
              <th>Aggiornato</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6">Caricamento…</td>
            </tr>
            <tr v-for="u in users" :key="u.username">
              <td>{{ u.username }}</td>
              <td>
                <select
                  class="in"
                  :value="u.role"
                  @change="setRole(u.username, ($event.target as HTMLSelectElement).value as UserRole)"
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </td>
              <td>
                <div style="display: flex; gap: 6px">
                  <input
                    v-model="passwordField[u.username]"
                    type="password"
                    class="in"
                    style="flex: 1; min-width: 90px"
                    placeholder="nuova password"
                  />
                  <button class="btn btn-soft btn-sm" type="button" @click="setPassword(u.username)">Imposta</button>
                </div>
              </td>
              <td v-if="u.created">{{ new Date(u.created).toLocaleDateString() }}</td>
              <td v-else>—</td>
              <td v-if="u.updated">{{ new Date(u.updated).toLocaleDateString() }}</td>
              <td v-else>—</td>
              <td>
                <button
                  v-if="u.username !== 'admin'"
                  class="btn btn-d btn-sm"
                  type="button"
                  @click="removeUser(u.username)"
                >
                  🗑
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
