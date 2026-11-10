/* ════════════════════════════════════════════════════════════════
   ARCAMIS — site-interface.mjs
   Identità del sito: nome, logo, tagline, footer e testi globali.

   Un unico modulo, senza dipendenze, usato da:
     • scripts/build-post.mjs → scolpisce header, loader, footer, titolo
       e metadati in dist/ (il sito resta leggibile senza JavaScript);
     • scripts/lib/routes.mjs → titoli e og:site_name delle pagine;
     • Admin → Interfaccia, per l'anteprima e la validazione prima del
       commit.

   Formato (content/interface.json):
     { version, updatedAt,
       site:   { name, brand, tagline, logo, logoAlt, loaderText },
       footer: { legal, links: [{ label, href, external, kind }] },
       texts:  { skipLink, searchPlaceholder } }

   Compatibilità: ogni campo mancante ricade sul valore storico del
   sito; i link non validi vengono scartati con un avviso. Una
   configurazione rotta non deve mai lasciare il sito senza header,
   footer o nome.
   ════════════════════════════════════════════════════════════════ */

export const SITE_INTERFACE_VERSION = 1;
export const SITE_INTERFACE_PATH = 'content/interface.json';

export const SITE_INTERFACE_LIMITS = {
  name: 80,
  brand: 40,
  tagline: 160,
  logo: 2048,
  logoAlt: 120,
  loaderText: 80,
  legal: 600,
  linkLabel: 80,
  href: 2048,
  skipLink: 120,
  searchPlaceholder: 80,
};

export const SITE_INTERFACE_MAX_LINKS = 6;

const DISCORD_URL = 'https://discord.gg/JZPnXZbXEJ';

export const DEFAULT_SITE_INTERFACE = {
  version: SITE_INTERFACE_VERSION,
  updatedAt: null,
  site: {
    name: 'Arcamis Wiki',
    brand: 'ARCAMIS',
    tagline: 'Wiki amatoriale di una campagna D&D 5e',
    logo: '/Artboard_1.png',
    logoAlt: 'Arcamis',
    loaderText: 'Arcamis',
  },
  footer: {
    legal:
      'Non affiliato a Riot Games né a Wizards of the Coast. Le immagini di League of Legends appartengono ai rispettivi titolari.',
    links: [
      { label: 'Crediti & legale', href: '', external: false, kind: 'credits' },
      { label: 'Contatti · Discord', href: DISCORD_URL, external: true, kind: '' },
      { label: 'Changelog', href: '/changelog', external: false, kind: '' },
    ],
  },
  texts: {
    skipLink: 'Vai al contenuto principale',
    searchPlaceholder: 'Cerca nella wiki…',
  },
};

/* Marcatori stabili in index.html: build-post sostituisce solo queste zone. */
export const INTERFACE_LOADER_START = '<!-- INTERFACE:LOADER:START -->';
export const INTERFACE_LOADER_END = '<!-- INTERFACE:LOADER:END -->';
export const INTERFACE_BRAND_START = '<!-- INTERFACE:BRAND:START -->';
export const INTERFACE_BRAND_END = '<!-- INTERFACE:BRAND:END -->';
export const INTERFACE_FOOTER_START = '<!-- INTERFACE:FOOTER:START -->';
export const INTERFACE_FOOTER_END = '<!-- INTERFACE:FOOTER:END -->';
export const INTERFACE_SKIP_START = '<!-- INTERFACE:SKIP:START -->';
export const INTERFACE_SKIP_END = '<!-- INTERFACE:SKIP:END -->';

/** Copia profonda dei default: chi modifica il risultato non tocca la costante. */
export function defaultSiteInterface() {
  return JSON.parse(JSON.stringify(DEFAULT_SITE_INTERFACE));
}

/* ── Utility pure ───────────────────────────────────────────────── */

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Attributo HTML (stesse entità del testo: il contesto è sempre fra virgolette). */
function attr(value) {
  return esc(value);
}

function text(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function bool(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  return value === true;
}

function safeHref(value) {
  const href = text(value, SITE_INTERFACE_LIMITS.href);
  if (!href) return '';
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(href)) return href;
  return '';
}

function safeImage(value, fallback) {
  const src = text(value, SITE_INTERFACE_LIMITS.logo);
  if (!src) return fallback;
  if (/^(https?:\/\/|\/)/i.test(src)) return src;
  return fallback;
}

/* ── Normalizzazione ─────────────────────────────────────────────
   Ritorna { config, errors, warnings }. `errors` blocca il salvataggio
   dall'Admin; il build pubblico usa comunque `config` normalizzata. */

