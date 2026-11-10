<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { errorText, registryApi, siteInterfaceApi } from '@/shared/api'
import { confirmAction } from '@/shared/confirm'
import { useUnsavedGuard } from '@/shared/guard'
import { useRegistryStore, useUIStore } from '@/app/store'
import AdminOnly from '@/features/interface/components/AdminOnly.vue'
import MediaDrawer from '@/features/pages/editor/MediaDrawer.vue'
import {
  SITE_INTERFACE_LIMITS,
  SITE_INTERFACE_MAX_LINKS,
  defaultSiteInterface,
  normalizeSiteInterface,
  renderInterfaceBrand,
  renderInterfaceFooter,
  renderInterfaceSkipLink,
  siteInterfaceHash
} from '@/shared/site-interface'
import type { InterfaceFooterLink, SiteInterfaceConfig } from '@/shared/site-interface'
import type { UIBottomNavItem, UIAction } from '@/types'

/* ════════════════════════════════════════════════════════════════
   INTERFACCIA DEL SITO

   Nome, logo, tagline, footer e testi globali vivono in
   content/interface.json: una sola configurazione, usata dal build
   per generare l'HTML statico. L'anteprima impiega lo stesso
   renderer e gli stessi CSS del sito, quindi non può divergere.

   La barra di navigazione mobile resta nel registry (dati diversi,
   salvataggio separato): qui convivono perché sono entrambe
   "interfaccia", ma non si sovrascrivono a vicenda.
   ════════════════════════════════════════════════════════════════ */

type Device = 'desktop' | 'mobile'

interface Draft {
  savedAt: string
  config: SiteInterfaceConfig
}

const DRAFT_KEY = 'arc-interface-draft-v1'
const DEVICE_WIDTH: Record<Device, string> = { desktop: '100%', mobile: '390px' }
const VERIFY_ATTEMPTS = 8
const VERIFY_DELAY_MS = 15_000

const ui = useUIStore()
const registry = useRegistryStore()

const config = ref<SiteInterfaceConfig>(defaultSiteInterface())
const published = ref<SiteInterfaceConfig | null>(null)
const publishedHash = ref('')
const sha = ref('')
const source = ref<'github' | 'default'>('github')
const loading = ref(true)
const saving = ref(false)
const previewOpen = ref(true)
const device = ref<Device>('desktop')
const draftNotice = ref('')
const pickerOpen = ref(false)
const historyOpen = ref(false)
const history = ref<Array<{ sha: string; date: string; message: string }>>([])
const historyLoading = ref(false)

const verification = ref<{ state: 'idle' | 'pending' | 'ok' | 'failed'; message: string }>({
  state: 'idle',
  message: ''
})
const siteState = ref<{ state: 'unknown' | 'ok' | 'stale'; message: string }>({ state: 'unknown', message: '' })

let draftTimer: ReturnType<typeof setTimeout> | null = null
let verifyTimer: ReturnType<typeof setTimeout> | null = null

const normalizedValue = computed(() => normalizeSiteInterface(config.value).config)
const dirty = computed(
  () =>
    !loading.value &&
    publishedHash.value !== '' &&
    siteInterfaceHash(normalizedValue.value) !== publishedHash.value
)
useUnsavedGuard(() => dirty.value || registry.dirty, 'modifiche all’interfaccia non salvate')

/* ── Barra di navigazione mobile (registry, invariata) ───────── */

const drawerSearch = ref(true)
const items = ref<UIBottomNavItem[]>([])

const actionsMap: Array<{ v: UIAction; l: string }> = [
  { v: 'home', l: 'Home' },
  { v: 'drawer', l: 'Drawer (menu)' },
  { v: 'options', l: 'Opzioni' },
  { v: 'page', l: 'Pagina' },
  { v: 'url', l: 'URL esterno' }
]

function addNavItem(): void {
  items.value.push({ icon: '➕', label: 'Nuova voce', action: 'home' })
}

