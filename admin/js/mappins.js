/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — mappins.js
   Editor visuale puntine mappa: carica/salva da KV, click per
   aggiungere, drag per spostare, form per editare/eliminare.
   Supporta anche il cambio dell'immagine della mappa.
   ════════════════════════════════════════════════════════════════ */

var MAP_PINS = [];
var MAP_IMAGE_URL = '/mappa.webp';
var _mapFileSha = null;
var _mapDirty = false;
var _mapDragPin = null;
var _mapDragOffset = { x: 0, y: 0 };
var _mapActive = false;

var MAP_PIN_TYPES = [
  { v: 'city',    l: 'Città',       c: 'rgba(220,175,60,.95)',  g: 'rgba(220,175,60,.8)' },
  { v: 'village', l: 'Villaggio',   c: 'rgba(200,155,60,.85)',  g: 'rgba(200,155,60,.65)' },
  { v: 'fort',    l: 'Forte',       c: 'rgba(190,130,50,.85)',  g: 'rgba(190,130,50,.65)' },
  { v: 'forest',  l: 'Foresta',     c: 'rgba(60,200,80,.85)',   g: 'rgba(60,200,80,.65)' },
  { v: 'water',   l: 'Acqua',       c: 'rgba(80,160,240,.85)',  g: 'rgba(80,160,240,.65)' },
  { v: 'ruin',    l: 'Rovine',      c: 'rgba(150,80,240,.85)',  g: 'rgba(150,80,240,.7)' },
  { v: 'fog',     l: 'Nebbia',      c: 'rgba(140,100,240,.85)', g: 'rgba(140,100,240,.7)' }
];

function _mapTypeColor(type) {
  for (var i = 0; i < MAP_PIN_TYPES.length; i++) {
    if (MAP_PIN_TYPES[i].v === type) return MAP_PIN_TYPES[i].c;
  }
  return 'rgba(200,155,60,.9)';
}
function _mapTypeLabel(type) {
  for (var i = 0; i < MAP_PIN_TYPES.length; i++) {
    if (MAP_PIN_TYPES[i].v === type) return MAP_PIN_TYPES[i].l;
  }
  return type;
}
function _mapTypeOptions(selected) {
  return MAP_PIN_TYPES.map(function(t) {
    return '<option value="' + t.v + '"' + (t.v === selected ? ' selected' : '') + '>' + t.l + '</option>';
  }).join('');
}

/* ════ CARICA DA REPO ════ */
async function _loadMapPins() {
  try {
    var d = await ghGet('content/mappins.json');
    var j = JSON.parse(b64decode(d.content));
    MAP_PINS = j.pins || [];
    MAP_IMAGE_URL = j.mapImage || '/mappa.webp';
    _mapFileSha = d.sha;
    return MAP_PINS;
  } catch (e) {
    MAP_PINS = [];
    MAP_IMAGE_URL = '/mappa.webp';
    _mapFileSha = null;
    return MAP_PINS;
  }
}

/* ════ SALVA SU REPO ════ */
async function _saveMapPins() {
  var imgInput = document.getElementById('me-map-image');
  if (imgInput) MAP_IMAGE_URL = imgInput.value.trim() || '/mappa.webp';
  var payload = { mapImage: MAP_IMAGE_URL, pins: MAP_PINS };

  try {
    setStatus('saving', 'salvataggio...');
    await ghPut('content/mappins.json', 'admin: update mappins',
      JSON.stringify(payload, null, 2) + '\n', _mapFileSha);
    _mapDirty = false;
    ArcAdmin.module('core').ui.toast('Salvato nel repo — deploy in corso (~30s)', 'success');
    ArcAdmin.module('core').audit('save_mappins', 'map', { count: MAP_PINS.length });
    startDeployTimer();
    setStatus('ok', 'deploying');
    setTimeout(function() { setStatus('idle', 'pronto'); }, 2000);
  } catch (e) {
    ArcAdmin.module('core').ui.toast('Errore di rete: ' + e.message, 'error');
    setStatus('err', 'errore');
  }
}

