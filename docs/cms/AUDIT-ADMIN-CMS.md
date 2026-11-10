# Arcamis Admin — Audit e architettura CMS

Data: 10 novembre 2026 · Ambito: pannello `/admin`, sito pubblico, API Cloudflare Pages
Metodo: lettura di router/store/feature Admin, `functions/api/*`, `content/**`, `index.html`, `scripts/js/*`, `scripts/lib/*`, build e test.

Questo documento è la **Fase 1 (audit)** e la **Fase 2 (architettura)** del brief. La prima verticale
realizzata è la **Fase 3 — Homepage Builder**, descritta più sotto. Le fasi 4–7 restano pianificate.

---

## 1. Mappa: elemento pubblico → sede → gestibile → intervento

| Elemento pubblico | Dove risiede | Gestibile da Admin | Intervento necessario |
|---|---|---|---|
| Homepage — hero/carousel | Manifest KV `admin_carousel` + `scripts/js/carousel-loader.js` | **Sì** (Carousel) | Già completo: numero, ordine, visibilità, testi, CTA, rotazione. Non duplicato nell'Homepage Builder |
| Homepage — sezioni (Marche, Arcadia, Novità, Come iniziare, Wiki) | `index.html` hardcoded | **Ora sì** (Homepage) | **Implementato**: `content/homepage.json` + renderer condiviso + build statico |
| Homepage — mappa e sottoviste | `content/mappins.json` + markup mappa in `index.html` | Punti e immagine **sì** (Mappa); sottoviste **no** | Fase successiva: sottoviste ancora inline (documentato come limite) |
| Pagine e contenuti | `content/pages/*.json` + `registry.json` | **Sì** (Pagine, editor, blocchi, template, workflow, versioni, anteprima) | Mantenere; aggiungere libreria componenti (Fase 5) |
| Navigazione (topbar, drawer, sezioni) | `content/pages/registry.json` → `custom-nav.js` | **Sì** (Navigazione) | Migliorare: drag & drop e anteprima menu; `_pathMap` resta generato da `sync-registry.py` |
| Footer | `index.html` (`#site-footer`) | **No** | Fase 4: footer configurabile, generato dal build |
| Banner di manutenzione | KV `site_settings` → `app-ui.js` | **Sì** (Impostazioni) | Già funzionante; unificare nell'Interfaccia del sito |
| Disclaimer / avvisi | KV `site_settings` → `app-ui.js` | **Sì** (Impostazioni) | Già funzionante; valutare avvisi programmati |
| Logo, nome sito, immagini brand | `index.html`, `Artboard_1.png` | **No** | Fase 4 |
| Testi UI (etichette, FAB, help, FAQ, stati vuoti) | `index.html` + `scripts/js/*` | **Parziale** (FAQ nel markup) | Fase 4: testi globali versionati |
| Temi (dark, light, blood, forest, abyss, alchemy) | CSS + `app-ui.js` | Scelta utente **sì**; configurazione **no** | Fase 6: palette e varianti con anteprima e controlli di contrasto |
| SEO (title, description, OG, canonical, robots) | `scripts/lib/routes.mjs` + meta per pagina | **Parziale** (title/description dal registry) | Fase 6: OG image, indicizzazione, stato per pagina |
| Changelog / Novità | `content/changelog.json` + Admin Changelog | **Sì** | Già funzionante; la home legge la stessa fonte |
| Copertine | KV `admin_cover_*` + `/api/cover/<id>` | **Sì** (Copertine) | Già funzionante |
| Media e libreria immagini | `images/**` + API media | **Sì** (Media) | Già funzionante |
| Database e collezioni | `content/databases/*.json` + schemi | **Parziale** (Imprese, Mestieri, Glossario, letture) | Fase 5: editor generico per collezioni |
| Glossario | `content/glossary.json` | **Sì** | Già funzionante |
| Materiale approvato | pagina Markdown + filtri JS | **Parziale** | Fase 5: metadati e filtri configurabili |
| Ricerca globale | indice generato dal build | **Sì** (indice), nessuna configurazione | Fase 5: pesi/etichette solo se necessari |
| Crediti e pagine legali | Pagina dal registry | **Parziale** (editor pagine) | Fase 4: testi legali tra i testi globali |
| 404 / offline | `404.html`, `offline.html` | **No** | Fase 4 |
| Service worker e cache | generato da `build-post.mjs` | **No** (corretto) | Non rendere modificabile |
| Analytics | KV + Dashboard | **Sì** (Dashboard) | Già funzionante |
| Stato deploy | `/api/deploy` + Dashboard | **Sì** (lettura) | Aggiungere verifica del contenuto pubblicato (fatta per la home) |

