# Arcamis Wiki

Wiki del server D&D Arcamis: sito statico su Cloudflare Pages + pannello admin Vue.
Contenuto 100% local-first — JSON statici versionati nel repo, nessuna chiamata
a Notion a runtime.

- **Parte 1 — Il sito**: cos'è, come funziona, contenuti, pagine speciali, temi, SEO.
- **Parte 2 — Il pannello admin**: cos'è, accesso e ruoli, tutorial d'uso.
- **Appendice tecnica**: struttura repo, build, test, deploy, sicurezza.

---

# Parte 1 — Il sito

## 1.1 Cos'è

Arcamis Wiki è la wiki di campagna del server D&D Arcamis: regole del server,
materiale approvato e homebrew, lore e pantheon, bestiario, lavori e mestieri,
imprese e licenze, mappe, changelog. È una **SPA statica** (`index.html`):
tutto il contenuto è già nel deploy sotto forma di JSON, il browser non chiama
alcun backend per leggere le pagine (le Functions servono solo al pannello
admin e a pochi endpoint di contorno).

## 1.2 Come funziona

```
Browser ──► dist/<rotta>.html (prerender, head SEO dedicato)
         ──► index.html + JS classici (navigazione client-side)
         ──► /content/pages/<slug>.json (contenuto markdown)
         ──► render nel DOM (renderer per layout)
```

- **Navigazione client-side**: la funzione `gp()` in `scripts/js/app.js`
  cambia pagina senza ricaricare, con supporto a history/popstate, deep link
  e pull-to-refresh su mobile. La mappa tra URL puliti e pagine (`_pathMap`)
  è **auto-generata** da `scripts/sync-registry.py`: non modificarla a mano.
- **Prerender**: a ogni build ogni rotta pubblica diventa un file
  `dist/<rotta>.html` con `<head>` dedicato (title, description, canonical,
  Open Graph, Twitter Card, JSON-LD `WebPage`/`Article` + `BreadcrumbList`) e
  fallback `<noscript>`. Niente catch-all SPA: gli URL inesistenti servono
  `404.html` con status **404 vero**.
- **Rotte come dati**: `scripts/lib/routes.mjs` è la fonte unica — legge
  `registry.json`, `pantheon.json` e `lavori.json` e da lì derivano prerender,
  `sitemap.xml` e `robots.txt`. Aggiungere una pagina ai contenuti la fa
  comparire automaticamente ovunque, senza elenchi da allineare a mano.
- **JS classici separati**: gli script in `scripts/js/` restano file distinti
  con scope globale (non un bundle unico) perché l'ordine di init e
  l'hoisting delle funzioni contano; in build vengono solo minificati e
  rinominati con hash del contenuto (`app.f89a88ab86.js`).

## 1.3 I contenuti

Tutto ciò che il sito mostra vive nel repo:

| Dove | Cosa |
|------|------|
| `content/pages/<slug>.json` | Le pagine: `k`, `title`, `icon`, `content` (markdown), `layout`, `explore`, `toc`, `status`, `lastModified` |
| `content/databases/*.json` | Database/gallerie (`{ "pages": [...] }`: pantheon, lavori, …) |
| `content/search-index.json` | Indice full-text per la ricerca locale |
| `content/changelog.json`, `content/mappins.json`, `content/recent.json` | Changelog, puntine della mappa, attività recente |
| `images/`, `audio/` | Immagini caricate dall'editor e effetti sonori |

Se una pagina JSON manca, il client mostra un placeholder "non disponibile":
nessuna chiamata di rete, nessun errore.

### Aggiornare una pagina a mano

```bash
# modifica content/pages/<slug>.json (campo content, markdown), poi:
git add content/pages/materiale-approvato.json
git commit -m "Aggiorna materiale approvato"
git push
```

Cloudflare Pages deploya automaticamente. (La via normale resta il pannello
admin — vedi Parte 2.)

## 1.4 Le pagine speciali

