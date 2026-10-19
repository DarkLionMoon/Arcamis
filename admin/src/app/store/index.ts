/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Pinia Store
   Centralized state management for the entire admin panel
   ════════════════════════════════════════════════════════════════ */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  UserRole,
  PageRegistryEntry,
  SectionRegistryEntry,
  PageContent,
  MapPin,
  MapData,
  CarouselConfig,
  CarouselSettings,
  CarouselSlideFull,
  UIConfig,
  AuditEntry,
  AnalyticsData,
  DeployStatus,
  LayoutRegistryEntry,
  CoversMap
} from '@/types'

// ──────────────────────────────────────────────
// Auth Store
// ──────────────────────────────────────────────
export const useAuthStore = defineStore('auth', () => {
  const user = ref<string | null>(null)
  const role = ref<UserRole>('viewer')
  const csrfToken = ref<string | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => role.value === 'admin')
  const isEditor = computed(() => role.value === 'editor' || role.value === 'admin')
  const canSave = computed(() => isEditor.value)
  const canDelete = computed(() => isAdmin.value)
  const canManageUsers = computed(() => isAdmin.value)

  function setAuth(u: string, r: UserRole, token: string) {
    user.value = u
    role.value = r
    csrfToken.value = token
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.setItem('arcadmin', '1')
    sessionStorage.setItem('arcadmin_user', u)
    sessionStorage.setItem('arcadmin_role', r)
  }

  function clearAuth() {
    user.value = null
    role.value = 'viewer'
    csrfToken.value = null
    if (typeof sessionStorage === 'undefined') return
    sessionStorage.removeItem('arcadmin')
    sessionStorage.removeItem('arcadmin_user')
    sessionStorage.removeItem('arcadmin_role')
  }

  function restoreFromSession() {
    if (typeof sessionStorage === 'undefined') return
    if (sessionStorage.getItem('arcadmin') === '1') {
      const u = sessionStorage.getItem('arcadmin_user')
      const r = sessionStorage.getItem('arcadmin_role') as UserRole
      if (u && r) {
        user.value = u
        role.value = r
        // csrfToken will be fetched on first API call
      }
    }
  }

  return {
    user,
    role,
    csrfToken,
    isLoading,
    isAuthenticated,
    isAdmin,
    isEditor,
    canSave,
    canDelete,
    canManageUsers,
    setAuth,
    clearAuth,
    restoreFromSession
  }
})

// ──────────────────────────────────────────────
// Registry Store (pages, sections, UI config)
// ──────────────────────────────────────────────
export const useRegistryStore = defineStore('registry', () => {
  const pages = ref<PageRegistryEntry[]>([])
  const sections = ref<SectionRegistryEntry[]>([])
  const uiConfig = ref<UIConfig>({
    bottomNav: [
      { icon: '🏰', label: 'Home', action: 'home' },
      { icon: '🧭', label: 'Esplora', action: 'drawer' },
      { icon: '💼', label: 'Lavori', action: 'page', target: 'pag-lavori' },
      { icon: '⚙️', label: 'Opzioni', action: 'options' }
    ],
    drawerSearch: true
  })
  const loading = ref(false)
  const error = ref<string | null>(null)
  /* Modifiche non salvate del registro (menu, sezioni, configurazione UI):
     prima solo lo store sapeva di essere stato toccato, quindi nessun guard
     poteva avvisare prima di perdere il lavoro. */
  const dirty = ref(false)

  const pagesByKey = computed(() => {
    const map = new Map<string, PageRegistryEntry>()
    pages.value.forEach((p) => map.set(p.k, p))
    return map
  })

  const pagesById = computed(() => {
    const map = new Map<string, PageRegistryEntry>()
    pages.value.forEach((p) => map.set(p.id, p))
    return map
  })

  const sectionsByValue = computed(() => {
    const map = new Map<string, SectionRegistryEntry>()
    sections.value.forEach((s) => map.set(s.v, s))
    return map
  })

  function setRegistry(p: PageRegistryEntry[], s: SectionRegistryEntry[], ui?: UIConfig) {
    pages.value = p
    sections.value = s
    if (ui) uiConfig.value = ui
    dirty.value = false
  }

  function markDirty() {
    dirty.value = true
  }

  function clearDirty() {
    dirty.value = false
  }

  function updatePage(key: string, updates: Partial<PageRegistryEntry>) {
    const idx = pages.value.findIndex((p) => p.k === key)
    if (idx !== -1) {
      pages.value[idx] = { ...pages.value[idx], ...updates }
      dirty.value = true
    }
  }

  function addPage(page: PageRegistryEntry) {
    pages.value.push(page)
    dirty.value = true
  }

  function removePage(key: string) {
    pages.value = pages.value.filter((p) => p.k !== key)
    dirty.value = true
  }

  function reorderPages(fromIndex: number, toIndex: number) {
    const [moved] = pages.value.splice(fromIndex, 1)
    pages.value.splice(toIndex, 0, moved)
    dirty.value = true
  }

  function updateSection(value: string, updates: Partial<SectionRegistryEntry>) {
    const idx = sections.value.findIndex((s) => s.v === value)
    if (idx !== -1) {
      sections.value[idx] = { ...sections.value[idx], ...updates }
      dirty.value = true
    }
  }

  function addSection(section: SectionRegistryEntry) {
    sections.value.push(section)
    dirty.value = true
  }

  function removeSection(value: string) {
    sections.value = sections.value.filter((s) => s.v !== value)
    dirty.value = true
  }

  function setUIConfig(config: UIConfig) {
    uiConfig.value = config
    dirty.value = true
  }

  return {
    pages,
    sections,
    uiConfig,
    loading,
    error,
    dirty,
    markDirty,
    clearDirty,
    pagesByKey,
    pagesById,
    sectionsByValue,
    setRegistry,
    updatePage,
    addPage,
    removePage,
    reorderPages,
    updateSection,
    addSection,
    removeSection,
    setUIConfig
  }
})

