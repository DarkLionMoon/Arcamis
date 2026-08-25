/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — ui-editor.js
   Gestione interfaccia mobile e desktop: barra inferiore,
   ricerca drawer, anteprima live. Salva su registry.json (chiave ui).
   ════════════════════════════════════════════════════════════════ */

var _uiCfg = null;
var _uiSha = null;
var _uiDirty = false;

var UI_ACTIONS = [
  { v: 'home',    l: 'Home' },
  { v: 'drawer',  l: 'Esplora (apri menu)' },
  { v: 'options', l: 'Opzioni' },
  { v: 'page',    l: 'Pagina wiki…' },
  { v: 'url',     l: 'Link esterno…' }
];

function _uiDefaults(){
  return {
    bottomNav: [
      { icon: '🏰', label: 'Home',    action: 'home' },
      { icon: '🧭', label: 'Esplora', action: 'drawer' },
      { icon: '💼', label: 'Lavori',  action: 'page', target: 'pag-lavori' },
      { icon: '⚙️', label: 'Opzioni', action: 'options' }
    ],
    drawerSearch: true
  };
}

async function openInterfaceUI(){
  if(_modified && !confirm('Hai modifiche non salvate. Continuare?')) return;
  _modified = false;
  _current = null;
  setActive('interface');
  closeSidebar();
  setCrumb('Sito', 'Interfaccia');
  setTitle('Interfaccia mobile & desktop');
  setStatus('saving', 'caricamento configurazione…');

  try {
    var d = await ghGet('content/pages/registry.json');
    var reg = JSON.parse(b64decode(d.content));
    _uiSha = d.sha;
    _uiCfg = reg.ui || _uiDefaults();
    if(!Array.isArray(_uiCfg.bottomNav)) _uiCfg.bottomNav = _uiDefaults().bottomNav;
  } catch(e) {
    setStatus('err', 'errore');
    toast('Errore caricamento: ' + e.message, 'error');
    return;
  }

  var h = ArcAdmin.module('core').ui.viewHead('📱', 'Interfaccia mobile & desktop',
    'Barra di navigazione inferiore (mobile) e opzioni del menu',
    '<button class="btn btn-p" onclick="_uiSave()" id="ui-save-btn">💾 Salva e pubblica</button>'
    + '<button class="btn btn-soft" onclick="openInterfaceUI()">⟳ Aggiorna</button>'
  );

  /* ── Barra inferiore ── */
  h += '<div class="panel" style="margin-bottom:16px">';
  h += '<div class="panel-head"><h3>Barra inferiore (mobile)</h3><span class="hint">Max 5 voci · visibile solo su mobile</span></div>';
  h += '<div class="panel-sub">Trascina o usa le frecce per riordinare. "Pagina wiki…" collega una voce a una pagina del sito.</div>';
  h += '<div id="ui-bn-preview" style="margin:14px 0"></div>';
  h += '<div id="ui-bn-rows"></div>';
  h += '<button class="btn btn-soft btn-sm" onclick="_uiAddSlot()" id="ui-add-slot">+ Aggiungi voce</button>';
  h += '</div>';

  /* ── Drawer ── */
  h += '<div class="panel" style="margin-bottom:16px">';
  h += '<div class="panel-head"><h3>Menu Esplora (mobile)</h3><span class="hint">Drawer a discesa</span></div>';
  h += '<div class="fld"><label><input type="checkbox" id="ui-drawer-search"' + (_uiCfg.drawerSearch !== false ? ' checked' : '') + '> Mostra la ricerca nel menu</label></div>';
  h += '<div class="panel-sub">Le sezioni e le voci del menu si gestiscono da <b>Navigazione</b> (sezioni e assegnazione pagine).</div>';
  h += '</div>';

  /* ── Anteprima sito con toggle dispositivo ── */
  h += '<div class="panel" style="margin-bottom:16px">';
  h += '<div class="panel-head"><h3>Anteprima sito</h3>'
    + '<span style="display:flex;gap:6px;align-items:center">'
    + '<button class="btn btn-soft btn-sm" id="ui-prev-m" onclick="_uiPrevDevice(390)">📱 Mobile</button>'
    + '<button class="btn btn-soft btn-sm" id="ui-prev-t" onclick="_uiPrevDevice(820)">📲 Tablet</button>'
    + '<button class="btn btn-soft btn-sm" id="ui-prev-d" onclick="_uiPrevDevice(0)">🖥️ Desktop</button>'
    + '<button class="btn btn-soft btn-sm" onclick="_uiPrevReload()">⟳</button></span></div>';
  h += '<div class="panel-sub">Caricata dopo il deploy (~30s dal salvataggio). Le modifiche alla barra si vedono a fine deploy.</div>';
  h += '<div style="background:#0b0d16;border:1px solid var(--line);border-radius:10px;padding:10px;overflow:auto;text-align:center">'
    + '<iframe id="ui-preview-frame" src="https://arcamis.pages.dev" style="width:100%;height:560px;border:1px solid var(--line);border-radius:8px;background:#fff" title="Anteprima sito"></iframe>'
    + '</div></div>';

  document.getElementById('main').innerHTML = h;
  _uiRenderRows();
  _uiRenderPreview();
  _uiPrevDevice(390);
  setStatus('ok', 'caricato');
  setTimeout(function(){ setStatus('idle', 'pronto'); }, 1200);
}