### Contenuti hardcoded rilevati (oltre alla home)

- Footer, logo, nome, testi legali, 404/offline.
- Sottoviste SVG della mappa (`#sub-foglia`, `#sub-smari`) e relativi luoghi.
- Testi di aiuto (FAQ, pannello opzioni, messaggi di sistema) in `index.html`.
- Metadati globali della home (OG/Twitter) in `index.html`.

---

## 2. API, persistenza e sicurezza (stato verificato)

- **`/api/admin`** — 45 action dispatcher. Sessione in cookie HttpOnly, token CSRF, rate limit,
  audit log, validazione degli input, backup/versioni in KV. Le action di sola lettura pubblica sono
  limitate a cover, impostazioni sito, tracking e login/check.
- **`/api/gh`** — proxy GitHub: il PAT resta server-side; `put`/`binary`/`delete`/`commit_multi`
  richiedono ruolo **editor o admin**; path validati (`isSafeRepositoryPath`).
- **`/api/carousel`** — manifest pubblico del carousel (KV), fallback agli hardcoded.
- **Contenuti** — JSON versionati su GitHub; bozze e versioni in KV; pubblicazione = commit → deploy
  automatico Cloudflare Pages.
- **Ruoli** — `admin`, `editor`, `viewer`; il frontend filtra le rotte con `canAccess`, il backend
  ricontrolla il ruolo.

### Rischi trovati e corretti in questa iterazione

1. **Scritture senza controllo di ruolo.** `set_cover`, `set_carousel_config`, `set_carousel`,
   `set_posa`, `save_draft`, `delete_draft` verificavano sessione + CSRF ma non il ruolo: un
   `viewer` poteva scrivere. Aggiunto `requireEditor()` (403 per i viewer) su tutte e sei.
2. **Homepage non gestibile** senza modificare `index.html`. Risolto per le sezioni post-hero.
3. **Nessuna verifica del pubblicato.** Ora il build scrive `<!-- homepage:<impronta> -->` e
   l'Admin verifica che la home online contenga l'impronta attesa; nessun "pubblicato" dichiarato
   senza riscontro.

### Rischi ancora aperti

- Footer, logo, testi globali, SEO e temi restano hardcoded (fasi 4–6).
- Sottoviste della mappa non configurabili.
- Il deploy non è verificabile tramite digest (toolchain/Node diversi fra locale e CI): usare la
  verifica dell'impronta e il contenuto servito, non il digest.
- Gli E2E Playwright non partono in questo ambiente (Chromium non si avvia); vedi §6.

---

## 3. Architettura della Homepage (Fase 2 + Fase 3)

### Una sola configurazione, una sola home

La home pubblica è `index.html`; le sezioni sotto la hero sono **generate** da
`content/homepage.json` e scolpite nell'HTML dal build. Non esiste una seconda home né una
chiamata API necessaria a leggere i contenuti: senza JavaScript la home continua a mostrare
tutto (prerender compreso).

La **hero/carousel resta nel suo manifest KV** e nel suo editor: l'Homepage Builder la elenca
come sezione bloccata con un rimando, così non ci sono due configurazioni della stessa cosa.

### Schema

```json
{
  "version": 1,
  "updatedAt": "2026-11-10T00:00:00.000Z",
  "sections": [
    { "id": "marche", "type": "marche", "label": "Marche di Arcamis", "visible": true,
      "divider": true, "eyebrow": "…", "title": "…", "description": "…", "showMap": true },
    { "id": "arcadia", "type": "arcadia", "…": "…", "factions": [], "guildsTitle": "…", "guilds": [] },
    { "id": "novita", "type": "news", "…": "…", "footerText": "…", "links": [] },
    { "id": "come-iniziare", "type": "steps", "…": "…", "steps": [], "cta": [] },
    { "id": "wiki", "type": "wiki", "…": "…", "groups": [{ "title": "…", "cards": [] }] }
  ]
}
```

