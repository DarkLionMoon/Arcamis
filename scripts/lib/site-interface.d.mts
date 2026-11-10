/* Tipi del modulo condiviso scripts/lib/site-interface.mjs.
   Usati dall'Admin (TypeScript) senza duplicare il modello dati. */

export interface InterfaceFooterLink {
  label: string;
  href: string;
  external: boolean;
  kind: '' | 'credits';
}

export interface SiteInterfaceConfig {
  version: number;
  updatedAt: string | null;
  site: {
    name: string;
    brand: string;
    tagline: string;
    logo: string;
    logoAlt: string;
    loaderText: string;
  };
  footer: {
    legal: string;
    links: InterfaceFooterLink[];
  };
  texts: {
    skipLink: string;
    searchPlaceholder: string;
  };
}

export interface SiteInterfaceValidation {
  config: SiteInterfaceConfig;
  errors: string[];
  warnings: string[];
}

export const SITE_INTERFACE_VERSION: number;
export const SITE_INTERFACE_PATH: string;
export const SITE_INTERFACE_LIMITS: Record<string, number>;
export const SITE_INTERFACE_MAX_LINKS: number;
export const DEFAULT_SITE_INTERFACE: SiteInterfaceConfig;

export function defaultSiteInterface(): SiteInterfaceConfig;
export function normalizeSiteInterface(raw: unknown): SiteInterfaceValidation;
export function siteInterfaceHash(config: SiteInterfaceConfig): string;
export function renderInterfaceLoader(config: SiteInterfaceConfig): string;
export function renderInterfaceBrand(config: SiteInterfaceConfig): string;
export function renderInterfaceSkipLink(config: SiteInterfaceConfig): string;
export function renderInterfaceFooter(config: SiteInterfaceConfig): string;
export function applyInterfaceMarkup(html: string, config: SiteInterfaceConfig): string;
export function applyDocumentIdentity(html: string, config: SiteInterfaceConfig): string;
export function applyErrorPageIdentity(html: string, config: SiteInterfaceConfig): string;
export function applyManifestIdentity(manifest: string, config: SiteInterfaceConfig): string;
export function siteInterfaceMarker(config: SiteInterfaceConfig): string;
