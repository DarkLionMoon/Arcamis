/* ════════════════════════════════════
   ARCAMIS — diary.js
   Diario di campagna per PG: personaggi e pagine di diario in
   localStorage, export/import JSON. Logica pura su window.ArcDiary,
   renderer su window.initDiary(root) per layout `diario`.
   (Classic script — variabili globali condivise)
════════════════════════════════════ */
(function () {
  'use strict';

  var STORE = 'arcamis-diary-v1';

  function uid(p) {
    return (p || 'e') + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }

  var D = {
    blank: function () {
      return { characters: [], entries: [] };
    },
    load: function () {
      try {
        var raw = localStorage.getItem(STORE);
        if (!raw) return D.blank();
        var s = JSON.parse(raw);
        return { characters: s.characters || [], entries: s.entries || [] };
      } catch (_) {
        return D.blank();
      }
    },
    save: function (state) {
      try {
        localStorage.setItem(STORE, JSON.stringify(state));
        return true;
      } catch (_) {
        return false;
      }
    },
    addCharacter: function (state, nome) {
      var c = { id: uid('pg'), nome: String(nome || 'Senza nome').slice(0, 40) };
      state.characters.push(c);
      return c;
    },
    removeCharacter: function (state, id) {
      state.characters = state.characters.filter(function (c) { return c.id !== id; });
      state.entries = state.entries.filter(function (e) { return e.pgId !== id; });
    },
    addEntry: function (state, pgId, titolo, testo) {
      var e = {
        id: uid('e'),
        pgId: pgId,
        data: new Date().toISOString().slice(0, 10),
        titolo: String(titolo || 'Senza titolo').slice(0, 80),
        testo: String(testo || '')
      };
      state.entries.unshift(e);
      return e;
    },
    removeEntry: function (state, id) {
      state.entries = state.entries.filter(function (e) { return e.id !== id; });
    },
    entriesOf: function (state, pgId) {
      return state.entries.filter(function (e) { return !pgId || e.pgId === pgId; });
    },
    exportJson: function (state) {
      return JSON.stringify(state, null, 2);
    },
    importJson: function (text) {
      var s = JSON.parse(text);
      if (!s || !Array.isArray(s.characters) || !Array.isArray(s.entries)) throw new Error('Formato non valido');
      return { characters: s.characters, entries: s.entries };
    }
  };

  window.ArcDiary = D;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.initDiary = function (root) {
    if (!root || root._diaryInit) return;
    root._diaryInit = true;
    var state = D.load();
    var selected = state.characters.length ? state.characters[0].id : null;

    function persist() {
      D.save(state);
    }

    function render() {
      var html =
        '<div class="dy-cols"><div class="dy-side"><h3>Personaggi</h3><div class="dy-pgs">' +
        state.characters.map(function (c) {
          return '<button type="button" class="dy-pg' + (c.id === selected ? ' active' : '') + '" data-pg="' + c.id + '">' + esc(c.nome) + '</button>';
        }).join('') +
        '</div><div class="dy-newpg"><input class="dy-in" data-f="newpg" placeholder="Nuovo PG…" maxlength="40"><button type="button" data-act="addpg">＋</button></div>' +
        '<div class="dy-tools"><button type="button" data-act="export">⤓ Export</button> <label class="dy-import">⤒ Import<input type="file" data-f="import" accept="application/json" hidden></label></div></div>' +
        '<div class="dy-main">';
      if (!state.characters.length) {
        html += '<p class="dy-empty">Crea il tuo primo personaggio per iniziare il diario.</p>';
      } else {
        html +=
          '<div class="dy-compose"><input class="dy-in" data-f="titolo" placeholder="Titolo della pagina…" maxlength="80">' +
          '<textarea class="dy-in" data-f="testo" rows="4" placeholder="Cosa è successo nella sessione?"></textarea>' +
          '<button type="button" data-act="addentry">✍️ Aggiungi pagina</button></div>' +
          '<div class="dy-entries">' +
          D.entriesOf(state, selected).map(function (e) {
            return (
              '<article class="dy-entry"><div class="dy-date">' + esc(e.data) + '</div><h4>' + esc(e.titolo) + '</h4>' +
              '<p>' + esc(e.testo).replace(/\n/g, '<br>') + '</p>' +
              '<button type="button" class="dy-del" data-del="' + e.id + '">Elimina</button></article>'
            );
          }).join('') +
          '</div>';
      }
      root.innerHTML = html + '</div></div>';
      root.querySelectorAll('[data-pg]').forEach(function (b) {
        b.addEventListener('click', function () {
          selected = b.getAttribute('data-pg');
          render();
        });
      });
      root.querySelectorAll('[data-act]').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.getAttribute('data-act');
          if (act === 'addpg') {
            var v = (root.querySelector('[data-f="newpg"]') || {}).value || '';
            if (!v.trim()) return;
            selected = D.addCharacter(state, v.trim()).id;
          } else if (act === 'addentry') {
            var t = (root.querySelector('[data-f="titolo"]') || {}).value || '';
            var x = (root.querySelector('[data-f="testo"]') || {}).value || '';
            if (!t.trim() && !x.trim()) return;
            D.addEntry(state, selected, t.trim(), x);
          } else if (act === 'export') {
            var blob = new Blob([D.exportJson(state)], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'diario-arcamis.json';
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
            return;
          }
          persist();
          render();
        });
      });
      root.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          D.removeEntry(state, b.getAttribute('data-del'));
          persist();
          render();
        });
      });
      var imp = root.querySelector('[data-f="import"]');
      if (imp) {
        imp.addEventListener('change', function () {
          var f = imp.files && imp.files[0];
          if (!f) return;
          var r = new FileReader();
          r.onload = function () {
            try {
              state = D.importJson(String(r.result || ''));
              selected = state.characters.length ? state.characters[0].id : null;
              persist();
              render();
            } catch (_) {
              alert('File non valido.');
            }
          };
          r.readAsText(f);
        });
      }
    }
    render();
  };
})();