- **Home** (`app-home.js`): hero con **carousel dinamico** — numero, ordine,
  visibilità, testi, bottoni, sfondi e rotazione si gestiscono dal pannello
  (manifest KV `admin_carousel` servito da `/api/carousel`; senza manifest
  restano le 3 slide hardcoded con gli override legacy `admin_cover_*`).
  Card delle pagine con copertine lazy (`/api/cover/<id>`, ETag + revalidate).
- **Materiale Approvato** (layout `materiale`): browser stile 5e.tools —
  **indice laterale** ricercabile con filtri per fonte (35+ manuali,
  Homebrew in evidenza), **badge colorati con tooltip** e pannello dettaglio;
  le classi sono accordion con conteggio sottoclassi. Ricerca live,
  deep-link via hash e apertura automatica degli accordion in
  `scripts/js/materiale-browser.js` (senza JS i link àncora funzionano comunque).
- **Imprese & Licenze** (layout `imprese`): vera mini-app integrata nella
  pagina (`scripts/js/imprese.js`, ~1300 righe): tab Società/Licenze, sidebar
  delle sezioni, tabelle, **ricerca globale** con conteggio risultati e
  **Gestore di Società** completo (soci, strutture, contratti, sanzioni,
  eventi, salvataggio in `localStorage`). Stessi font, token e frame del resto
  del sito; full-width su desktop, drawer su mobile.
- **Pantheon / Collezione**: griglie di tile con immagini e schede dedicate
  (`<chiave>-<slug>`); `collezione` è la versione generica riutilizzabile.
  Le schede del Pantheon usano la **pagina entità v2** (vedi 1.7): hero,
  rail dei metadati e tab. Le altre collezioni restano sul renderer storico
  finché i loro markdown non hanno la stessa struttura (metadati + `##`).
- **Bestiario, Fazioni, Oggetti, Timeline/Cronache, Glossario, Tabelle,
  Galleria, Lore, Lavoro, Personaggio**: renderer dedicati in `notion-nav.js`.
- **Layout `schede`** (anche `sessione`, `quest`, `npc`, `spell`, `specie`,
  `citta`, `evento`): ogni `##` diventa una card in griglia, con campi
  `- **Chiave:** valore` (`_renderSchede`).
- **Blocchi editor**: `:::cards` con `### Titolo` e `:::gallery` con una
  immagine per riga, resi da `md-render.js` in `.n-cards` / `.n-gal`.
- **Mappa**: puntine da `mappins.json`, coordinate in percentuali (stabili a
  zoom/scroll), tooltip e navigazione alle schede luogo. Le puntine non
  esplorate (`explored: false`, si imposta dal pannello Mappa) mostrano
  "Inesplorato" e la home conta i luoghi rivelati (`map-public.js`).
- **Esplorazione delle pagine** (`explore` nel JSON pagina): le pagine lunghe
  non sono più un unico listone. Il markdown resta la fonte delle voci; il
  pattern scelto decide come leggerlo e disporlo — **master-detail** (elenco
  ricercabile + scheda unica, deep link `#specie/ascesi`), **group-tabs**
  (colonna dei gruppi + linguette delle voci, es. classi → sottoclassi),
  **tabs** (schede orizzontali + indice sticky con highlight), **drawer**
  (griglia di tessere + cassetto laterale) e **accordion** (macro-categorie
  richiudibili). Logica in `scripts/js/explorer.js`, stili in
  `style-explorer.css`; su mobile il master-detail diventa lista → dettaglio
  con "Torna alla lista", mentre group-tabs tiene i gruppi in una striscia
  orizzontale sopra le linguette.
- **Changelog e Novità**: widget e pagina dedicata dai JSON locali.
- **Missioni (rimossa)**: la sezione missioni non fa più parte della wiki.
  Nessuna rotta, voce di menu, sitemap o vista Admin la espone: il registro
  pagine e `scripts/lib/routes.mjs` non la conoscono, quindi un vecchio link
  finisce nella 404 vera.

### Layout disponibili

