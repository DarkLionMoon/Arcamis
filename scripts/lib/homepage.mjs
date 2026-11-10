/* ════════════════════════════════════════════════════════════════
   ARCAMIS — homepage.mjs
   Configurazione e rendering delle sezioni della homepage.

   Un unico modulo, senza dipendenze, usato da:
     • scripts/build-post.mjs  → scolpisce le sezioni in dist/index.html
       (la home pubblica funziona anche senza JavaScript);
     • Admin → Homepage Builder, per l'anteprima live e per validare
       prima del commit.

   Il carousel/hero NON è qui: resta gestito dal manifest KV del
   Carousel, così non esistono due configurazioni della stessa cosa.

   Formato (content/homepage.json):
     { version, updatedAt, sections: [{ id, type, label, visible,
       divider, eyebrow, title, description, …campi del tipo }] }

   Compatibilità: i campi mancanti prendono i valori predefiniti, i
   tipi sconosciuti vengono scartati con un avviso, gli id duplicati
   rinominati. Una configurazione rotto non deve mai svuotare la home.
   ════════════════════════════════════════════════════════════════ */

export const HOMEPAGE_VERSION = 1;
export const HOMEPAGE_PATH = 'content/homepage.json';
export const HOMEPAGE_MAX_SECTIONS = 24;

/** Marcatori stabili in index.html: build-post sostituisce solo questa zona. */
export const HOMEPAGE_MARKER_START = '<!-- HOMEPAGE:SECTIONS:START -->';
export const HOMEPAGE_MARKER_END = '<!-- HOMEPAGE:SECTIONS:END -->';
export const HOMEPAGE_MAP_MARKER_START = '<!-- HOMEPAGE:MAP -->';
export const HOMEPAGE_MAP_MARKER_END = '<!-- /HOMEPAGE:MAP -->';
export const HOMEPAGE_MAP_SLOT = '<!-- HOMEPAGE:MAP-SLOT -->';

export const HOMEPAGE_TYPES = ['marche', 'arcadia', 'news', 'steps', 'wiki'];

export const SECTION_TYPE_LABELS = {
  marche: 'Mappa e regione',
  arcadia: 'Arcadia e gilde',
  news: 'Novità dal server',
  steps: 'Guida rapida e CTA',
  wiki: 'Wiki completa',
};

/* Limiti di lunghezza: condivisi tra normalizzazione e form dell'Admin. */
export const HOMEPAGE_LIMITS = {
  label: 120,
  eyebrow: 120,
  title: 200,
  description: 1200,
  footerText: 300,
  itemName: 120,
  itemRole: 160,
  itemTitle: 120,
  itemDescription: 500,
  itemIcon: 24,
  linkLabel: 80,
  href: 2048,
  groupTitle: 120,
  image: 2048,
};

/* ── Testi e valori predefiniti (gli stessi del sito storico) ───── */

const DISCORD_URL = 'https://discord.gg/JZPnXZbXEJ';

