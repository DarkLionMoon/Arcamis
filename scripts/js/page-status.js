/* ════════════════════════════════════════════════════════════════
   ARCAMIS — page-status.js

   Gli stati di pubblicazione di una pagina, lato sito:

     draft      → in lavorazione, non pubblica
     review     → in revisione, non pubblica
     scheduled  → pubblica da `publishAt`, non prima
     published  → pubblica

   Regole (identiche a admin/src/features/pages/workflow.ts e a
   scripts/lib/routes.mjs — scripts/__tests__/page-status.test.js
   verifica che le tre implementazioni non divergano):

     · `scheduled` scaduto vale `published`: la pagina è pubblica anche
       se la build non è ancora stata rifatta;
     · `scheduled` senza data valida decade a `draft`;
     · `published` con un `isDraft` residuo resta bozza (dati
       incoerenti non pubblicano per sbaglio);
     · le pagine storiche, senza `status`, si leggono da `isDraft`.

   Due compiti:

     1. `gate()` decide se il contenuto può essere mostrato a chi legge;
        in caso negativo il chiamante mostra un avviso e nessun testo;
     2. l'elenco pagine del sito (menu, home, ricerca) viene filtrato
        con la lista che la build inietta in `window.__ARC_HIDDEN_PAGES__`:
        una pagina non pubblicata non deve nemmeno essere pubblicizzata.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STATUSES = ['draft', 'review', 'scheduled', 'published'];

  function parseWhen(value) {
    if (!value) return null;
    var time = Date.parse(value);
    return isNaN(time) ? null : time;
  }

  /* Stato dichiarato, senza guardare l'orologio. */
  function declaredStatus(page) {
    if (!page) return 'draft';
    if (page.status && STATUSES.indexOf(page.status) !== -1) {
      if (page.status === 'scheduled' && parseWhen(page.publishAt) === null) return 'draft';
      if (page.status === 'published' && page.isDraft === true) return 'draft';
      return page.status;
    }
    return page.isDraft === true ? 'draft' : 'published';
  }

  /* Stato effettivo: una programmata scaduta è pubblica. */
  function statusOf(page, now) {
    var declared = declaredStatus(page);
    if (declared !== 'scheduled') return declared;
    var when = parseWhen(page && page.publishAt);
    if (when === null) return 'draft';
    return when <= (now || Date.now()) ? 'published' : 'scheduled';
  }

  function isPublic(page, now) {
    return statusOf(page, now) === 'published';
  }

  /* Programmata e già scaduta: pubblica, ma la build è indietro. */
  function isDue(page, now) {
    return declaredStatus(page) === 'scheduled' && statusOf(page, now) === 'published';
  }

  function label(status) {
    switch (status) {
      case 'draft':
        return 'Bozza';
      case 'review':
        return 'In revisione';
      case 'scheduled':
        return 'In arrivo';
      default:
        return 'Pubblicata';
    }
  }

  function formatWhen(value) {
    var when = parseWhen(value);
    if (when === null) return '';
    try {
      return new Date(when).toLocaleString('it-IT', { dateStyle: 'long', timeStyle: 'short' });
    } catch (_) {
      return new Date(when).toISOString();
    }
  }

  /**
   * Cosa mostrare al posto del contenuto.
   * @returns {{blocked:boolean,title:string,message:string}}
   */
  function gate(page, now) {
    var status = statusOf(page, now);
    if (status === 'published') return { blocked: false, title: '', message: '' };
    if (status === 'scheduled') {
      return {
        blocked: true,
        title: label('scheduled'),
        message:
          'Questa pagina sarà pubblica dal ' +
          formatWhen(page && page.publishAt) +
          '. Torna a trovarla da quella data.',
      };
    }
    if (status === 'review') {
      return {
        blocked: true,
        title: label('review'),
        message: 'Il contenuto è in revisione e non è ancora pubblicato.',
      };
    }
    return {
      blocked: true,
      title: label('draft'),
      message: 'Questa pagina è ancora in lavorazione: il contenuto non è pubblicato.',
    };
  }

  /* ── Elenco pagine ──────────────────────────────────────────────
     La build scrive in `window.__ARC_HIDDEN_PAGES__` le chiavi non
     pubbliche al momento della build. Senza la lista (sviluppo) si
     considera tutto pubblico: è la stessa scelta di routes.mjs, che
     non filtra nulla quando non sa. */
  function hiddenKeys() {
    if (typeof window === 'undefined') return [];
    return Array.isArray(window.__ARC_HIDDEN_PAGES__) ? window.__ARC_HIDDEN_PAGES__ : [];
  }

  function isListed(key) {
    if (!key) return false;
    return hiddenKeys().indexOf(key) === -1;
  }

  /** Toglie dalla lista le pagine non pubbliche (in place, come `pages`). */
  function pruneList(list) {
    var keys = hiddenKeys();
    if (!keys.length || !Array.isArray(list)) return 0;
    var removed = 0;
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i] && keys.indexOf(list[i].k) !== -1) {
        list.splice(i, 1);
        removed++;
      }
    }
    return removed;
  }

  var api = {
    STATUSES: STATUSES,
    parseWhen: parseWhen,
    declaredStatus: declaredStatus,
    statusOf: statusOf,
    isPublic: isPublic,
    isDue: isDue,
    label: label,
    formatWhen: formatWhen,
    gate: gate,
    isListed: isListed,
    pruneList: pruneList,
  };

  if (typeof window !== 'undefined') {
    window.arcPageWorkflow = api;
    /* Menu, home e ricerca leggono il globale `pages` di data.js: si
       ripulisce qui, prima che qualcuno lo usi. */
    try {
      pruneList(window.pages);
    } catch (_) {}
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
