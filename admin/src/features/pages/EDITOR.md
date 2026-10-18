# Editor a modelli (Pagine)

La sezione **Pagine** non è un editor di testo: è una suite di authoring
strutturata. Una pagina può essere *libera* (solo markdown) oppure *basata su
un modello* (`template` + `templateData`), e in quel caso i campi del modello
compilano da soli il markdown che il sito pubblico già sa rendere.

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
| `PageEditorView.vue` | workspace a due pannelli: form/markdown a sinistra, anteprima live a destra |
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
| `templates/definitions/*.json` | i quattro modelli built-in (dati, non codice) |
| `workflow.ts` | specifica del flusso: stati, azioni per ruolo, programmazione, conversione delle date |
| `scripts/js/page-status.js` | la stessa specifica lato sito (script classico, `window.arcPageWorkflow`) |

## I quattro modelli built-in

| id | Layout sul sito | Collezione | Forma generata |
| --- | --- | --- | --- |
| `divinita` | `pantheon` | entità (divinità) | `# Nome`, immagine con `#x,y`, `- **Etichetta:** …`, citazione, `---` tra le schede |
| `regola` | `regole` | regole | `## Regola N — Titolo`, corpo, `**Eccezioni:**` + elenco, nota `>` |
| `lore` | `lore` | sezioni | `## Titolo`, sottosezioni `###`, nessun `---` |
| `mestiere` | `lavori` | mestieri | `# Titolo` di pagina, poi `## Nome` con scheda tecnica |

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
   test `espone i quattro modelli richiesti` va esteso all'elenco atteso.

## Verifiche

```bash
npm --prefix admin run typecheck
npm --prefix admin test          # 210 test, modelli + compilazione + flusso + guard + palette
npm --prefix admin run test:e2e  # 13 test sull'editor (mock di /api/gh e di /api/admin)
npm --prefix admin run build
```