export const DEFAULT_HOMEPAGE = {
  version: HOMEPAGE_VERSION,
  updatedAt: null,
  sections: [
    {
      id: 'marche',
      type: 'marche',
      label: 'Marche di Arcamis',
      visible: true,
      divider: true,
      eyebrow: 'Regione Esplorabile',
      title: 'MARCHE DI ARCAMIS',
      description:
        "La città portuale di Arcamis e i territori circostanti. Un piccolo angolo di un regno molto più vasto, ancora in gran parte sconosciuto.",
      showMap: true,
    },
    {
      id: 'arcadia',
      type: 'arcadia',
      label: 'Arcadia',
      visible: true,
      divider: true,
      eyebrow: 'Il Regno',
      title: 'ARCADIA',
      description:
        "Le Marche di Arcamis sono solo l'avamposto di un regno antico e misterioso. Gilde, fazioni e poteri si contendono l'influenza. Altri territori restano inesplorati, oltre i confini delle Marche.",
      factions: [{ icon: '⚓', name: 'Marina', description: 'Flotta e commercio marittimo', active: false }],
      guildsTitle: 'Le Grandi Gilde',
      guilds: [
        {
          icon: '🪙',
          name: 'Gilda del Commercio',
          role: 'Arti, traffici e finanze',
          color: 'rgba(200,155,60,.6)',
        },
        {
          icon: '⚒️',
          name: 'Gilda dei Minatori',
          role: 'Estratti, fonderie e rocche',
          color: 'rgba(180,110,40,.7)',
        },
        {
          icon: '⚔️',
          name: 'Gilda delle Armi',
          role: 'Potenze militari e guardie',
          color: 'rgba(160,60,60,.7)',
        },
      ],
    },
    {
      id: 'novita',
      type: 'news',
      label: 'Novità dal server',
      visible: true,
      divider: false,
      eyebrow: 'Dal server alla wiki',
      title: 'NOVITÀ DAL SERVER',
      description:
        'Patch, eventi e cambiamenti della campagna. Qui trovi gli ultimi aggiornamenti registrati; gli annunci ufficiali dello staff arrivano sul Discord.',
      footerText: 'Le comunicazioni ufficiali della campagna sono sul Discord.',
      links: [
        { label: 'Tutte le patch', href: '/novita', external: false },
        { label: 'Annunci sul Discord', href: DISCORD_URL, external: true },
      ],
    },
    {
      id: 'come-iniziare',
      type: 'steps',
      label: 'Come iniziare',
      visible: true,
      divider: true,
      eyebrow: 'Guida rapida',
      title: "CREA IL TUO PERSONAGGIO\nE PARTI ALL'AVVENTURA",
      description:
        'Per iniziare ti servono tre cose: una **Specie**, una **Classe** e un **Background**. Da lì trovi il tuo posto nelle Marche.',
      steps: [
        {
          icon: '💬',
          title: 'Entra nel Discord',
          description: 'Il server è il cuore del gioco. Leggi le regole e partecipa ai primi passi.',
        },
        {
          icon: '🎭',
          title: 'Crea il tuo PG',
          description: 'Scegli *specie*, *classe* e *background* per costruire la storia.',
        },
        {
          icon: '🗡️',
          title: 'Unisciti alla Gilda',
          description: 'Ogni avventuriero delle Marche si registra e inizia la propria avventura.',
        },
      ],
      cta: [
        { label: 'Entra nel Discord', href: DISCORD_URL, external: true, kind: 'discord' },
        { label: 'Guida creazione PG →', href: '/personaggio/come-si-inizia', external: false, kind: '' },
      ],
    },
    {
      id: 'wiki',
      type: 'wiki',
      label: 'Wiki completa',
      visible: false,
      divider: false,
      eyebrow: '',
      title: 'Wiki Completa',
      description: '',
      groups: [
        {
          title: 'Personaggio',
          cards: [
            {
              icon: '🌟',
              name: 'Come si inizia',
              description: 'Crea il tuo personaggio e inizia il tuo viaggio.',
              pageId: 'pag-come-si-inizia',
              image: '',
            },
          ],
        },
        {
          title: 'In-game',
          cards: [
            {
              icon: '📖',
              name: 'Lore',
              description: 'La storia del mondo e delle grandi civiltà.',
              pageId: 'pag-storia-del-mondo',
              image: '',
            },
            {
              icon: '🗺️',
              name: 'Mappe',
              description: 'Territori, luoghi e punti d\'interesse.',
              pageId: 'pag-mappe',
              image: '',
            },
          ],
        },
      ],
    },
  ],
};

/** Copia profonda dei default: chi modifica il risultato non tocca la costante. */
export function defaultHomepage() {
  return JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE));
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

/** Markup inline minimo: **grassetto dorato**, *corsivo*, a capo. Niente HTML libero. */
function inline(value) {
  let out = esc(value);
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong style="color:var(--gold2)">$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return out.replace(/\n/g, '<br>');
}