function _uiActionOptions(sel){
  return UI_ACTIONS.map(function(a){
    return '<option value="' + a.v + '"' + (a.v === sel ? ' selected' : '') + '>' + a.l + '</option>';
  }).join('');
}

function _uiPageOptions(sel){
  var opts = '<option value="">— scegli pagina —</option>';
  (window.ArcAdmin.pages || []).forEach(function(p){
    opts += '<option value="' + escAttr(p.id) + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.i + ' ' + p.l) + '</option>';
  });
  return opts;
}

function _uiRenderRows(){
  var wrap = document.getElementById('ui-bn-rows');
  if(!wrap) return;
  var h = '';
  _uiCfg.bottomNav.forEach(function(item, i){
    var isPage = item.action === 'page';
    var isUrl = item.action === 'url';
    h += '<div class="kv-row ui-row" data-i="' + i + '" style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">'
      + '<span style="cursor:grab;color:var(--dim);font-size:14px">⠿</span>'
      + '<input class="in ui-f-icon" style="width:52px;text-align:center;font-size:18px" value="' + escAttr(item.icon || '') + '" maxlength="4" title="Icona (emoji)" onchange="_uiField(' + i + ',\'icon\',this.value)">'
      + '<input class="in ui-f-label" style="flex:1;min-width:90px" value="' + escAttr(item.label || '') + '" placeholder="Etichetta" maxlength="12" onchange="_uiField(' + i + ',\'label\',this.value)">'
      + '<select class="in ui-f-action" style="width:170px" onchange="_uiField(' + i + ',\'action\',this.value);_uiRenderRows();_uiRenderPreview()">' + _uiActionOptions(item.action) + '</select>'
      + (isPage ? '<select class="in" style="flex:1;min-width:140px" onchange="_uiField(' + i + ',\'target\',this.value)">' + _uiPageOptions(item.target) + '</select>' : '')
      + (isUrl ? '<input class="in" style="flex:1;min-width:140px" placeholder="https://…" value="' + escAttr(item.target || '') + '" onchange="_uiField(' + i + ',\'target\',this.value)">' : '')
      + '<button class="btn btn-soft btn-sm" title="Su" onclick="_uiMove(' + i + ',-1)">↑</button>'
      + '<button class="btn btn-soft btn-sm" title="Giù" onclick="_uiMove(' + i + ',1)">↓</button>'
      + '<button class="btn btn-d btn-sm" title="Elimina" onclick="_uiDel(' + i + ')">✕</button>'
      + '</div>';
  });
  if(!_uiCfg.bottomNav.length){
    h = '<div class="empty" style="padding:18px"><span class="ei">📭</span>Nessuna voce — aggiungine almeno una</div>';
  }
  wrap.innerHTML = h;
  _uiBindDrag();
  var addBtn = document.getElementById('ui-add-slot');
  if(addBtn) addBtn.style.display = _uiCfg.bottomNav.length >= 5 ? 'none' : '';
}

function _uiRenderPreview(){
  var box = document.getElementById('ui-bn-preview');
  if(!box) return;
  var cells = _uiCfg.bottomNav.map(function(item, i){
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 0;'
      + (i === 0 ? 'color:#c89b3c;' : 'color:rgba(200,155,60,.45);') + '">'
      + '<span style="font-size:17px">' + esc(item.icon || '📄') + '</span>'
      + '<span style="font-family:Cinzel,serif;font-size:7.5px;letter-spacing:.05em;text-transform:uppercase">' + esc(item.label || '') + '</span>'
      + '</div>';
  }).join('');
  box.innerHTML = '<div style="background:#04050e;border:1px solid rgba(200,155,60,.25);border-radius:10px;display:grid;grid-template-columns:repeat('
    + Math.max(_uiCfg.bottomNav.length, 1) + ',1fr);overflow:hidden">'
    + cells + '</div>';
}

function _uiField(i, key, val){
  if(!_uiCfg.bottomNav[i]) return;
  _uiCfg.bottomNav[i][key] = val;
  _uiDirty = true;
  if(key !== 'target') _uiRenderPreview();
}

