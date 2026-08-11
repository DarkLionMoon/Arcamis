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

## Sicurezza

- `_headers` definisce una CSP restrittiva (`script-src 'self' 'unsafe-inline'`,
  iframe YouTube/Vimeo, CDN cdnjs per three.js) + X-Frame-Options, nosniff,
  Referrer-Policy, Permissions-Policy.
- Rate limiting sulle API sensibili (`/api/admin`, `/api/send-help`) via KV
  (`env.ARCAMIS_CACHE`), basato su `CF-Connecting-IP`.
- Sanitizzazione XSS in `notion-render.js` (`_scrubHtmlString`, `_cleanHref`)
  e in `notion-nav.js` (`_mdToHtml` escape dell'input).

## Deployment

Cloudflare Pages:
- Build command: *(vuoto)*
- Output directory: `/` (root)
- Funzioni in `functions/`

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