function text(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function slug(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function safeHref(value) {
  const href = text(value, HOMEPAGE_LIMITS.href);
  if (!href) return '';
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(href)) return href;
  return '';
}

function safeImage(value) {
  const src = text(value, HOMEPAGE_LIMITS.image);
  if (!src) return '';
  if (/^(https?:\/\/|\/)/i.test(src)) return src;
  return '';
}

function safeColor(value, fallback) {
  const color = text(value, 60);
  if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
  if (/^rgba?\(\s*[0-9.%\s,]+\)$/i.test(color)) return color;
  return fallback;
}

function bool(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  return value === true;
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

/* ── Normalizzazione ─────────────────────────────────────────────
   Ritorna { config, errors, warnings }. `errors` blocca il salvataggio
   dall'Admin; il build pubblico usa comunque `config` normalizzata. */

export function normalizeHomepage(raw) {
  const warnings = [];
  const errors = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      config: defaultHomepage(),
      errors: [],
      warnings: ['Configurazione homepage assente o non valida: uso i valori predefiniti.'],
    };
  }

  const rawVersion = Number(raw.version);
  const version = Number.isFinite(rawVersion) && rawVersion > 0 ? Math.floor(rawVersion) : HOMEPAGE_VERSION;
  if (version > HOMEPAGE_VERSION) {
    warnings.push(`La configurazione usa la versione ${version}, più recente di quella supportata (${HOMEPAGE_VERSION}).`);
  }

  if (!Array.isArray(raw.sections)) {
    return {
      config: defaultHomepage(),
      errors: ['sections deve essere una lista.'],
      warnings,
    };
  }
  if (raw.sections.length > HOMEPAGE_MAX_SECTIONS) {
    errors.push(`Massimo ${HOMEPAGE_MAX_SECTIONS} sezioni.`);
  }

  const seen = new Set();
  const sections = [];
  raw.sections.slice(0, HOMEPAGE_MAX_SECTIONS).forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      warnings.push(`Sezione ${index + 1} ignorata: non è un oggetto.`);
      return;
    }
    const type = text(item.type, 20);
    if (!HOMEPAGE_TYPES.includes(type)) {
      warnings.push(`Sezione ${index + 1} ignorata: tipo "${type || '?'}" non supportato.`);
      return;
    }
    let id = slug(item.id) || `${type}-${index + 1}`;
    if (seen.has(id)) {
      let n = 2;
      while (seen.has(`${id}-${n}`)) n += 1;
      warnings.push(`Id "${id}" duplicato: rinominato in "${id}-${n}".`);
      id = `${id}-${n}`;
    }
    seen.add(id);

    const base = {
      id,
      type,
      label: text(item.label, HOMEPAGE_LIMITS.label) || `${SECTION_TYPE_LABELS[type] || type} ${index + 1}`,
      visible: bool(item.visible, true),
      divider: bool(item.divider, false),
      eyebrow: text(item.eyebrow, HOMEPAGE_LIMITS.eyebrow),
      title: text(item.title, HOMEPAGE_LIMITS.title),
      description: text(item.description, HOMEPAGE_LIMITS.description),
    };

    if (type === 'marche') {
      sections.push({ ...base, showMap: bool(item.showMap, true) });
      return;
    }

    if (type === 'arcadia') {
      sections.push({
        ...base,
        guildsTitle: text(item.guildsTitle, HOMEPAGE_LIMITS.eyebrow),
        factions: list(item.factions)
          .slice(0, 12)
          .map((faction) => ({
            icon: text(faction && faction.icon, HOMEPAGE_LIMITS.itemIcon),
            name: text(faction && faction.name, HOMEPAGE_LIMITS.itemName),
            description: text(faction && faction.description, HOMEPAGE_LIMITS.itemDescription),
            active: bool(faction && faction.active, true),
          }))
          .filter((faction) => faction.name || faction.description),
        guilds: list(item.guilds)
          .slice(0, 12)
          .map((guild) => ({
            icon: text(guild && guild.icon, HOMEPAGE_LIMITS.itemIcon),
            name: text(guild && guild.name, HOMEPAGE_LIMITS.itemName),
            role: text(guild && guild.role, HOMEPAGE_LIMITS.itemRole),
            color: safeColor(guild && guild.color, 'rgba(200,155,60,.6)'),
          }))
          .filter((guild) => guild.name),
      });
      return;
    }

    if (type === 'news') {
      sections.push({
        ...base,
        footerText: text(item.footerText, HOMEPAGE_LIMITS.footerText),
        links: normalizeLinks(item.links),
      });
      return;
    }

    if (type === 'steps') {
      sections.push({
        ...base,
        steps: list(item.steps)
          .slice(0, 8)
          .map((step) => ({
            icon: text(step && step.icon, HOMEPAGE_LIMITS.itemIcon),
            title: text(step && step.title, HOMEPAGE_LIMITS.itemTitle),
            description: text(step && step.description, HOMEPAGE_LIMITS.itemDescription),
          }))
          .filter((step) => step.title || step.description),
        cta: normalizeCta(item.cta),
      });
      return;
    }

    /* wiki */
    sections.push({
      ...base,
      groups: list(item.groups)
        .slice(0, 12)
        .map((group) => ({
          title: text(group && group.title, HOMEPAGE_LIMITS.groupTitle),
          cards: list(group && group.cards)
            .slice(0, 24)
            .map((card) => ({
              icon: text(card && card.icon, HOMEPAGE_LIMITS.itemIcon),
              name: text(card && card.name, HOMEPAGE_LIMITS.itemName),
              description: text(card && card.description, HOMEPAGE_LIMITS.itemDescription),
              pageId: /^[a-z0-9-]{1,64}$/i.test(String((card && card.pageId) || ''))
                ? String(card.pageId)
                : '',
              image: safeImage(card && card.image),
            }))
            .filter((card) => card.name || card.description || card.pageId),
        }))
        .filter((group) => group.title || group.cards.length),
    });
  });

  if (!sections.length) {
    errors.push('La homepage deve avere almeno una sezione.');
  }
  if (sections.length && !sections.some((section) => section.visible)) {
    warnings.push('Tutte le sezioni sono nascoste: la home mostrerà solo il carousel.');
  }

  return {
    config: {
      version: HOMEPAGE_VERSION,
      updatedAt: typeof raw.updatedAt === 'string' ? text(raw.updatedAt, 40) : null,
      sections,
    },
    errors,
    warnings,
  };
}

