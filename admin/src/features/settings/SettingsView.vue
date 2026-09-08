<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { settingsApi, registryApi } from '@/shared/api'
import { useRegistryStore, useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import type { SiteSettings, SectionRegistryEntry } from '@/types'

const registry = useRegistryStore()
const ui = useUIStore()

const loading = ref(true)
const saving = ref(false)
const webhookSaving = ref(false)
const tokenSaving = ref(false)
const tokenStatus = reactive<{ configured: boolean; ok: boolean; message: string }>({ configured: false, ok: false, message: '' })

const settings = reactive<SiteSettings>({
  banner_enabled: false,
  banner_text: '',
  disclaimer_enabled: false,
  disclaimer_text: ''
})

const newToken = ref('')
const webhook = reactive({ url: '', enabled: false })
const testResult = ref<string | null>(null)

const newSection = reactive({ v: '', l: '' })

async function load() {
  loading.value = true
  try {
    const [s, wh, gh, reg] = await Promise.all([
      settingsApi.getSettings(),
      settingsApi.getWebhook(),
      settingsApi.getGhTokenStatus(),
      registryApi.get()
    ])
    Object.assign(settings, {
      banner_enabled: !!s.banner_enabled,
      banner_text: s.banner_text || '',
      disclaimer_enabled: !!s.disclaimer_enabled,
      disclaimer_text: s.disclaimer_text || ''
    })
    webhook.url = wh.webhookUrl || ''
    webhook.enabled = !!wh.enabled
    tokenStatus.configured = !!gh.configured
    tokenStatus.ok = !!gh.ok
    tokenStatus.message = gh.message || ''
    registry.setRegistry(reg.pages || [], (reg.sections as SectionRegistryEntry[]) || [], reg.ui)
  } catch (e) {
    ui.toast('Errore caricamento impostazioni: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await settingsApi.saveSettings({ ...settings })
    ui.toast('Impostazioni salvate', 'success')
  } catch (e) {
    ui.toast('Errore: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = false
  }
}

async function saveWebhook() {
  webhookSaving.value = true
  try {
    await settingsApi.setWebhook(webhook.url.trim(), webhook.enabled)
    ui.toast('Webhook salvato', 'success')
  } catch (e) {
    ui.toast('Errore: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    webhookSaving.value = false
  }
}

async function testWebhook() {
  webhookSaving.value = true
  testResult.value = null
  try {
    const r = await settingsApi.testWebhook()
    testResult.value = r.ok ? 'Test inviato con successo' : (r.message || 'Test fallito')
  } catch (e) {
    testResult.value = 'Errore: ' + (e instanceof Error ? e.message : String(e))
  } finally {
    webhookSaving.value = false
  }
}

async function saveToken() {
  const token = newToken.value.trim()
  if (!token) {
    ui.toast('Inserisci un token', 'error')
    return
  }
  tokenSaving.value = true
  try {
    await settingsApi.setGhToken(token)
    newToken.value = ''
    ui.toast('Token GitHub salvato', 'success')
    void load()
  } catch (e) {
    ui.toast('Errore: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    tokenSaving.value = false
  }
}

function addSection() {
  const v = newSection.v.trim().toLowerCase()
  const l = newSection.l.trim()
  if (!v || !l) {
    ui.toast('Chiave e etichetta obbligatorie', 'error')
    return
  }
  registry.addSection({ v, l })
  newSection.v = ''
  newSection.l = ''
  ui.toast('Sezione aggiunta — ricordati di salvare', 'success')
}

function removeSection(v: string) {
  if (!confirm(`Eliminare la sezione "${v}"?`)) return
  registry.removeSection(v)
}

async function saveSections() {
  saving.value = true
  try {
    await registryApi.save(registry.pages, registry.uiConfig, 'admin: update sections')
    ui.toast('Sezioni salvate', 'success')
  } catch (e) {
    ui.toast('Errore: ' + (e instanceof Error ? e.message : String(e)), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="arc-dashboard">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Impostazioni</h1>
      <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Aggiorna</button>
    </div>

    <AdminOnly>
    <div v-if="loading" class="arc-empty-side">Caricamento…</div>

    <div class="arc-settings-grid">
      <div class="arc-panel">
        <h3 class="arc-panel-title">Banner e disclaimer</h3>
        <label class="arc-toggle-line">
          <input v-model="settings.banner_enabled" type="checkbox" /> Banner abilitato
        </label>
        <label class="arc-fld">
          <span>Testo banner</span>
          <textarea v-model="settings.banner_text" class="in" rows="2" placeholder="Annuncio in alto…"></textarea>
        </label>
        <label class="arc-toggle-line">
          <input v-model="settings.disclaimer_enabled" type="checkbox" /> Disclaimer abilitato
        </label>
        <label class="arc-fld">
          <span>Testo disclaimer</span>
          <textarea v-model="settings.disclaimer_text" class="in" rows="2" placeholder="Disclaimer…"></textarea>
        </label>
        <div class="arc-form-actions">
          <span style="flex:1"></span>
          <button class="btn btn-p btn-sm" type="button" :disabled="saving" @click="saveSettings">💾 Salva</button>
        </div>
      </div>

      <div class="arc-panel">
        <h3 class="arc-panel-title">Webhook Discord</h3>
        <label class="arc-fld">
          <span>URL</span>
          <input v-model="webhook.url" class="in" placeholder="https://discord.com/api/webhooks/…" />
        </label>
        <label class="arc-toggle-line">
          <input v-model="webhook.enabled" type="checkbox" /> Abilitato
        </label>
        <div class="arc-form-actions">
          <button class="btn btn-soft btn-sm" type="button" :disabled="webhookSaving" @click="testWebhook">Prova</button>
          <span v-if="testResult" style="font-size:12px;opacity:.8">{{ testResult }}</span>
          <span style="flex:1"></span>
          <button class="btn btn-p btn-sm" type="button" :disabled="webhookSaving" @click="saveWebhook">💾 Salva</button>
        </div>
      </div>

      <div class="arc-panel">
        <h3 class="arc-panel-title">Token GitHub</h3>
        <p class="arc-hint">
          Stato: <span :style="{ color: tokenStatus.ok ? '#8fceaa' : '#e28383' }">
            {{ tokenStatus.configured ? (tokenStatus.ok ? 'configurato e valido' : 'configurato ma non valido') : 'non configurato' }}
          </span>
          <template v-if="tokenStatus.message"> — {{ tokenStatus.message }}</template>
        </p>
        <label class="arc-fld">
          <span>Nuovo token (PAT con diritti sul repo)</span>
          <input v-model="newToken" type="password" class="in" placeholder="ghp_…" />
        </label>
        <div class="arc-form-actions">
          <span style="flex:1"></span>
          <button class="btn btn-p btn-sm" type="button" :disabled="tokenSaving" @click="saveToken">💾 Imposta</button>
        </div>
      </div>

      <div class="arc-panel">
        <h3 class="arc-panel-title">Sezioni del registro</h3>
        <div class="arc-form-actions" style="flex-wrap:wrap;margin-bottom:10px">
          <span v-for="s in registry.sections" :key="s.v" class="arc-chip">
            {{ s.l }} <code>{{ s.v }}</code>
            <button class="arc-chip-x" type="button" @click="removeSection(s.v)">✕</button>
          </span>
        </div>
        <div class="arc-form-actions">
          <input v-model="newSection.v" class="in" style="max-width:120px" placeholder="chiave" />
          <input v-model="newSection.l" class="in" style="flex:1" placeholder="etichetta" />
          <button class="btn btn-soft btn-sm" type="button" @click="addSection">+</button>
        </div>
        <div class="arc-form-actions" style="margin-top:10px">
          <span style="flex:1"></span>
          <button class="btn btn-p btn-sm" type="button" :disabled="saving" @click="saveSections">💾 Salva sezioni</button>
        </div>
      </div>
    </div>
    </AdminOnly>
  </section>
</template>