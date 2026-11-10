/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — homepage.ts

   Punto d'ingresso unico verso il modulo condiviso col build del
   sito (scripts/lib/homepage.mjs): stessi tipi, stessa validazione,
   stesso renderer. L'anteprima dell'Admin e la home pubblicata non
   possono divergere perché usano lo stesso codice.
   ════════════════════════════════════════════════════════════════ */

export {
  DEFAULT_HOMEPAGE,
  HOMEPAGE_LIMITS,
  HOMEPAGE_MAX_SECTIONS,
  HOMEPAGE_PATH,
  HOMEPAGE_TYPES,
  HOMEPAGE_VERSION,
  SECTION_TYPE_LABELS,
  defaultHomepage,
  homepageHash,
  normalizeHomepage,
  renderHomepageSections
} from '../../../scripts/lib/homepage.mjs'

export type {
  ArcadiaSection,
  HomepageConfig,
  HomepageCta,
  HomepageFaction,
  HomepageGuild,
  HomepageLink,
  HomepageSection,
  HomepageSectionType,
  HomepageStep,
  HomepageValidation,
  HomepageWikiCard,
  HomepageWikiGroup,
  MarcheSection,
  NewsSection,
  StepsSection,
  WikiSection
} from '../../../scripts/lib/homepage.mjs'