function _uiMove(i, dir){
  var t = i + dir;
  if(t < 0 || t >= _uiCfg.bottomNav.length) return;
  var arr = _uiCfg.bottomNav;
  var tmp = arr[i]; arr[i] = arr[t]; arr[t] = tmp;
  _uiDirty = true;
  _uiRenderRows();
  _uiRenderPreview();
}

async function _uiDel(i){
  if(!(await uiConfirm('Eliminare la voce "' + (_uiCfg.bottomNav[i].label || '') + '"?', {ok:'Elimina'}))) return;
  _uiCfg.bottomNav.splice(i, 1);
  _uiDirty = true;
  _uiRenderRows();
  _uiRenderPreview();
}

function _uiAddSlot(){
  if(_uiCfg.bottomNav.length >= 5){ toast('Massimo 5 voci', 'error'); return; }
  _uiCfg.bottomNav.push({ icon: '📄', label: 'Nuova', action: 'home' });
  _uiDirty = true;
  _uiRenderRows();
  _uiRenderPreview();
}

/* Riordino drag & drop */
function _uiBindDrag(){
  var rows = document.querySelectorAll('#ui-bn-rows .ui-row');
  var dragIdx = null;
  rows.forEach(function(row){
    row.addEventListener('mousedown', function(e){
      if(e.target.closest('input,select,button')) return;
      dragIdx = parseInt(row.dataset.i, 10);
      row.style.opacity = '.5';
    });
    row.addEventListener('mouseup', function(){ if(dragIdx !== null){ row.style.opacity = ''; } });
  });
  document.addEventListener('mouseup', function(){
    document.querySelectorAll('#ui-bn-rows .ui-row').forEach(function(r){ r.style.opacity = ''; });
    dragIdx = null;
  });
  rows.forEach(function(row){
    row.addEventListener('mousemove', function(e){
      if(dragIdx === null) return;
      var rect = row.getBoundingClientRect();
      if(e.clientY < rect.top + rect.height / 2){
        var to = parseInt(row.dataset.i, 10);
        if(to !== dragIdx){ _uiDragTo(dragIdx, to); dragIdx = to; }
      }
    });
  });
}
function _uiDragTo(from, to){
  var arr = _uiCfg.bottomNav;
  var item = arr.splice(from, 1)[0];
  arr.splice(to, 0, item);
  _uiDirty = true;
  _uiRenderRows();
  _uiRenderPreview();
}

async function _uiSave(){
  if(!_uiCfg || !_uiCfg.bottomNav.length){ toast('Aggiungi almeno una voce alla barra', 'error'); return; }
  /* validazione: azioni page richiedono target */
  for(var i = 0; i < _uiCfg.bottomNav.length; i++){
    var it = _uiCfg.bottomNav[i];
    if(it.action === 'page' && !it.target){
      toast('Voce "' + (it.label || (i + 1)) + '": scegli una pagina', 'error');
      return;
    }
    if(!it.label){ it.label = it.action === 'home' ? 'Home' : 'Voce'; }
  }
  var ds = document.getElementById('ui-drawer-search');
  _uiCfg.drawerSearch = ds ? ds.checked : true;

  setStatus('saving', 'salvataggio…');
  try {
    var d = await ghGet('content/pages/registry.json');
    var reg = JSON.parse(b64decode(d.content));
    reg.ui = _uiCfg;
    await ghPut('content/pages/registry.json', 'admin: update interfaccia',
      JSON.stringify(reg, null, 2) + '\n', d.sha);
    _uiSha = d.sha;
    _uiDirty = false;
    toast('Interfaccia salvata! Deploy in corso (~30s)…', 'success');
    startDeployTimer();
    await _logAudit('save_ui', 'bottomnav', { slots: _uiCfg.bottomNav.length });
    setStatus('ok', 'deploying…');
    setTimeout(function(){ setStatus('idle', 'pronto'); }, 2500);
  } catch(e) {
    setStatus('err', 'errore');
    toast('Errore salvataggio: ' + e.message, 'error');
  }
}


/* ════ ANTEPRIMA DISPOSITIVO ════ */
function _uiPrevDevice(w){
  var f=document.getElementById('ui-preview-frame');
  if(!f) return;
  f.style.width = w ? w+'px' : '100%';
  f.style.maxWidth = '100%';
  var map={m:390,t:820,d:0};
  Object.keys(map).forEach(function(k){
    var b=document.getElementById('ui-prev-'+k);
    if(b) b.classList.toggle('btn-p', map[k]===w);
  });
}
function _uiPrevReload(){
  var f=document.getElementById('ui-preview-frame');
  if(f){ var src=f.src; f.src='about:blank'; setTimeout(function(){ f.src=src; },80); }
}
function _uiPrevReload(){
  var f=document.getElementById('ui-preview-frame');
  if(f){ var src=f.src; f.src='about:blank'; setTimeout(function(){ f.src=src; },80); }
}
