# Arcamis Wiki — Static Version

Wiki statica per la campagna D&D Arcamis, deployata su Cloudflare Pages.
Contenuto servito da JSON locali; API Functions come fallback Notion.

---

## Struttura

```
/
├── index.html              ← SPA (home + routing)
├── _headers                ← CSP + header di sicurezza
├── _redirects              ← Redirect + SPA fallback
├── _routes.json            ← Regole routing Cloudflare Functions
├── sw.js                   ← Service worker (cache)
├── robots.txt
├── sitemap.xml
│
├── scripts/
│   ├── css/*.css           ← Stili (base, home, page, notion, fx, ui, …)
│   ├── js/*.js             ← Logica SPA
│   └── import-notion.js    ← Script export Notion → JSON (Node)
│
├── content/
│   ├── pages/*.json        ← Pagine in markdown (usate dal client)
│   ├── docs/*.json         ← Documenti HTML da Google Docs (codice, patenti)
│   ├── db/*.json           ← Snapshot database (riferimento, non serviti)
│   └── mestieri/*.json     ← Dati mestieri (riferimento, non serviti)
│
├── functions/api/*.js      ← Cloudflare Pages Functions
├── admin/index.html        ← Pannello amministrazione (con upload immagini in /images/)
├── export/index.html       ← Tool export contenuti
├── images/                 ← Immagini caricate dall'editor admin
└── audio/                  ← Effetti sonori (ambient, footsteps, …)
```

## Contenuto

- **Pagine**: `content/pages/<slug>.json` con campo `content` in markdown.
  Il client le legge localmente (`notion-nav.js` → `_gpRender`); se mancano,
  ricade su `/api/notion?pageId=…`.
- **Documenti** (`codice`, `patenti`): HTML da Google Docs in `content/docs/`.
  Renderizzati da `codice-giuridico.js` e `patenti-arcadia.js`.
- **Database/gallerie**: serviti via API `/api/notion?dbId=…` (Notion live).
- **Ricerca**: `/api/search`, indici costruiti con `/api/build-index`.
- `content/db/`, `content/mestieri/` e `content/docs/come-funzionano.json`
  non sono più letti dal client: sono mantenuti come snapshot di riferimento.

## Aggiornare una pagina

Modifica `content/pages/<slug>.json` (campo `content`, markdown):

```bash
git add content/pages/regole.json
git commit -m "Aggiorna pagina regole"
git push
```

Cloudflare Pages deploya automaticamente.

## Layout e template

Ogni pagina `content/pages/<slug>.json` può dichiarare un `layout` che
determina come viene renderizzata. Se manca, viene rilevato in automatico
dalla chiave (es. `pantheon`, `regole`, …).

La lista completa dei layout è in `admin/index.html` (`LAYOUTS` e
`LAYOUT_TEMPLATES`): `generico`, `lore`, `regole`, `lavoro`,
`personaggio`, `materiale`, `wide`, `pantheon`, `bestiario`, `timeline`,
`fazioni`, `oggetti`, `glossario`, `galleria`, `tabelle` e i layout a card
`sessione`, `quest`, `npc`, `spell`, `specie`, `citta`, `evento`.

I layout a card sono renderizzati da `_renderSchede` in `notion-nav.js`
(markdown → card con campi `- **Chiave:** valore`); gli altri da
renderer dedicati (`_renderPantheon`, `_renderBestiario`, …).

Nel pannello admin, il selettore Layout in alto a destra applica il template
predefinito del layout scelto (chiede conferma se c'è già contenuto).

## Creare una nuova pagina/sezione

Dal pannello admin, clicca **+** accanto a "Pagine Wiki": inserisci nome,
icona (emoji), slug/URL, sezione del menu (Regole, Personaggio, Lavori, Lore
o nessuna) e layout. La creazione:

1. scrive `content/pages/<slug>.json` con il template del layout scelto;
2. registra la pagina in `scripts/js/data.js` (array `pages`, con campo `sec`);
3. registra l'URL pulito in `scripts/js/app.js` (`_pathMap`);
4. aggiunge la voce alla sidebar dell'admin (`admin/index.html`, `PAGES`);
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

## Sicurezza

- `_headers` definisce una CSP restrittiva (`script-src 'self' 'unsafe-inline'`,
  iframe YouTube/Vimeo, CDN cdnjs per three.js) + X-Frame-Options, nosniff,
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

## Pannello admin

Oltre all'editor markdown con anteprima, il pannello offre:

- **Login server-side** con "ricordami", fallback hash locale se non configurato.
- **📜 STORIA** — cronologia commit di una pagina e ripristino di una versione
  precedente nell'editor (poi da salvare).
- **🔗 LINKS** — verifica che i link interni del contenuto esistano in `_pathMap`.
- **🔗 URL / 🌐 APRI** — copia l'URL pulito della pagina o la apre sul sito.
- **🖼️ /images/** — lista immagini con anteprima, copia URL, upload ed eliminazione.
- **🔎 Cerca nel contenuto** — ricerca full-text nelle pagine (lazy index).
- **Deploy status reale** via `/api/deploy` quando `CF_API_TOKEN` è configurato,
  altrimenti countdown di fallback.
- Sidebar off-canvas con hamburger su mobile.

## Deployment

Cloudflare Pages:
- Build command: *(vuoto)*
- Output directory: `/` (root)
- Funzioni in `functions/`

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
| Regole | `2f00274fdc1c800b9d8fc366e8e40c5c` |
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
