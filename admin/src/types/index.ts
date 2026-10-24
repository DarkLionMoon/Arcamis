/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Shared Types
   Single source of truth for all domain types
   ════════════════════════════════════════════════════════════════ */

import type { TemplateData } from '@/features/pages/templates/schema'

// ──────────────────────────────────────────────
// Auth & User
// ──────────────────────────────────────────────
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  username: string
  role: UserRole
  passwordHash?: string
  salt?: string
  created: string
  updated?: string
}

export interface AuthState {
  user: string | null
  role: UserRole
  csrfToken: string | null
  isAuthenticated: boolean
}

// ──────────────────────────────────────────────
// Flusso di pubblicazione
// ──────────────────────────────────────────────
/* Stati di una pagina. La logica (transizioni, ruoli, visibilità) sta in
   features/pages/workflow.ts; qui solo i nomi, condivisi da tipi e UI. */
export const PAGE_STATUSES = ['draft', 'review', 'scheduled', 'published'] as const
export type PageStatus = (typeof PAGE_STATUSES)[number]

/** Traccia di chi ha chiesto e fatto la revisione. */
export interface PageReview {
  requestedBy?: string
  requestedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  note?: string
}

/** I campi che il flusso di lavoro scrive su pagina e registro. */
export interface PageWorkflowFields {
  status?: PageStatus
  publishAt?: string
  isDraft?: boolean
  review?: PageReview
}

// ──────────────────────────────────────────────
// Pages & Registry
// ──────────────────────────────────────────────
export interface PageRegistryEntry extends PageWorkflowFields {
  k: string // slug key
  l: string // label
  i: string // icon (emoji)
  id: string // unique id for URL (pag-xxx or custom)
  sec?: string // section (regole, personaggio, lavori, lore, homebrew)
  sub?: string // subsection
  c?: number // custom flag (1 = custom page)
  layout?: string // layout key
}

export interface SectionRegistryEntry {
  v: string // value (URL segment)
  l: string // label
}

export interface RegistryData {
  pages: PageRegistryEntry[]
  sections?: SectionRegistryEntry[]
  ui?: UIConfig
}

// ──────────────────────────────────────────────
// Page Content
// ──────────────────────────────────────────────
export type ExploreMode = 'master-detail' | 'group-tabs' | 'tabs' | 'drawer' | 'accordion'

export interface ExploreFilter {
  id: string
  label: string
  field?: string
}

export interface ExploreGroup {
  id: string
  label: string
  sections: string[]
}

export interface ExploreConfig {
  mode: ExploreMode
  entryLevel?: 1 | 2 | 3
  skipFirst?: boolean
  search?: boolean
  label?: string
  plural?: string
  hash?: string
  groupBy?: string
  groupPlural?: string
  detailStyle?: 'markdown' | 'lavoro'
  source?: 'headings' | 'table'
  entityHeading?: string
  showHero?: boolean
  unassigned?: boolean
  filters?: ExploreFilter[]
  tabs?: ExploreGroup[]
  groups?: ExploreGroup[]
}

export interface PageContent extends PageWorkflowFields {
  k: string
  title: string
  icon: string
  content: string
  layout?: string
  toc?: boolean
  /* Pagina goliardica: il sito mostra un banner «Pagina meme» prima del
     contenuto. Il campo è opzionale e viene preservato al salvataggio. */
  meme?: boolean
  description?: string
  lastModified: string
  sha?: string
  /* Authoring strutturato: il modello applicato, i dati dei campi e i
     percorsi marcati "in lavorazione". `content` resta compilato per il
     sito pubblico, che questi campi non li legge. */
  template?: string
  templateData?: TemplateData
  draftFields?: string[]
  /* Pattern di esplorazione scelto dall'Admin. Il sito lo legge in
     scripts/js/explorer.js; il markdown resta la fonte delle voci. */
  explore?: ExploreConfig
}

// ──────────────────────────────────────────────
// Layouts
// ──────────────────────────────────────────────
export type EditorMode = 'pantheon' | 'schede' | 'page' | 'contenuto' | 'materiale'

export interface LayoutField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'wysiwyg' | 'image'
  required?: boolean
  placeholder?: string
  options?: string[]
}

export interface LayoutRegistryEntry {
  v: string
  l: string
  i: string
  template: string
  blockFields?: string[]
  requiredFields?: string[]
  fields?: LayoutField[]
  sections?: string[]
  editorMode: EditorMode
}

export type LayoutRegistry = Record<string, LayoutRegistryEntry>