/* ════ GENERA UN ID UNICO ════ */
function _genPinId() {
  return 'pin-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}

/* ════ RENDER MAPPA EDITOR ════ */
function openMapEditor() {
  if (_modified && !confirm('Hai modifiche non salvate. Continuare?')) return;
  _modified = false;
  _current = null;
  _mapActive = true;
  setActive('mappins');
  closeSidebar();
  setCrumb('Sito', 'Editor Mappa');
  setTitle('Mappa');
  setStatus('saving', 'caricamento mappa…');

  _loadMapPins().then(function() {
    var h = ArcAdmin.module('core').ui.viewHead('🗺️', 'Editor Mappa',
      'Puntine della mappa interattiva sulla homepage',
      '<button class="btn btn-p" onclick="_saveMapPins()" id="map-save-btn">💾 Salva</button>'
      + '<button class="btn btn-soft" onclick="openMapEditor()">⟳ Aggiorna</button>'
      + '<button class="btn btn-soft" onclick="_mapAddPin()">+ Nuova puntina</button>'
    );
    h += '<div class="panel-sub">Clicca sulla mappa per aggiungere una puntina. Trascina per spostare. Click su una puntina per editarla.</div>';

    /* Pannello immagine mappa */
    h += '<div class="panel" style="margin-bottom:16px">';
    h += '<div class="panel-head"><h3>Immagine mappa</h3><span class="hint">URL dell\'immagine di sfondo</span></div>';
    h += '<div style="display:flex;gap:10px;align-items:center">';
    h += '<input id="me-map-image" class="in" style="flex:1" value="' + escAttr(MAP_IMAGE_URL) + '" placeholder="/mappa.webp">';
    h += '<button class="btn btn-soft btn-sm" onclick="_previewMapImage()">Anteprima</button>';
    h += '<button class="btn btn-soft btn-sm" onclick="_uploadMapImage()">Carica file</button>';
    h += '<input type="file" id="me-map-file" accept="image/*" aria-label="Carica nuova immagine mappa" style="display:none" onchange="_handleMapFileUpload(this)">';
    h += '</div>';
    h += '<div id="me-map-preview" style="margin-top:10px;display:none"><img src="" style="max-width:100%;max-height:200px;border-radius:6px;border:1px solid var(--line)"></div>';
    h += '</div>';

    /* Mappa + sidebar puntine */
    h += '<div class="map-editor-wrap">';
    h += '  <div class="map-editor-container" id="map-editor-container">';
    h += '    <img src="' + escAttr(MAP_IMAGE_URL) + '" alt="Mappa" id="map-editor-img" draggable="false"/>';
    h += '    <div class="map-editor-pins" id="map-editor-pins"></div>';
    h += '  </div>';
    h += '  <div class="map-editor-sidebar" id="map-editor-sidebar">';
    h += '    <div class="mes-label">Puntine (' + MAP_PINS.length + ')</div>';
    h += '    <div class="mes-list" id="mes-list"></div>';
    h += '  </div>';
    h += '</div>';

    document.getElementById('main').innerHTML = h;

    _renderMapPins();
    _renderPinList();
    _mapBindClick();

    setStatus('ok', 'mappa caricata');
    setTimeout(function() { setStatus('idle', 'pronto'); }, 1500);
  });
}

/* ════ CAMBIA IMMAGINE MAPPA ════ */
function _previewMapImage() {
  var url = document.getElementById('me-map-image').value.trim();
  if (!url) { ArcAdmin.module('core').ui.toast('Inserisci un URL', 'error'); return; }
  var box = document.getElementById('me-map-preview');
  var img = box.querySelector('img');
  img.src = url;
  box.style.display = '';
  /* Aggiorna anche l'editor */
  var editorImg = document.getElementById('map-editor-img');
  if (editorImg) editorImg.src = url;
}

function _uploadMapImage() {
  document.getElementById('me-map-file').click();
}

async function _handleMapFileUpload(input) {
  var file = input.files[0];
  if (!file) return;
  setStatus('saving', 'caricamento immagine…');
  try {
    var dataUri = await new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() { resolve(reader.result); };
      reader.onerror = function() { reject(new Error('Lettura file fallita')); };
      reader.readAsDataURL(file);
    });
    var name = 'map-' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    await ghPutBinary('images/' + name, 'admin: upload map image ' + name, dataUri);
    var url = '/images/' + name;
    document.getElementById('me-map-image').value = url;
    var editorImg = document.getElementById('map-editor-img');
    if (editorImg) editorImg.src = url;
    ArcAdmin.module('core').ui.toast('Immagine caricata: ' + url, 'success');
  } catch (e) {
    ArcAdmin.module('core').ui.toast('Errore caricamento: ' + e.message, 'error');
  }
  setStatus('ok', 'caricato');
  setTimeout(function() { setStatus('idle', 'pronto'); }, 1500);
  input.value = '';
}

