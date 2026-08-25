/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — arc.js
   Namespace unico dell'admin (window.ArcAdmin).
   Caricare PRIMA del blocco di configurazione inline e degli altri
   moduli (core/editors/structured/site/system).

   Organizzazione:
     ArcAdmin.CONFIG   → impostazioni repo/branch/contenuti
     ArcAdmin.pages    → registro pagine (compilato dal blocco inline)
     ArcAdmin.sections → sezioni menu (compilato dal blocco inline)
     ArcAdmin.state    → stato runtime condiviso tra i moduli
     ArcAdmin.register → registra l'API pubblica di un modulo
     ArcAdmin.module   → recupera l'API di un modulo registrato
   ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var arc = {
    VERSION: '2.0.0',
    CONFIG: {
      repo: 'DarkLionMoon/Arcamis',
      branch: 'main',
      content: 'content'
    },
    pages: [],
    sections: [],
    state: {},
    _modules: {},

    register: function (name, api) {
      if (!name || typeof api !== 'object') {
        throw new Error('ArcAdmin.register: modulo o API non valida');
      }
      this._modules[name] = api;
      return api;
    },

    module: function (name) {
      return this._modules[name] || null;
    },

    /* Ottiene una configurazione (con valore di default). */
    cfg: function (key, fallback) {
      var v = this.CONFIG[key];
      return v === undefined ? fallback : v;
    }
  };

  global.ArcAdmin = arc;
})(window);
