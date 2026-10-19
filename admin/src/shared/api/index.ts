/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — API client

   Moduli separati per responsabilità; questo file è il punto di
   ingresso unico e mantiene stabili gli import esistenti:

     http.ts    trasporto (cookie, CSRF, timeout, errori tipizzati)
     github.ts  proxy verso l'API GitHub
     content.ts pagine, registro, mappa, copertine, layout, ricerca
     system.ts  auth, impostazioni, audit, analytics, cestino, deploy
     media.ts   immagini: compressione, upload, elenco

   Nuovi moduli: importa direttamente il file specifico
   (es. `import { mediaApi } from '@/shared/api/media'`) per non
   trascinare il resto nel bundle.
   ════════════════════════════════════════════════════════════════ */

export { API_BASE, ApiError, DEFAULT_TIMEOUT_MS, adminUrl, errorText, onUnauthorized, request } from './http'
export type { RequestOptions } from './http'

export { b64encode, decodeBase64Utf8, ghApi } from './github'

export {
  calendarApi,
  carouselApi,
  coversApi,
  layoutsApi,
  mapApi,
  pagesApi,
  questsApi,
  registryApi,
  searchApi,
  statusApi
} from './content'
export type { PageWorkflowStatus, RegistryDoc } from './content'

export {
  analyticsApi,
  auditApi,
  authApi,
  backupApi,
  checkSession,
  deployApi,
  navAuditApi,
  scannerApi,
  settingsApi,
  trashApi
} from './system'

export { MEDIA_DIR, compressImage, formatBytes, mediaApi, mediaName, mediaUrl, uploadImage } from './media'
