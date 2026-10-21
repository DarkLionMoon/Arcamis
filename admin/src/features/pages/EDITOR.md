# Editor pagine (blocchi, modelli e layout)

La sezione **Pagine** non è un editor di testo: è una suite di authoring. Una
pagina può essere *libera* (blocchi o markdown) oppure *basata su un modello*
(`template` + `templateData`), e in quel caso i campi del modello compilano da
soli il markdown che il sito pubblico già sa rendere.

Le schede in alto sono **Blocchi** e **Markdown**; per le pagine a modello la
prima diventa **Struttura**. Una pagina libera si apre nei blocchi. Il markdown
resta la fonte di verità in ogni caso: i blocchi sono una vista sopra di esso.

```
content/pages/<key>.json
{
  "k": "pantheon",
  "title": "Pantheon",
  "icon": "🛐",
  "layout": "pantheon",
  "template": "divinita",
  "templateData": { "fields": { … }, "collections": { "entita": [ … ] } },
  "draftFields": ["collections.entita.0.tempio"],
  "status": "scheduled",
  "isDraft": false,
  "publishAt": "2026-11-01T09:00:00.000Z",
  "review": { "requestedBy": "brian", "requestedAt": "…", "reviewedBy": "admin", "reviewedAt": "…" },
  "content": "# Divinità\n\n…"   ← markdown compilato, è questo che legge il sito
}
```

`templateData` è la fonte di verità per l'autore, `content` per il lettore:
vengono scritti entrambi nello stesso salvataggio, quindi non esiste un
formato "nuovo" da supportare lato sito.

## Componenti

| Componente | Ruolo |
| --- | --- |
| `PageEditorView.vue` | workspace a due pannelli: blocchi/form/markdown a sinistra, anteprima live a destra |
| `blocks.ts` | markdown ⇄ blocchi: riconoscimento, serializzazione, campi vuoti |
| `editor/BlockEditor.vue` | card dei blocchi: campi per tipo, riordino, duplica/elimina, scelta media |
| `editor/TemplateForm.vue` | rende il modello: campi pagina, sezioni, schede della collezione con riordino, filtro rapido dei campi |
| `editor/TemplateField.vue` | un campo (text, markdown, select, image, tags, number, boolean, url) + chip «Da completare / In lavorazione» |
| `editor/TemplatePicker.vue` | scelta del modello alla creazione (`create`) o cambio modello (`apply`), import JSON di modelli personalizzati |
| `editor/EditorToolbar.vue` | annulla/ripeti, comandi markdown, inserimento immagine, toggle anteprima, aiuto |
| `editor/EditorStatusBar.vue` | stato salvataggio, parole/caratteri, completamento campi, errori/avvisi, autosave |
| `editor/WorkflowPanel.vue` | flusso di pubblicazione: stato, data programmata, nota di revisione, azioni ammesse dal ruolo |
| `editor/MediaDrawer.vue` | cassetto delle immagini pubblicate in `images/` (via `/api/gh`), con upload e drag&drop: riempie il campo immagine o inserisce nel testo |
| `editor/ShortcutsDialog.vue` | elenco scorciatoie |
| `editor/usePageEditor.ts` | stato, compilazione live, validazione, cronologia, salvataggio, autosave |
| `editor/history.ts` | undo/redo con coalescenza della battitura |
| `templates/schema.ts` | forma del modello (zod) + integrità dei riferimenti |
| `templates/compile.ts` | modello → markdown, con segnaposto e badge bozza |
| `templates/validate.ts` | errori che bloccano il salvataggio e avvisi che lo spiegano |
| `templates/seed.ts` | import "best effort" del markdown esistente nei campi del modello |
| `templates/definitions/*.json` | gli undici modelli built-in (dati, non codice) |
| `workflow.ts` | specifica del flusso: stati, azioni per ruolo, programmazione, conversione delle date |
| `scripts/js/page-status.js` | la stessa specifica lato sito (script classico, `window.arcPageWorkflow`) |

## Editor a blocchi (pagine libere)

`blocks.ts` traduce markdown ⇄ blocchi senza inventare un formato: ogni blocco
corrisponde alla sintassi che `scripts/js/md-render.js` sa già rendere.