// ──────────────────────────────────────────────
// Current Page Editor Store
// ──────────────────────────────────────────────
/* L'impronta esclude ciò che cambia senza che l'utente tocchi nulla:
   lo sha della revisione GitHub e lastModified. Tutto il resto — testo,
   metadati, dati del modello, campi in lavorazione — conta come modifica. */
export function pageSnapshot(page: PageContent | null): string {
  if (!page) return ''
  const { sha: _sha, lastModified: _lastModified, ...rest } = page
  return JSON.stringify(rest)
}

export const useEditorStore = defineStore('editor', () => {
  const currentPage = ref<PageContent | null>(null)
  const saving = ref(false)
  const savedSnapshot = ref('')
  const lastSavedAt = ref<string | null>(null)
  const autosaveEnabled = ref(true)
  const mode = ref<'structure' | 'markdown'>('structure')
  const previewOpen = ref(true)
  const editorFontSize = ref(13)
  const showLineNumbers = ref(false)
  const wordWrap = ref(true)

  /* Confronto a impronta invece del solo testo: prima modificare titolo,
     icona o campi strutturati non risultava come modifica non salvata. */
  const hasUnsavedChanges = computed(
    () => Boolean(currentPage.value) && pageSnapshot(currentPage.value) !== savedSnapshot.value
  )
  const modified = hasUnsavedChanges

  function setPage(page: PageContent | null) {
    currentPage.value = page
    savedSnapshot.value = pageSnapshot(page)
    lastSavedAt.value = page?.lastModified || null
  }

  function setContent(content: string) {
    if (currentPage.value) currentPage.value.content = content
  }

  function setMetadata(updates: Partial<PageContent>) {
    if (currentPage.value) Object.assign(currentPage.value, updates)
  }

  function setTemplateData(data: PageContent['templateData']) {
    if (currentPage.value) currentPage.value.templateData = data
  }

  function setDraftFields(paths: string[]) {
    if (currentPage.value) currentPage.value.draftFields = [...paths]
  }

  function applyTemplate(templateId: string | undefined) {
    if (currentPage.value) currentPage.value.template = templateId
  }

  function markSaved(savedAt?: string) {
    savedSnapshot.value = pageSnapshot(currentPage.value)
    lastSavedAt.value = savedAt || currentPage.value?.lastModified || new Date().toISOString()
  }

  function setMode(next: 'structure' | 'markdown') {
    mode.value = next
  }

  function clear() {
    currentPage.value = null
    savedSnapshot.value = ''
    lastSavedAt.value = null
    mode.value = 'structure'
  }

  return {
    currentPage,
    saving,
    lastSavedAt,
    autosaveEnabled,
    mode,
    previewOpen,
    editorFontSize,
    showLineNumbers,
    wordWrap,
    modified,
    hasUnsavedChanges,
    setPage,
    setContent,
    setMetadata,
    setTemplateData,
    setDraftFields,
    applyTemplate,
    markSaved,
    setMode,
    clear
  }
})