Ogni pagina dichiara un `layout` (se manca, rilevato dalla chiave):
`contenuto`, `luoghi`, `cronache`, `personaggio`, `materiale`, `wide`,
`pantheon`, `collezione`, `bestiario`, `timeline`, `fazioni`, `oggetti`,
`glossario`, `galleria`, `tabelle`, `schede`, più i layout a
card `sessione`, `quest`, `npc`, `spell`, `specie`, `citta`, `evento`.
Nell'editor si sceglie
tra tre preset — **Wiki standard**, **Immersivo / full width** (`wide`),
**Schede / griglia** (`schede`) — con selettore avanzato per gli altri.

## 1.5 Ricerca, temi, PWA

- **Ricerca**: client-side sull'indice statico (`app-ui.js` → fetch di
  `/content/search-index.json`, lazy al primo uso): minimo 2 caratteri,
  debounce, punteggio titolo > testo, snippet, navigazione da tastiera
  (↑/↓ + Invio). Zero server.
- **Temi** (`dark`, `light`, `theme-blood`, `theme-forest`, `theme-abyss`,
  `theme-alchemy`): stesso set di token in `:root` (`--bg…--bg5`, `--panel`,
  `--gold…--gold4`, `--gold-rgb`, `--text/2/3`, `--parch`, …). Le superfici
  "vetro" leggono `--surface-rgb`/`--panel-rgb` e si adattano da sole.
  `themes.test.js` fallisce se un token manca o un testo scende sotto 4.5:1.
- **PWA/offline**: manifest + icone (`npm run icons`), font self-hosted
  (`npm run fonts`, nessun ping a Google Fonts — la CSP non lo permette),
  service worker versionato per build con precache reale (shell, JS/CSS e
  JSON dati: indice ricerca, mappa) e fallback
  `offline.html`: le pagine già visitate restano leggibili senza rete. Le copertine non sono più base64 nei JSON: URL
  `/api/cover/<id>` scaricati on demand.
- **Pagina crediti** (`/credits`): disclaimer e attribuzioni, informativa sul
  conteggio visite (`track_view`: nessun IP, nessun cookie, solo aggregati) e
  contatti. Linkata dal footer e dal menu mobile.

## 1.6 Design system v2 (Dark Hextech)

- **Token**: `scripts/css/theme-v2.css` si carica subito dopo `style-base.css`
  e rimappa i token storici sulla palette Deep Void / Runeterra Gold /
  Hextech Teal. Aggiunge i token nuovi (`--accent`, `--bevel`, `--ring`,
  `--radius-*`, `--glow-teal`). I temi alternativi restano invariati finché
  non vengono rifatti. `themes.test.js` legge anche questo file: se un colore
  di testo scende sotto AA, la CI lo segnala.
- **Icone**: `images/icons-lore.svg` è lo sprite (tratto 1.7, `currentColor`);
  `scripts/js/icons.js` espone `arcIcon(name)` e `arcIconFor(emoji)`. Il menu
  usa le icone nuove e ricade sull'emoji del registro per le voci non ancora
  mappate, così la migrazione può procedere pagina per pagina.
- **Immagini responsive**: `scripts/optimize-images.mjs` (sharp) genera AVIF e
  WebP a 640/1280/1920px in `images/opt/`, senza mai ingrandire i sorgenti, e
  scrive `images/opt/manifest.json` + `scripts/js/image-manifest.js` (misure
  reali, nessuna fetch). `scripts/js/images.js` produce il markup `<picture>`
  con `srcset`, `sizes` e `width/height`; se un'immagine non è in pipeline
  resta un normale `<img>`. Budget per variante: 80 KB (640), 180 KB (1280),
  400 KB (1920) — il build segnala le violazioni.

```bash
npm run images:opt     # genera/aggiorna le varianti (≈75s a freddo)
npm run images:check   # solo verifica: esce con errore se mancano varianti
```

  Le varianti in `images/opt/` vanno **committate**: la build le copia così
  come sono (e `prebuild:site` le rigenera solo se serve). I sorgenti
  originali restano in `images/` per lo zoom e come archivio.

