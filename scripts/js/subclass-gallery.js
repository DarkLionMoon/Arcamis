var HB_SUBCLASS_DB_ID = '2f70274fdc1c80e3bdc7f95f81eb9cc0';

/* ════════════════════════════════════
   SUBCLASS GALLERY
   Layout: sidebar classi | tab bar sottoclassi | contenuto
════════════════════════════════════ */

window.loadSubclassGallery = function(container, pages) {
  if (pages && pages.length) {
    _renderHbLayout(container, pages);
    return;
  }
  container.innerHTML = '<div class="loader-dots">...';
  fetch('/api/notion?dbId=' + HB_SUBCLASS_DB_ID)
    .then(function(r){ return r.json(); })
    .then(function(data){ _renderHbLayout(container, data.pages || []); })
    .catch(function(err){
      container.innerHTML = '<p class="sec-p">Errore nel risveglio delle pergamene.</p>';
      console.error(err);
    });
};

function _renderHbLayout(container, pages) {
  /* ── Raggruppa per classe, ordina classi e sottoclassi ── */
  var grouped = {};
  pages.forEach(function(p){
    var cl = p.classe || 'Altra';
    if(!grouped[cl]) grouped[cl] = [];
    grouped[cl].push(p);
  });
  var classi = Object.keys(grouped).sort(function(a,b){ return a.localeCompare(b,'it'); });
  classi.forEach(function(cl){
    grouped[cl].sort(function(a,b){ return a.title.localeCompare(b.title,'it'); });
  });

  /* ── Struttura HTML ── */
  var sidebarItems = classi.map(function(cl){
    return '<li class="hbsc-class-item" data-classe="'+cl+'" onclick="hbscSelectClass(this,\''+cl+'\')">'+cl+'</li>';
  }).join('');

  container.innerHTML =
    '<div class="hbsc-layout">'+
      '<aside class="hbsc-sidebar">'+
        '<div class="hbsc-sidebar-title">Classi</div>'+
        '<ul class="hbsc-class-list">'+sidebarItems+'</ul>'+
      '</aside>'+
      '<div class="hbsc-main">'+
        '<div class="hbsc-tabs" id="hbsc-tabs"></div>'+
        '<div class="hbsc-content" id="hbsc-content">'+
          '<div class="hbsc-placeholder">← Seleziona una classe</div>'+
        '</div>'+
      '</div>'+
    '</div>';
    /* ── Salva i dati sul layout ── */
  var layout = container.querySelector('.hbsc-layout');
  if(layout) layout._hbscData = grouped;

  /* ── Seleziona la prima classe automaticamente ── */
  if(classi.length){
    var firstItem = container.querySelector('.hbsc-class-item');
    if(firstItem) hbscSelectClass(firstItem, classi[0]);
  }

  /* ── Salva i dati raggruppati nel container per accesso globale ── */
  container._hbscData = grouped;

  /* ── Seleziona la prima classe automaticamente ── */
  if(classi.length){
    var firstItem = container.querySelector('.hbsc-class-item');
    if(firstItem) hbscSelectClass(firstItem, classi[0]);
  }

  _injectHbscCSS();
}