// ──────────────────────────────────────────────
// Map Store
// ──────────────────────────────────────────────
export const useMapStore = defineStore('map', () => {
  const pins = ref<MapPin[]>([])
  const mapImage = ref<string>('/mappa.webp')
  const fileSha = ref<string | null>(null)
  const dirty = ref(false)
  const loading = ref(false)
  const active = ref(false)

  const pinTypes = [
    { v: 'city', l: 'Città', c: 'rgba(220,175,60,.95)', g: 'rgba(220,175,60,.8)' },
    { v: 'village', l: 'Villaggio', c: 'rgba(200,155,60,.85)', g: 'rgba(200,155,60,.65)' },
    { v: 'fort', l: 'Forte', c: 'rgba(190,130,50,.85)', g: 'rgba(190,130,50,.65)' },
    { v: 'forest', l: 'Foresta', c: 'rgba(60,200,80,.85)', g: 'rgba(60,200,80,.65)' },
    { v: 'water', l: 'Acqua', c: 'rgba(80,160,240,.85)', g: 'rgba(80,160,240,.65)' },
    { v: 'ruin', l: 'Rovine', c: 'rgba(150,80,240,.85)', g: 'rgba(150,80,240,.7)' },
    { v: 'fog', l: 'Nebbia', c: 'rgba(140,100,240,.85)', g: 'rgba(140,100,240,.7)' }
  ] as const

  function typeColor(type: string) {
    return pinTypes.find((t) => t.v === type)?.c || 'rgba(200,155,60,.9)'
  }

  function typeLabel(type: string) {
    return pinTypes.find((t) => t.v === type)?.l || type
  }

  function setMapData(data: MapData) {
    pins.value = data.pins
    mapImage.value = data.mapImage
    dirty.value = false
  }

  function addPin(pin: MapPin) {
    pins.value.push(pin)
    dirty.value = true
  }

  function updatePin(index: number, updates: Partial<MapPin>) {
    if (pins.value[index]) {
      pins.value[index] = { ...pins.value[index], ...updates }
      dirty.value = true
    }
  }

  function deletePin(index: number) {
    pins.value.splice(index, 1)
    dirty.value = true
  }

  function reorderPins(from: number, to: number) {
    const [moved] = pins.value.splice(from, 1)
    pins.value.splice(to, 0, moved)
    dirty.value = true
  }

  function setMapImage(url: string) {
    mapImage.value = url
    dirty.value = true
  }

  function markSaved() {
    dirty.value = false
  }

  function clear() {
    pins.value = []
    mapImage.value = '/mappa.webp'
    fileSha.value = null
    dirty.value = false
    active.value = false
  }

  return {
    pins,
    mapImage,
    fileSha,
    dirty,
    loading,
    active,
    pinTypes,
    typeColor,
    typeLabel,
    setMapData,
    markSaved,
    addPin,
    updatePin,
    deletePin,
    reorderPins,
    setMapImage,
    clear
  }
})

// ──────────────────────────────────────────────
// Carousel Store
// ──────────────────────────────────────────────
/* Le slide sono dinamiche (manifest KV): questi sono solo i seed usati
   quando il manifest non esiste ancora — gli stessi default hardcoded
   della home, così l'editor parte senza migrazioni. */
export const CAROUSEL_SEED_SLIDES: CarouselSlideFull[] = [
  {
    id: 'carousel_0',
    label: 'Slide 1 — Arcamis Porto',
    img: '',
    tag: 'Città Portuale — Marche di Arcamis',
    tit: 'ARCAMIS',
    sub: '',
    desc: "Città portuale delle Marche di Arcamis, porta d'ingresso al regno di Arcadia. Solo una piccola parte della regione è esplorata dai giocatori.",
    btns: [
      { label: 'Entra nel Discord', href: 'https://discord.gg/JZPnXZbXEJ' },
      { label: 'Scopri la città ↓', href: '' }
    ],
    hidden: false
  },
  {
    id: 'carousel_1',
    label: 'Slide 2 — Pantheon',
    img: '',
    tag: 'Pantheon di Arcamis',
    tit: 'LE DIVINITÀ DI ARCAMIS',
    sub: '',
    desc: 'Ogni dio ha lasciato il proprio segno sulla terra. Scopri il Pantheon e i culti che plasmano il mondo.',
    btns: [{ label: 'Scopri il Pantheon →', href: '' }],
    hidden: false
  },
  {
    id: 'carousel_2',
    label: 'Slide 3 — Personaggio',
    img: '',
    tag: 'Crea il tuo eroe',
    tit: 'CREA IL TUO PERSONAGGIO',
    sub: '',
    desc: 'Scegli la tua classe, forgia la tua storia. Il tuo personaggio esiste solo su Arcamis.',
    btns: [{ label: 'Come si inizia →', href: '' }],
    hidden: false
  }
]

