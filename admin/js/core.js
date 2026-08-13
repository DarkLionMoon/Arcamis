/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — core.js
   Config, stato, API GitHub, autenticazione, sidebar, dashboard,
   ricerca contenuto, deploy timer. (v2)
   ════════════════════════════════════════════════════════════════ */
var ADMIN_PW = 'b0b9dd19ef971d0b25d73afa6c1b1a1a52aff81b4c6259e067aa305e187119f5';
var GH_REPO = 'DarkLionMoon/Arcamis';
var GH_BRANCH = 'main';
var CONTENT = 'content';

var _token = localStorage.getItem('arcamis_gh_token') || null;
var _modified = false;
var _current = null;
var _autosaveTimer = null;
var _lastSavedContent = '';
var _currentUser = null;
var _userRole = 'admin';

var MESTIERI = [
  {file:'alchimista.json',l:'Alchimista',i:'⚗️'},{file:'architetto.json',l:'Architetto',i:'🏛️'},
  {file:'artigiano.json',l:'Artigiano',i:'🔨'},{file:'artista.json',l:'Artista',i:'🎨'},
  {file:'falegname.json',l:'Falegname',i:'🪚'},{file:'metallurgo.json',l:'Metallurgo',i:'⚒️'},
  {file:'oste.json',l:'Oste',i:'🍺'},{file:'sarto.json',l:'Sarto',i:'🧵'}
];
var DOCS = [
  {file:'patenti.json',l:'Patenti di Arcadia',i:'⚖️'},
  {file:'codice.json',l:'Codice Giuridico',i:'📜'},
  {file:'come-funzionano.json',l:'Come Funzionano',i:'📖'}
];

