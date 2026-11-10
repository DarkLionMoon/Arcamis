/* Tipi del modulo condiviso scripts/lib/homepage.mjs.
   Usati dall'Admin (TypeScript) senza duplicare il modello dati. */

export type HomepageSectionType = 'marche' | 'arcadia' | 'news' | 'steps' | 'wiki';

export interface HomepageLink {
  label: string;
  href: string;
  external: boolean;
}

export interface HomepageCta extends HomepageLink {
  kind: '' | 'discord';
}

export interface HomepageFaction {
  icon: string;
  name: string;
  description: string;
  active: boolean;
}

export interface HomepageGuild {
  icon: string;
  name: string;
  role: string;
  color: string;
}

export interface HomepageStep {
  icon: string;
  title: string;
  description: string;
}

export interface HomepageWikiCard {
  icon: string;
  name: string;
  description: string;
  pageId: string;
  image: string;
}

export interface HomepageWikiGroup {
  title: string;
  cards: HomepageWikiCard[];
}

interface HomepageSectionBase {
  id: string;
  label: string;
  visible: boolean;
  divider: boolean;
  eyebrow: string;
  title: string;
  description: string;
}

export interface MarcheSection extends HomepageSectionBase {
  type: 'marche';
  showMap: boolean;
}

export interface ArcadiaSection extends HomepageSectionBase {
  type: 'arcadia';
  guildsTitle: string;
  factions: HomepageFaction[];
  guilds: HomepageGuild[];
}

export interface NewsSection extends HomepageSectionBase {
  type: 'news';
  footerText: string;
  links: HomepageLink[];
}

export interface StepsSection extends HomepageSectionBase {
  type: 'steps';
  steps: HomepageStep[];
  cta: HomepageCta[];
}

export interface WikiSection extends HomepageSectionBase {
  type: 'wiki';
  groups: HomepageWikiGroup[];
}

export type HomepageSection = MarcheSection | ArcadiaSection | NewsSection | StepsSection | WikiSection;

export interface HomepageConfig {
  version: number;
  updatedAt: string | null;
  sections: HomepageSection[];
}

export interface HomepageValidation {
  config: HomepageConfig;
  errors: string[];
  warnings: string[];
}

export const HOMEPAGE_VERSION: number;
export const HOMEPAGE_PATH: string;
export const HOMEPAGE_MAX_SECTIONS: number;
export const HOMEPAGE_TYPES: HomepageSectionType[];
export const SECTION_TYPE_LABELS: Record<HomepageSectionType, string>;
export const HOMEPAGE_LIMITS: Record<string, number>;
export const DEFAULT_HOMEPAGE: HomepageConfig;

export function defaultHomepage(): HomepageConfig;
export function normalizeHomepage(raw: unknown): HomepageValidation;
export function homepageHash(config: HomepageConfig): string;
export function renderHomepageSections(
  config: HomepageConfig,
  options?: { mapHtml?: string; pagePaths?: Record<string, string> }
): string;
