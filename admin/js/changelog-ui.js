/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — changelog-ui.js
   Gestione del changelog del sito (content/changelog.json):
   lista versioni, aggiunta/modifica/eliminazione entry.
   ════════════════════════════════════════════════════════════════ */

var _clData = [];
var _clSha = null;
var _clEditIdx = -1;

async function openChangelog(){
  if(_modified && !confirm('Hai modifiche non salvate. Continuare?')) return;
  _modified = false;
  _current = null;
  setActive('changelog');
  closeSidebar();
  setCrumb('Sito', 'Changelog');
  setTitle('Changelog');
  setStatus('saving', 'caricamento…');
  try {
    var d = await ghGet('content/changelog.json');
    _clSha = d.sha;
    _clData = JSON.parse(b64decode(d.content));
    if(!Array.isArray(_clData)) _clData = [];
  } catch(e) {
    _clData = []; _clSha = null;
    toast('Changelog vuoto o non leggibile: ' + e.message, 'error');
  }

  var h = ArcAdmin.module('core').ui.viewHead('📝', 'Changelog',
    'Cronologia aggiornamenti visibile nella pagina Changelog del sito',
    '<button class="btn btn-p" onclick="_clEdit(-1)">+ Nuova entry</button>'
    + '<button class="btn btn-soft" onclick="openChangelog()">⟳ Aggiorna</button>'
  );
  h += '<div class="panel-sub" style="margin-bottom:10px">Le versioni sono raggruppate per Versione → Sottoversione → Patch. Il contenuto è Markdown.</div>';
  h += '<div class="panel"><div class="panel-head"><h3>Entry (' + _clData.length + ')</h3><span class="hint">ordinate per versione crescente nel sito</span></div>';

  if(!_clData.length){
    h += '<div class="empty"><span class="ei">📭</span>Nessuna entry — creane la prima</div>';
  } else {
    var sorted = _clData.map(function(e,i){ e._i = i; return e; })
      .sort(function(a,b){ return String(b.versione+'.'+b.sottoversione).localeCompare(String(a.versione+'.'+a.sottoversione), undefined, {numeric:true}); });
    h += '<div style="padding:6px 12px 12px">';
    sorted.forEach(function(e){
      var hasContent = !!(e.content && e.content.trim());
      h += '<div class="row" style="border-bottom:1px solid var(--line)">'
        + '<div class="rico">' + esc(_clVersionBadge(e)) + '</div>'
        + '<div class="rmain"><div class="rt">' + esc(e.title || '(senza titolo)') + '</div>'
        + '<div class="rs">v' + esc([e.versione, e.sottoversione, e.patch].filter(Boolean).join('.')) + ' · ' + esc(e.date || 'senza data') + ' · ' + (hasContent ? '✓ contenuto' : '⚠ senza contenuto') + '</div></div>'
        + '<div class="ract">'
        + '<button class="btn btn-soft btn-sm" onclick="_clEdit(' + e._i + ')">✎</button>'
        + '<button class="btn btn-d btn-sm" onclick="_clDelete(' + e._i + ')">🗑</button>'
        + '</div></div>';
    });
    h += '</div>';
  }
  h += '</div>';
  document.getElementById('main').innerHTML = h;
  setStatus('ok', 'caricato');
  setTimeout(function(){ setStatus('idle', 'pronto'); }, 1200);
}

function _clVersionBadge(e){
  if(e.patch) return '🩹';
  if(e.sottoversione) return '📦';
  return '🏷️';
}

function _clEdit(idx){
  _clEditIdx = idx;
  var e = idx >= 0 ? (_clData[idx] || {}) : { versione:'', sottoversione:'', patch:'', title:'', date:new Date().toISOString().slice(0,10), content:'' };
  var body = '<div class="map-edit-form">'
    + '<div class="grid-3">'
    + '<div class="fld"><label>Versione *</label><input id="clf-v" class="in" value="' + escAttr(e.versione || '') + '" placeholder="1"></div>'
    + '<div class="fld"><label>Sottoversione</label><input id="clf-sv" class="in" value="' + escAttr(e.sottoversione || '') + '" placeholder="0"></div>'
    + '<div class="fld"><label>Patch</label><input id="clf-p" class="in" value="' + escAttr(e.patch || '') + '" placeholder="1"></div>'
    + '</div>'
    + '<div class="grid-2">'
    + '<div class="fld"><label>Titolo *</label><input id="clf-t" class="in" value="' + escAttr(e.title || '') + '" placeholder="Titolo dell\'aggiornamento"></div>'
    + '<div class="fld"><label>Data</label><input id="clf-d" type="date" class="in" value="' + escAttr(e.date || '') + '"></div>'
    + '</div>'
    + '<div class="fld"><label>Contenuto (Markdown)</label><textarea id="clf-c" class="in" rows="10" style="font-family:var(--mono);font-size:12px;resize:vertical" placeholder="- Aggiunta nuova regola&#10;- Fix meccanica…">' + esc(e.content || '') + '</textarea></div>'
    + '</div>';
  var actions = (idx >= 0 ? '<button class="btn btn-d" onclick="_clDelete(' + idx + ')">🗑 Elimina</button><div style="flex:1"></div>' : '<div style="flex:1"></div>')
    + '<button class="btn btn-soft" onclick="closeModal(\'clf-modal\')">Annulla</button>'
    + '<button class="btn btn-p" onclick="_clSave()">💾 Salva</button>';
  modalHtml('clf-modal', idx >= 0 ? '✎ Entry v' + [e.versione, e.sottoversione, e.patch].filter(Boolean).join('.') : '➕ Nuova entry', body, actions, 'md-wide');
}

async function _clSave(){
  var versione = document.getElementById('clf-v').value.trim();
  var title = document.getElementById('clf-t').value.trim();
  if(!versione){ toast('La versione è obbligatoria', 'error'); return; }
  if(!title){ toast('Il titolo è obbligatorio', 'error'); return; }
  var entry = {
    id: _clEditIdx >= 0 && _clData[_clEditIdx] ? _clData[_clEditIdx].id : ('local-' + Date.now().toString(36)),
    title: title,
    versione: versione,
    sottoversione: document.getElementById('clf-sv').value.trim() || null,
    patch: document.getElementById('clf-p').value.trim() || null,
    date: document.getElementById('clf-d').value.trim() || null,
    content: document.getElementById('clf-c').value
  };
  if(_clEditIdx >= 0) _clData[_clEditIdx] = entry;
  else _clData.push(entry);
  await _clPersist(_clEditIdx >= 0 ? 'update' : 'create');
  closeModal('clf-modal');
  openChangelog();
}

async function _clDelete(idx){
  if(!(await uiConfirm('Eliminare l\'entry "' + (_clData[idx].title || '') + '"?', {ok:'Elimina'}))) return;
  _clData.splice(idx, 1);
  await _clPersist('delete');
  openChangelog();
}

async function _clPersist(what){
  setStatus('saving', 'salvataggio…');
  try {
    await ghPut('content/changelog.json', 'admin: ' + what + ' changelog entry',
      JSON.stringify(_clData, null, 2) + '\n', _clSha);
    toast('Changelog salvato! Deploy in corso (~30s)…', 'success');
    startDeployTimer();
    await _logAudit('save_changelog', what, { entries: _clData.length });
  } catch(e) {
    setStatus('err', 'errore');
    toast('Errore salvataggio: ' + e.message, 'error');
  }
}
