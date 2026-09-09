# Resoconto Sessione — Integrazione Imprese & Licenze in ArcaMain

**Data:** 8 Settembre 2026
**Repo:** https://github.com/DarkLionMoon/Arcamis.git
**Commit:** `2a81df8` (push su `origin/main`)

---

## Obiettivo

Integrare il progetto standalone "Società & Licenze di Arcamis" (`/home/brian/Documenti/Imprese e Licenze/index.html`, ~2400 righe autonome) come nuova sezione "Imprese" all'interno del sito SPA ArcaMain (`/home/brian/Documenti/Arcamis-main/`).

---

## Cosa è stato fatto

### 1. Progetto Standalone (Imprese e Licenze)

- **Gestore di Società** completato con 5 blocchi JS (gp1-gp5), tutti gli onclick funzionanti, `node --check` OK
- **Fix applicati:**
  - `sociCount` minimo 4 per L3
  - `gAddSanzione` usa index-based select + campo `s.multa`
  - `gRoll` usa `DATA.tiriEvento` con range parsing (en-dash split)
  - `impresaStats` calcola PG 20 / NPC 8 costi apprendista
- **CSS glassmorphism** riscritto: dark theme con backdrop-filter blur, pannelli semitrasparenti, glow effects
- **Sezione "Come Creare un'Impresa"** aggiunta in RENDER_GILDE

### 2. Integrazione in ArcaMain

| File | Azione | Stato |
|------|--------|-------|
| `scripts/css/style-imprese.css` | **Creato** (22 KB) — CSS namespaced `.imprese-app` | ✅ |
| `scripts/js/imprese.js` | **Creato** (115 KB) — JS wrappato in IIFE + `initImprese()` | ⚠️ **ROTO** |
| `content/pages/imprese.json` | **Creato** — `layout: "imprese"` | ✅ |
| `scripts/js/notion-nav.js` | Aggiunto branch `layout === 'imprese'` + init call | ✅ |
| `scripts/js/data.js` | Pagina `pag-imprese` + sezione `imprese` in `SECTIONS` | ✅ |
| `scripts/js/app.js` | URL route `'imprese': 'pag-imprese'` | ✅ |
| `scripts/js/custom-nav.js` | SEC entry `imprese` per desktop + mobile | ✅ |
| `index.html` | CSS link + dropdown topbar + mobile nav section | ✅ |

---

## Perché non funziona — Problemi identificati

### Bug critico 1: `template` non definito

```javascript
// linea 12 di imprese.js
container.innerHTML = `${template}`;
```

La variabile `template` non esiste nel file. Lo script di estrazione avrebbe dovuto iniettarla ma l'escaping è fallito — il template HTML (header, tabs, sidenav, content, modal) non viene mai generato, quindi `container.innerHTML` diventa `undefined` e l'app non si inizializza.

### Bug critico 2: Override funzioni non applicato

L'IIFE wrappa il codice standalone e tenta di sovrascrivere `window.renderTabs`, `window.renderSideNav`, `window.renderContent`, `window.render`. Ma il codice standalone definisce le stesse funzioni con `function renderTabs()` etc. che vengono **hoisted** all'interno dell'IIFE, ombreggiando le override su `window.*`. Quando `render()` viene chiamato, esegue la versione originale (che usa `document.getElementById('tabs')`, `document.getElementById('sidenav')` ecc.) e non le versioni container-scoped.

### Bug critico 3: `document.getElementById('modalOverlay')` fallisce al parse time

```javascript
// linea 1025
document.getElementById('modalOverlay').addEventListener('click', e => { ... });
```

Questo viene eseguito immediatamente quando il JS viene parsato, ma a quel punto il DOM non contiene ancora `#modalOverlay` (viene iniettato solo quando `initImprese` viene chiamato). Errore: `Cannot read property 'addEventListener' of null`.

### Bug critico 4: Funzioni globali che chiamano funzioni IIFE-locali

Le funzioni inline `onclick="closeModal()"`, `onclick="goto('licenze','...')"`, `onclick="openDrawer()"` etc. cercano funzioni globali, ma quelle funzioni sono definite dentro l'IIFE e non sono su `window`. Solo `window._impSetPage` e `window._impSetSection` vengono esposte correttamente.

### Bug critico 5: `closeDrawer()` e `openDrawer()` usano ID non esistenti

```javascript
function openDrawer() {
  document.getElementById('mobileDrawer').classList.add('open');
  // ...
}
```

`mobileDrawer` e `drawerOverlay` non sono definiti nel template iniettato dall'IIFE.

### Bug critico 6: CSS non adattato

Lo standalone usa variabili CSS senza prefisso (`--gold`, `--bg`, `--text` ecc.) che entrano in conflitto con quelle del sito ArcaMain. Il CSS in `style-imprese.css` è stato namespaced con `.imprese-app` e `--imp-*` ma il JS standalone continua a usare le classi originali (`.btn`, `.modal-overlay` ecc.) che non matchano.

---

## Stato attuale

- **Commit pushato:** `2a81df8` su `origin/main` (119 file, 26K righe)
- **Sezione Imprese:** visibile nel menu ma **non funzionante** — schermo vuoto o errori JS in console
- **Standalone:** il progetto in `/home/brian/Documenti/Imprese e Licenze/index.html` funziona ancora autonomamente

---

## Cosa serve per fixare

1. **Riscrivere l'estrazione JS:** Iniettare il template HTML corretto come stringa letterale, non come variabile. O meglio, non wrappare in IIFE — usare un approccio diverso (es. Shadow DOM, o semplicemente caricare il standalone in un iframe, oppure refactorare il JS standalone per essere modular).

2. **Risoluzione scope:** Le funzioni globali (`closeModal`, `goto`, `openDrawer` ecc.) devono essere esposte su `window.*` esplicitamente, oppure usare `addEventListener` con delegation.

3. **DOM timing:** `document.getElementById('modalOverlay').addEventListener(...)` deve essere spostato dentro `initImprese()` dopo l'injection del template.

4. **Coerenza CSS:** O rinominare tutte le classi CSS standalone nel CSS namespaced (`.imp-btn`, `.imp-modal-overlay` ecc.), oppure usare un approccio iframe che isola completamente l'app.

### Opzioni di approccio

| Opzione | Complessità | Isolamento | Manutenzione |
|---------|-------------|------------|--------------|
| **A) Fix IIFE + namespace classi** | Alta | Medio | Difficile |
| **B) Caricare in `<iframe>`** | Bassa | Totale | Facile |
| **C) Shadow DOM** | Media | Alto | Media |
| **D) Rewrite standalone come modulo** | Molto alta | Medio | Facile |

**Raccomandazione:** L'opzione **B (iframe)** è la più pragmatica — carica l'intero `index.html` standalone in un iframe, nessun conflitto CSS/JS/namespace, zero modifiche al codice esistente. L'URL diventa `/imprese` con un `src="/imprese-standalone/index.html"`.
