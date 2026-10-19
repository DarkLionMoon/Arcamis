/* ════════════════════════════════════
   ARCAMIS — quest-board.js
   Bacheca delle missioni: legge /content/quests.json, filtra per
   stato/tag/livello, "accetta" le missioni (party in localStorage).
   Logica pura su window.ArcQuests, renderer su
   window.initQuestBoard(root) per layout `missioni`.
   (Classic script — variabili globali condivise)
════════════════════════════════════ */
(function () {
  'use strict';

  var STORE = 'arcamis-quests-accepted';

  function loadAccepted() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || '[]');
    } catch (_) {
      return [];
    }
  }

  var Q = {
    filter: function (quests, opts) {
      opts = opts || {};
      var q = (opts.q || '').toLowerCase();
      return (quests || []).filter(function (x) {
        if (opts.stato && opts.stato !== 'tutte' && x.stato !== opts.stato) return false;
        if (opts.tag && opts.tag !== 'tutti' && (x.tag || []).indexOf(opts.tag) === -1) return false;
        if (q && (x.titolo + ' ' + (x.descrizione || '')).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
    },
    tags: function (quests) {
      var out = [];
      (quests || []).forEach(function (x) {
        (x.tag || []).forEach(function (t) {
          if (out.indexOf(t) === -1) out.push(t);
        });
      });
      return out.sort();
    },
    accepted: loadAccepted,
    accept: function (id) {
      var list = loadAccepted();
      if (list.indexOf(id) === -1) list.push(id);
      try {
        localStorage.setItem(STORE, JSON.stringify(list));
      } catch (_) { /* storage non disponibile */ }
      return list;
    },
    leave: function (id) {
      var list = loadAccepted().filter(function (x) { return x !== id; });
      try {
        localStorage.setItem(STORE, JSON.stringify(list));
      } catch (_) { /* storage non disponibile */ }
      return list;
    }
  };

  window.ArcQuests = Q;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var STATO_LABEL = { aperta: '🟢 Aperta', attiva: '🟡 In corso', completata: '✅ Completata' };
  var STATO_CLASS = { aperta: ' is-open', attiva: '', completata: ' is-done' };

  window.initQuestBoard = function (root) {
    if (!root || root._qbInit) return;
    root._qbInit = true;
    root.innerHTML = '<div class="qb-wrap"><p class="qb-loading">Caricamento missioni…</p></div>';
    fetch('/content/quests.json')
      .then(function (r) { return (r.ok ? r.json() : { quests: [] }); })
      .then(function (doc) {
        var quests = doc.quests || [];
        var accepted = Q.accepted();
        var state = { q: '', stato: 'tutte', tag: 'tutti' };
        var wrap = root.querySelector('.qb-wrap');

        function render() {
          var list = Q.filter(quests, state);
          var tags = Q.tags(quests);
          var html =
            '<div class="qb-filters">' +
            '<input class="qb-in" data-f="q" type="search" placeholder="Cerca missioni…" value="' + esc(state.q) + '">' +
            '<select class="qb-in" data-f="stato">' +
            ['tutte', 'aperta', 'attiva', 'completata'].map(function (s) {
              return '<option value="' + s + '"' + (state.stato === s ? ' selected' : '') + '>' + (s === 'tutte' ? 'Tutti gli stati' : STATO_LABEL[s]) + '</option>';
            }).join('') +
            '</select>' +
            '<select class="qb-in" data-f="tag"><option value="tutti">Tutti i tag</option>' +
            tags.map(function (t) {
              return '<option value="' + esc(t) + '"' + (state.tag === t ? ' selected' : '') + '>' + esc(t) + '</option>';
            }).join('') +
            '</select><span class="qb-count">' + list.length + ' missioni</span></div>' +
            '<div class="qb-grid">';
          list.forEach(function (x) {
            var mine = accepted.indexOf(x.id) !== -1;
            html +=
              '<article class="qb-card' + (mine ? ' mine' : '') + '">' +
              '<div class="qb-stato' + (STATO_CLASS[x.stato] || '') + '">' + (STATO_LABEL[x.stato] || esc(x.stato)) + (mine ? ' · ⚔️ accettata' : '') + '</div>' +
              '<h3>' + esc(x.titolo) + '</h3>' +
              '<p>' + esc(x.descrizione || '') + '</p>' +
              '<div class="qb-meta">' +
              (x.livello ? '<span>Liv. ' + esc(x.livello) + '</span>' : '') +
              (x.ricompensa ? '<span>💰 ' + esc(x.ricompensa) + '</span>' : '') +
              (x.master ? '<span>🎭 ' + esc(x.master) + '</span>' : '') +
              '</div>' +
              ((x.tag || []).length ? '<div class="qb-tags">' + x.tag.map(function (t) { return '<span>#' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
              (x.stato === 'aperta'
                ? '<button type="button" class="qb-btn" data-id="' + esc(x.id) + '">' + (mine ? 'Lascia la missione' : 'Accetta la missione') + '</button>'
                : '') +
              '</article>';
          });
          wrap.innerHTML = html + '</div>' + (list.length ? '' : '<p class="qb-empty">Nessuna missione con questi filtri.</p>');
          wrap.querySelectorAll('[data-f]').forEach(function (el) {
            el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', function () {
              state[el.getAttribute('data-f')] = el.value;
              render();
              var focus = wrap.querySelector('[data-f="q"]');
              if (focus && el.getAttribute('data-f') === 'q') {
                focus.focus();
                focus.setSelectionRange(focus.value.length, focus.value.length);
              }
            });
          });
          wrap.querySelectorAll('.qb-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = btn.getAttribute('data-id');
              accepted = accepted.indexOf(id) !== -1 ? Q.leave(id) : Q.accept(id);
              render();
            });
          });
        }
        render();
      })
      .catch(function () {
        root.querySelector('.qb-wrap').innerHTML = '<p class="qb-empty">Bacheca non disponibile.</p>';
      });
  };
})();
