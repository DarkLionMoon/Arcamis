# Arcamis Wiki — Static Version

Wiki statica per la campagna D&D Arcamis, deployata su Cloudflare Pages.
Contenuto 100% local-first: tutto servito da JSON statici (nessun ping alla Notion API).

---

## Struttura

```
/
├── index.html              ← SPA (home + routing client-side)
├── 404.html                ← Pagina 404 statica (status 404 vero)
├── offline.html            ← Schermata offline del service worker
├── _headers                ← CSP + header di sicurezza + cache
├── _redirects              ← Redirect (senza catch-all: le rotte sono prerenderizzate)
├── _routes.json            ← Regole routing Cloudflare Functions
├── sw.js                   ← Service worker (template, versionato in build)
├── robots.txt              ← generato da scripts/lib/routes.mjs
├── sitemap.xml             ← generato da scripts/lib/routes.mjs
│
├── public/                 ← copiato com'è in dist/
│   ├── manifest.webmanifest ← PWA (icone, shortcuts, theme-color)
│   ├── icons/*.png          ← icone 192/512 + maskable (npm run icons)
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── fonts/*.woff2        ← Cinzel + Crimson Pro self-hosted (npm run fonts)
│
├── scripts/
│   ├── css/*.css           ← Stili (base, home, page, notion, fx, ui, shell, …)
│   ├── js/*.js             ← Logica SPA
│   ├── lib/routes.mjs      ← Fonte unica delle rotte (prerender + sitemap + robots)
│   ├── build-all.mjs       ← Build unica: admin → sito (usata da CI e deploy)
│   ├── build-post.mjs      ← Post-build: hash JS, prerender, sitemap, sw.js
│   ├── gen-seo-static.mjs  ← Riscrive sitemap.xml/robots.txt in root
│   ├── fetch-fonts.mjs     ← Scarica i woff2 e genera scripts/css/fonts.css
│   ├── make-icons.mjs      ← Genera icone PWA/favicon da Artboard_1.png
│   └── import-notion.js    ← Script export Notion → JSON (Node)
│
├── content/
│   └── pages/*.json        ← Pagine in markdown (usate dal client)
│
├── functions/api/*.js      ← Cloudflare Pages Functions
├── admin/                  ← Pannello amministrazione Vue (sorgenti; si apre da /admin)
├── export/index.html       ← Tool export contenuti
├── images/                 ← Immagini caricate dall'editor admin
└── audio/                  ← Effetti sonori (ambient, footsteps, …)
```

## Contenuto

- **Pagine**: `content/pages/<slug>.json` con campo `content` in markdown.
  Il client le legge localmente (`notion-nav.js` → `_gpRender`); se mancano,
  mostra un placeholder "non disponibile" (nessuna chiamata a Notion).
- **Database/gallerie**: serviti da JSON locali in `content/databases/*.json`
  (struttura `{ "pages": [...] }`) tramite `_loadLocalDb`/`_loadLocalPage`
  in `notion-render.js`. Se il file è assente, i loader mostrano l'empty state
  (nessuna API, nessun ping a Notion).
- **Ricerca**: locale, dall'indice statico `content/search-index.json`.
- I mestieri e le professioni sono renderizzati dal compendio locale
  (`mestieri-compendio.js`).

## Aggiornare una pagina

Modifica `content/pages/<slug>.json` (campo `content`, markdown):

```bash
git add content/pages/materiale.json
git commit -m "Aggiorna pagina materiale approvato"
git push
```

Cloudflare Pages deploya automaticamente.

## Layout e template

Ogni pagina `content/pages/<slug>.json` può dichiarare un `layout` che
determina come viene renderizzata. Se manca, viene rilevato in automatico
dalla chiave (es. `pantheon`, `regole`, …).