export function normalizeSiteInterface(raw) {
  const warnings = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      config: defaultSiteInterface(),
      errors: [],
      warnings: ['Configurazione interfaccia assente o non valida: uso i valori predefiniti.'],
    };
  }

  const rawVersion = Number(raw.version);
  const version = Number.isFinite(rawVersion) && rawVersion > 0 ? Math.floor(rawVersion) : SITE_INTERFACE_VERSION;
  if (version > SITE_INTERFACE_VERSION) {
    warnings.push(
      `La configurazione usa la versione ${version}, più recente di quella supportata (${SITE_INTERFACE_VERSION}).`
    );
  }

  const site = raw.site && typeof raw.site === 'object' ? raw.site : {};
  const footer = raw.footer && typeof raw.footer === 'object' ? raw.footer : {};
  const texts = raw.texts && typeof raw.texts === 'object' ? raw.texts : {};
  const defaults = DEFAULT_SITE_INTERFACE;

  const name = text(site.name, SITE_INTERFACE_LIMITS.name) || defaults.site.name;
  const brand = text(site.brand, SITE_INTERFACE_LIMITS.brand) || defaults.site.brand;
  const logo = safeImage(site.logo, defaults.site.logo);
  if (text(site.logo, SITE_INTERFACE_LIMITS.logo) && logo !== text(site.logo, SITE_INTERFACE_LIMITS.logo)) {
    warnings.push('Il logo deve essere un percorso del sito (inizia con /) o un URL https: uso il logo predefinito.');
  }

  const rawLinks = Array.isArray(footer.links) ? footer.links : [];
  const links = [];
  rawLinks.slice(0, SITE_INTERFACE_MAX_LINKS).forEach((link, index) => {
    if (!link || typeof link !== 'object') {
      warnings.push(`Link del footer ${index + 1} ignorato: non è un oggetto.`);
      return;
    }
    const label = text(link.label, SITE_INTERFACE_LIMITS.linkLabel);
    const kind = link.kind === 'credits' ? 'credits' : '';
    const external = bool(link.external, false);
    const href = kind === 'credits' ? '' : safeHref(link.href);
    if (!label) return;
    if (kind !== 'credits' && !href) {
      warnings.push(`Link del footer «${label}» ignorato: destinazione non valida.`);
      return;
    }
    links.push({ label, href, external, kind });
  });
  if (!links.length) {
    warnings.push('Il footer non ha link: verranno mostrati solo nome, tagline e nota legale.');
  }

  return {
    config: {
      version: SITE_INTERFACE_VERSION,
      updatedAt: typeof raw.updatedAt === 'string' ? text(raw.updatedAt, 40) : null,
      site: {
        name,
        brand,
        tagline: text(site.tagline, SITE_INTERFACE_LIMITS.tagline) || defaults.site.tagline,
        logo,
        logoAlt: text(site.logoAlt, SITE_INTERFACE_LIMITS.logoAlt) || name,
        loaderText: text(site.loaderText, SITE_INTERFACE_LIMITS.loaderText) || name,
      },
      footer: {
        legal: text(footer.legal, SITE_INTERFACE_LIMITS.legal),
        links,
      },
      texts: {
        skipLink: text(texts.skipLink, SITE_INTERFACE_LIMITS.skipLink) || defaults.texts.skipLink,
        searchPlaceholder:
          text(texts.searchPlaceholder, SITE_INTERFACE_LIMITS.searchPlaceholder) || defaults.texts.searchPlaceholder,
      },
    },
    errors: [],
    warnings,
  };
}

/* ── Impronta della configurazione ───────────────────────────────
   FNV-1a sul JSON normalizzato: identica in Node e nel browser. Serve
   all'Admin per verificare che il sito pubblicato serva davvero la
   versione appena salvata (build-post la scrive in un commento). */