/* ════ RENDER PUNTINE SULLA MAPPA ════ */
function _renderMapPins() {
  var container = document.getElementById('map-editor-pins');
  if (!container) return;
  container.innerHTML = '';

  MAP_PINS.forEach(function(pin, idx) {
    var el = document.createElement('div');
    el.className = 'me-pin';
    el.style.left = pin.left;
    el.style.top = pin.top;
    el.style.setProperty('--pc', _mapTypeColor(pin.type));
    el.dataset.idx = idx;
    el.innerHTML = '<div class="me-pin-dot"></div><div class="me-pin-label">' + esc(pin.name) + '</div>';

    /* Drag */
    el.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      e.stopPropagation();
      _mapDragPin = el;
      var rect = el.getBoundingClientRect();
      _mapDragOffset.x = e.clientX - rect.left - rect.width / 2;
      _mapDragOffset.y = e.clientY - rect.top - rect.height / 2;
      el.classList.add('dragging');
    });
    el.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      _mapDragPin = el;
      var t = e.touches[0];
      var rect = el.getBoundingClientRect();
      _mapDragOffset.x = t.clientX - rect.left - rect.width / 2;
      _mapDragOffset.y = t.clientY - rect.top - rect.height / 2;
      el.classList.add('dragging');
    }, {passive: false});

    /* Click per editare */
    el.addEventListener('click', function(e) {
      if (el.classList.contains('was-dragged')) {
        el.classList.remove('was-dragged');
        return;
      }
      e.stopPropagation();
      _mapEditPin(idx);
    });

    container.appendChild(el);
  });
}

/* ════ DRAG & DROP ════ */
document.addEventListener('mousemove', function(e) {
  if (!_mapActive || !_mapDragPin) return;
  var container = document.getElementById('map-editor-container');
  if (!container) return;
  var imgRect = container.getBoundingClientRect();
  var x = ((e.clientX - imgRect.left - _mapDragOffset.x) / imgRect.width * 100);
  var y = ((e.clientY - imgRect.top - _mapDragOffset.y) / imgRect.height * 100);
  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));
  _mapDragPin.style.left = x.toFixed(2) + '%';
  _mapDragPin.style.top = y.toFixed(2) + '%';
});
document.addEventListener('touchmove', function(e) {
  if (!_mapActive || !_mapDragPin || e.touches.length !== 1) return;
  e.preventDefault();
  var container = document.getElementById('map-editor-container');
  if (!container) return;
  var t = e.touches[0];
  var imgRect = container.getBoundingClientRect();
  var x = ((t.clientX - imgRect.left - _mapDragOffset.x) / imgRect.width * 100);
  var y = ((t.clientY - imgRect.top - _mapDragOffset.y) / imgRect.height * 100);
  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));
  _mapDragPin.style.left = x.toFixed(2) + '%';
  _mapDragPin.style.top = y.toFixed(2) + '%';
}, {passive: false});

document.addEventListener('mouseup', function() {
  if (_mapActive) _mapEndDrag();
});
document.addEventListener('touchend', function() {
  if (_mapActive) _mapEndDrag();
});
function _mapEndDrag() {
  if (!_mapDragPin) return;
  var idx = parseInt(_mapDragPin.dataset.idx, 10);
  if (!isNaN(idx) && MAP_PINS[idx]) {
    MAP_PINS[idx].left = _mapDragPin.style.left;
    MAP_PINS[idx].top = _mapDragPin.style.top;
    _mapDirty = true;
    _mapDragPin.classList.remove('dragging');
    _mapDragPin.classList.add('was-dragged');
    var ref = _mapDragPin;
    _mapDragPin = null;
    setTimeout(function() { ref.classList.remove('was-dragged'); }, 50);
    _renderPinList();
  } else {
    _mapDragPin = null;
  }
}

/* ════ CLICK SULLA MAPPA PER AGGIUNGERE ════ */
function _mapBindClick() {
  var container = document.getElementById('map-editor-container');
  if (!container) return;
  container.addEventListener('click', function(e) {
    if (e.target.closest('.me-pin')) return;
    var rect = container.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width * 100);
    var y = ((e.clientY - rect.top) / rect.height * 100);
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    _mapAddPinAt(x, y);
  });
}

/* ════ AGGIUNGI PUNTINA ════ */
function _mapAddPin() {
  _mapAddPinAt(50, 50);
}

function _mapAddPinAt(x, y) {
  var pin = {
    id: _genPinId(),
    left: x.toFixed(2) + '%',
    top: y.toFixed(2) + '%',
    type: 'village',
    name: 'Nuova puntina',
    desc: '',
    explored: false,
    sub: '',
    pageId: ''
  };
  MAP_PINS.push(pin);
  _mapDirty = true;
  _renderMapPins();
  _renderPinList();
  _mapEditPin(MAP_PINS.length - 1);
  ArcAdmin.module('core').ui.toast('Puntina aggiunta — modifica i dettagli', 'success');
}