function moveNavItem(idx: number, dir: number): void {
  const to = idx + dir
  if (to < 0 || to >= items.value.length) return
  const [m] = items.value.splice(idx, 1)
  items.value.splice(to, 0, m)
}

function removeNavItem(idx: number): void {
  items.value.splice(idx, 1)
}

async function saveNavigation(): Promise<void> {
  try {
    registry.setUIConfig({ bottomNav: items.value, drawerSearch: drawerSearch.value })
    await registryApi.save(registry.pages, registry.sections, registry.uiConfig, 'admin: update ui config')
    registry.clearDirty()
    ui.toast('Navigazione salvata — deploy in corso (~30s)', 'success')
  } catch (e) {
    ui.toast('Errore salvataggio: ' + errorText(e), 'error')
  }
}

/* ── Bozza locale ────────────────────────────────────────────── */

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Draft
    if (!parsed || typeof parsed !== 'object' || !parsed.config) return null
    return parsed
  } catch {
    return null
  }
}

function writeDraft(): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: new Date().toISOString(), config: config.value }))
  } catch {
    /* storage pieno o negato: la bozza locale è solo una comodità */
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignorato */
  }
}

function scheduleDraftSave(): void {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(writeDraft, 700)
}

watch(
  config,
  () => {
    if (loading.value) return
    if (dirty.value) scheduleDraftSave()
  },
  { deep: true }
)

/* ── Caricamento e stato del pubblicato ──────────────────────── */

async function load(): Promise<void> {
  loading.value = true
  draftNotice.value = ''
  try {
    const doc = await siteInterfaceApi.get()
    sha.value = doc.sha
    published.value = doc.config
    publishedHash.value = doc.hash
    source.value = doc.source
    config.value = doc.config
    if (doc.warnings.length) ui.toast(doc.warnings.join(' '), 'warning', { title: 'Configurazione interfaccia' })

    const draft = readDraft()
    if (draft) {
      const draftConfig = normalizeSiteInterface(draft.config).config
      if (siteInterfaceHash(draftConfig) !== doc.hash) {
        config.value = draftConfig
        draftNotice.value = draft.savedAt
      } else {
        clearDraft()
      }
    }

    await checkSiteState()
  } catch (e) {
    ui.toast('Interfaccia non caricata: ' + errorText(e), 'error')
  } finally {
    loading.value = false
  }
}

async function loadRegistry(): Promise<void> {
  try {
    const data = await registryApi.get()
    registry.setRegistry(data.pages || [], data.sections || [], data.ui)
    items.value = (data.ui?.bottomNav || []).map((i) => ({ ...i }))
    drawerSearch.value = data.ui?.drawerSearch !== false
  } catch {
    /* la navigazione mobile è secondaria in questa pagina */
  }
}