La lista completa dei layout è gestita dal pannello admin Vue e dai tipi condivisi in `admin/src/types/index.ts`.
`contenuto`, `luoghi`, `cronache`, `personaggio`, `materiale`, `wide`,
`pantheon`, `collezione`, `bestiario`, `timeline`, `fazioni`, `oggetti`,
`glossario`, `galleria`, `tabelle`, `schede` e i layout a card `sessione`,
`quest`, `npc`, `spell`, `specie`, `citta`, `evento`.

Nell'editor il layout si sceglie da tre preset — **Wiki standard** (`""` + indice),
**Immersivo / full width** (`wide`) e **Schede / griglia** (`schede`, ogni `##`
diventa una card in griglia) — con il selettore avanzato per i layout specifici.

Il layout `collezione` è la versione generica del Pantheon: stessa griglia
di tile con immagini e schede dedicate (`<chiave-pagina>-<slug>`), ma con
nomenclatura neutra, riutilizzabile per qualsiasi argomento.

I layout a card sono renderizzati da `_renderSchede` in `notion-nav.js`
(markdown → card con campi `- **Chiave:** valore`); gli altri da
renderer dedicati (`_renderPantheon`, `_renderBestiario`, …).

I blocchi dell'editor sono solo markdown: le carte sono `:::cards` con
`### Titolo`, le gallerie `:::gallery` con una riga di immagine ciascuna, e
`md-render.js` le rende in `.n-cards` / `.n-gal` (il layout `schede`
trasforma invece ogni `##` in una card della griglia).

Le pagine davvero strutturate (`pantheon` e `collezione`, `bestiario`,
`fazioni`, `oggetti` e i layout a card `sessione`, `quest`, `npc`, `spell`,
`specie`, `citta`, `evento`) si scrivono con i **modelli** dell'editor: ogni
scheda produce `## Titolo` + campi `- **Chiave:** valore` + sezioni `###`.

Le schede dei tab dell'editor sono **Blocchi** e **Markdown**: si passa
dall'una all'altra in qualsiasi momento e il markdown resta la fonte di verità.

Per le immagini delle divinità, **trascinando** sull'anteprima si sceglie la
parte visibile nella card: la posizione viene salvata come frammento
`![](...#30,70)` (percentuali orizzontale, verticale) e applicata lato sito
come `object-position` sia nelle tile del pantheon che nell'hero della
scheda divinità.

Nel pannello admin, il selettore Layout in alto a destra applica il template
predefinito del layout scelto (chiede conferma se c'è già contenuto).

## Creare una nuova pagina/sezione

Dal pannello admin, clicca **+** accanto a "Pagine Wiki": inserisci nome,
icona (emoji), slug/URL, sezione del menu (Regole, Personaggio, Lavori, Lore
o nessuna) e layout. La creazione:

1. scrive `content/pages/<slug>.json` con il template del layout scelto;
2. registra la pagina in `scripts/js/data.js` (array `pages`, con campo `sec`);
3. registra l'URL pulito in `scripts/js/app.js` (`_pathMap`);
4. aggiorna il registro usato dal pannello admin Vue;
5. al deploy, `scripts/js/custom-nav.js` inietta la voce nel menu del sito
   (desktop e mobile) nella sezione scelta.

Il sito è raggiungibile all'URL `/regole/<slug>`, `/lore/<slug>`, … (o
`/<slug>` se nessuna sezione). Per una nuova sezione si intende una nuova
voce in una delle sezioni del menu esistenti.

### Eliminare una pagina

Aprendo una pagina creata dall'admin compare il pulsante **ELIMINA** nell'editor
(visibile solo per le pagine custom, contrassegnate da `c:1` in `PAGES`).
L'eliminazione rimuove `content/pages/<slug>.json`, la registrazione in
`data.js` e `_pathMap` e la voce dalla sidebar; la pagina scompare anche dal
menu del sito dopo il deploy.

## Pagine legali e crediti

- `/credits` (contenuto in `content/pages/credits.json`) raccoglie crediti e
  disclaimer (immagini di League of Legends © Riot Games, non affiliazione,
  font OFL), informativa sul conteggio visite (`track_view`: nessun IP, nessun
  cookie, solo contatori aggregati per pagina) e i contatti (Discord + Oracolo).
  È linkata dal footer presente in ogni vista e dal menu mobile.