// ──────────────────────────────────────────────
// Map Pins
// ──────────────────────────────────────────────
export type PinType = 'city' | 'village' | 'fort' | 'forest' | 'water' | 'ruin' | 'fog'

export interface MapPin {
  id: string
  left: string // percentage (e.g., "50.25%")
  top: string
  type: PinType
  name: string
  desc: string
  explored: boolean
  sub?: string // sub-map key (foglia, smari)
  pageId?: string // linked wiki page id
}

export interface MapData {
  mapImage: string
  pins: MapPin[]
}

// ──────────────────────────────────────────────
// Carousel
// ──────────────────────────────────────────────
export interface CarouselButton {
  label: string
  href: string
}

/* ── Manifest dinamico (get/set_carousel_config) ── */

/** Una slide completa del manifest: tutto è modificabile, anche l'id. */
export interface CarouselSlideFull {
  id: string
  label: string
  img: string
  tag: string
  tit: string
  sub: string
  desc: string
  btns: CarouselButton[]
  hidden: boolean
}

export interface CarouselSettings {
  intervalMs: number
  pauseOnHover: boolean
}

export interface CarouselConfig {
  slides: CarouselSlideFull[]
  settings: CarouselSettings
}

export interface CarouselConfigResponse extends CarouselConfig {
  /** false = seed da default + override legacy, manifest non ancora salvato. */
  managed: boolean
}

// ──────────────────────────────────────────────
// Covers
// ──────────────────────────────────────────────
export type CoversMap = Record<string, string> // pageId -> imageUrl

// ──────────────────────────────────────────────
// UI Config (bottom nav, drawer)
// ──────────────────────────────────────────────
export type UIAction = 'home' | 'drawer' | 'options' | 'page' | 'url'

export interface UIBottomNavItem {
  icon: string
  label: string
  action: UIAction
  target?: string // page id for 'page', URL for 'url'
}

export interface UIConfig {
  bottomNav: UIBottomNavItem[]
  drawerSearch: boolean
}

// ──────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────
export interface AnalyticsData {
  total: number
  pages: Array<{ pageKey: string; views: number }>
  series: Array<{ date: string; views: number }>
}

// ──────────────────────────────────────────────
// Audit Log
// ──────────────────────────────────────────────
export interface AuditEntry {
  timestamp: string
  action: string
  target: string
  user: string
  role: string
  extra?: Record<string, unknown>
}

// ──────────────────────────────────────────────
// GitHub API
// ──────────────────────────────────────────────
export interface GHFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string | null
  type: 'file' | 'dir'
  content?: string
  encoding?: string
}

export interface GHCommit {
  sha: string
  commit: {
    author: { name: string; email: string; date: string }
    message: string
  }
  html_url: string
}

// ──────────────────────────────────────────────
// Deploy
// ──────────────────────────────────────────────
export interface DeployStatus {
  configured: boolean
  status?: 'success' | 'failure' | 'pending' | 'building' | 'unknown'
  url?: string
  created_on?: string | null
  latest_commit?: string | null
}

// ──────────────────────────────────────────────
// Generic API Responses
// ──────────────────────────────────────────────
export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

// ──────────────────────────────────────────────
// Site Settings & Webhook
// ──────────────────────────────────────────────
export interface SiteSettings {
  banner_enabled?: boolean
  banner_text?: string
  disclaimer_enabled?: boolean
  disclaimer_text?: string
}

export interface WebhookConfig {
  webhookUrl?: string
  enabled?: boolean
  configured?: boolean
}

export interface GhTokenStatus {
  configured?: boolean
  ok?: boolean
  message?: string
}

// ──────────────────────────────────────────────
// Trash / Cestino
// ──────────────────────────────────────────────
export interface TrashItem {
  pageKey: string
  title?: string
  deletedAt?: string
  deletedBy?: string
  sha?: string
}

// ──────────────────────────────────────────────
// Link Scanner & Orphan Media
// ──────────────────────────────────────────────
export interface ScanIssue {
  pageKey: string
  type: string
  detail?: string
  broken?: Array<{ target: string }>
  missingAlt?: Array<{ src: string }>
}

export interface OrphanMediaItem {
  filename: string
  path: string
  sha?: string
  size?: number
}

// ──────────────────────────────────────────────
// Changelog
// ──────────────────────────────────────────────
export interface ChangelogEntry {
  /** Id stabile usato dal changelog pubblico per aprire/chiudere una entry. */
  id?: string
  versione: string
  sottoversione: string
  patch: string
  title: string
  date: string
  content: string
}

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Nullable<T> = T | null