## 1.7 Pagina entità e mega-menu

- **Pagina entità** (`scripts/js/entity-page.js`, stili in `entity-v2.css`):
  il markdown resta la fonte di verità. Il parser legge la sezione
  `## Identità` (elenco `- **Chiave:** valore`) e la trasforma nel **rail dei
  metadati**; le altre `##` diventano **tab** accessibili (frecce, Home/End,
  `aria-selected`). L'immagine di apertura va nell'**hero**, l'eventuale
  citazione resta come epigrafe; nessun contenuto viene duplicato. La vecchia
  testata `#page-hero` è nascosta quando la scheda è in questo formato.
  È attiva sulle 20 divinità del Pantheon; se una scheda non ha metadati e
  sezioni (es. i lavori, con il testo dentro un blocco di codice) il renderer
  storico resta in uso, senza regressioni.
- **Mega-menu** (`scripts/js/custom-nav.js`, stili in `shell-v2.css`): i
  dropdown della topbar si aprono anche al passaggio del mouse, hanno una
  testata con il conteggio delle voci e una scheda in evidenza con cover
  (`/api/cover/<id>`) e fallback sul glifo di lore. Il pannello si aggancia al
  bordo destro se uscirebbe dalla finestra; con meno di 4 voci passa a una
  colonna e la scheda diventa una riga compatta (con una sola voce resta
  nascosta, perché sarebbe un doppione). Sotto i 1025px resta il drawer mobile.

---

# Parte 2 — Il pannello admin

## 2.1 Cos'è e come si accede

Il pannello (Vue, su `/admin`; `/admin/`, `/admin/app` e `/admin/app.html`
reindirizzano lì) è il modo normale di gestire i contenuti: niente modifiche a
mano nel repo. **Ogni salvataggio crea un commit**, Cloudflare Pages
ricostruisce il sito (~30 s) e la modifica va online da sola.

1. Apri `https://<tuo-dominio>/admin` e fai login (c'è il "ricordami").
   Il login è server-side (cookie HttpOnly + rate limit), con fallback a
   verifica hash locale se `ADMIN_SECRET` non è configurato.
2. In alto a destra leggi `nome · Ruolo`. I ruoli sono **Admin**, **Editor**,
   **Viewer** (sola lettura): le voci proibite non compaiono nel menu e le
   rotte protette rimandano alla Dashboard.
3. Scorciatoie: **Ctrl+K** (⌘K) ricerca globale e command palette (`>`
   filtra solo le azioni: nuova pagina, vai alle sezioni…), **Esc** chiude
   la sidebar. Il pallino "● modifiche non salvate" in topbar avverte
   prima di cambiare pagina con modifiche pendenti.

La sidebar è in 5 gruppi: **Pannello** (Dashboard, Utenti), **Contenuti**
(Pagine, Copertine, Media, Cestino), **Feature** (Mappa, Carousel, Changelog),
**Sistema** (Navigazione, Interfaccia, Impostazioni), **Sicurezza** (Audit,
Scanner link, Trova & Sostituisci, Media orfani, Backup). La **Dashboard**
mostra visite totali, pagine nel registro, stato del deploy (con riverifica),
grafico a 30 giorni, pagine più viste, azioni rapide e il pannello
**Operatività redazione** (bozze, in revisione, programmate con prossima
data, scorciatoie a Scanner e Media orfani).

## 2.2 Tutorial 1 — creare una nuova pagina

1. Vai in **Pagine** → **+ Nuova pagina**.
2. Scegli il punto di partenza: un **modello** (Scheda Divinità, Regolamento,
   Pagina Lore, Mestiere / Lavoro, Luogo / Città, Casata / Fazione, PNG,
   Creatura / Mostro, Oggetto, Diario di Sessione, Cronologia / Ere) oppure
   pagina vuota.
3. Compila **titolo**, **chiave** (lo slug, es. `nuova-gilda` — unica),
   **icona** (emoji) e **sezione del menu** (Regole, Personaggio, Lavori, Lore
   o nessuna).
4. La pagina nasce in **Bozza** e si apre nell'editor: compila i campi (o
   scrivi il contenuto) con l'anteprima live accanto.