/* ═══════════════ UTILITIES ═══════════════ */
function sha256(t){
  return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))
    .then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('')});
}
function esc(t){var d=document.createElement('span');d.textContent=(t==null?'':t);return d.innerHTML}
function escAttr(t){return esc(t).replace(/"/g,'&quot;')}
function toast(msg,type){
  var el=document.createElement('div');
  el.className='toast '+(type||'');
  el.textContent=msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(function(){el.classList.add('out');setTimeout(function(){el.remove()},250)},3500);
}
function setStatus(s,label){
  var el=document.getElementById('tb-status');
  if(!el)return;
  el.className='topbar-status '+(s||'idle');
  el.textContent=label||'pronto';
}
function setBadge(cls,label){
  var b=document.getElementById('e-badge');
  if(b){b.className='badge badge-'+cls;b.textContent=label}
}
function setTitle(t){
  var cl=document.querySelector('#tb-crumb .cl');
  if(cl)cl.textContent=t||'…';
}
function setCrumb(module,item){
  var cr=document.getElementById('tb-crumb');
  if(!cr)return;
  cr.innerHTML='<span class="cr">'+esc(module||'Admin')+'</span><span class="ci">›</span><span class="cl">'+esc(item||'')+'</span>';
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').classList.remove('open');
}
function toggleSidebar(){
  var sb=document.getElementById('sidebar');
  var ov=document.getElementById('sb-overlay');
  if(sb.classList.contains('open')){sb.classList.remove('open');ov.classList.remove('open')}
  else{sb.classList.add('open');ov.classList.add('open')}
}
function closeModal(id){var m=document.getElementById(id);if(m)m.remove()}
function dateFmt(iso){
  try{return new Date(iso).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return iso}
}
function viewHead(icon,title,sub,actionsHtml){
  return '<div class="view-head">'
    +'<div class="vh-title"><div class="vhi">'+icon+'</div>'
    +'<div><h2>'+esc(title)+'</h2>'+(sub?'<div class="vhs">'+esc(sub)+'</div>':'')+'</div></div>'
    +'<div class="vh-actions">'+(actionsHtml||'')+'</div></div>';
}
function modalHtml(id,title,bodyHtml,actionsHtml,size){
  var d=document.createElement('div');
  d.className='md-backdrop';
  d.id=id;
  d.innerHTML='<div class="md '+(size||'')+'">'
    +'<div class="md-head"><h3>'+title+'</h3><button class="md-x" onclick="closeModal(\''+id+'\')">✕</button></div>'
    +'<div class="md-body">'+bodyHtml+'</div>'
    +'<div class="md-actions">'+(actionsHtml||'')+'</div></div>';
  d.addEventListener('click',function(e){if(e.target===d)closeModal(id)});
  document.body.appendChild(d);
  return d;
}

/* ═══════════════ API GITHUB ═══════════════ */
function _authHeaders(){
  return {'Authorization':'token '+_token,'Content-Type':'application/json','Accept':'application/vnd.github.v3+json'};
}
async function _api(url,opts){
  var r=await fetch(url,opts);
  if(r.status===401){
    _token=prompt('Token GitHub non valido o revocato. Inserisci un nuovo Personal Access Token:');
    if(!_token){_token='';localStorage.removeItem('arcamis_gh_token');throw new Error('GitHub API 401 - token mancante')}
    localStorage.setItem('arcamis_gh_token',_token);
    opts.headers['Authorization']='token '+_token;
    r=await fetch(url,opts);
  }
  return r;
}
async function ghProxy(action,payload){
  var r=await fetch('/api/gh',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action,payload:payload})});
  if(!r.ok){
    var j=await r.json().catch(function(){return {}});
    throw new Error(j.error||('GH proxy '+r.status));
  }
  return (await r.json()).data;
}
async function ghGet(path){
  try{return await ghProxy('get',{path:path})}
  catch(e){
    var r=await _api('https://api.github.com/repos/'+GH_REPO+'/contents/'+path+'?ref='+GH_BRANCH,{headers:_authHeaders()});
    if(!r.ok)throw new Error('GitHub API '+r.status);
    return r.json();
  }
}
async function ghGetAt(path,ref){
  try{return await ghProxy('get',{path:path,ref:ref})}
  catch(e){
    var r=await _api('https://api.github.com/repos/'+GH_REPO+'/contents/'+path+'?ref='+ref,{headers:_authHeaders()});
    if(!r.ok)throw new Error('GitHub API '+r.status);
    return r.json();
  }
}
async function ghPut(path,msg,content,sha){
  try{return await ghProxy('put',{path:path,message:msg,content:btoa(unescape(encodeURIComponent(content))),sha:sha||null})}
  catch(e){
    var headers=_authHeaders();
    async function put(s){
      var body={message:msg,content:btoa(unescape(encodeURIComponent(content))),branch:GH_BRANCH};
      if(s)body.sha=s;
      return _api('https://api.github.com/repos/'+GH_REPO+'/contents/'+path,{method:'PUT',headers:headers,body:JSON.stringify(body)});
    }
    var r=await put(sha);
    if(r.status===409){var f=await ghGet(path);r=await put(f.sha)}
    if(!r.ok)throw new Error('GitHub API '+r.status);
    return r.json();
  }
}
async function ghPutBinary(path,msg,dataUri){
  var m=dataUri.match(/^data:[^;]+;base64,(.*)$/);
  var b64=m?m[1]:dataUri;
  try{return await ghProxy('binary',{path:path,message:msg,content:b64,sha:null})}
  catch(e){
    var headers=_authHeaders();
    async function put(s){
      var body={message:msg,content:b64,branch:GH_BRANCH};
      if(s)body.sha=s;
      return _api('https://api.github.com/repos/'+GH_REPO+'/contents/'+path,{method:'PUT',headers:headers,body:JSON.stringify(body)});
    }
    var r=await put(null);
    if(r.status===409){var f=await ghGet(path);r=await put(f.sha)}
    if(!r.ok)throw new Error('GitHub API '+r.status);
    return r.json();
  }
}
async function ghDelete(path,msg,sha){
  try{return await ghProxy('delete',{path:path,message:msg,sha:sha})}
  catch(e){
    var headers=_authHeaders();
    async function del(s){
      var body={message:msg,branch:GH_BRANCH};
      if(s)body.sha=s;
      return _api('https://api.github.com/repos/'+GH_REPO+'/contents/'+path,{method:'DELETE',headers:headers,body:JSON.stringify(body)});
    }
    var r=await del(sha);
    if(r.status===409){var f=await ghGet(path);r=await del(f.sha)}
    if(!r.ok)throw new Error('GitHub API '+r.status);
    return r.json();
  }
}
async function ghCommits(path){
  try{return await ghProxy('commits',{path:path,per_page:25})}
  catch(e){
    var r=await _api('https://api.github.com/repos/'+GH_REPO+'/commits?path='+encodeURIComponent(path)+'&per_page=25&sha='+GH_BRANCH,{headers:_authHeaders()});
    if(!r.ok)throw new Error('GitHub API '+r.status);
    return r.json();
  }
}
function b64decode(s){return decodeURIComponent(escape(atob(s)))}
function b64encode(s){return btoa(unescape(encodeURIComponent(s)))}