| Blocco | Markdown prodotto |
| --- | --- |
| Titolo H1–H3 | `#`, `##`, `###` |
| Paragrafo | testo (le righe singole restano a capo) |
| Callout | `> [!TIPO] Titolo` + corpo |
| Accordion / FAQ | `> [!TIPO]- Titolo` + corpo (il renderer lo fa `<details>`) |
| Griglia / Carte | `:::cards` con `### Titolo` per carta |
| Galleria | `:::gallery` con una riga `![didascalia](/immagine)` per foto |
| Immagine | `![didascalia](/immagine)` |
| Tabella | tabella a pipe con separatore |
| Separatore | `---` |
| Markdown grezzo | testo identico (elenchi, citazioni, codice, H4+) |

Regole che tengono in piedi la promessa «niente perdite»:

- **aprire i blocchi non riscrive nulla.** Il markdown si rilegge solo quando
  si torna sui Blocchi e il testo è cambiato altrove; la prima modifica a un
  blocco riserializza tutto;
- **ciò che i blocchi non riconoscono** (elenchi, citazioni semplici, blocchi di
  codice, titoli H4+) finisce in un blocco *markdown grezzo* che conserva le
  righe originali: è modificabile a mano e non viene riformattato;
- **i toni dei callout non si normalizzano**: un `[!FAQ]` scritto a mano resta
  `FAQ` anche se non è nel menu, altrimenti il solo aprire i blocchi cambierebbe
  il file;
- `blocks.test.ts` verifica il giro completo (markdown → blocchi → markdown),
  l'idempotenza e che nessuna riga vada persa.

`BlockEditor.vue` disegna una card per blocco: maniglia per il trascinamento (o
frecce su/giù, con la stessa semantica), duplica, elimina, e campi per tipo.
Griglia, galleria e immagine aprono `MediaDrawer` per scegliere un file da
`images/` invece di incollare un URL; le immagini con una sorgente mostrano
l'anteprima. `blockIssues()` segnala i blocchi incompleti (paragrafo vuoto,
immagine senza file, carta senza titolo): sono avvisi nel piè di pagina, non
bloccano il salvataggio di una bozza.

Il layout a schede (`schede`) e le card `:::cards` condividono il renderer
`_renderSchede` / `.n-cards` del sito, quindi l'anteprima è quella dei lettori.

## Selettore del layout di pagina

All'inizio di *Dettagli* ci sono tre preset (`layouts.ts`), pensati per coprire
i casi reali senza inventare valori che il sito non sa rendere:

| Preset | `layout` | Indice |
| --- | --- | --- |
| Wiki standard | `""` | attivo |
| Immersivo / full width | `wide` | spento |
| Schede / griglia | `schede` | spento |

Sotto c'è il selettore avanzato con tutti i layout specifici (`regole`,
`pantheon`, `galleria`, …). Su una pagina a modello i preset sono disabilitati:
il layout lo decide il modello.

Aprire una pagina non basta per pubblicarla: lo stato si cambia dal pannello del
flusso (`WorkflowPanel`) o dal pulsante **Segna come bozza** in *Dettagli*, che
usa la stessa azione `back-to-draft` (e chiede conferma se la pagina è online).

## I modelli built-in

| id | Layout sul sito | Collezione | Forma generata |
| --- | --- | --- | --- |
| `divinita` | `pantheon` | entità (divinità) | `# Nome`, immagine con `#x,y`, `- **Etichetta:** …`, citazione, `---` tra le schede |
| `regola` | `regole` | regole | `## Regola N — Titolo`, corpo, `**Eccezioni:**` + elenco, nota `>` |
| `lore` | `lore` | sezioni | `## Titolo`, sottosezioni `###`, nessun `---` |
| `mestiere` | `lavori` | mestieri | `# Titolo` di pagina, poi `## Nome` con scheda tecnica |
| `luogo` | `schede` | luoghi | `## Nome`, immagine, scheda geografica, storia, attrazioni e volti |
| `fazione` | `schede` | fazioni | `## Nome`, stemma, identità, storia, alleanze, rivalità e segreti |
| `npc` | `schede` | personaggi | `## Nome`, ritratto, ruolo, personalità, agganci e segreti del DM |
| `creatura` | `bestiario` | creature | `## Nome`, statistiche, tratti, azioni, reazioni e tattiche |
| `oggetto` | `oggetti` | oggetti | `## Nome`, immagine, rarità/sintonia, proprietà, poteri e varianti |
| `sessione` | `schede` | sessioni | `## Sessione N — Titolo`, presenti, riassunto, momenti, premi e conseguenze |
| `cronologia` | `timeline` | epoche | `## Epoca`, periodo, descrizione ed eventi in timeline |

