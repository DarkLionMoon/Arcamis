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
  CarouselSlide,
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
  }

  function updatePage(key: string, updates: Partial<PageRegistryEntry>) {
    const idx = pages.value.findIndex((p) => p.k === key)
    if (idx !== -1) {
      pages.value[idx] = { ...pages.value[idx], ...updates }
    }
  }

  function addPage(page: PageRegistryEntry) {
    pages.value.push(page)
  }

  function removePage(key: string) {
    pages.value = pages.value.filter((p) => p.k !== key)
  }

  function reorderPages(fromIndex: number, toIndex: number) {
    const [moved] = pages.value.splice(fromIndex, 1)
    pages.value.splice(toIndex, 0, moved)
  }

  function updateSection(value: string, updates: Partial<SectionRegistryEntry>) {
    const idx = sections.value.findIndex((s) => s.v === value)
    if (idx !== -1) {
      sections.value[idx] = { ...sections.value[idx], ...updates }
    }
  }

  function addSection(section: SectionRegistryEntry) {
    sections.value.push(section)
  }

  function removeSection(value: string) {
    sections.value = sections.value.filter((s) => s.v !== value)
  }

  function setUIConfig(config: UIConfig) {
    uiConfig.value = config
  }

  return {
    pages,
    sections,
    uiConfig,
    loading,
    error,
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
export const useEditorStore = defineStore('editor', () => {
  const currentPage = ref<PageContent | null>(null)
  const modified = ref(false)
  const saving = ref(false)
  const lastSavedContent = ref('')
  const autosaveEnabled = ref(true)
  const viewMode = ref<'md' | 'pv' | 'split' | 'site'>('split')
  const structuredMode = ref(false)
  const editorFontSize = ref(13)
  const showLineNumbers = ref(false)
  const wordWrap = ref(true)

  const hasUnsavedChanges = computed(() => modified.value)

  function setPage(page: PageContent | null) {
    currentPage.value = page
    modified.value = false
    lastSavedContent.value = page?.content || ''
  }

  function setContent(content: string) {
    if (currentPage.value) {
      currentPage.value.content = content
      modified.value = content !== lastSavedContent.value
    }
  }

  function setMetadata(updates: Partial<PageContent>) {
    if (currentPage.value) {
      Object.assign(currentPage.value, updates)
      modified.value = true
    }
  }

  function markSaved() {
    modified.value = false
    lastSavedContent.value = currentPage.value?.content || ''
  }

  function toggleStructuredMode() {
    structuredMode.value = !structuredMode.value
  }

  function setViewMode(mode: 'md' | 'pv' | 'split' | 'site') {
    viewMode.value = mode
  }

  function clear() {
    currentPage.value = null
    modified.value = false
    lastSavedContent.value = ''
    structuredMode.value = false
  }

  return {
    currentPage,
    modified,
    saving,
    lastSavedContent,
    autosaveEnabled,
    viewMode,
    structuredMode,
    editorFontSize,
    showLineNumbers,
    wordWrap,
    hasUnsavedChanges,
    setPage,
    setContent,
    setMetadata,
    markSaved,
    toggleStructuredMode,
    setViewMode,
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
export const useCarouselStore = defineStore('carousel', () => {
  const slides = ref<CarouselSlide[]>([
    {
      key: 'carousel_0',
      label: 'Slide 1 — Arcamis Porto',
      image: '',
      tag: 'Città Portuale — Marche di Arcamis',
      title: 'ARCAMIS',
      description:
        "Città portuale delle Marche di Arcamis, porta d'ingresso al regno di Arcadia. Solo una piccola parte della regione è esplorata dai giocatori.",
      buttons: [
        { label: 'Entra nel Discord', href: 'https://discord.gg/JZPnXZbXEJ' },
        { label: 'Scopri la città ↓', href: '' }
      ],
      defTag: 'Città Portuale — Marche di Arcamis',
      defTit: 'ARCAMIS',
      defDesc:
        "Città portuale delle Marche di Arcamis, porta d'ingresso al regno di Arcadia. Solo una piccola parte della regione è esplorata dai giocatori.",
      defBtns: [
        { label: 'Entra nel Discord', href: 'https://discord.gg/JZPnXZbXEJ' },
        { label: 'Scopri la città ↓', href: '' }
      ]
    },
    {
      key: 'carousel_1',
      label: 'Slide 2 — Pantheon',
      image: '',
      tag: 'Pantheon di Arcamis',
      title: 'LE DIVINITÀ DI ARCAMIS',
      description:
        'Ogni dio ha lasciato il proprio segno sulla terra. Scopri il Pantheon e i culti che plasmano il mondo.',
      buttons: [{ label: 'Scopri il Pantheon →', href: '' }],
      defTag: 'Pantheon di Arcamis',
      defTit: 'LE DIVINITÀ DI ARCAMIS',
      defDesc: 'Ogni dio ha lasciato il proprio segno sulla terra. Scopri il Pantheon e i culti che plasmano il mondo.',
      defBtns: [{ label: 'Scopri il Pantheon →', href: '' }]
    },
    {
      key: 'carousel_2',
      label: 'Slide 3 — Personaggio',
      image: '',
      tag: 'Crea il tuo eroe',
      title: 'CREA IL TUO PERSONAGGIO',
      description: 'Scegli la tua classe, forgia la tua storia. Il tuo personaggio esiste solo su Arcamis.',
      buttons: [{ label: 'Come si inizia →', href: '' }],
      defTag: 'Crea il tuo eroe',
      defTit: 'CREA IL TUO PERSONAGGIO',
      defDesc: 'Scegli la tua classe, forgia la tua storia. Il tuo personaggio esiste solo su Arcamis.',
      defBtns: [{ label: 'Come si inizia →', href: '' }]
    }
  ])
  const loading = ref(false)

  function setSlides(s: CarouselSlide[]) {
    slides.value = s
  }

  function updateSlide(key: string, updates: Partial<CarouselSlide>) {
    const idx = slides.value.findIndex((s) => s.key === key)
    if (idx !== -1) {
      slides.value[idx] = { ...slides.value[idx], ...updates }
    }
  }

  function clear() {
    slides.value = slides.value.map((s) => ({
      ...s,
      image: '',
      tag: s.defTag,
      title: s.defTit,
      description: s.defDesc,
      buttons: [...s.defBtns]
    }))
  }

  return {
    slides,
    loading,
    setSlides,
    updateSlide,
    clear
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
    type: 'success' | 'error' | 'info' | 'warning'
  }
  const toasts = ref<Toast[]>([])
  let toastId = 0

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

  function toast(message: string, type: Toast['type'] = 'info') {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 4000)
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