export function siteInterfaceHash(config) {
  const { config: normalized } = normalizeSiteInterface(config);
  const payload = JSON.stringify(normalized);
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/* ── Rendering ──────────────────────────────────────────────────── */

export function renderInterfaceLoader(config) {
  const { config: normalized } = normalizeSiteInterface(config);
  return [
    `  <img src="${attr(normalized.site.logo)}" alt="${attr(normalized.site.logoAlt)}" style="width:280px;height:280px;object-fit:contain;opacity:.85">`,
    `  <div class="loader-sub">${esc(normalized.site.loaderText)}</div>`,
  ].join('\n');
}

export function renderInterfaceBrand(config) {
  const { config: normalized } = normalizeSiteInterface(config);
  return [
    `    <div id="liw"><img id="li" src="${attr(normalized.site.logo)}" alt="${attr(
      normalized.site.logoAlt
    )}" style="display:block"/><span id="lf" style="display:none">⚔</span></div>`,
    `    <span id="tlt">${esc(normalized.site.brand)}</span>`,
  ].join('\n');
}

export function renderInterfaceSkipLink(config) {
  const { config: normalized } = normalizeSiteInterface(config);
  return `<a href="#main" class="skip-link" id="skip-link">${esc(normalized.texts.skipLink)}</a>`;
}

function renderFooterLink(link) {
  if (link.kind === 'credits') {
    return `        <button type="button" class="sf-link" onclick="gp('pag-credits','Crediti &amp; Legale','⚖️')">${esc(
      link.label
    )}</button>`;
  }
  const target = link.external ? ' target="_blank" rel="noopener"' : '';
  return `        <a class="sf-link" href="${attr(link.href)}"${target}>${esc(link.label)}</a>`;
}

export function renderInterfaceFooter(config) {
  const { config: normalized } = normalizeSiteInterface(config);
  const links = normalized.footer.links.map(renderFooterLink).join('\n');
  return [
    '    <div class="sf-inner">',
    '      <div class="sf-brand">',
    `        <span class="sf-name">${esc(normalized.site.brand)}</span>`,
    normalized.site.tagline ? `        <span class="sf-tag">${esc(normalized.site.tagline)}</span>` : '',
    '      </div>',
    '      <nav class="sf-links" aria-label="Informazioni sul sito">',
    links,
    '      </nav>',
    normalized.footer.legal ? `      <p class="sf-legal">${esc(normalized.footer.legal)}</p>` : '',
    '    </div>',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/* ── Applicazione alla shell HTML ──────────────────────────────── */

function replaceBlock(html, start, end, content) {
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from < 0 || to < from) return html;
  return html.slice(0, from) + content + html.slice(to + end.length);
}

/** Sostituisce marcatori e testi che compaiono in più punti della shell. */
export function applyInterfaceMarkup(html, config) {
  const { config: normalized } = normalizeSiteInterface(config);
  let out = html;
  out = replaceBlock(out, INTERFACE_LOADER_START, INTERFACE_LOADER_END, renderInterfaceLoader(normalized));
  out = replaceBlock(out, INTERFACE_BRAND_START, INTERFACE_BRAND_END, renderInterfaceBrand(normalized));
  out = replaceBlock(out, INTERFACE_FOOTER_START, INTERFACE_FOOTER_END, renderInterfaceFooter(normalized));
  out = replaceBlock(out, INTERFACE_SKIP_START, INTERFACE_SKIP_END, renderInterfaceSkipLink(normalized));

  /* Il placeholder compare nella ricerca desktop e in quella mobile.
     La sostituzione parte dal valore predefinito scritto in index.html,
     così non dipende da un selettore fragile. */
  const from = `placeholder="${attr(DEFAULT_SITE_INTERFACE.texts.searchPlaceholder)}"`;
  const to = `placeholder="${attr(normalized.texts.searchPlaceholder)}"`;
  out = out.split(from).join(to);

  return out;
}

/** Titolo e metadati della home: nome del sito, og:site_name, JSON-LD. */
export function applyDocumentIdentity(html, config) {
  const { config: normalized } = normalizeSiteInterface(config);
  const name = normalized.site.name;
  const title = `${name} — Il mondo di Arcamis`;
  let out = html;

  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  out = out.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${attr(title)}$2`
  );
  out = out.replace(
    /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
    `$1${attr(title)}$2`
  );
  out = out.replace(
    /(<meta\s+property="og:site_name"\s+content=")[^"]*(")/,
    `$1${attr(name)}$2`
  );
  out = out.replace(/"name":"Arcamis Wiki"/, `"name":${JSON.stringify(name)}`);
  return out;
}

/** Nome del sito nelle pagine di errore statiche (404/offline). */
export function applyErrorPageIdentity(html, config) {
  const { config: normalized } = normalizeSiteInterface(config);
  const name = esc(normalized.site.name);
  const brand = esc(normalized.site.brand);
  return html
    .replace(/<title>([^<]*) — Arcamis<\/title>/, `<title>$1 — ${name}</title>`)
    .replace('<div class="sigil">Arcamis</div>', `<div class="sigil">${brand}</div>`)
    .replace(/Torna alla wiki di Arcamis/g, `Torna alla wiki di ${name}`);
}

/** Manifest PWA: nome completo e nome breve seguono l'identità del sito. */
export function applyManifestIdentity(manifest, config) {
  const { config: normalized } = normalizeSiteInterface(config);
  let parsed;
  try {
    parsed = JSON.parse(manifest);
  } catch {
    return manifest;
  }
  if (!parsed || typeof parsed !== 'object') return manifest;
  parsed.name = `${normalized.site.name} — D&D`;
  parsed.short_name = normalized.site.brand.slice(0, 12);
  return JSON.stringify(parsed, null, 2) + '\n';
}

/** Commento di build usato dall'Admin per verificare il deploy reale. */
export function siteInterfaceMarker(config) {
  return `<!-- interface:${siteInterfaceHash(config)} -->`;
}
