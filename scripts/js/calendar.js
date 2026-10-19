/* ════════════════════════════════════
   ARCAMIS — calendar.js
   Calendario del mondo: converte la data reale nel datario di
   Arcamis (config in /content/calendar.json, con fallback interno),
   elenca feste e fasi lunari narrative.
   Logica pura su window.ArcCalendar, renderer su
   window.initCalendar(root) per le pagine con layout `calendario`.
   (Classic script — variabili globali condivise)
════════════════════════════════════ */
(function () {
  'use strict';

  var FALLBACK = {
    epochGregorian: '2024-01-01',
    epochArcamis: { anno: 1492, mese: 0, giorno: 1 },
    mesi: [
      'Primofiore',
      'Verdeme',
      'Solealto',
      'Calorluna',
      'Mietitura',
      'Fogliaoro',
      'Nebbiame',
      'Gelofondo',
      'Neveme',
      'Disgelo',
      'Fiorrugiada',
      'Stellcaduta'
    ],
    giorniMese: 30,
    giorniSettimana: ['Lunadì', 'Martedì', 'Mercordì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
    feste: [
      { mese: 0, giorno: 1, nome: 'Capodanno di Primavera' },
      { mese: 2, giorno: 15, nome: 'Solstizio del Sole' },
      { mese: 5, giorno: 30, nome: 'Festa del Raccolto' },
      { mese: 8, giorno: 1, nome: 'Notte delle Lanterne' },
      { mese: 11, giorno: 30, nome: 'Veglia delle Stelle' }
    ]
  };

  function daysBetween(a, b) {
    return Math.floor((b - a) / 86400000);
  }

  var C = {
    /* Ritorna la config effettiva (custom o fallback). */
    config: function (custom) {
      return custom && custom.mesi && custom.mesi.length ? custom : FALLBACK;
    },
    /* Converte una data gregoriana in data di Arcamis. */
    convert: function (date, custom) {
      var cfg = C.config(custom);
      var epoch = new Date(cfg.epochGregorian + 'T12:00:00');
      var target = date instanceof Date ? date : new Date(date);
      var delta = daysBetween(epoch.getTime(), target.getTime());
      var gpm = cfg.giorniMese || 30;
      var base = cfg.epochArcamis || { anno: 1492, mese: 0, giorno: 1 };
      var absolute = (base.giorno - 1) + delta;
      var totalMonths = base.mese + Math.floor(absolute / gpm);
      var giorno = ((absolute % gpm) + gpm) % gpm + 1;
      var anno = base.anno + Math.floor(totalMonths / cfg.mesi.length);
      var mese = ((totalMonths % cfg.mesi.length) + cfg.mesi.length) % cfg.mesi.length;
      var sett = cfg.giorniSettimana || [];
      var weekday = sett.length ? sett[((delta % sett.length) + sett.length) % sett.length] : '';
      var feste = (cfg.feste || []).filter(function (f) {
        return f.mese === mese && f.giorno === giorno;
      });
      return { anno: anno, mese: mese, meseNome: cfg.mesi[mese], giorno: giorno, weekday: weekday, feste: feste };
    },
    format: function (arc) {
      var s = arc.giorno + ' ' + arc.meseNome + ' ' + arc.anno;
      if (arc.weekday) s += ' (' + arc.weekday + ')';
      return s;
    }
  };

  window.ArcCalendar = C;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.initCalendar = function (root) {
    if (!root || root._calInit) return;
    root._calInit = true;
    root.innerHTML = '<div class="cal-wrap"><div class="cal-today">Caricamento…</div><div class="cal-months"></div></div>';
    function render(cfg) {
      var now = new Date();
      var arc = C.convert(now, cfg);
      var html =
        '<div class="cal-today"><div class="cal-label">Oggi ad Arcamis</div>' +
        '<div class="cal-big">' + esc(C.format(arc)) + '</div>';
      if (arc.feste.length) {
        html += '<div class="cal-festa">🎉 ' + arc.feste.map(function (f) { return esc(f.nome); }).join(', ') + '</div>';
      }
      html += '<div class="cal-real">Data reale: ' + esc(now.toLocaleDateString('it-IT')) + '</div></div>';
      html += '<div class="cal-months">' + cfg.mesi.map(function (m, i) {
        var feste = (cfg.feste || []).filter(function (f) { return f.mese === i; });
        return (
          '<div class="cal-month"><strong>' + esc(m) + '</strong>' +
          (feste.length
            ? '<ul>' + feste.map(function (f) { return '<li>' + f.giorno + ' — ' + esc(f.nome) + '</li>'; }).join('') + '</ul>'
            : '<span class="cal-nofesta">Nessuna festa</span>') +
          '</div>'
        );
      }).join('') + '</div>';
      root.querySelector('.cal-wrap').innerHTML = html;
    }
    fetch('/content/calendar.json')
      .then(function (r) { return (r.ok ? r.json() : null); })
      .then(function (cfg) { render(C.config(cfg)); })
      .catch(function () { render(FALLBACK); });
  };
})();