Il compilatore produce **esattamente** le forme che i renderer di
`scripts/js/notion-nav.js` riconoscono: le classi di verifica stanno in
`templates/templates.test.ts` e `templates/content-compat.test.ts` (quest'ultimo
esegue il renderer reale del sito sul markdown compilato).

## Segnaposto e badge «bozza»

Nessun campo vuoto sparisce in silenzio:

- campo **obbligatorio** vuoto → `Da scrivere` nel markdown (`_DRAFT_MARKERS`
  del sito accende il badge `✎ Bozza`);
- campo **marcato «In lavorazione»** → stesso segnaposto, anche per i campi
  opzionali, così la scelta è visibile a chi legge;
- campo opzionale vuoto non marcato → resta l'etichetta senza valore: il sito
  ha già una regola (`_isDraftMd`) che riconosce `- **Etichetta:**` vuota e
  mostra il badge senza rompere il layout;
- una scheda completamente vuota non viene pubblicata;
- `---` scritto a mano dentro una scheda diventa `***` per non spezzarla;
- un titolo scritto a mano troppo alto rispetto alla scheda è segnalato come
  avviso (non blocca il salvataggio).

## Flusso di pubblicazione

Il badge «bozza» non è più un booleano del testo compilato: lo stato è
*dichiarato* nel file della pagina, ed è lo stesso che il sito e la build
leggono.

| Stato | Pubblico? | Ci si arriva con |
| --- | --- | --- |
| `draft` | no | creazione, «Riporta in bozza» |
| `review` | no | «Invia in revisione» (editor) |
| `scheduled` | da `publishAt` in poi | «Programma» (admin) |
| `published` | sì | «Approva e pubblica» / «Pubblica ora» (admin) |

Un editor prepara e chiede la revisione; approvare, programmare e pubblicare
sono atti di un amministratore: sono le uniche azioni che cambiano ciò che vede
il pubblico. `WorkflowPanel.vue` non decide nulla, disegna quello che
`availableActions(ruolo, stato)` gli passa.

Tre regole reggono il resto:

- **una `scheduled` scaduta è pubblica.** Lo dice `statusOf`, non la build: la
  pagina esce alla data senza che nessuno tocchi il pannello, e `isDue` segnala
  che menu, sitemap e prerender si allineeranno al prossimo deploy («In
  pubblicazione: serve una build»);
- **una `scheduled` senza data valida decade a `draft`**, così una data
  dimenticata non blocca per sempre una pagina;
- **le pagine storiche non si migrano.** Senza `status` valgono `isDraft` e
  `publishAt` come prima, e una `publishAt` senza stato non nasconde una pagina
  già online.

Pubblicare (`publish`, `approve`) è bloccato finché la validazione del modello
trova errori: senza questo si manderebbe online un segnaposto. L'azione scrive
`status`, `isDraft`, `publishAt` e `review` (`requestedBy/At`, `reviewedBy/At`,
`note`) sulla pagina **e** sulla voce del registro, che è il menu del sito;
`sameWorkflow()` evita la PUT sul registro quando non cambia nulla, e se il
registro non è scrivibile la pagina resta comunque salvata (con un avviso).

Anche la lista Pagine parla per stati: chip di filtro con conteggio, badge per
riga, e le azioni rapide «Invia in revisione» / «Approva» senza aprire l'editor.
I chip partono dal registro e vengono allineati al file della pagina con
`/api/admin?action=pages_status`.

### Dove vive lo stato, lato lettore

| File | Ruolo |
| --- | --- |
| `scripts/js/page-status.js` | specifica del sito: `declaredStatus`, `statusOf`, `isPublic`, `isDue`, `gate` |
| `scripts/js/notion-nav.js` | una pagina non pubblica non viene servita: al suo posto il messaggio con lo stato (bozza, in revisione, programmata) |
| `scripts/lib/routes.mjs` | build: rotte prerenderizzate, sitemap e robots solo per le pagine pubbliche |

Le tre implementazioni (pannello, sito, build) sono verificate da
`workflow.test.ts` (parità con lo script del sito, valutato in un contesto `vm`)
e da `scripts/__tests__/page-status.test.js`: se divergono, il test cade invece
di lasciare una pagina «pubblicata» nel pannello e invisibile ai lettori.

## Validazione

`validateTemplateData()` gira a ogni battitura ed è pura:

- **errori** (bloccano il salvataggio): obbligatori vuoti, slug/URL/immagini non
  validi, numeri non numerici, `maxLength`, duplicati sulla chiave titolo;
- **avvisi**: valori fuori dalle opzioni del modello, titoli che spezzano la
  scheda, `---` manuali, collezioni sotto il minimo.