5. Salva e pubblicala (vedi §2.4): alla build successiva compare nel menu
   (`/regole/<slug>`, `/lore/<slug>`, … o `/<slug>` se senza sezione).

Ordine nel menu, nomi, icone e sezioni si cambiano in **Navigazione** (admin):
frecce ↑↓, ✏️ per la voce, **+ Sezione**, poi **💾 Salva registro**.
Per eliminare: 🗑 nella lista (toglie la voce dal registro, il file resta nel
repo); recuperi dal **Cestino** con **♻️ Ripristina**.

## 2.3 Tutorial 2 — modificare una pagina

1. In **Pagine** cerca per titolo/chiave/layout o filtra per stato, poi
   **Modifica** (o doppio click sulla riga). Con le checkbox fai azioni
   **bulk**: invio in revisione o rimozione dal registro di N pagine.
2. Schede **Blocchi ⇄ Markdown** intercambiabili: il markdown è la fonte di
   verità, nulla si perde nel passaggio (l'irriconosciuto resta in un blocco
   "markdown grezzo").
3. Toolbar: annulla/ripeti (Ctrl+Z), formattazione, titoli, elenchi,
   citazioni, link, immagini, codice, tabelle, **stat block creatura**
   (blocco `:::statblock` reso dal sito), anteprima e guida ai tasti.
   Scrivendo `[[` si apre il collegamento rapido alle pagine wiki.
4. Immagini dal cassetto **Media** o **trascinate dal desktop** nel testo
   (upload WebP automatico); per le divinità il trascinamento
   sull'anteprima regola anche il ritaglio (`![](...#30,70)`).