async function checkSiteState(): Promise<void> {
  try {
    const result = await siteInterfaceApi.verifyPublished(publishedHash.value)
    if (result.ok) {
      siteState.value = { state: 'ok', message: 'Il sito online serve la configurazione pubblicata.' }
    } else if (result.found) {
      siteState.value = {
        state: 'stale',
        message: `Il sito online serve un'altra versione (${result.found}): un deploy potrebbe essere in corso.`
      }
    } else {
      siteState.value = {
        state: 'unknown',
        message: 'Impronta non rilevata in questa anteprima locale: la verifica funziona sul sito pubblicato.'
      }
    }
  } catch {
    siteState.value = { state: 'unknown', message: 'Verifica del pubblicato non disponibile da questa anteprima.' }
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('it-IT')
}

/* ── Footer: link ripetibili ────────────────────────────────── */

function addFooterLink(): void {
  if (config.value.footer.links.length >= SITE_INTERFACE_MAX_LINKS) return
  config.value.footer.links.push({ label: 'Nuovo link', href: '/', external: false, kind: '' })
}

function removeFooterLink(index: number): void {
  config.value.footer.links.splice(index, 1)
}

function moveFooterLink(index: number, dir: -1 | 1): void {
  const to = index + dir
  if (to < 0 || to >= config.value.footer.links.length) return
  const [moved] = config.value.footer.links.splice(index, 1)
  config.value.footer.links.splice(to, 0, moved)
}

function onLinkKindChange(link: InterfaceFooterLink, event: Event): void {
  const kind = (event.target as HTMLSelectElement).value === 'credits' ? 'credits' : ''
  link.kind = kind
  if (kind === 'credits') link.href = ''
}

/* ── Logo ───────────────────────────────────────────────────── */

function onPickLogo(path: string): void {
  config.value.site.logo = path
  pickerOpen.value = false
}

/* ── Anteprima ──────────────────────────────────────────────── */

const PREVIEW_CSS = ['fonts', 'style-base', 'theme-v2', 'shell-v2', 'style-home', 'style-fx', 'style-ui']

/** I testi arrivano dall'editor: nell'anteprima vanno escapati come nel build. */
function escPreview(value: string): string {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const previewDoc = computed(() => {
  const value = normalizedValue.value
  const links = PREVIEW_CSS.map((name) => `<link rel="stylesheet" href="/scripts/css/${name}.css">`).join('\n  ')
  return [
    '<!DOCTYPE html><html lang="it" data-theme="dark"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `  ${links}`,
    '  <style>',
    '    html,body{margin:0;background:#080a0e;color:#e8e4da}',
    '    body{font-family:"Crimson Pro",Georgia,serif}',
    '    #topbar{position:sticky!important;top:0!important;z-index:5}',
    '    .if-note{padding:10px 16px;border-bottom:1px solid rgba(200,155,60,.2);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#c8b483}',
    '    .if-page{min-height:260px;display:grid;place-items:center;padding:40px 24px;text-align:center}',
    '    .if-page strong{display:block;font-family:Cinzel,Georgia,serif;font-size:22px;color:#d4af37;letter-spacing:.06em}',
    '    .if-page span{display:block;margin-top:8px;color:#b8a97e;font-size:14px}',
    '    .if-meta{margin-top:18px;font-size:12px;color:#8f846b}',
    '  </style>',
    '</head><body>',
    renderInterfaceSkipLink(value),
    '<div class="if-note">Anteprima header, testi e footer · il contenuto della pagina è un segnaposto</div>',
    `<header id="topbar" aria-label="Header principale">${renderInterfaceBrand(value)}</header>`,
    '<main class="if-page">',
    `  <div><strong>${escPreview(value.site.name)}</strong><span>${escPreview(value.site.tagline)}</span>`,
    `  <div class="if-meta">Loader: ${escPreview(value.site.loaderText)} · Ricerca: “${escPreview(
      value.texts.searchPlaceholder
    )}”</div></div>`,
    '</main>',
    `<footer id="site-footer">${renderInterfaceFooter(value)}</footer>`,
    '</body></html>'
  ].join('\n')
})

/* ── Salvataggio, verifica, cronologia ──────────────────────── */

async function save(): Promise<void> {
  if (saving.value) return
  const validation = normalizeSiteInterface(config.value)
  if (validation.errors.length) {
    ui.toast(validation.errors.join(' '), 'error', { title: 'Controlla la configurazione' })
    return
  }
  if (validation.warnings.length) ui.toast(validation.warnings.join(' '), 'warning')

  const ok = await confirmAction({
    title: 'Pubblica l’interfaccia',
    message: 'Salvare e pubblicare nome, logo, footer e testi globali?',
    detail: `${validation.config.site.name} · commit su GitHub e deploy Cloudflare automatico (~30s).`,
    confirmLabel: 'Salva e pubblica'
  })
  if (!ok) return

  saving.value = true
  try {
    const result = await siteInterfaceApi.save(validation.config, sha.value)
    sha.value = result.sha
    published.value = result.config
    publishedHash.value = result.hash
    source.value = 'github'
    config.value = result.config
    clearDraft()
    draftNotice.value = ''
    ui.toast('Interfaccia salvata: commit creato, deploy in corso', 'success')
    startVerification(result.hash)
  } catch (e) {
    ui.toast('Salvataggio non riuscito: ' + errorText(e), 'error')
  } finally {
    saving.value = false
  }
}

function stopVerification(): void {
  if (verifyTimer) clearTimeout(verifyTimer)
  verifyTimer = null
}

function startVerification(hash: string): void {
  stopVerification()
  void verify(hash, 1)
}

async function verify(hash: string, attempt: number): Promise<void> {
  verification.value = {
    state: 'pending',
    message:
      attempt === 1
        ? 'Verifico il sito pubblicato…'
        : `Deploy non ancora visibile · tentativo ${attempt}/${VERIFY_ATTEMPTS}…`
  }
  try {
    const result = await siteInterfaceApi.verifyPublished(hash)
    if (result.ok) {
      verification.value = { state: 'ok', message: 'Pubblicata e verificata: il sito online serve questa versione.' }
      siteState.value = { state: 'ok', message: 'Il sito online serve la configurazione pubblicata.' }
      return
    }
    if (!result.found) {
      verification.value = {
        state: 'failed',
        message: 'Impronta non trovata nella home online: verifica dal sito pubblicato (non da un’anteprima locale).'
      }
      return
    }
  } catch (e) {
    verification.value = { state: 'failed', message: 'Verifica non riuscita: ' + errorText(e) }
    return
  }
  if (attempt >= VERIFY_ATTEMPTS) {
    verification.value = {
      state: 'failed',
      message: 'Commit creato ma il deploy non risulta ancora attivo. Riprova con «Verifica ora» tra qualche minuto.'
    }
    return
  }
  verifyTimer = setTimeout(() => void verify(hash, attempt + 1), VERIFY_DELAY_MS)
}

function verifyNow(): void {
  if (!publishedHash.value) return
  startVerification(publishedHash.value)
}

async function toggleHistory(): Promise<void> {
  historyOpen.value = !historyOpen.value
  if (!historyOpen.value) return
  historyLoading.value = true
  try {
    history.value = await siteInterfaceApi.history()
  } catch (e) {
    ui.toast('Cronologia non disponibile: ' + errorText(e), 'error')
  } finally {
    historyLoading.value = false
  }
}

async function restore(entry: { sha: string; date: string; message: string }): Promise<void> {
  const ok = await confirmAction({
    title: 'Carica dalla cronologia',
    message: `Caricare l’interfaccia del commit ${entry.sha.slice(0, 7)}?`,
    detail: 'La configurazione viene caricata nell’editor: non va online finché non la salvi.',
    confirmLabel: 'Carica'
  })
  if (!ok) return
  try {
    config.value = await siteInterfaceApi.getAt(entry.sha)
    ui.toast('Versione caricata: controlla l’anteprima e salva per pubblicarla', 'success')
  } catch (e) {
    ui.toast('Ripristino non riuscito: ' + errorText(e), 'error')
  }
}

function discardDraft(): void {
  if (!published.value) return
  config.value = normalizeSiteInterface(published.value).config
  draftNotice.value = ''
  clearDraft()
  ui.toast('Bozza locale scartata', 'info')
}

onMounted(async () => {
  await Promise.all([load(), loadRegistry()])
})

onBeforeUnmount(() => {
  stopVerification()
  if (draftTimer) clearTimeout(draftTimer)
})
</script>

<template>
  <section class="arc-dashboard if-view">
    <div class="arc-head-row">
      <h1 class="arc-page-title">Interfaccia</h1>
      <div class="arc-head-actions">
        <button class="btn btn-soft" type="button" :disabled="loading" @click="load">⟳ Ricarica</button>
        <button class="btn btn-soft" type="button" :aria-pressed="previewOpen" @click="previewOpen = !previewOpen">
          {{ previewOpen ? 'Nascondi anteprima' : 'Mostra anteprima' }}
        </button>
        <button class="btn btn-p" type="button" :disabled="saving || !dirty" @click="save">
          {{ saving ? 'Salvo…' : '💾 Salva e pubblica' }}
        </button>
      </div>
    </div>

    <div class="arc-panel if-intro">
      <div class="if-status">
        <span class="arc-chip" :class="{ 'is-dirty': dirty }">
          {{ dirty ? 'Modifiche non salvate' : 'Nessuna modifica — allineata al pubblicato' }}
        </span>
        <span v-if="siteState.state !== 'unknown'" class="arc-chip" :class="{ 'is-dirty': siteState.state !== 'ok' }">
          {{ siteState.state === 'ok' ? 'Sito allineato' : 'Sito da aggiornare' }}
        </span>
        <span v-if="source === 'default'" class="arc-chip is-dirty">File non ancora creato: valori predefiniti</span>
      </div>
      <p class="arc-hint">
        Nome, logo, tagline, footer e testi globali del sito. Le modifiche restano in bozza finché non premi
        <strong>Salva e pubblica</strong>: il commit aggiorna <code>content/interface.json</code> e il deploy rigenera
        header, footer, titoli e metadati di tutte le pagine (senza dipendere da JavaScript).
      </p>
      <p v-if="siteState.message" class="arc-hint" :class="{ 'if-warn': siteState.state !== 'ok' }">
        {{ siteState.message }}
      </p>
    </div>

    <div v-if="draftNotice" class="arc-panel if-banner">
      <span>📝 Bozza locale del {{ formatDate(draftNotice) }}: non è ancora pubblicata.</span>
      <button class="btn btn-soft btn-sm" type="button" @click="discardDraft">Scarta bozza</button>
    </div>

    <div v-if="verification.state !== 'idle'" class="arc-panel if-banner" :class="'is-' + verification.state">
      <span>{{ verification.message }}</span>
      <button class="btn btn-soft btn-sm" type="button" :disabled="verification.state === 'pending'" @click="verifyNow">
        Verifica ora
      </button>
    </div>

    <div v-if="loading" class="arc-empty-side">Caricamento interfaccia…</div>

    <div v-else class="if-layout" :class="{ 'has-preview': previewOpen }">
      <div class="if-form">
        <div class="arc-panel">
          <h3 class="arc-panel-title">Identità del sito</h3>
          <div class="arc-form-grid" style="grid-template-columns: 1fr 1fr">
            <label class="arc-fld">
              <span>Nome del sito (titoli e SEO)</span>
              <input v-model="config.site.name" class="in" :maxlength="SITE_INTERFACE_LIMITS.name" />
              <small class="arc-field-help">Compare in &lt;title&gt;, og:site_name e manifest.</small>
            </label>
            <label class="arc-fld">
              <span>Nome breve (header e footer)</span>
              <input v-model="config.site.brand" class="in" :maxlength="SITE_INTERFACE_LIMITS.brand" />
            </label>
          </div>

          <label class="arc-fld">
            <span>Tagline</span>
            <input v-model="config.site.tagline" class="in" :maxlength="SITE_INTERFACE_LIMITS.tagline" />
          </label>

          <div class="arc-fld">
            <span>Logo</span>
            <div class="if-logo-row">
              <img v-if="config.site.logo" class="if-logo-preview" :src="config.site.logo" :alt="config.site.logoAlt || 'Logo'" />
              <input
                v-model="config.site.logo"
                class="in"
                :maxlength="SITE_INTERFACE_LIMITS.logo"
                placeholder="/Artboard_1.png"
                aria-label="Percorso del logo"
              />
              <button class="btn btn-soft btn-sm" type="button" @click="pickerOpen = true">Libreria</button>
            </div>
            <small class="arc-field-help">Percorso del sito (/images/…) o URL https. Usato da header e loader.</small>
          </div>

          <div class="arc-form-grid" style="grid-template-columns: 1fr 1fr">
            <label class="arc-fld">
              <span>Testo alternativo del logo</span>
              <input v-model="config.site.logoAlt" class="in" :maxlength="SITE_INTERFACE_LIMITS.logoAlt" />
            </label>
            <label class="arc-fld">
              <span>Testo sotto il logo (loader)</span>
              <input v-model="config.site.loaderText" class="in" :maxlength="SITE_INTERFACE_LIMITS.loaderText" />
            </label>
          </div>
        </div>

        <div class="arc-panel">
          <div class="arc-form-actions" style="margin-bottom: 10px">
            <h3 class="arc-panel-title" style="margin: 0">Footer</h3>
            <span style="flex: 1"></span>
            <button
              class="btn btn-soft btn-sm"
              type="button"
              :disabled="config.footer.links.length >= SITE_INTERFACE_MAX_LINKS"
              @click="addFooterLink"
            >
              + Link
            </button>
          </div>

          <label class="arc-fld">
            <span>Nota legale</span>
            <textarea v-model="config.footer.legal" class="in" rows="3" :maxlength="SITE_INTERFACE_LIMITS.legal"></textarea>
          </label>

          <div v-for="(link, index) in config.footer.links" :key="'footer-link-' + index" class="if-row if-row--link">
            <input
              v-model="link.label"
              class="in"
              :maxlength="SITE_INTERFACE_LIMITS.linkLabel"
              placeholder="Etichetta"
              aria-label="Etichetta del link"
            />
            <select
              class="in if-kind"
              :value="link.kind"
              aria-label="Tipo di link"
              @change="onLinkKindChange(link, $event)"
            >
              <option value="">Destinazione</option>
              <option value="credits">Pagina Crediti</option>
            </select>
            <input
              v-if="link.kind !== 'credits'"
              v-model="link.href"
              class="in"
              :maxlength="SITE_INTERFACE_LIMITS.href"
              placeholder="/changelog oppure https://…"
              aria-label="Destinazione del link"
            />
            <label v-else class="arc-toggle-line if-inline">Pagina interna gestita dal sito</label>
            <label v-if="link.kind !== 'credits'" class="arc-toggle-line if-inline">
              <input v-model="link.external" type="checkbox" /> esterno
            </label>
            <button class="arc-icon-btn" type="button" title="Sposta su" :disabled="index === 0" @click="moveFooterLink(index, -1)">
              ↑
            </button>
            <button
              class="arc-icon-btn"
              type="button"
              title="Sposta giù"
              :disabled="index === config.footer.links.length - 1"
              @click="moveFooterLink(index, 1)"
            >
              ↓
            </button>
            <button class="arc-icon-btn" type="button" title="Rimuovi link" @click="removeFooterLink(index)">✕</button>
          </div>
          <p v-if="!config.footer.links.length" class="arc-hint">Nessun link: il footer mostra solo nome, tagline e nota legale.</p>
          <p class="arc-hint">La voce «Pagina Crediti» apre la pagina legale interna; le altre vanno a un percorso o a un URL esterno.</p>
        </div>

        <div class="arc-panel">
          <h3 class="arc-panel-title">Testi globali</h3>
          <div class="arc-form-grid" style="grid-template-columns: 1fr 1fr">
            <label class="arc-fld">
              <span>Link “salta al contenuto”</span>
              <input v-model="config.texts.skipLink" class="in" :maxlength="SITE_INTERFACE_LIMITS.skipLink" />
            </label>
            <label class="arc-fld">
              <span>Placeholder della ricerca</span>
              <input
                v-model="config.texts.searchPlaceholder"
                class="in"
                :maxlength="SITE_INTERFACE_LIMITS.searchPlaceholder"
              />
            </label>
          </div>
          <p class="arc-hint">
            Il placeholder compare nella ricerca desktop e mobile. La nota del disclaimer e i testi del banner restano in
            <router-link to="/impostazioni">Impostazioni</router-link>, dove hanno già il loro editor.
          </p>
        </div>

        <AdminOnly>
          <div class="arc-panel">
            <div class="arc-form-actions" style="margin-bottom: 10px">
              <h3 class="arc-panel-title" style="margin: 0">Navigazione in basso (sito mobile)</h3>
              <span style="flex: 1"></span>
              <button class="btn btn-soft btn-sm" type="button" @click="addNavItem">+ Aggiungi voce</button>
              <button class="btn btn-p btn-sm" type="button" @click="saveNavigation">💾 Salva navigazione</button>
            </div>
            <label class="arc-toggle-line">
              <input v-model="drawerSearch" type="checkbox" />
              Mostra ricerca nel drawer
            </label>
            <div v-for="(item, idx) in items" :key="'nav-' + idx" class="arc-navrow">
              <div class="arc-navrow-move">
                <button class="btn btn-soft btn-sm" type="button" :disabled="idx === 0" @click="moveNavItem(idx, -1)">↑</button>
                <button
                  class="btn btn-soft btn-sm"
                  type="button"
                  :disabled="idx === items.length - 1"
                  @click="moveNavItem(idx, 1)"
                >
                  ↓
                </button>
              </div>
              <input v-model="item.icon" class="in" style="max-width: 64px" placeholder="🏰" />
              <input v-model="item.label" class="in" style="max-width: 180px" placeholder="Etichetta" />
              <select v-model="item.action" class="in" style="max-width: 160px">
                <option v-for="a in actionsMap" :key="a.v" :value="a.v">{{ a.l }}</option>
              </select>
              <input
                v-if="item.action === 'page' || item.action === 'url'"
                v-model="item.target"
                class="in"
                style="flex: 1; min-width: 120px"
                :placeholder="item.action === 'page' ? 'pag-xxx' : 'https://…'"
              />
              <span v-else style="flex: 1"></span>
              <button class="btn btn-d btn-sm" type="button" @click="removeNavItem(idx)">🗑</button>
            </div>
            <div v-if="!items.length" class="arc-empty-side">Nessuna voce. Aggiungine una.</div>
            <p class="arc-hint">La navigazione mobile vive nel registry delle pagine e ha un salvataggio separato.</p>
          </div>
        </AdminOnly>

        <div class="if-tools">
          <span class="if-grow"></span>
          <button class="btn btn-soft" type="button" @click="toggleHistory">🕘 Cronologia</button>
        </div>

        <div v-if="historyOpen" class="arc-panel if-history">
          <div class="arc-form-actions">
            <h3 class="arc-panel-title" style="margin: 0">Cronologia di content/interface.json</h3>
            <span style="flex: 1"></span>
            <button class="btn btn-soft btn-sm" type="button" @click="historyOpen = false">Chiudi</button>
          </div>
          <p v-if="historyLoading" class="arc-hint">Caricamento…</p>
          <ul v-else>
            <li v-for="entry in history" :key="entry.sha">
              <div>
                <strong>{{ entry.message }}</strong>
                <small>{{ formatDate(entry.date) }} · {{ entry.sha.slice(0, 7) }}</small>
              </div>
              <button class="btn btn-soft btn-sm" type="button" @click="restore(entry)">Carica</button>
            </li>
          </ul>
          <p v-if="!historyLoading && !history.length" class="arc-hint">Nessun commit per questo file.</p>
        </div>
      </div>

      <aside v-if="previewOpen" class="if-preview" aria-label="Anteprima interfaccia">
        <div class="if-preview-head">
          <span class="if-preview-title">Anteprima live</span>
          <div class="if-devices" role="group" aria-label="Dimensione anteprima">
            <button
              v-for="size in (['desktop', 'mobile'] as Device[])"
              :key="size"
              class="if-device"
              type="button"
              :class="{ active: device === size }"
              :aria-pressed="device === size"
              @click="device = size"
            >
              {{ size === 'desktop' ? '🖥' : '📱' }}
              <span>{{ size }}</span>
            </button>
          </div>
        </div>
        <div class="if-frame-wrap">
          <iframe
            class="if-frame"
            :style="{ width: DEVICE_WIDTH[device] }"
            :srcdoc="previewDoc"
            title="Anteprima di header, testi e footer"
            loading="lazy"
          ></iframe>
        </div>
        <p class="arc-hint">
          Stessi CSS e stesso renderer del build pubblico. La pagina centrale è un segnaposto: qui si verificano header,
          logo, testi e footer, non i contenuti delle singole pagine.
        </p>
      </aside>
    </div>

    <MediaDrawer :open="pickerOpen" title="Scegli il logo del sito" @close="pickerOpen = false" @pick="onPickLogo" />
  </section>
</template>

<style scoped>
.if-view {
  --if-gap: 18px;
}
.if-intro {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}
.if-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.if-warn {
  color: #e0b35a;
}
.if-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.if-banner.is-pending {
  border-color: rgba(200, 155, 60, 0.45);
}
.if-banner.is-ok {
  border-color: rgba(80, 170, 110, 0.5);
}
.if-banner.is-failed {
  border-color: rgba(190, 80, 70, 0.55);
}
.if-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--if-gap);
  align-items: start;
}
.if-form {
  min-width: 0;
  display: grid;
  gap: 16px;
}
.if-logo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.if-logo-preview {
  width: 46px;
  height: 46px;
  object-fit: contain;
  flex: none;
  border: 1px solid rgba(200, 155, 60, 0.25);
  border-radius: 4px;
  background: #0b0e14;
}
.if-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 0;
  border-bottom: 1px solid rgba(200, 155, 60, 0.12);
}
.if-row:last-of-type {
  border-bottom: 0;
}
.if-row .in {
  flex: 1 1 150px;
  min-width: 120px;
}
.if-kind {
  flex: 0 1 170px !important;
}
.if-inline {
  white-space: nowrap;
  font-size: 12px;
}
.if-tools {
  display: flex;
  gap: 8px;
}
.if-grow {
  flex: 1;
}
.if-history ul {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.if-history li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid rgba(200, 155, 60, 0.14);
  border-radius: 4px;
}
.if-history small {
  display: block;
  opacity: 0.7;
  font-size: 11px;
  margin-top: 2px;
}
.if-preview {
  position: sticky;
  top: 16px;
  min-width: 0;
}
.if-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.if-preview-title {
  font-family: var(--font-title, Cinzel, Georgia, serif);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #d4af37;
}
.if-devices {
  display: flex;
  gap: 4px;
}
.if-device {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: #b8a97e;
  background: transparent;
  border: 1px solid rgba(200, 155, 60, 0.2);
  border-radius: 3px;
  cursor: pointer;
}
.if-device.active {
  color: #f0d98a;
  border-color: rgba(200, 155, 60, 0.6);
  background: rgba(200, 155, 60, 0.12);
}
.if-frame-wrap {
  border: 1px solid rgba(200, 155, 60, 0.25);
  border-radius: 6px;
  overflow: hidden;
  background: #080a0e;
}
.if-frame {
  display: block;
  height: 620px;
  max-width: 100%;
  margin: 0 auto;
  border: 0;
  background: #080a0e;
}
@media (min-width: 1280px) {
  .if-layout.has-preview {
    grid-template-columns: minmax(0, 1fr) minmax(380px, 520px);
  }
}
@media (max-width: 720px) {
  .if-banner {
    flex-direction: column;
    align-items: flex-start;
  }
  .if-frame {
    height: 520px;
  }
}
</style>