/* ═══════════════ AUTOSAVE & MULTI-UTENTE ═══════════════ */
function _autosaveKey(){
  var u=_currentUser||'anon';
  var c=_current;
  return 'arc_autosave_'+u+'_'+((c&&(c.k||c.file))||'');
}
function _autosaveLoad(){
  try{return JSON.parse(localStorage.getItem(_autosaveKey())||'null')}catch(e){return null}
}
function _autosaveStore(content){
  localStorage.setItem(_autosaveKey(),JSON.stringify({content:content,ts:Date.now()}));
}
function _autosaveClear(){localStorage.removeItem(_autosaveKey())}
function _checkUnsaved(){
  var saved=_autosaveLoad();
  if(saved&&saved.content&&saved.content!==_lastSavedContent){
    if(confirm('Hai modifiche locali non salvate ('+new Date(saved.ts).toLocaleTimeString()+'). Ripristinare?')){
      return saved.content;
    }
  }
  return null;
}
async function _checkRemoteSha(){
  if(!_current||!_current.sha)return true;
  try{
    var path=_current.type==='page'?CONTENT+'/pages/'+_current.k+'.json'
      :_current.type==='mestiere'?CONTENT+'/mestieri/'+_current.file
      :CONTENT+'/docs/'+_current.file;
    var d=await ghGet(path);
    return d.sha===_current.sha;
  }catch(e){return true}
}
async function _logAudit(action,target,extra){
  try{
    await fetch('/api/admin?action=audit',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:action,target:target,extra:extra,user:_currentUser,role:_userRole})});
  }catch(e){}
}
function _startAutosave(){
  if(_autosaveTimer)clearInterval(_autosaveTimer);
  _autosaveTimer=setInterval(function(){
    if(_modified&&_current){
      var md=document.getElementById('e-md')||document.getElementById('e-json');
      if(md){_autosaveStore(md.value);_lastSavedContent=md.value}
    }
  },15000);
}
function _stopAutosave(){if(_autosaveTimer){clearInterval(_autosaveTimer);_autosaveTimer=null}}

async function _loadUsers(){
  try{
    var r=await fetch('/api/admin?action=get_users',{credentials:'include'});
    if(!r.ok)return [];
    return (await r.json()).users||[];
  }catch(e){return []}
}
async function _saveUsers(users){
  try{
    var r=await fetch('/api/admin?action=set_users',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({users:users})});
    if(!r.ok){
      var j=await r.json().catch(function(){return {}});
      throw new Error(j.error||('Errore '+r.status));
    }
    return true;
  }catch(e){
    toast('Errore salvataggio utenti: '+e.message,'error');
    return false;
  }
}
async function _addUser(username,password,role){
  var users=await _loadUsers();
  for(var i=0;i<users.length;i++)if(users[i].username===username)return false;
  var hash=await sha256(password);
  users.push({username:username,role:role,passwordHash:hash,created:new Date().toISOString()});
  return _saveUsers(users);
}
async function _updateUser(username,password,role){
  var users=await _loadUsers();
  var idx=-1;
  for(var i=0;i<users.length;i++)if(users[i].username===username){idx=i;break}
  if(idx===-1)return false;
  if(password)users[idx].passwordHash=await sha256(password);
  users[idx].role=role;
  users[idx].updated=new Date().toISOString();
  return _saveUsers(users);
}
async function _deleteUser(username){
  if(username==='admin')return false;
  var users=await _loadUsers();
  var idx=-1;
  for(var i=0;i<users.length;i++)if(users[i].username===username){idx=i;break}
  if(idx===-1)return false;
  users.splice(idx,1);
  return _saveUsers(users);
}
function _can(action){
  if(_userRole==='admin')return true;
  if(action==='save'||action==='create')return _userRole==='editor'||_userRole==='admin';
  if(action==='delete'||action==='users')return _userRole==='admin';
  return false;
}
function _checkPerm(action){
  if(!_can(action)){
    toast('Permesso negato: serve ruolo '+(action==='delete'||action==='users'?'admin':'editor+'),'error');
    return false;
  }
  return true;
}

