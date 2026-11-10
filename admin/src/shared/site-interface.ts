/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — site-interface.ts

   Punto d'ingresso unico verso il modulo condiviso col build del
   sito (scripts/lib/site-interface.mjs): stessi tipi, stessa
   normalizzazione, stesso renderer. L'anteprima dell'Admin e
   l'header/footer pubblicati non possono divergere.
   ════════════════════════════════════════════════════════════════ */

export {
  DEFAULT_SITE_INTERFACE,
  SITE_INTERFACE_LIMITS,
  SITE_INTERFACE_MAX_LINKS,
  SITE_INTERFACE_PATH,
  SITE_INTERFACE_VERSION,
  defaultSiteInterface,
  normalizeSiteInterface,
  renderInterfaceBrand,
  renderInterfaceFooter,
  renderInterfaceLoader,
  renderInterfaceSkipLink,
  siteInterfaceHash
} from '../../../scripts/lib/site-interface.mjs'

export type {
  InterfaceFooterLink,
  SiteInterfaceConfig,
  SiteInterfaceValidation
} from '../../../scripts/lib/site-interface.mjs'