La barra di stato mostra `N da correggere` / `N avvisi`; al salvataggio la vista
scorre al primo campo in errore (`#f-<percorso>`).

## Percorsi dei campi

Un unico formato per validazione, cronologia e stato «in lavorazione»:

```
fields.intro
collections.entita.2.personalita
```

`parseFieldPath` / `getValueAtPath` / `setValueAtPath` (in `templates/schema.ts`)
sono immutabili: la cronologia riceve sempre un nuovo oggetto, il che rende
undo/redo affidabili anche sulle collezioni.

## Modelli personalizzati

`TemplatePicker` → *Importa un modello JSON*: il testo viene validato con lo
stesso schema dei built-in (compreso `assertIntegrity`, che rifiuta blocchi che
puntano a campi inesistenti) e salvato in `localStorage`
(`arcamis.custom-templates`). I built-in non sono sovrascrivibili; un modello
rimosso non tocca le pagine che lo usavano, perché il markdown è già compilato.

## Persistenza

`pagesApi.get/save` passano da `/api/gh` (proxy session-authenticated verso il
repository). Il salvataggio scrive `content/pages/<key>.json` con markdown
compilato, `template` e `templateData` nella stessa PUT; l'autosave (ogni 15 s,
disattivabile dalla barra di stato) usa lo stesso percorso in modalità silenziosa
e **non** salva se ci sono errori di validazione. Un modello non più disponibile
lascia la pagina leggibile: il markdown resta, i campi diventano non modificabili.

## Filtro rapido dei campi

In cima al form strutturato: ricerca per etichetta, testo, valore o chiave, più
un toggle «Solo da completare» (campi vuoti, con problemi o in lavorazione).
Il filtro è di sola visualizzazione e non nasconde nulla in silenzio — il
conteggio dice quanti campi restano fuori e il pulsante «Primo errore» porta al
primo campo che blocca il salvataggio. Per le collezioni il filtro sceglie le
schede da mostrare ma non cambia gli indici, quindi gli errori restano ancorati
alla scheda giusta.

## Anteprima fedele al sito

Il pannello destro usa il renderer reale (`scripts/js/md-render.js`, importato
da `MarkdownPreview.vue`) **e** il suo CSS (`scripts/css/style-notion.css`,
importato da `shared/styles/arc-preview.css`): i blocchi si vedono come sul
sito, con i simboli dorati degli heading e le liste della wiki. L'unico
adattamento è la mappatura dei token (`--gold` → `--accent`, `--parch` →
`--afg-2`, …), così nel tema scuro l'anteprima coincide con la wiki e nel tema
chiaro resta leggibile. Il sommario dell'anteprima assegna gli id ai titoli che
il renderer non emette, altrimenti i link finirebbero su `#undefined`.

## Scorciatoie

`Ctrl/Cmd+S` salva · `Ctrl/Cmd+B` grassetto · `Ctrl/Cmd+Shift+P` anteprima ·
`Ctrl/Cmd+Z` / `Shift` undo/redo strutturato (fuori dai campi di testo) ·
`Esc` chiude cassetto/modali. L'elenco completo è in `ShortcutsDialog.vue`.

## Guard delle modifiche

`useUnsavedGuard` copre entrambi i fronti: navigazione interna (modale
«Resta qui / Esci senza salvare») e chiusura della scheda (`beforeunload`).
La barra superiore mostra `Tutto salvato` / `Modifiche non salvate`.

## Aggiungere un modello built-in

1. creare `templates/definitions/<id>.json` con lo schema di `schema.ts`
   (`version`, `id`, `label`, `icon`, `description`, `layout`, `page`,
   `collections`, `separator`);
2. registrarlo in `templates/index.ts` (`BUILT_IN_TEMPLATES`);
3. `templates.test.ts` verifica automaticamente i riferimenti dei blocchi; il
   test `espone i modelli per ogni scopo editoriale` va esteso all'elenco atteso.

## Verifiche

```bash
npm --prefix admin run typecheck
npm --prefix admin test          # 258 test: blocchi, modelli, compilazione, flusso, guard, palette, mappa
npm --prefix admin run test:e2e  # 34 test (mock di /api/gh e di /api/admin): editor, mappa, carousel, shell
npm --prefix admin run build
```

La mappa e il carousel hanno i loro test: `features/map/coords.test.ts`
(conversione coordinate, il bug della Y a 0) e i casi e2e di
`admin/e2e/map-carousel.spec.ts` (drag col mouse vero, salvataggio della slide).