/* ════ RENDER LISTA PUNTINE ════ */
function _renderPinList() {
  var list = document.getElementById('mes-list');
  if (!list) return;
  if (!MAP_PINS.length) {
    list.innerHTML = '<div class="empty" style="padding:20px"><span class="ei">📍</span>Nessuna puntina</div>';
    return;
  }
  list.innerHTML = MAP_PINS.map(function(pin, idx) {
    return '<div class="mes-item' + (_mapDirty ? ' dirty' : '') + '" onclick="_mapEditPin(' + idx + ')">'
      + '<div class="mes-dot" style="background:' + esc(_mapTypeColor(pin.type)) + '"></div>'
      + '<div class="mes-info"><div class="mes-name">' + esc(pin.name) + '</div>'
      + '<div class="mes-meta">' + _mapTypeLabel(pin.type) + ' · ' + esc(pin.left) + ', ' + esc(pin.top) + '</div></div>'
      + '</div>';
  }).join('');
}

/* ════ EDITA PUNTINA ════ */
function _mapEditPin(idx) {
  var pin = MAP_PINS[idx];
  if (!pin) return;

  var body = '<div class="map-edit-form">'
    + '<div class="grid-2">'
    + '<div class="fld"><label>Nome</label><input id="mef-name" class="in" value="' + escAttr(pin.name) + '"></div>'
    + '<div class="fld"><label>Tipo</label><select id="mef-type" class="in">' + _mapTypeOptions(pin.type) + '</select></div>'
    + '</div>'
    + '<div class="fld"><label>Descrizione</label><textarea id="mef-desc" class="in" rows="2" style="resize:vertical">' + esc(pin.desc) + '</textarea></div>'
    + '<div class="grid-2">'
    + '<div class="fld"><label>Posizione X</label><input id="mef-left" class="in" value="' + escAttr(pin.left) + '"></div>'
    + '<div class="fld"><label>Posizione Y</label><input id="mef-top" class="in" value="' + escAttr(pin.top) + '"></div>'
    + '</div>'
    + '<div class="grid-2">'
    + '<div class="fld"><label>Sub-mappa</label><input id="mef-sub" class="in" placeholder="foglia, smari…" value="' + escAttr(pin.sub || '') + '"></div>'
    + '<div class="fld"><label>ID pagina wiki</label><input id="mef-pageid" class="in" placeholder="es. pag-arcamis" value="' + escAttr(pin.pageId || '') + '"></div>'
    + '</div>'
    + '<div class="fld"><label><input type="checkbox" id="mef-explored"' + (pin.explored ? ' checked' : '') + '> Esplorata</label></div>'
    + '</div>';

  var id = 'mef-modal';
  if (document.getElementById(id)) document.getElementById(id).remove();

  var actions = '<button class="btn btn-d" onclick="_mapDeletePin(' + idx + ')">🗑 Elimina</button>'
    + '<div style="flex:1"></div>'
    + '<button class="btn btn-soft" onclick="closeModal(\'' + id + '\')">Annulla</button>'
    + '<button class="btn btn-p" onclick="_mapSavePin(' + idx + ')">Salva</button>';

  var modal = ArcAdmin.module('core').ui.modal(id, '📍 ' + pin.name, body, actions);

  var typeSelect = document.getElementById('mef-type');
  if (typeSelect) {
    typeSelect.addEventListener('change', function() {
      var dot = modal.querySelector('.md-head');
      if (dot) dot.style.borderBottomColor = _mapTypeColor(typeSelect.value);
    });
  }
}

function _mapSavePin(idx) {
  var pin = MAP_PINS[idx];
  if (!pin) return;

  var name = document.getElementById('mef-name').value.trim();
  var type = document.getElementById('mef-type').value;
  var desc = document.getElementById('mef-desc').value.trim();
  var left = document.getElementById('mef-left').value.trim();
  var top = document.getElementById('mef-top').value.trim();
  var sub = document.getElementById('mef-sub').value.trim();
  var pageId = document.getElementById('mef-pageid').value.trim();
  var explored = document.getElementById('mef-explored').checked;

  if (!name) {
    ArcAdmin.module('core').ui.toast('Il nome è obbligatorio', 'error');
    return;
  }

  pin.name = name;
  pin.type = type;
  pin.desc = desc;
  pin.left = left;
  pin.top = top;
  pin.sub = sub;
  pin.pageId = pageId;
  pin.explored = explored;

  _mapDirty = true;
  _renderMapPins();
  _renderPinList();
  closeModal('mef-modal');
  ArcAdmin.module('core').ui.toast('Puntina aggiornata — ricorda di salvare', 'success');
}

function _mapDeletePin(idx) {
  if (!confirm('Eliminare questa puntina?')) return;
  MAP_PINS.splice(idx, 1);
  _mapDirty = true;
  _renderMapPins();
  _renderPinList();
  closeModal('mef-modal');
  ArcAdmin.module('core').ui.toast('Puntina eliminata — ricorda di salvare', 'success');
}
