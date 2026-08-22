/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — schede.js
   Gestione della sezione "Scheda PG" (/schede/):
   - abilitazione/disabilitazione voce di menu + testo introduttivo
   - elenco personaggi salvati (D1) con apertura ed eliminazione
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escJs(s) {
    return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  async function api(path, opts) {
    var r = await fetch('/api/schede/' + path, Object.assign({ credentials: 'include' }, opts));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  window.openSchede = async function () {
    closeSidebar();
    setCrumb('Schede PG');
    var m = document.getElementById('main');
    m.innerHTML =
      '<div style="max-width:900px;margin:0 auto;padding:24px">' +
      '<div class="panel"><div class="panel-head"><h3>⚔️ Sezione Scheda PG</h3>' +
      '<span class="hint">/schede/ · database D1</span></div>' +
      '<label class="fld" style="margin-bottom:12px"><span>Voce &laquo;Crea &amp; Gestisci PG&raquo; visibile nel menu del sito</span>' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--txt)">' +
      '<input type="checkbox" id="sc-attiva" style="width:auto"> Sezione abilitata</label></label>' +
      '<div class="fld" style="margin-bottom:14px"><span>Testo introduttivo</span>' +
      '<textarea id="sc-intro" class="in" rows="2" placeholder="Descrizione mostrata nella sezione"></textarea></div>' +
      '<button class="btn btn-p" onclick="saveSchedeConfig()">💾 SALVA IMPOSTAZIONI</button>' +
      '<div id="sc-msg" style="margin-top:10px"></div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Personaggi salvati</h3>' +
      '<span class="hint" id="sc-count"></span></div>' +
      '<div id="sc-list"><p class="hint">Caricamento…</p></div>' +
      '</div></div>';

    try {
      var cfg = await api('config');
      document.getElementById('sc-attiva').checked = !!cfg.abilitata;
      document.getElementById('sc-intro').value = cfg.intro || '';
    } catch (e) {
      scMsg('Impossibile leggere la configurazione (' + esc(e.message) + ')', true);
    }
    loadSchedeList();
  };

  function scMsg(t, err) {
    var el = document.getElementById('sc-msg');
    if (!el) return;
    el.innerHTML = t
      ? '<p style="font-size:12.5px;margin-top:6px;color:' + (err ? 'var(--red)' : 'var(--grn)') + '">' + t + '</p>'
      : '';
  }

  async function loadSchedeList() {
    var box = document.getElementById('sc-list');
    if (!box) return;
    try {
      var lista = await api('characters');
      document.getElementById('sc-count').textContent = lista.length ? lista.length + ' personaggi' : 'nessun personaggio';
      if (!lista.length) {
        box.innerHTML = '<p class="hint">Nessun personaggio salvato.</p>';
        return;
      }
      var h = '<div class="tbl-wrap"><table><thead><tr><th>Nome</th><th>Specie</th><th>Classi</th><th>Aggiornato</th><th style="text-align:right">Azioni</th></tr></thead><tbody>';
      lista.forEach(function (p) {
        var cls = (p.classi || [])
          .map(function (c) { return c.classe + ' ' + c.livello; })
          .join(', ');
        h +=
          '<tr>' +
          '<td><strong>' + esc(p.nome) + '</strong></td>' +
          '<td>' + esc(p.specie || '') + '</td>' +
          '<td>' + esc(cls) + '</td>' +
          '<td class="hint">' + esc(String(p.aggiornatoIl || '').slice(0, 16)) + '</td>' +
          '<td style="white-space:nowrap;text-align:right">' +
          '<a class="btn btn-soft btn-sm" href="/schede/pg/' + encodeURIComponent(p.id) + '" target="_blank" rel="noopener" title="Apri scheda">👁️</a> ' +
          '<button class="btn btn-d btn-sm" onclick="delSchedaPg(\'' + escJs(p.id) + '\',\'' + escJs(p.nome) + '\')" title="Elimina">🗑️</button>' +
          '</td></tr>';
      });
      h += '</tbody></table></div>';
      box.innerHTML = h;
    } catch (e) {
      box.innerHTML =
        '<p class="hint">Errore di caricamento (' + esc(e.message) + '). Verifica il binding D1 <code>DB</code> e lo schema in <code>schede-schema.sql</code>.</p>';
    }
  }

  window.saveSchedeConfig = async function () {
    try {
      var r = await fetch('/api/schede/config', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          abilitata: document.getElementById('sc-attiva').checked,
          intro: document.getElementById('sc-intro').value
        })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      scMsg('Impostazioni salvate ✓');
      toast('Schede PG: impostazioni salvate', 'success');
    } catch (e) {
      scMsg('Salvataggio fallito: ' + esc(e.message), true);
    }
  };

  window.delSchedaPg = async function (id, nome) {
    if (!confirm('Eliminare definitivamente il personaggio "' + nome + '"?')) return;
    try {
      var r = await fetch('/api/schede/characters/' + encodeURIComponent(id), {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      toast('Personaggio eliminato', 'success');
      loadSchedeList();
    } catch (e) {
      alert('Eliminazione fallita: ' + e.message);
    }
  };

  ArcAdmin.register('schede', {
    open: openSchede,
    saveConfig: saveSchedeConfig,
    delPg: delSchedaPg
  });
})();