window.hbscSelectClass = function(el, classe) {
  /* Aggiorna sidebar active */
  document.querySelectorAll('.hbsc-class-item').forEach(function(i){ i.classList.remove('active'); });
  el.classList.add('active');

  /* Trova i dati */
  var container = el.closest('.hbsc-layout').parentElement;
  if(!container || !container._hbscData) return;
  var sottoclassi = container._hbscData[classe] || [];

  /* Renderizza tab bar */
  var tabsEl = document.getElementById('hbsc-tabs');
  var contentEl = document.getElementById('hbsc-content');
  if(!tabsEl || !contentEl) return;

  tabsEl.innerHTML = sottoclassi.map(function(p, i){
    var titleSafe = p.title.replace(/'/g, "\\'");
    return '<div class="hbsc-tab" data-id="'+p.id+'" data-title="'+titleSafe+'" onclick="hbscSelectTab(this,\''+p.id+'\',\''+titleSafe+'\')">'+p.title+'</div>';
  }).join('');

  contentEl.innerHTML = '<div class="hbsc-placeholder">↑ Seleziona una sottoclasse</div>';

  /* Seleziona automaticamente la prima tab */
  if(sottoclassi.length){
    var firstTab = tabsEl.querySelector('.hbsc-tab');
    if(firstTab) hbscSelectTab(firstTab, sottoclassi[0].id, sottoclassi[0].title);
  }
};

window.hbscSelectTab = function(el, pageId, title) {
  /* Aggiorna tab active */
  document.querySelectorAll('.hbsc-tab').forEach(function(t){ t.classList.remove('active'); });
  el.classList.add('active');

  var contentEl = document.getElementById('hbsc-content');
  if(!contentEl) return;

  contentEl.innerHTML = '<div class="hbsc-loading"><div class="gs-loading-spin"></div></div>';

  fetch('/api/notion?pageId=' + pageId)
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data.blocks) throw new Error('no blocks');
      var html = renderBlocks(data.blocks, true);
      contentEl.innerHTML =
        '<div class="n-body">'+
          '<div class="hbsc-content-title">'+title+'</div>'+
          html+
        '</div>';
    })
    .catch(function(){
      contentEl.innerHTML = '<div class="hbsc-error">Errore caricamento</div>';
    });
};

function _injectHbscCSS(){
  if(document.getElementById('hbsc-css')) return;
  var s = document.createElement('style');
  s.id = 'hbsc-css';
  s.textContent = `
/* ── Layout principale ── */
.hbsc-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 600px;
  border: 1px solid rgba(200,155,60,.15);
  width: 100%;
}

/* ── Sidebar classi ── */
.hbsc-sidebar {
  border-right: 1px solid rgba(200,155,60,.15);
  background: rgba(4,6,14,.6);
  overflow-y: auto;
}
.hbsc-sidebar-title {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .25em;
  color: rgba(200,155,60,.5);
  padding: 16px 18px 10px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(200,155,60,.1);
}
.hbsc-class-list {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}
.hbsc-class-item {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: .04em;
  color: rgba(240,230,200,.6);
  padding: 9px 18px;
  cursor: pointer;
  transition: .15s;
  border-left: 2px solid transparent;
}
.hbsc-class-item:hover {
  color: rgba(240,230,200,.95);
  background: rgba(200,155,60,.06);
}
.hbsc-class-item.active {
  color: var(--gold2, #c89b3c);
  background: rgba(200,155,60,.1);
  border-left-color: rgba(200,155,60,.7);
}

/* ── Area destra ── */
.hbsc-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Tab bar sottoclassi ── */
.hbsc-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 12px 16px 0;
  border-bottom: 1px solid rgba(200,155,60,.15);
  background: rgba(4,6,14,.4);
}
.hbsc-tab {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  letter-spacing: .06em;
  color: rgba(240,230,200,.5);
  padding: 7px 14px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  transition: .15s;
  margin-bottom: -1px;
  position: relative;
}
.hbsc-tab:hover {
  color: rgba(240,230,200,.85);
  background: rgba(200,155,60,.06);
  border-color: rgba(200,155,60,.15);
}
.hbsc-tab.active {
  color: var(--gold2, #c89b3c);
  background: rgba(6,8,18,.9);
  border-color: rgba(200,155,60,.3);
  border-bottom-color: rgba(6,8,18,.9);
}

/* ── Contenuto pagina ── */
.hbsc-content {
  flex: 1;
  padding: 28px 32px;
  background: rgba(6,8,18,.4);
  overflow-y: auto;
  max-height: 80vh;
}
.hbsc-placeholder {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: .1em;
  color: rgba(200,155,60,.25);
  padding: 60px 0;
  text-align: center;
}
.hbsc-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
.hbsc-error {
  color: rgba(200,155,60,.4);
  font-family: 'Cinzel', serif;
  font-size: 11px;
  padding: 40px;
  text-align: center;
}
.hbsc-content-title {
  font-family: 'Cinzel', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--gold2, #c89b3c);
  letter-spacing: .06em;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(200,155,60,.2);
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .hbsc-layout {
    grid-template-columns: 1fr;
  }
  .hbsc-sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(200,155,60,.15);
    max-height: 180px;
  }
  .hbsc-content {
    padding: 20px 16px;
    max-height: none;
  }
}
  `;
  document.head.appendChild(s);
}
