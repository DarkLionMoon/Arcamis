/* ════════════════════════════════════════════════════════════
   ARCAMIS — notion-mapping.mjs
   Regole di migrazione dall'export HTML di Notion alle pagine
   JSON del sito. Ogni funzione è idempotente: rilanciare
   `--run` riscrive le stesse pagine dallo stesso export.

   Uso: node scripts/notion-migrate.mjs --run [export-dir]
   ════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SOURCE, readPage } from './notion-migrate.mjs';
import { ASPECTS_INTRO, DEMONS_INTRO, DEITIES, REGIONAL_SECTIONS } from './notion-pantheon-data.mjs';

const PAGES_DIR = 'content/pages';
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const now = () => new Date().toISOString();
const imageMap = new Map();

function walk(dir, extension = '.html') {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walk(full, extension));
    else if (entry.toLowerCase().endsWith(extension)) out.push(full);
  }
  return out;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(path.join(PROJECT_ROOT, file), JSON.stringify(value, null, 2) + '\n');
}

function writePage(key, { content, layout, toc }) {
  const file = path.join(PAGES_DIR, `${key}.json`);
  const page = readJson(file);
  page.content = normalizeDividers(content.replace(/\r\n/g, '\n'))
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
  if (layout !== undefined) page.layout = layout;
  if (toc !== undefined) page.toc = toc;
  page.lastModified = now();
  writeJson(file, page);
  return page;
}

function sourcePage(source, file, options = {}) {
  return readPage(path.join(source, file), { copyAssets: true, imageMap, ...options });
}

function loadPage(source, relative, options = {}) {
  const file = path.join(source, relative);
  if (!fs.existsSync(file)) throw new Error(`Pagina Notion mancante: ${relative}`);
  return sourcePage(source, relative, options);
}

function sectionsOf(markdown) {
  return markdown
    .split(/(?=^# )/m)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => {
      const lines = section.split('\n');
      const heading = lines.shift() || '';
      return { title: heading.replace(/^#\s+/, '').trim(), body: lines.join('\n').replace(/^\s*---\s*$/gm, '').trim() };
    });
}

function section(title, body, level = 1) {
  const clean = (body || '').replace(/^\s*#\s+.*\n?/, '').trim();
  return `${'#'.repeat(level)} ${title}\n\n${clean}`.trim();
}

function joinSections(blocks) {
  return blocks.filter(Boolean).join('\n\n---\n\n');
}

/* Due divisori consecutivi (es. `<hr>` finale di una pagina Notion più il
   separatore aggiunto qui) in collezione creano una scheda vuota. */
function normalizeDividers(markdown) {
  const out = [];
  let lastNonBlank = '';
  for (const line of markdown.split('\n')) {
    const isHr = /^\s*---\s*$/.test(line);
    if (isHr && lastNonBlank === '---') continue;
    if (line.trim()) lastNonBlank = isHr ? '---' : line;
    out.push(line);
  }
  return out.join('\n');
}

/* Nei layout a collezione `---` separa le schede: un <hr> interno non
   deve spezzare la scheda in due blocchi senza titolo. */
function cardBody(body) {
  return (body || '').replace(/^\s*---\s*$/gm, '***');
}

function plainText(markdown) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function csvRows(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map((line) => {
    const cells = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) {
        cells.push(current);
        current = '';
      } else current += char;
    }
    cells.push(current);
    return cells.map((cell) => cell.trim());
  });
}