5. Il selettore **Layout** cambia il rendering e può applicare il template
   del layout (conferma richiesta se c'è contenuto).
6. La scheda **🧭 Esplorazione** sceglie il pattern della pagina
   (master-detail, gruppi + schede, schede, griglia + cassetto, accordion), da quali titoli
   leggere le voci, le etichette, il prefisso del deep link, i gruppi di tab e
   i filtri rapidi ricavati dalle etichette del markdown. Nessuna modifica al
   codice; il sito applica la configurazione alla build successiva.
7. Pannello **Dettagli**: metadati, flusso di pubblicazione e **Cronologia**
   (commit git con diff riga/parola + ripristino in memoria) con **Snapshot**
   nominati nel browser prima dei grossi rimaneggiamenti. La validazione dei
   modelli è live (errori sotto i campi, blocco salvataggio/pubblicazione).
   Se un altro editor salva prima di te, il salvataggio propone la
   sovrascrittura consapevole (la tua copia è salvata nel browser). Il guard
   blocca l'uscita con modifiche non salvate.

## 2.4 Tutorial 3 — pubblicare

Stati: **Bozza** → **In revisione** → **Programmata** (data `publishAt`) /
**Pubblicata**. L'Editor può solo inviare in revisione (anche dalla lista);
approvare, pubblicare e programmare è da Admin, dall'apposito pannello
(data + nota di revisione + storico chi ha chiesto/approvato) o con
**Approva** in lista. La pubblicazione si blocca con campi obbligatori vuoti;
una programmata scaduta è già pubblica prima della build. Le pagine non
pubbliche restano fuori da menu, sitemap e prerender — è la prima cosa da
controllare se una pagina "sparisce".

## 2.5 Le altre sezioni

- **Copertine**: un'anteprima per pagina (URL, upload, reset) per homepage e card.
- **Carousel**: slide a piacere (max 8) — aggiungi, elimina, riordina ↑↓,
  nascondi, id/nome/tag/titolo/**sottotitolo**/descrizione, sfondo dalla libreria o trascinato,
  bottoni (max 3), più intervallo autoplay e pausa su hover; anteprima live e
  un solo salvataggio per tutto; Reset cancella il manifest e torna ai default.
  I manifest salvati prima del sottotitolo restano validi (migrazione in lettura).
- **Mappa**: click per aggiungere puntine, trascina per spostare, click per
  modificare, Salva. Coordinate in percentuali: valgono a ogni zoom.
  La spunta "esplorato" decide se il sito mostra il luogo o "Inesplorato"
  (fog of war) con conteggio in home.
- **Changelog**: voci versione/sottoversione/patch + data, titolo, markdown.
- **Media**: upload con conversione WebP e resize a 1920 px automatici;
  l'eliminazione chiede di digitare il nome (è un commit, non va nel cestino).
- **Cestino** (admin): ripristino o distruzione definitiva (conferma con
  chiave; "Svuota" chiede `SVUOTA`).
- **Backup** (admin): JSON scaricabile con tutte le pagine.
- **Utenti** (admin): crea/cambia ruolo e password/elimina (mai `admin`);
  tutto parte con **💾 Salva**.
- **Scanner link / Trova & Sostituisci / Media orfani** (admin): link rotti e
  `alt` mancanti più **menzioni non linkate** (pagine che nominano un'altra
  pagina senza collegarla, con suggerimento pronto e apertura editor);
  cerca-e-sostituisci sulle pagine selezionate; immagini inutilizzate.
  **Audit**: chi ha fatto cosa. **Navigazione / Interfaccia /
  Impostazioni**: menu, testi UI, opzioni del sito.

---

# Appendice tecnica

## A. Struttura repo

```
/
├── index.html              ← SPA (home + routing client-side)
├── 404.html / offline.html ← 404 vera / schermata offline del SW
├── _headers / _redirects / _routes.json
├── sw.js                   ← template service worker (versionato in build)
├── public/                 ← manifest PWA, icone, favicon, fonts/*.woff2
├── scripts/
│   ├── css/*.css           ← base, home, page, notion, imprese, tools, fx, ui, shell, …
│   ├── js/*.js             ← SPA (app, app-home, app-ui, notion-nav, notion-render,
│   │                           md-render, imprese, materiale-browser, carousel-loader,
│   │                           explorer, generators, calendar, diary, combat, map-public, …)
│   ├── lib/routes.mjs      ← fonte unica rotte (prerender + sitemap + robots)
│   ├── build-all.mjs       ← build unica (CI e deploy): prima admin, poi sito
│   ├── build-post.mjs      ← hash JS, preload, prerender, sitemap, sw.js, copia admin
│   ├── build-summary.mjs   ← digest in Markdown (job summary)
│   ├── verify-deploy.mjs   ← digest pubblicato vs locale (fallisce se diversi)
│   ├── sync-registry.py    ← rigenera _pathMap in app.js (non editare a mano)
│   └── import-notion.js    ← export Notion → JSON (one-shot)
├── content/pages/*.json    ← pagine · databases/ · search-index · changelog/mappins
├── functions/api/          ← admin, carousel, cover/, deploy, gh, send-help, sitemap
├── admin/                  ← pannello Vue (compilato in export/admin → dist/admin)
└── images/ / audio/        ← media caricati dall'editor / effetti sonori
```

## B. Build, test, deploy

```bash
npm run build        # → dist/ pronto: prima export/admin, poi il sito
npm run build:site   # solo sito: vite build + build-post.mjs
npm run build:admin  # solo pannello Vue → export/admin
npm test             # unit test (functions/ + integrità rotte)
npm run test:routes  # build + verifica artefatti (meta, sitemap, 404, PWA, font)
npm run verify:deploy https://arcamis.pages.dev
```

```bash
cd admin && npm test           # unit test pannello (workflow, modelli, diff, comandi…)
cd admin && npm run test:e2e   # Playwright: build + preview automatici
```

Formattazione e lint sono un gate della CI (`npm run lint` e
`npm run format:check` in root e in `admin/`): in locale gli stessi comandi
controllano, e `format` scrive le correzioni.

```bash
npm run lint                   # ESLint del sito
npm run format:check           # Prettier in sola verifica
npm run format                 # Prettier che riscrive
npm --prefix admin run lint
npm --prefix admin run format:check
npm --prefix admin run format
npm --prefix admin run typecheck
```

La suite E2E gira sull'artefatto pubblicato (`npm run build`) e, se non
trova un server su `:4173`, avvia da sé build e `vite preview`.

Dopo aver aggiunto pagine/rotte ai contenuti, rigenera gli artefatti
prima di committare (la CI li verifica con `--check`):

```bash
python3 scripts/sync-registry.py  # data.js/json, _pathMap, indice ricerca, recent
npm run seo                        # sitemap.xml + robots.txt allineati alle rotte
```

L'ordine conta: `build-post.mjs` copia il pannello da `export/admin` in
`dist/admin`, quindi l'admin va compilato per primo. `dist/build-info.json`
(escluso dal digest, altrimenti si autoreferenzierebbe) pubblica digest,
commit e **toolchain** (`node`, `npm`, `wrangler` da `node_modules`);
`verify-deploy` fallisce se online c'è altro rispetto al `dist` testato.
`wrangler` è pinnato come devDependency esatta; lo staging riusa quello del
progetto e fallisce se non lo trova.

Cloudflare Pages: build command `npm ci --prefix admin && npm run build`,
output `dist`, funzioni in `functions/`. Preview automatiche per i branch
non-`main` (`https://<branch>.arcamis.pages.dev`); produzione da `main`.
Da locale: `npm run deploy` (build + `wrangler pages deploy dist`).

## C. Sicurezza e variabili

- `_headers`: CSP restrittiva (`script-src 'self' 'unsafe-inline'`, iframe
  YouTube/Vimeo, three.js da cdnjs, `font-src 'self'`), X-Frame-Options,
  nosniff, Referrer/Permissions-Policy.
- Rate limiting KV su `/api/admin` e `/api/send-help` via `CF-Connecting-IP`.
- Sanitizzazione XSS (`_scrubHtmlString`, `_cleanHref`, escape in `_mdToHtml`).
- Temi testati per contrasto (≥4.5:1) in `themes.test.js`.

| Variabile | Uso |
|-----------|-----|
| `ADMIN_SECRET` | Password pannello (login server-side) |
| `GH_TOKEN` | Token GitHub per `/api/gh` (senza, token nel browser) |
| `CF_API_TOKEN` / `CF_ACCOUNT_ID` / `CF_PAGES_PROJECT` | Stato deploy reale (`arcamis` di default) |
| `GH_REPO` / `GH_BRANCH` | Repo/branch del proxy (default `DarkLionMoon/Arcamis`, `main`) |

## D. Riferimenti

- Dettagli editor/modelli/flussi dati:
  [`admin/src/features/pages/EDITOR.md`](admin/src/features/pages/EDITOR.md).
- ID pagine Notion di riferimento (solo per `import-notion.js`, non usati a
  runtime): Gameplay `2f00274fdc1c8065a11ff45192aa5dcb`, Materiale approvato
  `3130274fdc1c807eb61fde24e8236659`, Come si inizia
  `2dd222f22ef8413f8cb48f03bbb4f4b0`, Andando avanti
  `5cea525d149f4acb9c59007bf6b3d5ff`, Galleria PG
  `2fd0274fdc1c80d8b948c4133f874f28`, Biblioteca
  `2f00274fdc1c8089bfe6c24434d53b67`, Pantheon
  `2f00274fdc1c80679bd3c3df8a1fa040`, Changelog
  `3000274fdc1c8033a214c44a1aa7f01f`, Maestria/Titoli
  `2f00274fdc1c802a9babd4239d97a319`, Lore
  `2f00274fdc1c806f8f17dbc6532d2211`, Homebrew
  `2f00274fdc1c80e78ad7ce985007b7c6`, Mappe
  `2f10274fdc1c80489f23c49164747770`.