function normalizeLinks(raw) {
  return list(raw)
    .slice(0, 6)
    .map((link) => ({
      label: text(link && link.label, HOMEPAGE_LIMITS.linkLabel),
      href: safeHref(link && link.href),
      external: bool(link && link.external, false),
    }))
    .filter((link) => link.label && link.href);
}

function normalizeCta(raw) {
  return list(raw)
    .slice(0, 4)
    .map((button) => ({
      label: text(button && button.label, HOMEPAGE_LIMITS.linkLabel),
      href: safeHref(button && button.href),
      external: bool(button && button.external, false),
      kind: button && button.kind === 'discord' ? 'discord' : '',
    }))
    .filter((button) => button.label && button.href);
}

/* ── Impronta della configurazione ───────────────────────────────
   FNV-1a su JSON normalizzato: identica in Node e nel browser, serve
   all'Admin per verificare che il sito pubblicato serva davvero la
   versione appena salvata (build-post la scrive in un commento). */

export function homepageHash(config) {
  const { config: normalized } = normalizeHomepage(config);
  const payload = JSON.stringify({ version: HOMEPAGE_VERSION, sections: normalized.sections });
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/* ── Rendering ──────────────────────────────────────────────────── */

const DISCORD_ICON =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 1.666c-.4.17-.8.38-1.17.63A18.95 18.95 0 0 0 3.7 4.49a.08.08 0 0 0-.04-.03A19.91 19.91 0 0 0 1.72 6.88a.08.08 0 0 0-.02.04c-.27.46-.48 1-.64 1.53-.19.72-.34 1.48-.44 2.27-.12.92-.17 1.87-.17 2.82 0 4.2 2.43 7.9 5.85 7.9 1.16 0 2.28-.39 3.2-1.06.38-.28.72-.62 1.02-.99.17-.2.33-.4.48-.6l.13-.17a.08.08 0 0 1 .13.02c.1.18.22.35.35.52.2.27.43.53.7.77a9.8 9.8 0 0 0 3.52 1.75 7.36 7.36 0 0 1-1.72-3.13.08.08 0 0 1 .03-.08c.18-.1.35-.22.51-.34.16-.13.3-.26.44-.4.11-.12.22-.24.32-.38.1-.14.2-.29.28-.44.12-.23.2-.45.29-.69a.08.08 0 0 0-.04-.09zm-7.79 9.06c-.76 0-1.37-.66-1.37-1.5s.61-1.5 1.37-1.5c.77 0 1.39.66 1.39 1.5s-.62 1.5-1.39 1.5zm6.12 0c-.77 0-1.39-.66-1.39-1.5s.62-1.5 1.39-1.5c.76 0 1.37.66 1.37 1.5s-.61 1.5-1.37 1.5z"/></svg>';

const ARC_DECO_L =
  '<div class="arc-deco-line"></div><div class="arc-deco-runes">ᛟ<br>✦<br>ᚹ<br>◆<br>ᚷ<br>✦<br>ᛉ</div><div class="arc-deco-line"></div>';
const ARC_DECO_R =
  '<div class="arc-deco-line"></div><div class="arc-deco-runes">ᛉ<br>✦<br>ᚷ<br>◆<br>ᚹ<br>✦<br>ᛟ</div><div class="arc-deco-line"></div>';

function renderHeading(section) {
  const parts = [];
  if (section.eyebrow) parts.push(`      <div class="sec-eyebrow">${inline(section.eyebrow)}</div>`);
  if (section.title) parts.push(`      <h2 id="${sectionAnchor(section)}" class="sec-h">${inline(section.title)}</h2>`);
  if (section.description) parts.push(`      <p class="sec-p">${inline(section.description)}</p>`);
  return parts.join('\n');
}

function sectionAnchor(section) {
  switch (section.type) {
    case 'marche':
      return 'regione-arcamis-title';
    case 'arcadia':
      return 'arcadia-title';
    case 'news':
      return 'novita-server-title';
    case 'steps':
      return 'come-iniziare-title';
    default:
      return 'wiki-completa-title';
  }
}

function renderCta(button) {
  const icon = button.kind === 'discord' ? DISCORD_ICON + ' ' : '';
  const target = button.external ? ' target="_blank" rel="noopener"' : '';
  return `<a class="sbtn" href="${esc(button.href)}"${target}>${icon}${inline(button.label)}</a>`;
}

function renderSection(section, options) {
  const mapSlot = options.mapHtml || HOMEPAGE_MAP_SLOT;

  if (section.type === 'marche') {
    const map = section.showMap ? `\n      ${mapSlot}` : '';
    return [
      `<section class="hsec fade-in" aria-labelledby="${sectionAnchor(section)}">`,
      renderHeading(section),
      map,
      '</section>',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  if (section.type === 'arcadia') {
    const factions = section.factions.length
      ? [
          '<div class="faction-grid">',
          ...section.factions.map((faction) => {
            const style = faction.active ? '' : ' style="opacity:.5;cursor:default"';
            return `        <div class="fpill"${style}><span class="fp-i">${esc(faction.icon)}</span><div><span class="fp-n">${inline(
              faction.name
            )}</span><div class="fp-d">${inline(faction.description)}</div></div></div>`;
          }),
          '      </div>',
        ].join('\n')
      : '';
    const guilds = section.guilds.length
      ? [
          section.guildsTitle
            ? `      <div class="sec-eyebrow" style="margin-top:36px">${inline(section.guildsTitle)}</div>`
            : '',
          '      <div class="guild-grid">',
          ...section.guilds.map(
            (guild) =>
              `        <div class="guild-card" style="--gbar:${esc(guild.color)}"><div class="guild-bar"></div><div class="guild-body"><div class="guild-head"><span class="guild-icon">${esc(
                guild.icon
              )}</span><div class="guild-meta"><span class="guild-name">${inline(guild.name)}</span><span class="guild-role">${inline(
                guild.role
              )}</span></div></div></div></div>`
          ),
          '      </div>',
        ]
          .filter(Boolean)
          .join('\n')
      : '';
    return [
      `<section class="arcadia-sec fade-in" aria-labelledby="${sectionAnchor(section)}">`,
      `      <div class="arc-deco arc-deco-l">${ARC_DECO_L}</div>`,
      `      <div class="arc-deco arc-deco-r">${ARC_DECO_R}</div>`,
      '      <div class="arcadia-inner">',
      '        <div>',
      renderHeading(section),
      factions,
      guilds,
      '        </div>',
      '      </div>',
      '</section>',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  if (section.type === 'news') {
    const links = section.links.length
      ? [
          '        <div class="news-links">',
          ...section.links.map((link) =>
            link.external
              ? `          <a href="${esc(link.href)}" target="_blank" rel="noopener">${inline(link.label)} <span aria-hidden="true">↗</span></a>`
              : `          <a href="${esc(link.href)}">${inline(link.label)} <span aria-hidden="true">→</span></a>`
          ),
          '        </div>',
        ].join('\n')
      : '';
    return [
      `<section class="hsec news-sec fade-in" aria-labelledby="${sectionAnchor(section)}">`,
      renderHeading(section),
      '      <div class="news-grid" id="news-home-grid" aria-live="polite" aria-busy="true">',
      '        <p class="news-loading">Caricamento novità…</p>',
      '      </div>',
      '      <div class="news-footer">',
      section.footerText ? `        <span>${inline(section.footerText)}</span>` : '        <span></span>',
      links,
      '      </div>',
      '</section>',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  if (section.type === 'steps') {
    const columns = Math.min(4, Math.max(1, section.steps.length || 1));
    const steps = section.steps.length
      ? [
          `      <div class="steps" style="grid-template-columns:repeat(${columns},1fr)">`,
          ...section.steps.map(
            (step, index) =>
              `        <div class="step"><div class="step-n">${index + 1}</div><div class="step-icon">${esc(
                step.icon
              )}</div><div class="step-title">${inline(step.title)}</div><div class="step-desc">${inline(
                step.description
              )}</div></div>`
          ),
          '      </div>',
        ].join('\n')
      : '';
    const cta = section.cta.length
      ? ['      <div class="cta-row">', ...section.cta.map((button) => '        ' + renderCta(button)), '      </div>'].join(
          '\n'
        )
      : '';
    return [
      `<section class="hsec start-sec fade-in" aria-labelledby="${sectionAnchor(section)}">`,
      renderHeading(section),
      steps,
      cta,
      '</section>',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  /* wiki */
  const groups = section.groups
    .map((group) => {
      const title = group.title
        ? `        <div class="shead"><div class="shead-gem"></div>${inline(group.title)}</div>`
        : '';
      const cards = group.cards
        .map((card) => {
          const path = card.pageId && options.pagePaths ? options.pagePaths[card.pageId] : '';
          const href = path ? ` href="/${esc(path)}"` : '';
          const thumbStyle = card.image
            ? ` style="background-image:url('${esc(card.image)}');background-size:cover;background-position:center"`
            : ' style="background:linear-gradient(140deg,#181200,#241c00)"';
          const icon = card.image ? '' : `<span>${esc(card.icon)}</span>`;
          return [
            `          <a class="lcard"${href}><div class="shine"></div>`,
            `            <div class="cthumb"${thumbStyle}>${icon}</div>`,
            `            <div class="cmeta"><div class="cname">${inline(card.name)}</div><div class="cdesc">${inline(
              card.description
            )}</div></div>`,
            '          </a>',
          ].join('\n');
        })
        .join('\n');
      return [title, cards ? `        <div class="cgrid">\n${cards}\n        </div>` : ''].filter(Boolean).join('\n');
    })
    .join('\n');

  return [
    '<section class="hsec wiki-sec fade-in" id="wiki-wrap" style="display:none" aria-labelledby="wiki-completa-title">',
    '      <button type="button" class="wiki-toggle-btn" onclick="toggleWiki()" aria-expanded="false">',
    '        <div class="shead-gem"></div>',
    `        <span style="font-family:'Cinzel',serif;font-size:9.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--gold2)">${inline(
      section.title || section.label
    )}</span>`,
    '        <span class="wiki-arrow" id="wiki-arrow">▶</span>',
    '      </button>',
    '      <div class="wiki-content" id="wiki-content">',
    groups,
    '      </div>',
    '    </section>',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * HTML delle sezioni visibili, nell'ordine della configurazione.
 * options.mapHtml  → markup della mappa (il suo contenuto resta in index.html)
 * options.pagePaths→ { 'pag-…': 'percorso/rotte' } per i link dei card wiki
 */
export function renderHomepageSections(config, options = {}) {
  const { config: normalized } = normalizeHomepage(config);
  const visible = normalized.sections.filter((section) => section.visible);
  const parts = [`<!-- homepage:${homepageHash(normalized)} -->`];
  visible.forEach((section, index) => {
    if (section.divider) parts.push('<div class="gold-sep" aria-hidden="true"></div>');
    parts.push(renderSection(section, options));
    if (index === visible.length - 1) parts.push('');
  });
  return parts.join('\n');
}