/* ═══════════════ AUTH ═══════════════ */
document.getElementById('login-user').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin()});
document.getElementById('login-pw').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin()});
async function doLogin(){
  var user=document.getElementById('login-user').value.trim();
  var pw=document.getElementById('login-pw').value;
  var remember=document.getElementById('login-remember')?document.getElementById('login-remember').checked:false;
  document.getElementById('login-err').style.display='none';
  var btn=document.getElementById('login-btn');
  if(btn)btn.disabled=true;
  var ok=false,role='editor',serverAuth=false,serverReachable=true;
  try{
    var r=await fetch('/api/admin?action=login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:user,password:pw,remember:remember})});
    ok=r.ok;
    if(ok){var j=await r.json();role=j.role||'editor';serverAuth=true;}
  }catch(e){ok=false;serverReachable=false;}
  if(!ok&&!serverReachable){
    var h=await sha256(pw);
    if(h===ADMIN_PW){ok=true;role='admin';}
  }
  if(!ok){
    var errEl=document.getElementById('login-err');
    errEl.textContent=serverReachable?'Credenziali errate':'Server non raggiungibile';
    errEl.style.display='';
    if(btn)btn.disabled=false;
    return;
  }
  if(btn)btn.disabled=false;
  if(!serverAuth)toast('Login offline: le operazioni server-side (es. gestione utenti) non saranno disponibili','error');
  _currentUser=user;_userRole=role;
  sessionStorage.setItem('arcadmin','1');
  document.getElementById('login').classList.add('hide');
  document.getElementById('app').style.display='flex';
  document.getElementById('sb-name').textContent=user;
  document.getElementById('sb-role').textContent=role;
  document.getElementById('sb-ava').textContent=(user.charAt(0)||'?').toUpperCase();
  document.getElementById('tb-user').innerHTML='<div class="tb-ava">'+esc((user.charAt(0)||'?').toUpperCase())+'</div><div style="display:none"></div>';
  _startAutosave();
  var restored=_checkUnsaved();
  if(restored&&_current){_autosaveClear()}
  buildSidebar();
  renderDashboard();
  toast('Benvenuto, '+user+' ('+role+')','success');
}
function doLogout(){
  sessionStorage.removeItem('arcadmin');
  fetch('/api/admin?action=logout',{method:'POST',credentials:'include'}).catch(function(){});
  _stopAutosave();_autosaveClear();
  _currentUser=null;_userRole='admin';
  _token=null;localStorage.removeItem('arcamis_gh_token');
  document.getElementById('app').style.display='none';
  document.getElementById('login').classList.remove('hide');
  document.getElementById('login-pw').value='';
}

/* ═══════════════ SIDEBAR ═══════════════ */
function buildSidebar(){
  var admin=_userRole==='admin';
  var h='';
  h+='<div class="sb-group"><div class="sb-label">Generale</div>';
  h+='<div class="sb-item" data-type="home" onclick="goHome()"><span class="ico">🏠</span><span class="lbl">Dashboard</span></div>';
  h+='<div class="sb-item" data-type="search" onclick="openContentSearch()"><span class="ico">🔎</span><span class="lbl">Cerca nel contenuto</span></div>';
  h+='</div>';
  h+='<div class="sb-group"><div class="sb-label">Contenuti <button class="sb-add" onclick="openNewPageModal()" title="Nuova pagina">+</button></div>';
  h+=_sbItems('Pagine wiki','page',PAGES);
  h+=_sbItems('Mestieri','mestiere',MESTIERI);
  h+=_sbItems('Documenti','doc',DOCS);
  h+='</div>';
  h+='<div class="sb-group"><div class="sb-label">Media</div>';
  h+='<div class="sb-item" data-type="images" data-key="images" onclick="openImages()"><span class="ico">🖼️</span><span class="lbl">Immagini /images/</span></div>';
  h+='<div class="sb-item" data-type="carousel" onclick="openCarousel()"><span class="ico">🎠</span><span class="lbl">Carousel homepage</span></div>';
  h+='<div class="sb-item" data-type="covers" onclick="openCovers()"><span class="ico">🖌️</span><span class="lbl">Cover pagine</span></div>';
  h+='</div>';
  h+='<div class="sb-group"><div class="sb-label">Sito</div>';
  h+='<div class="sb-item" data-type="nav" onclick="openNav()"><span class="ico">🧭</span><span class="lbl">Navigazione</span></div>';
  h+='<div class="sb-item" data-type="settings" onclick="openSettings()"><span class="ico">⚙️</span><span class="lbl">Impostazioni</span></div>';
  h+='</div>';
  if(admin){
    h+='<div class="sb-group"><div class="sb-label">Sistema</div>';
    h+='<div class="sb-item" data-type="users" onclick="openUserManagement()"><span class="ico">👥</span><span class="lbl">Gestione utenti</span></div>';
    h+='<div class="sb-item" data-type="audit" onclick="openAudit()"><span class="ico">📋</span><span class="lbl">Registro attività</span></div>';
    h+='</div>';
  }
  document.getElementById('sb-nav').innerHTML=h;
}
function _sbItems(label,type,items){
  var h='<div class="sb-label">'+label+'</div>';
  items.forEach(function(it){
    h+='<div class="sb-item" data-type="'+type+'" data-key="'+(it.k||it.file)+'" onclick="openItem(this)">';
    h+='<span class="ico">'+it.i+'</span><span class="lbl">'+it.l+'</span></div>';
  });
  return h;
}
function sbFilter(q){
  q=q.toLowerCase();
  document.querySelectorAll('.sb-item').forEach(function(el){
    var lbl=el.querySelector('.lbl').textContent.toLowerCase();
    el.style.display=lbl.indexOf(q)!==-1?'':'none';
  });
  document.querySelectorAll('.sb-group').forEach(function(g){
    var vis=g.querySelectorAll('.sb-item:not([style*="display: none"])').length;
    g.style.display=vis?'':'none';
  });
}
function setActive(type,key){
  document.querySelectorAll('.sb-item').forEach(function(el){
    el.classList.toggle('active',el.dataset.type===type&&(key==null||el.dataset.key===key||el.getAttribute('data-key')===key));
  });
}
function goHome(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  setActive('home');
  renderDashboard();
}
async function openItem(el){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  var type=el.dataset.type,key=el.dataset.key;
  setActive(type,key);
  _modified=false;
  closeSidebar();
  setStatus('saving','caricamento...');
  try{
    if(type==='page')await openPage(key);
    else if(type==='mestiere')await openMestiere(key);
    else if(type==='doc')await openDoc(key);
    setStatus('ok','caricato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}

/* ═══════════════ DASHBOARD ═══════════════ */
function _dashGrid(label,type,items){
  if(!items||!items.length)return '';
  var h='<div class="panel" style="margin-top:16px"><div class="panel-head"><h3>'+label+'</h3><span class="hint">'+items.length+' voci</span></div>';
  items.forEach(function(it){
    h+='<div class="row" data-type="'+type+'" data-key="'+(it.k||it.file)+'" onclick="dashOpen(this)">'
      +'<div class="rico">'+it.i+'</div><div class="rmain"><div class="rt">'+it.l+'</div>'
      +'<div class="rs">'+(it.k||it.file)+'</div></div>'
      +'<div class="ract"><span style="color:var(--dim)">›</span></div></div>';
  });
  return h+'</div>';
}
async function renderDashboard(){
  _current=null;
  setCrumb('Dashboard','');
  setTitle('Panoramica');
  setStatus('idle','pronto');
  var admin=_userRole==='admin';
  var h=viewHead('🏠','Dashboard','Panoramica del contenuto di Arcamis', 
    '<button class="btn btn-p" onclick="openNewPageModal()">+ Nuova pagina</button>'
    +'<button class="btn btn-soft" onclick="openContentSearch()">🔎 Cerca</button>');
  h+='<div class="stat-row">';
  h+='<div class="stat" onclick="dashOpenByType(\'page\')"><div class="si">📄</div><div><div class="sn">'+PAGES.length+'</div><div class="sl">Pagine wiki</div></div></div>';
  h+='<div class="stat" onclick="dashOpenByType(\'mestiere\')"><div class="si green">⚒️</div><div><div class="sn">'+MESTIERI.length+'</div><div class="sl">Mestieri</div></div></div>';
  h+='<div class="stat" onclick="dashOpenByType(\'doc\')"><div class="si purple">📜</div><div><div class="sn">'+DOCS.length+'</div><div class="sl">Documenti</div></div></div>';
  h+='</div>';
  h+='<div class="panel"><div class="panel-head"><h3>Azioni rapide</h3><span class="hint">scorciatoie</span></div><div class="quick-grid">';
  h+='<div class="quick" onclick="openNewPageModal()"><div class="qi">➕</div><div class="qt">Nuova pagina</div><div class="qd">Crea una sezione wiki con URL pulito</div></div>';
  h+='<div class="quick" onclick="openContentSearch()"><div class="qi">🔎</div><div class="qt">Cerca contenuto</div><div class="qd">Trova testi in tutte le pagine</div></div>';
  h+='<div class="quick" onclick="openCarousel()"><div class="qi">🎠</div><div class="qt">Carousel homepage</div><div class="qd">Slide, testi e bottoni della home</div></div>';
  h+='<div class="quick" onclick="openNav()"><div class="qi">🧭</div><div class="qt">Navigazione</div><div class="qd">Ordina e organizza le voci del menu</div></div>';
  h+='<div class="quick" onclick="openImages()"><div class="qi">🖼️</div><div class="qt">Immagini</div><div class="qd">Carica e gestisci /images/</div></div>';
  if(admin){
    h+='<div class="quick" onclick="openCovers()"><div class="qi">🖌️</div><div class="qt">Cover pagine</div><div class="qd">Sfondi delle card sulla home</div></div>';
  }
  h+='</div></div>';
  h+=_dashGrid('Pagine wiki','page',PAGES);
  h+=_dashGrid('Mestieri','mestiere',MESTIERI);
  h+=_dashGrid('Documenti','doc',DOCS);
  h+='<div class="panel" style="margin-top:16px"><div class="panel-head"><h3>Ultime attività</h3><span class="hint">registro admin</span></div><div id="dash-act"><div class="empty" style="padding:22px"><span class="ei">⏳</span>Caricamento…</div></div></div>';
  document.getElementById('main').innerHTML=h;
  _dashActivity();
}
function dashOpen(el){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  var type=el.getAttribute('data-type'),key=el.getAttribute('data-key');
  openByType(type,key);
}
function dashOpenByType(type){
  var key=null;
  if(type==='page')key=PAGES[0]&&PAGES[0].k;
  else if(type==='mestiere')key=MESTIERI[0]&&MESTIERI[0].file;
  else if(type==='doc')key=DOCS[0]&&DOCS[0].file;
  if(key)openByType(type,key);
}
function openByType(type,key){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  setActive(type,key);
  _modified=false;
  setStatus('saving','caricamento...');
  var p=type==='page'?openPage(key):type==='mestiere'?openMestiere(key):type==='doc'?openDoc(key):null;
  if(!p)return;
  p.then(function(){setStatus('ok','caricato');setTimeout(function(){setStatus('idle','pronto')},1500)})
   .catch(function(e){setStatus('err','errore');toast(e.message,'error')});
}
async function _dashActivity(){
  var box=document.getElementById('dash-act');
  try{
    var r=await fetch('/api/admin?action=get_log',{credentials:'include'});
    var j=await r.json();
    var entries=(j.entries||[]).slice(0,6);
    if(!box)return;
    if(!entries.length){box.innerHTML='<div class="empty" style="padding:22px"><span class="ei">🗒️</span>Nessuna attività registrata</div>';return}
    box.innerHTML=entries.map(function(e){
      var ico=e.action==='save_page'?'📝':e.action==='save_db'||e.action==='save_mestiere'||e.action==='save_doc'?'🗄️':e.action==='cover_page'?'🖌️':'⚙️';
      return '<div class="act-item"><div class="act-dot" style="background:var(--acc)"></div>'
        +'<div class="act-main"><div class="act-t">'+ico+' <b>'+esc(e.action||'')+'</b> → '+esc(e.target||'')+'</div>'
        +'<div class="act-s">'+esc(dateFmt(e.timestamp))+'</div></div></div>';
    }).join('');
  }catch(e){
    if(box)box.innerHTML='<div class="empty" style="padding:22px"><span class="ei">⚠️</span>Registro non disponibile</div>';
  }
}

/* ═══════════════ RICERCA CONTENUTO ═══════════════ */
var _contentIndex=null,_contentIndexLoading=false;
async function _loadContentIndex(){
  if(_contentIndex)return _contentIndex;
  if(_contentIndexLoading)return null;
  _contentIndexLoading=true;
  try{
    var list=await ghGet('content/pages');
    var idx=[];
    for(var i=0;i<list.length;i++){
      var it=list[i];
      if(!it||it.type!=='file'||!it.name||it.name.slice(-5)!=='.json')continue;
      try{
        var c=await ghGet('content/pages/'+it.name);
        var j=JSON.parse(b64decode(c.content));
        idx.push({k:j.k||it.name.replace('.json',''),title:j.title||'',icon:j.icon||'',content:j.content||''});
      }catch(e){}
    }
    _contentIndex=idx;
  }catch(e){_contentIndex=[]}
  _contentIndexLoading=false;
  return _contentIndex;
}
function openContentSearch(){
  if(document.getElementById('cs-modal'))return;
  var d=modalHtml('cs-modal','🔎 Cerca nel contenuto',
    '<div class="fld"><input id="cs-input" class="in" placeholder="Termine da cercare nelle pagine… (min. 3 caratteri)"></div>'
    +'<div class="list-body" id="cs-body"><div class="list-empty">Digita almeno 3 caratteri…</div></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'cs-modal\')">Chiudi</button>');
  document.getElementById('cs-input').addEventListener('input',_runContentSearch);
  document.getElementById('cs-input').focus();
}
async function _runContentSearch(){
  var input=document.getElementById('cs-input');
  var body=document.getElementById('cs-body');
  if(!input||!body)return;
  var q=input.value.trim().toLowerCase();
  if(q.length<3){body.innerHTML='<div class="list-empty">Digita almeno 3 caratteri…</div>';return}
  body.innerHTML='<div class="list-empty">Ricerca…</div>';
  var idx=await _loadContentIndex();
  if(!idx){body.innerHTML='<div class="list-empty">Nessun contenuto indicizzato</div>';return}
  var hits=[];
  idx.forEach(function(p){
    var c=p.content.toLowerCase();
    var pos=c.indexOf(q);
    if(pos===-1)return;
    var start=Math.max(0,pos-60),end=Math.min(p.content.length,pos+q.length+60);
    var snip=(start>0?'…':'')+p.content.slice(start,end).replace(/\s*\n+\s*/g,' ')+(end<p.content.length?'…':'');
    hits.push({p:p,snip:snip});
  });
  if(!hits.length){body.innerHTML='<div class="list-empty">Nessun risultato per "'+esc(q)+'"</div>';return}
  body.innerHTML=hits.map(function(h){
    return '<div class="row" onclick="openSearchHit(\''+esc(h.p.k)+'\')">'
      +'<div class="rico">'+h.p.icon+'</div><div class="rmain"><div class="rt">'+esc(h.p.title)+'</div>'
      +'<div class="rs snippet">'+esc(h.snip)+'</div></div>'
      +'<div class="ract"><span style="color:var(--dim)">›</span></div></div>';
  }).join('');
}
async function openSearchHit(k){
  closeModal('cs-modal');
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  setActive('page',k);
  closeSidebar();
  setStatus('saving','caricamento…');
  try{
    await openPage(k);
    setStatus('ok','caricato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}

/* ═══════════════ DEPLOY TIMER ═══════════════ */
var _deployInterval=null;
function startDeployTimer(){
  if(_deployInterval)clearInterval(_deployInterval);
  var el=document.getElementById('tb-status');
  if(!el)return;
  var start=Date.now();
  var lastPing=0;
  var realDeploy=false;
  el.className='saving';
  el.textContent='deploy in corso…';
  async function pingDeploy(){
    try{
      var r=await fetch('/api/deploy',{credentials:'include'});
      var j=await r.json();
      if(j.configured){
        realDeploy=true;
        if(j.status==='success'){
          clearInterval(_deployInterval);_deployInterval=null;
          el.className='ok';
          el.textContent='deploy completato';
          toast('Deploy completato! Ricarica il sito per vedere le modifiche.','success');
          return true;
        }
        el.textContent='deploy: '+j.status;
      }
    }catch(e){}
    return false;
  }
  _deployInterval=setInterval(function(){
    var now=Date.now();
    if(now-lastPing>=10000){lastPing=now;pingDeploy();}
    var sec=Math.max(0,45-Math.round((now-start)/1000));
    if(sec<=0){
      clearInterval(_deployInterval);_deployInterval=null;
      pingDeploy().then(function(done){
        if(done)return;
        el.className='ok';
        el.textContent='deploy completato';
        toast('Deploy completato! Ricarica il sito per vedere le modifiche.','success');
      });
    }else if(!realDeploy){
      el.textContent='deploy in '+sec+'s…';
    }
  },1000);
}