export const CAROUSEL_DEFAULT_SETTINGS: CarouselSettings = { intervalMs: 6000, pauseOnHover: true }
export const CAROUSEL_MAX_SLIDES = 8

export const useCarouselStore = defineStore('carousel', () => {
  const slides = ref<CarouselSlideFull[]>([])
  const settings = ref<CarouselSettings>({ ...CAROUSEL_DEFAULT_SETTINGS })
  const managed = ref(false)
  const loading = ref(false)

  function setConfig(config: CarouselConfig, isManaged: boolean): void {
    slides.value = (config.slides || []).map((s) => ({
      id: s.id,
      label: s.label || s.id,
      img: s.img || '',
      tag: s.tag || '',
      tit: s.tit || '',
      sub: s.sub || '',
      desc: s.desc || '',
      btns: (s.btns || []).map((b) => ({ label: b.label || '', href: b.href || '' })),
      hidden: s.hidden === true
    }))
    settings.value = { ...CAROUSEL_DEFAULT_SETTINGS, ...(config.settings || {}) }
    managed.value = isManaged
  }

  function setSlides(s: CarouselSlideFull[]): void {
    slides.value = s
  }

  return {
    slides,
    settings,
    managed,
    loading,
    setConfig,
    setSlides
  }
})

// ──────────────────────────────────────────────
// Covers Store
// ──────────────────────────────────────────────
export const useCoversStore = defineStore('covers', () => {
  const covers = ref<CoversMap>({})
  const loading = ref(false)

  function setCovers(c: CoversMap) {
    covers.value = c
  }

  function setCover(pageId: string, url: string) {
    covers.value[pageId] = url
  }

  function removeCover(pageId: string) {
    delete covers.value[pageId]
  }

  function clear() {
    covers.value = {}
  }

  return {
    covers,
    loading,
    setCovers,
    setCover,
    removeCover,
    clear
  }
})