## Sicurezza

- `_headers` definisce una CSP restrittiva (`script-src 'self' 'unsafe-inline'`,
  iframe YouTube/Vimeo, CDN cdnjs per three.js, `font-src 'self'`,
  `manifest-src`/`worker-src 'self'`) + X-Frame-Options, nosniff,
  Referrer-Policy, Permissions-Policy.
- Rate limiting sulle API sensibili (`/api/admin`, `/api/send-help`) via KV
  (`env.ARCAMIS_CACHE`), basato su `CF-Connecting-IP`.
- Sanitizzazione XSS in `notion-render.js` (`_scrubHtmlString`, `_cleanHref`)
  e in `notion-nav.js` (`_mdToHtml` escape dell'input).
- Login del pannello admin: prima prova il login server-side (`/api/admin`,
  cookie di sessione HttpOnly in KV + rate limit), con fallback alla verifica
  hash locale se `ADMIN_SECRET` non è configurato. Dopo il login viene attivata
  la barra di amministrazione sul sito (`sessionStorage.arcadmin`).

### Variabili d'ambiente Cloudflare Pages

| Variabile | Uso |
|-----------|-----|
| `ADMIN_SECRET` | Password del pannello admin (login server-side) |
| `GH_TOKEN` | Personal Access Token GitHub per il proxy `/api/gh` (se assente l'admin ricade sul token inserito nel browser) |
| `CF_API_TOKEN` | Token Cloudflare (opzionale) per lo stato deploy reale in `/api/deploy` |
| `CF_ACCOUNT_ID` | Account Cloudflare (opzionale, serve con `CF_API_TOKEN`) |
| `CF_PAGES_PROJECT` | Nome progetto Pages, default `arcamis` (opzionale) |
| `GH_REPO` / `GH_BRANCH` | Repo/branch usati dal proxy, default `DarkLionMoon/Arcamis` e `main` |

Con `GH_TOKEN` configurato il pannello non richiede mai il Personal Access Token
nel browser: tutte le operazioni passano da `functions/api/gh.js` (session-authenticated).

## Pannello admin Vue

Il pannello legacy è stato rimosso. Il pannello Vue è disponibile su `/admin`
(gli URL `/admin/`, `/admin/app` e `/admin/app.html` reindirizzano lì) e offre:

- **Login server-side** con "ricordami".
- **📜 STORIA** — cronologia commit di una pagina e ripristino di una versione
  precedente nell'editor (poi da salvare).
- **🔗 LINKS** — verifica che i link interni del contenuto esistano in `_pathMap`.
- **🔗 URL / 🌐 APRI** — copia l'URL pulito della pagina o la apre sul sito.
- **🖼️ /images/** — lista immagini con anteprima, copia URL, upload ed eliminazione.
- **🔎 Cerca nel contenuto** — ricerca full-text nelle pagine (lazy index).
- **Deploy status reale** via `/api/deploy` quando `CF_API_TOKEN` è configurato,
  altrimenti countdown di fallback.
- **🎠 Carousel** — sfondo scelto dalla libreria media (o trascinato sulla card),
tag, titolo, descrizione e bottoni delle tre slide, con anteprima live nella
card e salvataggio in una sola scrittura (`set_carousel`).
- **📍 Mappa** — puntine trascinabili: le coordinate sono percentuali
`getBoundingClientRect()` del canvas, quindi restano corrette anche con la
mappa scrollata o zoomata.
- Sidebar off-canvas con hamburger su mobile.

### Editor di pagine a modelli

Le pagine si scrivono in tre modi: **blocchi visuali**, markdown libero, oppure
compilando un **modello** (Scheda Divinità, Regolamento, Pagina Lore,
Mestiere/Lavoro) i cui campi validati generano da soli il markdown che il sito
già rende. L'editor è un workspace a due pannelli con editor + anteprima live,
validazione mentre si scrive, cassetto media, cronologia undo/redo, autosave e
guard delle modifiche non salvate; i campi vuoti diventano segnaposto che
accendono il badge «✎ Bozza» sul sito. I modelli sono dati JSON
(`admin/src/features/pages/templates/definitions/`) e se ne possono importare di
personalizzati dal pannello.

L'editor a blocchi compone titoli H1–H3, paragrafi, callout, accordion/FAQ,
griglia di carte, galleria, immagini, tabelle e separatori: ogni modifica
riserializza il markdown reale, quindi il passaggio **Blocchi ⇄ Markdown** non
perde nulla (ciò che i blocchi non riconoscono resta in un blocco «markdown
grezzo»).

Dettagli su componenti, schema dei modelli e flusso dei dati:
[`admin/src/features/pages/EDITOR.md`](admin/src/features/pages/EDITOR.md).

### Flusso di pubblicazione (bozza · revisione · programmata · pubblicata)

Il badge «bozza» è diventato uno **stato dichiarato** nel file della pagina, e
vale per tutte le pagine, libere o a modello:

- **Bozza** → non pubblica, in lavorazione;
- **In revisione** → un editor l'ha consegnata, aspetta un amministratore;
- **Programmata** → esce da sola alla data scelta (`publishAt`);
- **Pubblicata** → visibile nel sito.

Un editor può solo *chiedere* la revisione; approvare, pubblicare e programmare
richiedono il ruolo amministratore, e la pubblicazione si ferma se un campo
obbligatorio del modello è vuoto. Nel pannello la lista Pagine filtra e mostra i
chip per stato (con azioni rapide Approva / Invia in revisione), l'editor ha il
pannello del flusso con data di programmazione, nota di revisione e chi ha
chiesto o firmato l'approvazione.

Il sito e la build applicano la stessa specifica (`scripts/js/page-status.js`,
`scripts/lib/routes.mjs`): una pagina non pubblica non viene servita e resta
fuori da prerender e sitemap; una **programmata già scaduta è pubblica** anche
prima della build, che si allinea al deploy successivo. Le pagine storiche senza
`status` continuano a valere con il vecchio `isDraft`, senza migrazioni.

## SEO, meta per pagina e 404

Ogni pagina pubblica viene **prerenderizzata** durante la build: per ogni rotta
esiste un file `dist/<rotta>.html` con `<head>` dedicato (title, description,
canonical, Open Graph, Twitter Card, JSON-LD `WebPage`/`Article` +
`BreadcrumbList`) e un fallback `<noscript>` con titolo, estratto e link alla home.

- Le rotte sono raccolte da `scripts/lib/routes.mjs` leggendo il registry,
  `pantheon.json` e `lavori.json`: pagine, sottopagine delle divinità
  (`/lore/pantheon/<slug>`), mestieri (`/personaggio/lavori/<slug>`),
  `/changelog` e `/credits`. Nessun elenco da aggiornare a mano.
- Da qui derivano anche `dist/sitemap.xml` e `dist/robots.txt`.
  `functions/api/sitemap.js` è solo un 301 verso `/sitemap.xml` (niente più
  sitemap diversa generata a runtime).
- `_redirects` **non** ha più il catch-all `/* /index.html 200`: le URL
  inesistenti ricevono `404.html` con status **404** (niente soft-404).
  Restano `200` solo `/p/:id` (link legacy) e `/content/*`.
- I file sono `dist/<rotta>.html` (non `<rotta>/index.html`): Cloudflare Pages
  serve `/credits` direttamente da `credits.html`, quindi l'URL canonico è
  esattamente quello servito, senza redirect 308.

Comandi utili:

```bash
npm run seo            # rigenera sitemap.xml e robots.txt in root
npm run seo -- --check # verifica che siano allineati (usato dalla CI)
npm run test:routes    # build + test di integrità di tutte le rotte
```

## Font e PWA

- **Font self-hosted**: `npm run fonts` scarica i `.woff2` di Cinzel e Crimson
  Pro in `public/fonts/` e genera `scripts/css/fonts.css` (font variabili, un
  file per famiglia/stile/subset, nome con hash del contenuto). Nessuna
  richiesta a `fonts.googleapis.com`/`fonts.gstatic.com`: la CSP non li
  consente più e la privacy non dipende da un fornitore esterno.
- **PWA**: `public/manifest.webmanifest` + icone 192/512 e maskable, favicon
  `.ico`, apple-touch icon. `npm run icons` rigenera tutto da `Artboard_1.png`
  senza dipendenze native.

## Build

```bash
npm run build        # → dist/ pronto per il deploy: pannello + sito
npm run build:site   # solo sito: vite build + scripts/build-post.mjs
npm run build:admin  # solo pannello Vue → export/admin
npm run icons        # rigenera icone PWA/favicon
npm run fonts        # riscarica i font self-hosted
```

`npm run build` è l'unico percorso di build: CI, staging e deploy da locale
passano tutti da `scripts/build-all.mjs`, che compila **prima** il pannello in
`export/admin` e **poi** il sito, perché `build-post.mjs` copia quel pannello in
`dist/admin`. Al contrario `dist/` finirebbe con il pannello del commit
precedente (o senza pannello, in un checkout pulito). Lo script verifica che
`dist/admin/app.html` esista, che in `dist/admin` non finiscano source map e
stampa il digest di `export/admin` e `dist`: due build dello stesso commit
devono dare lo stesso digest, altrimenti ciò che è stato testato non è ciò che
si sta pubblicando.

`scripts/build-post.mjs` (eseguito dopo `vite build`):

- minifica i JS classici e aggiunge l'hash al nome (`app.f89a88ab86.js`);
  restano file separati perché sono script classici con scope globale:
  concatenarli cambierebbe l'hoisting delle funzioni e l'ordine di init;
- riscrive `index.html` con i riferimenti hashati e inserisce i preload di
  `/cover.webp` (immagine LCP) e dei due font usati above-the-fold;
- copia `_headers`, `_routes.json` e `_redirects` (versione per `dist/`);
- copia `404.html` e `offline.html`;
- **prerenderizza tutte le rotte** in `dist/<rotta>.html` con meta dedicati;
- genera `sitemap.xml` e `robots.txt`;
- copia il pannello admin da `export/admin` in `dist/admin` (senza sourcemap);
- genera `sw.js` con versione di build e lista di precache reale.

## Temi

Ogni tema (`dark`, `light`, `theme-blood`, `theme-forest`, `theme-abyss`,
`theme-alchemy`) deve definire **lo stesso set di token** in `:root` /
`body.<tema>`: `--bg…--bg5`, `--panel`, `--bdr…--bdr3`, `--gold…--gold4`,
`--gold-rgb`, `--copper`, `--parch`, `--text/2/3`, `--white`, `--violet*`,
`--teal*`, `--glow/glow2/vglow`, `--surface-rgb`, `--panel-rgb`.

Le superfici "vetro" (dropdown della top bar, drawer mobile, bottom nav,
pannello Oracolo) leggono `--surface-rgb` / `--panel-rgb`, quindi si adattano
al tema senza duplicare regole. `scripts/__tests__/themes.test.js` legge i CSS
reali e fallisce se un tema non definisce un token o se un colore di testo
(`--text/2/3`, `--parch`, `--copper`, `--gold`, `--white`) scende sotto
**4.5:1** su `--bg` e `--panel`.

## Test

```bash
npm test             # unit test (functions/ + integrità rotte)
npm run test:routes  # build del sito + verifica degli artefatti (meta, sitemap, 404, PWA, font)
npm run test:dist    # come sopra ma sull'attuale dist/ (usato dopo npm run build)
```

`scripts/__tests__/routes.test.js` controlla che ogni rotta abbia titolo,
canonical e description unici, che la sitemap elenchi esattamente le rotte
prerenderizzate, che `dist/404.html` esista e che `_redirects` non abbia il
catch-all che mascherava i 404. La CI esegue anche
`node scripts/gen-seo-static.mjs --check` per accorgersi se `sitemap.xml` o
`robots.txt` restano indietro rispetto ai contenuti.

## Deployment

Cloudflare Pages:
- Build command: `npm ci --prefix admin && npm run build`
- Output directory: `dist`
- Funzioni in `functions/` (restano nella root del repo)

Il comando di build installa anche le dipendenze del pannello: Pages installa
solo quelle della root, quindi senza `npm ci --prefix admin` non si potrebbe
ricompilare `admin/`. Lo script di build se ne accorge e le installa da solo se
mancano, ma dichiararlo nel build command rende il deploy esplicito e più
veloce.

> Il catch-all SPA è stato rimosso: se in dashboard resta un output diverso da
> `dist` (o una vecchia regola `/* /index.html 200`), le rotte prerenderizzate e
> la 404 non vengono servite. Verifica anche che il dominio canonico in
> `scripts/lib/routes.mjs` (`SITE_URL`, default `https://arcamis.pages.dev`) sia
> quello di produzione.

In alternativa, da locale:

```bash
npm run deploy   # build + npx wrangler pages deploy dist --project-name arcamis
```

### Cache e service worker

- I nomi di CSS/JS e dei font contengono l'hash del contenuto: `_headers` può
  quindi servirli `immutable` per un anno senza rischiare CSS stale.
- `/sw.js` è sempre `no-store` e la sua cache è versionata
  (`arcamis-<hash di build>`): ogni deploy invalida la precedente. Il precache
  elenca solo file realmente emessi e rifiuta risposte con content-type
  incoerente (niente HTML salvato sotto URL `.css`). Le navigazioni offline
  ricadono su `offline.html`.
- Le copertine non sono più inline in base64 nel JSON: `/api/admin?action=get_covers`
  restituisce URL `/api/cover/<id>` e le immagini vengono scaricate on demand
  (con `ETag` e `stale-while-revalidate`) e applicate in lazy loading dal client.

### Preview Deploy (staging)

Cloudflare Pages crea automaticamente un **deploy preview** per ogni branch diverso da `main` (branch di produzione configurato in dashboard).

**Workflow consigliato:**
1. In Cloudflare Pages dashboard → *Settings > Build & deployments* → *Production branch*: `main`
2. Per testare le modifiche prima del merge su `main`:
   ```bash
   git checkout -b preview
   git push origin preview
   ```
3. Cloudflare Pages rileva il push su `preview` e crea un deploy preview all'URL tipo `https://preview.arcamis.pages.dev`
4. Testare le modifiche sull'URL di preview
5. Quando soddisfatti: merge `preview` → `main` (o PR) per il deploy produzione

> **Nota**: non serve configurazione extra; basta che il branch non sia `main`. Il dominio preview è `https://<branch>.<project>.pages.dev`.

---

## ID pagine Notion di riferimento

| Pagina | ID |
|--------|----|
| Gameplay | `2f00274fdc1c8065a11ff45192aa5dcb` |
| Materiale approvato | `3130274fdc1c807eb61fde24e8236659` |
| Come si inizia | `2dd222f22ef8413f8cb48f03bbb4f4b0` |
| Andando avanti | `5cea525d149f4acb9c59007bf6b3d5ff` |
| Galleria PG | `2fd0274fdc1c80d8b948c4133f874f28` |
| Biblioteca | `2f00274fdc1c8089bfe6c24434d53b67` |
| Pantheon | `2f00274fdc1c80679bd3c3df8a1fa040` |
| Changelog | `3000274fdc1c8033a214c44a1aa7f01f` |
| Maestria / Titoli | `2f00274fdc1c802a9babd4239d97a319` |
| Lore | `2f00274fdc1c806f8f17dbc6532d2211` |
| Homebrew | `2f00274fdc1c80e78ad7ce985007b7c6` |
| Mappe | `2f10274fdc1c80489f23c49164747770` |