Tipi supportati: `marche`, `arcadia`, `news`, `steps`, `wiki`. Lo schema JSON è in
`content/schemas/homepage.schema.json`.

### Validazione, versione, fallback, migrazione

`scripts/lib/homepage.mjs` (nessuna dipendenza, usato sia dal build sia dall'Admin):

- `version` numerica; una versione futura produce un avviso, non un errore.
- Campi mancanti → valori del tipo; tipi sconosciuti → scartati con avviso; id duplicati →
  rinominati; href `javascript:`/protocolli non ammessi → scartati; colori non validi → default.
- Limiti di lunghezza per ogni campo, massimo 24 sezioni, massimo 6 link, 4 CTA, 8 passi, 12
  gruppi, 24 card per gruppo.
- Configurazione assente o non valida → **default del sito** (la home non si svuota).
- Normalizzazione **idempotente**: salvare e ricaricare non perde campi (test dedicato).
- Testi sempre escapati; unico markup inline: `**grassetto dorato**`, `*corsivo*`, a capo.

### Rendering e integrazione col sito

- `renderHomepageSections()` produce lo stesso markup/CSS del sito (classi `hsec`, `sec-h`,
  `gold-sep`, `guild-card`, `steps`, `news-grid`, `wiki-sec`…), nell'ordine e con la visibilità
  della configurazione.
- `scripts/build-post.mjs` sostituisce solo la zona fra `<!-- HOMEPAGE:SECTIONS:START -->` e
  `<!-- HOMEPAGE:SECTIONS:END -->` in `dist/index.html`.
- La mappa resta un **partial** di `index.html` delimitato da `<!-- HOMEPAGE:MAP -->`: il build lo
  estrae e lo reinserisce nella sezione generata, così gli ID e `app-home.js` continuano a
  funzionare (e i punti restano gestiti da Mappa).
- I card wiki risolvono la pagina dal `registry.json` (`id → path`), quindi i link restano
  allineati alle rotte generate da `sync-registry.py`.
- Le sezioni restano dentro `#hv`: non compaiono mai nelle pagine interne (test dedicato).

### Anteprima e pubblicazione (Admin)

- **Anteprima live** in iframe con gli stessi CSS del sito e lo **stesso renderer**; viste
  desktop/tablet/mobile. Mappa e carousel sono segnaposto espliciti (sono generati a runtime dal
  sito reale): nessuna simulazione grafica alternativa.
- **Bozza locale** in `localStorage` (autosave con debounce), banner "non pubblicata", scarto
  esplicito; indicatore delle modifiche non salvate e guard di navigazione.
- **Validazione** prima del commit; conferma; commit di `content/homepage.json` via `/api/gh`
  (ruolo editor/admin, token server-side).
- **Cronologia**: i commit del file sono la cronologia; "Carica" riporta la versione nell'editor
  (non va online finché non salvi).
- **Verifica del pubblicato**: dopo il commit il pannello cerca l'impronta della configurazione
  nella home online (8 tentativi, 15 s) e mostra "Pubblicata e verificata" solo al riscontro.
  In anteprima locale (senza deploy) lo dice esplicitamente.

---

## 4. File creati e modificati

**Creati**

- `content/homepage.json` — configurazione pubblicata delle sezioni.
- `content/schemas/homepage.schema.json` — schema JSON.
- `scripts/lib/homepage.mjs` + `scripts/lib/homepage.d.mts` — default, normalizzazione, hash,
  renderer e tipi condivisi.
- `scripts/__tests__/homepage.test.js` — 17 test (configurazione, rendering, artefatto).
- `admin/src/shared/homepage.ts` — re-export tipizzato del modulo condiviso.
- `admin/src/shared/api/homepage.ts` — lettura/scrittura GitHub, cronologia, verifica pubblicato.
- `admin/src/features/homepage/HomepageView.vue` — Homepage Builder (sezioni, drag & drop,
  visibilità, duplicazione, eliminazione, form per tipo, anteprima, cronologia, bozza).
- `docs/cms/AUDIT-ADMIN-CMS.md` — questo documento.

**Modificati**

- `index.html` — marcatori della zona generata e del partial mappa (contenuto invariato nel dev).
- `scripts/build-post.mjs` — generazione delle sezioni nell'HTML pubblicato.
- `functions/api/admin.js` — `requireEditor()` e controllo di ruolo su sei scritture.
- `admin/src/app/router/index.ts`, `features/interface/layout/AdminLayout.vue`,
  `features/dashboard/DashboardView.vue`, `shared/icons.ts` — rotta `/homepage`, voce di menu,
  azione rapida, icona.
- `admin/src/shared/api/index.ts`, `admin/src/types/index.ts` (percorso pagina nel registry),
  `admin/vite.config.ts` (modulo condiviso fuori da `admin/`, proxy `/scripts` e `/content` per
  l'anteprima in sviluppo).
- `export/admin/**` — build del pannello (artefatto versionato).

**Non toccati**: `scripts/sync-registry.py`, `_pathMap`, rotte generate, sitemap/robots/prerender,
manifest del carousel, contenuti delle pagine.

---

## 5. API e formati dati

- **Nessun nuovo endpoint**: il salvataggio usa il proxy esistente `/api/gh` (editor/admin) e la
  lettura pubblica è statica (`/content/homepage.json`).
- **Nuovo formato**: `content/homepage.json` v1 (sopra). Nessuna chiave KV nuova.
- **Compatibilità**: file assente = default del sito; campi nuovi opzionali; nessuna migrazione
  distruttiva.
- **Sicurezza**: commit solo con ruolo editor/admin; testi escapati nel renderer; href validati;
  nessun token nel browser; audit log e rate limit invariati.

---

## 6. Test eseguiti

| Verifica | Comando | Esito |
|---|---|---|
| Test root (sito, rotte, contenuti, homepage) | `npm test` | **276/276 passati** (29 file) |
| Test Admin (store, editor, API, guard) | `npm --prefix admin test` | **299/299 passati** (26 file) |
| Typecheck Admin | `npm --prefix admin run typecheck` | **0 errori** |
| Build Admin + sito | `npm run build` | **ok** — 712 file in dist, 74 rotte prerenderizzate, 10 file in `export/admin` |
| Lint Admin | `npm --prefix admin run lint` | **0 errori** |
| Lint root | `npm run lint` | **0 errori**, 130 warning preesistenti |
| Format check | `npm run format:check` | **ok** |
| Artefatto home | test dedicati | impronta `5f1e06d9` presente, mappa una sola volta, nessuna sezione nascosta, sezioni assenti da `#pv` |

**Non eseguiti / bloccati**

- **Playwright E2E e screenshot**: Chromium non si avvia in questo ambiente (librerie di sistema
  mancanti, nessun `sudo` disponibile). Nessuna verifica visiva né E2E è stata dichiarata.
- **Deploy e verifica online**: nessun push/deploy eseguito in questa iterazione. La verifica
  dell'impronta è pronta e va usata dopo la pubblicazione.
- **Digest del deploy**: non usabile come prova (toolchain Node diversa fra locale e CI).

---

## 7. Cosa resta (fasi 4–7)

1. **Fase 4 — Interfaccia globale**: footer, logo/nome, banner e avvisi, testi UI, 404/offline con
   lo stesso schema versionato + renderer del build; unificare banner/disclaimer oggi in
   Impostazioni.
2. **Fase 5 — Editor visuale**: libreria componenti con anteprima e markup compatibile con
   `md-render`/`notion-render`; collezioni e materiale approvato.
3. **Fase 6 — Aspetto e SEO**: palette/varianti con vincoli di contrasto e anteprima; OG image,
   canonical, indicizzazione per pagina; checklist che blocchi indicizzazione di bozze/revisione.
4. **Fase 7 — Verifica**: E2E in un ambiente con browser, prova di deploy su preview, verifica
   dell'impronta online, test di concorrenza sul salvataggio.

### Limiti dichiarati di questa verticale

- La hero/carousel non è riordinabile dal builder: resta in cima ed è gestita dal suo editor
  (scelta esplicita per non duplicare la configurazione).
- Le sottoviste della mappa restano markup del sito.
- L'anteprima mostra le sezioni senza mappa reale né carousel: sono segnaposto dichiarati.
- Il salvataggio è un commit immediato ("Salva e pubblica"); non esiste ancora una bozza
  server-side condivisa fra dispositivi (la bozza locale è per singolo browser).