// ──────────────────────────────────────────────
// UI State Store (modals, toasts, sidebar, etc.)
// ──────────────────────────────────────────────
export const useUIStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const mobileSidebarOpen = ref(false)
  const activeView = ref<
    | 'dashboard'
    | 'page'
    | 'map'
    | 'carousel'
    | 'covers'
    | 'navigation'
    | 'interface'
    | 'settings'
    | 'users'
    | 'audit'
    | 'media'
  >('dashboard')
  const status = ref<'idle' | 'saving' | 'ok' | 'err'>('idle')
  const statusLabel = ref('pronto')

  // Toasts
  interface Toast {
    id: number
    message: string
    title?: string
    type: 'success' | 'error' | 'info' | 'warning'
    duration: number
  }
  const toasts = ref<Toast[]>([])
  const toastTimers = new Map<number, ReturnType<typeof setTimeout>>()
  let toastId = 0
  /* Gli errori restano più a lungo: vanno letti, non intravisti. */
  const TOAST_DURATION: Record<Toast['type'], number> = {
    success: 4000,
    info: 5000,
    warning: 6000,
    error: 8000
  }
  const MAX_TOASTS = 4

  // Modals
  const modals = ref<Record<string, boolean>>({})

  function showSidebar() {
    sidebarOpen.value = true
  }
  function hideSidebar() {
    sidebarOpen.value = false
  }
  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function showMobileSidebar() {
    mobileSidebarOpen.value = true
  }
  function hideMobileSidebar() {
    mobileSidebarOpen.value = false
  }
  function toggleMobileSidebar() {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  function setActiveView(view: typeof activeView.value) {
    activeView.value = view
    hideSidebar()
    hideMobileSidebar()
  }

  function setStatus(s: typeof status.value, label?: string) {
    status.value = s
    if (label) statusLabel.value = label
  }

  function clearToastTimer(id: number) {
    const timer = toastTimers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      toastTimers.delete(id)
    }
  }

  function scheduleToast(id: number, duration: number) {
    clearToastTimer(id)
    toastTimers.set(
      id,
      setTimeout(() => dismissToast(id), duration)
    )
  }

  function dismissToast(id: number) {
    clearToastTimer(id)
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function toast(message: string, type: Toast['type'] = 'info', options: { title?: string; duration?: number } = {}) {
    const id = ++toastId
    const duration = options.duration ?? TOAST_DURATION[type]
    toasts.value.push({ id, message, title: options.title, type, duration })
    /* Mai accumulare decine di avvisi: i più vecchi escono da soli. */
    while (toasts.value.length > MAX_TOASTS) dismissToast(toasts.value[0].id)
    scheduleToast(id, duration)
    return id
  }

  /** Sospende il timer (hover/focus): l'avviso non sparisce mentre lo si legge. */
  function holdToast(id: number) {
    clearToastTimer(id)
  }

  function releaseToast(id: number) {
    if (toasts.value.some((t) => t.id === id)) scheduleToast(id, 2500)
  }

  function openModal(id: string) {
    modals.value[id] = true
  }

  function closeModal(id: string) {
    modals.value[id] = false
  }

  function isModalOpen(id: string) {
    return !!modals.value[id]
  }

  return {
    sidebarOpen,
    mobileSidebarOpen,
    activeView,
    status,
    statusLabel,
    toasts,
    modals,
    showSidebar,
    hideSidebar,
    toggleSidebar,
    showMobileSidebar,
    hideMobileSidebar,
    toggleMobileSidebar,
    setActiveView,
    setStatus,
    toast,
    dismissToast,
    holdToast,
    releaseToast,
    openModal,
    closeModal,
    isModalOpen
  }
})

// ──────────────────────────────────────────────
// Analytics Store
// ──────────────────────────────────────────────
export const useAnalyticsStore = defineStore('analytics', () => {
  const data = ref<AnalyticsData | null>(null)
  const loading = ref(false)

  function setData(d: AnalyticsData) {
    data.value = d
  }

  function clear() {
    data.value = null
  }

  return {
    data,
    loading,
    setData,
    clear
  }
})

// ──────────────────────────────────────────────
// Audit Store
// ──────────────────────────────────────────────
export const useAuditStore = defineStore('audit', () => {
  const entries = ref<AuditEntry[]>([])
  const loading = ref(false)

  function setEntries(e: AuditEntry[]) {
    entries.value = e
  }

  function addEntry(entry: AuditEntry) {
    entries.value.unshift(entry)
  }

  function clear() {
    entries.value = []
  }

  return {
    entries,
    loading,
    setEntries,
    addEntry,
    clear
  }
})

// ──────────────────────────────────────────────
// Layouts Store
// ──────────────────────────────────────────────
export const useLayoutsStore = defineStore('layouts', () => {
  const registry = ref<Record<string, LayoutRegistryEntry>>({})
  const loading = ref(false)

  const layoutsList = computed(() => [
    { v: '', l: '(Auto — rileva da chiave)', i: '🔍' },
    ...Object.values(registry.value)
  ])

  function setRegistry(reg: Record<string, LayoutRegistryEntry>) {
    registry.value = reg
  }

  function getLayout(key: string) {
    return registry.value[key]
  }

  return {
    registry,
    loading,
    layoutsList,
    setRegistry,
    getLayout
  }
})

// ──────────────────────────────────────────────
// Deploy Store
// ──────────────────────────────────────────────
export const useDeployStore = defineStore('deploy', () => {
  const status = ref<DeployStatus | null>(null)
  const timerActive = ref(false)
  const timerSeconds = ref(0)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  function startTimer(expectedSeconds = 45) {
    if (timerInterval) clearInterval(timerInterval)
    timerActive.value = true
    timerSeconds.value = expectedSeconds
    timerInterval = setInterval(() => {
      timerSeconds.value = Math.max(0, timerSeconds.value - 1)
      if (timerSeconds.value <= 0) {
        stopTimer()
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    timerActive.value = false
    timerSeconds.value = 0
  }

  function setStatus(s: DeployStatus) {
    status.value = s
  }

  return {
    status,
    timerActive,
    timerSeconds,
    startTimer,
    stopTimer,
    setStatus
  }
})