function normalizeTitle(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pagesIn(source, dir, options = {}) {
  return walk(path.join(source, dir)).map((file) => ({
    file,
    ...readPage(file, { copyAssets: true, imageMap, ...options })
  }));
}

/* ── Homebrew ────────────────────────────────────────────── */

function migrateSpecies(source) {
  const dir = 'In-game/Homebrew/Specie Homebrew/Specie';
  const pages = pagesIn(source, dir);
  const byTitle = new Map(pages.map((page) => [page.title, page]));
  const existing = readJson(path.join(PAGES_DIR, 'specie-homebrew.json'));
  const current = sectionsOf(existing.content);
  const ascesi = current.find((item) => item.title === 'Ascesi');
  const shurima = current.find((item) => item.title === 'Asceso di Shurima');

  const fromStats = (markdown) => {
    const match = markdown.match(/(^|\n)(?:Taglia|Velocità|Tipologia)\s*:/);
    if (!match) return markdown;
    const body = markdown.slice(match.index).trim();
    const stats = {};
    const cleaned = body
      .split('\n')
      .filter((line) => {
        const found = line.match(/^(Taglia|Velocità|Tipologia)\s*:\s*(.+)$/);
        if (!found) return true;
        stats[found[1]] = found[2].trim();
        return false;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const details = ['Tipologia', 'Taglia', 'Velocità']
      .filter((key) => stats[key])
      .map((key) => `- **${key}:** ${stats[key]}`);
    return [details.length ? `## Dettagli\n\n${details.join('\n')}` : '', cleaned].filter(Boolean).join('\n\n');
  };

  const blocks = [];
  if (ascesi) blocks.push(section('Ascesi', cardBody(ascesi.body)));
  if (shurima) blocks.push(section('Asceso di Shurima', cardBody(shurima.body)));

  const withCover = (page, body) =>
    [page?.cover && !/^!\[/.test(body.trim()) ? `![${page.title}](${page.cover})` : '', body]
      .filter(Boolean)
      .join('\n\n');

  const targon = byTitle.get('Targon');
  if (targon) blocks.push(section('Asceso di Targon', withCover(targon, cardBody(fromStats(targon.markdown)))));
  const darkin = byTitle.get('Darkin');
  if (darkin) blocks.push(section('Darkin', withCover(darkin, cardBody(fromStats(darkin.markdown)))));

  const skip = new Set(['Ascesi', 'Asceso di Shurima', 'Asceso di Targon', 'Darkin', 'Shurima', 'Targon']);
  for (const page of pages.sort((a, b) => a.title.localeCompare(b.title, 'it'))) {
    if (skip.has(page.title)) continue;
    blocks.push(section(page.title, withCover(page, cardBody(page.markdown))));
  }

  const intro = 'Specie giocabili nate dal materiale homebrew del server: tratti, privilegi e varianti approvate dallo staff. Le specie già presenti nei manuali restano raccolte in [Regole Homebrew](/lore/regole-homebrew).';
  writePage('specie-homebrew', {
    content: `${intro}\n\n---\n\n${joinSections(blocks)}`,
    layout: 'compendio',
    toc: false
  });
  return { sections: blocks.length, source: pages.length };
}

function classOrder(value) {
  const order = ['Artefice', 'Barbaro', 'Bardo', 'Chierico', 'Druido', 'Guerriero', 'Ladro', 'Mago', 'Monaco', 'Paladino', 'Ranger', 'Stregone', 'Warlock'];
  const index = order.findIndex((entry) => entry.toLowerCase() === String(value || '').toLowerCase());
  return index === -1 ? order.length : index;
}

function migrateSubclasses(source) {
  const dir = 'In-game/Homebrew/Sottoclassi Homebrew/Sottoclassi';
  const pages = pagesIn(source, dir);
  const blocks = pages
    .sort((a, b) => classOrder(a.properties?.Classe) - classOrder(b.properties?.Classe) || a.title.localeCompare(b.title, 'it'))
    .map((page) => {
      const meta = page.properties?.Classe ? `*Classe:* ${page.properties.Classe}` : '';
      return section(page.title, [meta, cardBody(page.markdown)].filter(Boolean).join('\n\n'));
    });

  const intro = 'Sottoclassi homebrew approvate per le classi del server. Ogni scheda riporta la classe di appartenenza e i privilegi così come sono giocati ad Arcamis.';
  writePage('sottoclassi-homebrew', {
    content: `${intro}\n\n---\n\n${joinSections(blocks)}`,
    layout: 'compendio',
    toc: false
  });
  return { sections: blocks.length, source: pages.length };
}

function migrateRules(source) {
  const base = 'In-game/Homebrew/Regole Homebrew per specie, classi ed oggetti già_';
  const groups = [
    { title: 'Specie già esistenti', dir: `${base}/Specie` },
    { title: 'Classi e sottoclassi', dir: `${base}/Classi` },
    { title: 'Talenti', dir: `${base}/Feat` },
    { title: 'Oggetti', dir: `${base}/Oggetti` }
  ];

  const blocks = [];
  let count = 0;
  for (const group of groups) {
    const pages = pagesIn(source, group.dir, { headingOffset: 0 }).filter(
      (page) => !/^Tutte le sottoclassi$/i.test(page.title)
    );
    if (!pages.length) continue;
    const entries = pages.map((page) => {
      count += 1;
      const meta = page.properties?.Classi ? `*Classe:* ${page.properties.Classi}` : '';
      return section(page.title, [meta, page.markdown].filter(Boolean).join('\n\n'), 2);
    });
    blocks.push(section(group.title, joinSections(entries)));
  }

  const intro =
    'Regole homebrew per specie, classi e oggetti già presenti nei manuali: varianti approvate dallo staff per giocare i contenuti ufficiali nel mondo di Arcamis.';
  writePage('regole-homebrew', {
    content: `${intro}\n\n---\n\n${joinSections(blocks)}`,
    layout: '',
    toc: true
  });
  return { sections: count };
}

/* ── Lore ────────────────────────────────────────────────── */

function migrateTimeline(source) {
  const dir = 'In-game/Lore/Introduzione/Un po’ di storia';
  const pages = pagesIn(source, `${dir}/Timeline`);
  const byTitle = new Map(pages.map((page) => [normalizeTitle(page.title), page]));
  const rows = csvRows(path.join(source, `${dir}/Timeline 2fc0274fdc1c800f8ac0d6d03b255cad.csv`));
  const parent = loadPage(source, `${dir} 2fc0274fdc1c80c4bbc1c8806f591e0f.html`);

  const intro = parent.markdown
    .replace(/^#\s+.*\n?/, '')
    .replace(/^DISCLAIMER\s*$/m, '')
    .replace(/^###\s+Introduzione:?\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const blocks = [];
  for (const [index, [name, , label]] of rows.entries()) {
    const page = byTitle.get(normalizeTitle(name));
    if (!page) continue;
    const body = page.markdown
      .replace(/^#\s+.*\n?/, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .split('\n')
      .map((line) => line.replace(/^>\s?/, '').trim())
      .filter((line) => line && line !== '---')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!body) continue;
    blocks.push(`## ${name}\n\n- **${label}:** ${body}`);
  }

  writePage('storia-del-mondo', {
    content: `${intro}\n\n---\n\n${blocks.join('\n\n')}`,
    layout: 'timeline',
    toc: false
  });
  return { sections: blocks.length, source: pages.length };
}

function migratePlanes(source) {
  const dir = 'In-game/Lore/Piani di esistenza/Untitled';
  const pages = pagesIn(source, dir, { headingOffset: 1 });
  const order = ['Reame Fisico', 'Reame Celestiale', 'Reame Spirituale', 'Il Vuoto', 'Reame della Morte', 'La Radura', 'Marus Omegnum'];
  pages.sort((a, b) => {
    const ai = order.indexOf(a.title);
    const bi = order.indexOf(b.title);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.title.localeCompare(b.title, 'it');
  });

  const existing = readJson(path.join(PAGES_DIR, 'piani-di-esistenza.json'));
  /* La pagina contiene già le sezioni migrate: si riparte dall'introduzione
     originale, non dall'ultima esecuzione. */
  const intro = existing.content.split(/\n\n---\n\n## /)[0].replace(/\n{3,}/g, '\n\n').trim();
  const blocks = pages.map((page) => section(page.title, page.markdown, 2));
  writePage('piani-di-esistenza', {
    content: `${intro}\n\n---\n\n${blocks.join('\n\n')}`,
    layout: '',
    toc: true
  });
  return { sections: blocks.length };
}

function migrateBibliography(source) {
  const dir = 'In-game/Lore/Bibliografia scoperta/Bibliografia scoperta';
  const pages = pagesIn(source, dir);
  const rows = pages
    .sort((a, b) => a.title.localeCompare(b.title, 'it'))
    .map((page) => {
      const note = page.markdown
        .replace(/^#\s+.*\n?/, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return `| ${page.title.replace(/\|/g, '\\|')} | ${note.replace(/\|/g, '\\|') || '—'} |`;
    });

  const existing = readJson(path.join(PAGES_DIR, 'bibliografia-scoperta.json'));
  const intro = existing.content.split(/\n\n## Opere catalogate/)[0].trim();
  const table = ['| Opera | Autore / nota |', '| --- | --- |', ...rows].join('\n');
  writePage('bibliografia-scoperta', {
    content: `${intro}\n\n## Opere catalogate\n\n${table}`,
    layout: '',
    toc: true
  });
  return { sections: rows.length };
}

function migrateKingdoms(source) {
  const dir = 'In-game/Lore/Introduzione/Regni esterni';
  const pages = pagesIn(source, dir, { headingOffset: 1 });
  const order = csvRows(path.join(source, 'In-game/Lore/Introduzione/Regni esterni 2f60274fdc1c80bb88adc1676f818b62.csv')).map(([name]) => name);
  pages.sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));

  const existing = readJson(path.join(PAGES_DIR, 'introduzione.json'));
  /* Idempotenza: le sezioni "Regni esterni" appartengono a una run
     precedente, si tengono solo l'introduzione e i suoi titoli. */
  const baseSource = existing.content.split(/\n\n# Regni esterni\b/)[0];
  const base = baseSource
    .replace(/^###\s+Benvenuti ad Aetherion\s*$/m, '## Benvenuti ad Aetherion')
    .replace(/^###\s+Terre Selvagge e Mari\s*$/m, '## Terre Selvagge e Mari')
    .replace(/^###\s+Il calendario di Aetherion\s*$/m, '## Il calendario di Aetherion')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const wilds =
    'Tra un regno e l’altro si stendono terre senza padrone: boschi che nessun censimento attraversa, passi di montagna battuti solo dai contrabbandieri, paludi dove le mappe finiscono. Sono i luoghi in cui nascono le storie che poi arrivano ad Arcamis sotto forma di voce, prezzo o minaccia.';
  const calendar =
    'Il calendario ufficiale è quello imposto da Noxus: gli anni si contano **AN** (Avanti Noxus), prima della fondazione dell’impero, e **DN** (Dopo Noxus). Le altre culture conservano le proprie datazioni, ma sulle rotte commerciali e nei documenti delle Marche prevale il conteggio noxiano.';

  const withWilds = base.replace(
    /^## Terre Selvagge e Mari\s*$/m,
    `## Terre Selvagge e Mari\n\n${wilds}`
  );
  const withCalendar = withWilds.replace(
    /^## Il calendario di Aetherion\s*$/m,
    `## Il calendario di Aetherion\n\n${calendar}`
  );

  const blocks = pages.map((page) =>
    section(page.title, page.markdown.replace(/^## FAZIONI\s*$/gm, '### FAZIONI'), 2)
  );
  writePage('introduzione', {
    content: `${withCalendar}\n\n# Regni esterni\n\nOltre le Marche di Arcamis, Aetherion è divisa in grandi regni, città-stato e terre contese. Queste sono le potenze che gli avventurieri possono incontrare sulla strada, nei porti e nelle corti.\n\n${blocks.join('\n\n')}`,
    layout: '',
    toc: true
  });
  return { sections: blocks.length };
}

function migrateCasate(source) {
  const base = 'In-game/Maestria Titoli ed altro/Casate e Compagnie';
  const company = loadPage(source, `${base}/Compagnie Mercantili 31f0274fdc1c804b83e2c877ba0b19d6.html`, { headingOffset: 1 });
  const cabala = loadPage(source, `${base}/Compagnie Mercantili/Untitled/La Cabala del Filo di Seta 31f0274fdc1c80b0b80ffbcd541d71b2.html`, { headingOffset: 1 });
  const kikri = loadPage(source, `${base}/Ordine Kikri 32c0274fdc1c80febaedfb183944dfb4.html`, { headingOffset: 1 });

  const content = [
    'Ad Arcamis il potere non passa solo dalle istituzioni: casate, compagnie mercantili e ordini antichi tessono alleanze, debiti e rivalità che gli avventurieri incontrano ogni giorno.',
    '## Compagnie Mercantili',
    'Le compagnie controllano rotte, magazzini e prestiti. Il loro peso cresce là dove le strade sono incerte e le guardie lontane.',
    '### La Cabala del Filo di Seta',
    cabala.markdown || 'Una compagnia mercantile poco conosciuta, il cui primo contatto con gli avventurieri risale al 10 marzo 2026.',
    '## Ordine Kikri',
    kikri.markdown || 'Un antenato dell’Ordine Kinkou, proveniente dalle antiche terre oltre il regno di Arcadia.'
  ].join('\n\n');

  writePage('casate-e-compagnie', { content, layout: '', toc: true });
  return { sections: 3 };
}

function migrateArcamy(source) {
  const locations = [
    'Arena',
    'Biblioteca',
    'Bottega farmaceutica',
    'Caserma',
    'Corporazione dei costruttori',
    'Forgia',
    'Il Polpo Verde',
    'Locanda',
    'Ospedale',
    'Piazza',
    'Porto',
    'Sartoria'
  ];
  const dir = 'In-game/Lore/Esplora dal “vivo”/Marche di Arcamis/Arcamis/Luoghi di Arcamis';
  const pages = pagesIn(source, dir, { headingOffset: 0 });
  const byTitle = new Map(pages.map((page) => [page.title, page]));
  const fallback = {
    Arena: 'Il cerchio di pietra dove si misurano le lame e si mettono alla prova i nuovi arrivati. Le rune dell’arena chiudono gli scontri prima che diventino funerali.',
    Biblioteca: 'Un silenzio rispettoso avvolge la biblioteca: chi alza troppo la voce scopre presto che il capo dello staff non ha pazienza per i curiosi.',
    'Bottega farmaceutica': 'Ampolle, erbe secche e odori che restano addosso per giorni. Qui si comprano rimedi, veleni e qualche risposta che non si trova altrove.',
    Caserma: 'Il cuore armato di Arcamis: armeria, celle e corridoi dove le guardie parlano più volentieri con chi porta ordini scritti.',
    'Corporazione dei costruttori': 'Imprese, cantieri e contratti. Chi vuole costruire qualcosa ad Arcamis passa prima da questi banchi.',
    Forgia: 'Il fuoco non si spegne mai. La forgia lavora per la città, per le guardie e per chi paga abbastanza da non fare domande.',
    'Il Polpo Verde': 'Una locanda dal proprietario molto particolare, dove le voci corrono più veloci del vino.',
    Locanda: 'Il primo posto in cui un forestiero trova un letto, una birra e qualcuno disposto a raccontare ciò che non dovrebbe.',
    Ospedale: 'Bende, preghiere e qualche miracolo minore. Le porte restano aperte anche quando le casse della città sono vuote.',
    Piazza: 'Il centro di Arcamis, dove i banditori leggono gli editti e le notizie cambiano padrone prima di sera.',
    Porto: 'Moli, cordami e navi che arrivano da mezzo mondo. Al porto si trova lavoro, merce proibita e gente che non vuole essere ricordata.',
    Sartoria: 'Aghi, stoffe e abiti su misura. Un buon sarto vale quanto una lama, soprattutto quando bisogna sembrare qualcun altro.'
  };

  const blocks = locations.map((title) => {
    const page = byTitle.get(title);
    return section(
      title,
      [fallback[title], page?.markdown?.replace(/!\[[^\]]*\]\(https:\/\/cdn\.discordapp\.com[^)]*\)\n?/g, '')]
        .filter(Boolean)
        .join('\n\n'),
      2
    );
  });

  const content = [
    'Arcamis è la città portuale delle Marche: un crocevia di merci, giuramenti e storie che non sempre tornano. Qui si trovano i luoghi che ogni avventuriero impara presto a conoscere.',
    ...blocks
  ].join('\n\n');

  writePage('arcamis', { content, layout: '', toc: true });
  return { sections: blocks.length };
}

function migrateMaps(source) {
  const mappins = readJson('content/mappins.json');
  const pins = Array.isArray(mappins.pins) ? mappins.pins : [];
  const list = pins
    .filter((pin) => pin.name)
    .map((pin) => `- **${pin.name}** — ${pin.desc || 'Luogo segnato sulla mappa.'}`)
    .join('\n');

  const mapContent = [
    'La mappa delle Marche di Arcamis raccoglie porti, fortezze, boschi e rovine. I puntini non sono decorazioni: ogni luogo è una porta verso una storia.',
    '![Mappa delle Marche di Arcamis](/mappa.webp)',
    '## Luoghi segnati',
    list
  ].join('\n\n');

  writePage('mappa-arcamis', { content: mapContent, layout: 'wide', toc: false });
  writePage('mappe', {
    content: [
      'Le mappe del mondo di Arcamis, aggiornate con i luoghi esplorati dagli avventurieri.',
      '## Marche di Arcamis',
      'La carta delle Marche raccoglie la città di Arcamis e i suoi dintorni. Per i dettagli di ogni luogo, apri la [mappa interattiva](/lore/mappa-arcamis).',
      '![Mappa delle Marche di Arcamis](/mappa.webp)'
    ].join('\n\n'),
    layout: '',
    toc: false
  });
  return { pins: pins.length };
}

function migrateLands() {
  const mappins = readJson('content/mappins.json');
  const pins = Array.isArray(mappins.pins) ? mappins.pins : [];
  const entries = {
    volonx: {
      title: 'Volonx',
      body: 'Volonx sorge ai margini delle Marche, dove le strade diventano sentieri e i sentieri si perdono nei campi. È un insediamento di poche case e molte assenze: chi ci abita raramente se ne va, e chi arriva non sempre spiega perché.'
    },
    vigilius: {
      title: 'Vigilius',
      body: 'Vigilius è la città interna delle Marche, il centro politico e militare da cui si amministra il territorio. Le sue mura non sono le più alte della regione, ma gli ordini che ne escono arrivano ovunque.'
    },
    galeton: {
      title: 'Galeton',
      body: 'Galeton vive di incroci. Qui si incontrano carovane, mercanti e messaggeri, e ogni piazza è un piccolo mercato dove le notizie hanno lo stesso prezzo delle merci.'
    },
    'lago-di-gromot': {
      title: 'Lago di Gromot',
      body: 'Le acque del Lago di Gromot sono scure e profonde, e nessuno sa davvero quanto siano profonde. I pescatori parlano di correnti che tirano verso il fondo; gli avventurieri parlano di ciò che ci vive.'
    },
    'forte-vigilus': {
      title: 'Forte Vigilus',
      body: 'Forte Vigilus controlla i passi verso est da un’altura battuta dal vento. La guarnigione è ridotta, ma le vedette vedono arrivare chiunque prima che metta piede sulla strada principale.'
    },
    'riva-di-ferro': {
      title: 'Riva di Ferro',
      body: 'Riva di Ferro è un porto minore di pescatori, contrabbandieri e avventurieri di passaggio. Le banchine sono poche, ma abbastanza per far sparire un carico prima dell’alba.'
    },
    fumofosco: {
      title: 'Fumofosco',
      body: 'Fumofosco è avvolto da nebbie che non seguono il vento. I locali non parlano molto degli stranieri, e ancora meno di ciò che si muove nei campi quando cala la sera.'
    },
    'rovine-di-kaldur': {
      title: 'Rovine di Kaldur',
      body: 'Di Kaldur resta poco: pietre spezzate, fondamenta annerite e un silenzio che non assomiglia a quello delle rovine comuni. Si dice che le pietre brucino ancora, e che chi le tocca senta il calore sotto la pelle.'
    }
  };

  for (const [key, entry] of Object.entries(entries)) {
    const pin = pins.find((item) => item.pageId === `pag-${key}` || item.name === entry.title);
    const intro = pin?.desc ? `*${pin.desc}*` : '';
    writePage(key, {
      content: [intro, entry.body].filter(Boolean).join('\n\n'),
      layout: '',
      toc: false
    });
  }

  writePage('selva-fogliabruna', {
    content: [
      'Gli alberi della Selva Fogliabruna sono troppo vecchi per essere abbattuti e troppo fitti per essere mappati. Chi entra non sempre torna, e chi torna non sempre racconta la stessa strada.',
      '## Punti d’interesse',
      '- **Rivorosso** — un nome che i cacciatori segnano sulle mappe senza spiegare perché.'
    ].join('\n\n'),
    layout: '',
    toc: true
  });

  writePage('foresta-dello-smarrimento', {
    content: [
      'Non ci sono mappe. I sentieri cambiano. Rune violacee compaiono di notte.',
      'La foresta non è semplicemente fitta: sembra ascoltare. Le bussole girano, i richiami si ripetono da direzioni diverse e le lanterne si spengono senza vento. Chi vuole attraversarla impara a fidarsi più dei segni lasciati dietro di sé che della strada davanti.',
      '## Punti d’interesse',
      '- **Circolo smarrimento**',
      '- **Dimora degli Ursidi**',
      '- **La caverna delle Talpe**',
      '- **Miniera Bruciascoria**'
    ].join('\n\n'),
    layout: '',
    toc: true
  });

  return { pages: Object.keys(entries).length + 2 };
}

function migrateLavori(source) {
  const page = readJson(path.join(PAGES_DIR, 'lavori.json'));
  if (page.content.includes('# Gilda degli avventurieri')) return { added: 0 };
  const gilda = loadPage(source, 'Lavori/Gilda degli avventurieri 2f00274fdc1c801b8c13cefd9e15694e.html');
  const block = section('Gilda degli avventurieri', cardBody(gilda.markdown));
  page.content = `${page.content.trim()}\n\n---\n\n${block}\n`;
  page.lastModified = now();
  writeJson(path.join(PAGES_DIR, 'lavori.json'), page);
  return { added: 1 };
}

/* ── Pulizia immagini non referenziate ───────────────────── */

function pruneImages() {
  const dir = path.join(PROJECT_ROOT, 'images', 'notion');
  if (!fs.existsSync(dir)) return { removed: 0 };
  const refs = new Set();
  for (const file of fs.readdirSync(path.join(PROJECT_ROOT, PAGES_DIR))) {
    if (!file.endsWith('.json') || file === 'registry.json') continue;
    const text = fs.readFileSync(path.join(PROJECT_ROOT, PAGES_DIR, file), 'utf8');
    for (const match of text.matchAll(/\/images\/notion\/([^)"#]+)/g)) refs.add(match[1]);
  }
  let removed = 0;
  for (const file of fs.readdirSync(dir)) {
    if (refs.has(file)) continue;
    fs.unlinkSync(path.join(dir, file));
    removed += 1;
  }
  return { removed };
}

/* ── Indice di ricerca e recenti ─────────────────────────── */

function regenerateIndexes() {
  const registry = readJson(path.join(PAGES_DIR, 'registry.json'));
  const search = [];
  const recent = [];
  for (const entry of registry.pages || []) {
    const file = path.join(PAGES_DIR, `${entry.k}.json`);
    if (!fs.existsSync(path.join(PROJECT_ROOT, file))) continue;
    const page = readJson(file);
    search.push({
      id: `pag-${entry.k}`,
      title: page.title || entry.l,
      icon: page.icon || entry.i || '📄',
      text: plainText(page.content || '')
    });
    recent.push({
      id: `pag-${entry.k}`,
      title: page.title || entry.l,
      icon: page.icon || entry.i || '📄',
      lastEdited: page.lastModified || ''
    });
  }
  recent.sort((a, b) => String(b.lastEdited).localeCompare(String(a.lastEdited)));
  writeJson('content/search-index.json', search);
  writeJson('content/recent.json', { pages: recent.slice(0, 8) });
  return { pages: search.length };
}

/* ── Entry point ─────────────────────────────────────────── */

export async function runMigrations({ root = PROJECT_ROOT, source = DEFAULT_SOURCE } = {}) {
  if (!fs.existsSync(source)) {
    throw new Error(`Export Notion non trovato: ${source}`);
  }

  const report = {};
  report.species = migrateSpecies(source);
  report.subclasses = migrateSubclasses(source);
  report.rules = migrateRules(source);
  report.timeline = migrateTimeline(source);
  report.planes = migratePlanes(source);
  report.bibliography = migrateBibliography(source);
  report.kingdoms = migrateKingdoms(source);
  report.casate = migrateCasate(source);
  report.arcamy = migrateArcamy(source);
  report.maps = migrateMaps(source);
  report.lands = migrateLands();
  report.lavori = migrateLavori(source);
  report.pantheon = await migratePantheon(source);
  report.images = pruneImages();
  report.indexes = regenerateIndexes();

  console.log('\n✔ Migrazione Notion completata');
  for (const [name, value] of Object.entries(report)) {
    console.log(`  ${name.padEnd(14)} ${JSON.stringify(value)}`);
  }
  return report;
}

function deityBlock(deity) {
  const parts = [`# ${deity.name}`];
  if (deity.img) parts.push(`![${deity.name}](${deity.img})`);
  if (deity.quote) parts.push(`> ${deity.quote}`);
  parts.push(
    [
      '## Identità',
      '',
      `- **Nome:** ${deity.name}`,
      `- **Epiteto:** ${deity.epithet}`,
      `- **Allineamento:** ${deity.alignment}`,
      `- **Sfere:** ${deity.spheres}`,
      `- **Simbolo:** ${deity.symbol || '—'}`
    ].join('\n')
  );
  parts.push(`## Personalità\n\n${deity.personality}`);
  parts.push(
    [
      '## Culto',
      '',
      `- **Tempio:** ${deity.temple}`,
      `- **Rituali:** ${deity.rituals}`,
      `- **Seguaci:** ${deity.followers}`
    ].join('\n')
  );
  return parts.join('\n\n');
}

async function migratePantheon() {
  const intro = `# Divinità

In un mondo direttamente influenzato dalla divinità, i miti di Aetherion sono fondamentali. Molti attribuiscono la creazione del mondo all’opera dei celestiali, potenze superiori; molti altri traggono capacità magiche o conforto personale dalla presenza degli dèi.

È quasi impossibile negare la presenza delle forze del bene, del male e della neutralità all’opera nel plasmare Aetherion e i suoi popoli. Questa sezione elenca le divinità, i demoni e altre figure sacre presenti su Aetherion.

Quando crei il tuo personaggio, chiediti: il mio personaggio è fedele a un dio o a più dèi? Riceve qualcosa in cambio della propria devozione? Collabora con il Dungeon Master per determinare il rapporto del tuo personaggio con il pantheon di Aetherion, se esiste.`;

  const blocks = [intro];
  for (const deity of DEITIES) {
    if (deity.group === 'ASPETTI') blocks.push(`# ASPETTI\n\n${ASPECTS_INTRO}`);
    if (deity.group === 'DEMONI') blocks.push(`# DEMONI\n\n${DEMONS_INTRO}`);
    blocks.push(deityBlock(deity));
  }
  for (const section of REGIONAL_SECTIONS) {
    blocks.push(`# ${section.title}\n\n${section.body}`);
  }
  blocks.push(
    '# Nota sulle fonti\n\nParte del pantheon, dei nomi e delle immagini deriva da League of Legends, di proprietà della Riot Games. Il materiale è adattato al mondo di Arcamis e integrato con le aggiunte homebrew del server.'
  );

  writePage('pantheon', {
    content: blocks.join('\n\n---\n\n'),
    layout: 'pantheon',
    toc: false
  });
  return { deities: DEITIES.length, sections: REGIONAL_SECTIONS.length };
}
