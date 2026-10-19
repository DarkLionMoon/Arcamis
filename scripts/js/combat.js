/* ════════════════════════════════════
   ARCAMIS — combat.js
   Tracker di iniziativa per il tavolo: round, turni, PF.
   Logica pura su window.ArcCombat, stato in localStorage,
   renderer su window.initCombat(root) per layout `combattimento`.
   (Classic script — variabili globali condivise)
════════════════════════════════════ */
(function () {
  'use strict';

  function uid() {
    return 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }

  var C = {
    create: function () {
      return { combatants: [], round: 1, active: 0 };
    },
    add: function (state, name, init, hp) {
      var c = { id: uid(), name: String(name || 'Senza nome').slice(0, 40), init: Number(init) || 0, hp: hp == null || hp === '' ? null : Number(hp), maxHp: hp == null || hp === '' ? null : Number(hp) };
      state.combatants.push(c);
      C.sort(state);
      return c;
    },
    remove: function (state, id) {
      state.combatants = state.combatants.filter(function (c) { return c.id !== id; });
      if (state.active >= state.combatants.length) state.active = 0;
    },
    sort: function (state) {
      state.combatants.sort(function (a, b) { return b.init - a.init; });
    },
    next: function (state) {
      if (!state.combatants.length) return;
      state.active += 1;
      if (state.active >= state.combatants.length) {
        state.active = 0;
        state.round += 1;
      }
    },
    prev: function (state) {
      if (!state.combatants.length) return;
      state.active -= 1;
      if (state.active < 0) {
        state.active = state.combatants.length - 1;
        state.round = Math.max(1, state.round - 1);
      }
    },
    damage: function (state, id, amount) {
      var c = state.combatants.filter(function (x) { return x.id === id; })[0];
      if (c && c.hp != null) c.hp = Math.max(0, c.hp - (Number(amount) || 0));
    },
    heal: function (state, id, amount) {
      var c = state.combatants.filter(function (x) { return x.id === id; })[0];
      if (c && c.hp != null) c.hp = Math.min(c.maxHp, c.hp + (Number(amount) || 0));
    },
    rollInit: function (mod) {
      return 1 + Math.floor(Math.random() * 20) + (Number(mod) || 0);
    },
    save: function (key, state) {
      try {
        localStorage.setItem('arcamis-combat-' + key, JSON.stringify(state));
      } catch (_) { /* storage pieno o privato: il tracker resta in memoria */ }
    },
    load: function (key) {
      try {
        var raw = localStorage.getItem('arcamis-combat-' + key);
        if (!raw) return null;
        var s = JSON.parse(raw);
        if (!s || !Array.isArray(s.combatants)) return null;
        return { combatants: s.combatants, round: s.round || 1, active: s.active || 0 };
      } catch (_) {
        return null;
      }
    }
  };

  window.ArcCombat = C;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.initCombat = function (root) {
    if (!root || root._combatInit || typeof document === 'undefined') return;
    root._combatInit = true;
    var storeKey = root.getAttribute('data-page') || 'default';
    var state = C.load(storeKey) || C.create();

    function persist() {
      C.save(storeKey, state);
    }

    function render() {
      var html =
        '<div class="cb-top"><div class="cb-round">Round <strong>' + state.round + '</strong></div>' +
        '<div class="cb-actions">' +
        '<button type="button" data-act="prev">◀ Turno prec.</button>' +
        '<button type="button" data-act="next">Turno succ. ▶</button>' +
        '<button type="button" data-act="reset">↺ Azzera</button>' +
        '</div></div>' +
        '<div class="cb-add">' +
        '<input class="cb-in" data-f="name" placeholder="Nome" maxlength="40">' +
        '<input class="cb-in cb-num" data-f="init" type="number" placeholder="Iniz.">' +
        '<input class="cb-in cb-num" data-f="hp" type="number" placeholder="PF">' +
        '<button type="button" data-act="roll">🎲 Tira iniziativa</button>' +
        '<button type="button" data-act="add">＋ Aggiungi</button>' +
        '</div>' +
        '<ol class="cb-list">';
      state.combatants.forEach(function (c, i) {
        var hp = c.hp == null ? '—' : c.hp + (c.maxHp != null ? '/' + c.maxHp : '');
        html +=
          '<li class="cb-row' + (i === state.active ? ' active' : '') + (c.hp === 0 ? ' down' : '') + '">' +
          '<span class="cb-init">' + c.init + '</span>' +
          '<span class="cb-name">' + esc(c.name) + '</span>' +
          '<span class="cb-hp">' + esc(hp) + '</span>' +
          '<span class="cb-rowbtns">' +
          '<button type="button" data-act="dmg" data-id="' + c.id + '" title="Danno">−</button>' +
          '<button type="button" data-act="heal" data-id="' + c.id + '" title="Cura">＋</button>' +
          '<button type="button" data-act="del" data-id="' + c.id + '" title="Rimuovi">✕</button>' +
          '</span></li>';
      });
      root.innerHTML = html + '</ol>' + (state.combatants.length ? '' : '<p class="cb-empty">Nessun combattente: aggiungi il party e i nemici.</p>');
      root.querySelectorAll('[data-act]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var act = btn.getAttribute('data-act');
          var id = btn.getAttribute('data-id');
          if (act === 'next') C.next(state);
          else if (act === 'prev') C.prev(state);
          else if (act === 'reset') state = C.create();
          else if (act === 'del') C.remove(state, id);
          else if (act === 'dmg') {
            var n = parseInt(prompt('Danno subito:', '5') || '0', 10);
            if (!isNaN(n)) C.damage(state, id, n);
          } else if (act === 'heal') {
            var h = parseInt(prompt('PF recuperati:', '5') || '0', 10);
            if (!isNaN(h)) C.heal(state, id, h);
          } else if (act === 'add' || act === 'roll') {
            var name = (root.querySelector('[data-f="name"]') || {}).value || 'Senza nome';
            var initEl = root.querySelector('[data-f="init"]');
            var hpEl = root.querySelector('[data-f="hp"]');
            if (act === 'roll') {
              var mod = parseInt(prompt('Modificatore di iniziativa:', '0') || '0', 10);
              if (initEl) initEl.value = String(C.rollInit(isNaN(mod) ? 0 : mod));
              return;
            }
            C.add(state, name, initEl ? initEl.value : 0, hpEl && hpEl.value !== '' ? hpEl.value : null);
          }
          persist();
          render();
        });
      });
    }
    render();
  };
})();
