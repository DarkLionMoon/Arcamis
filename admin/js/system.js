/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — system.js
   Gestione utenti, registro attività, inizializzazione. (v2)
   ════════════════════════════════════════════════════════════════ */

/* ═══════════════ GESTIONE UTENTI ═══════════════ */
async function openUserManagement(){
  if(!_checkPerm('users'))return;
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('users');
  closeSidebar();
  setCrumb('Sistema','Gestione utenti');
  setTitle('Utenti admin');
  setStatus('saving','caricamento utenti…');
  try{
    var users=await _loadUsers();
    window.__usersForEdit=users;
    var h=viewHead('👥','Gestione utenti','Account che possono accedere al pannello', 
      '<button class="btn btn-p" onclick="openAddUserModal()">+ NUOVO UTENTE</button>');
    h+='<div class="panel"><div class="panel-head"><h3>Account</h3><span class="hint">'+users.length+' utenti · password salvate come hash SHA-256</span></div>';
    if(!users.length)h+='<div class="empty"><span class="ei">👥</span>Nessun utente configurato</div>';
    users.forEach(function(u){
      var isMe=u.username===_currentUser;
      h+='<div class="cover-row">'
        +'<div class="tb-ava">'+esc((u.username.charAt(0)||'?').toUpperCase())+'</div>'
        +'<div class="cmain"><div class="ct">'+esc(u.username)+(isMe?' <span class="pill blue">te</span>':'')+'</div>'
        +'<div class="cs">ruolo: '+esc(u.role||'editor')+(u.updated?' · aggiornato '+esc(dateFmt(u.updated)):'')+'</div></div>'
        +'<div class="ract">'
        +'<button class="btn btn-soft btn-sm" onclick="openEditUserModal(\''+escJsAttr(u.username)+'\')">✏️</button>'
        +(u.username!==_currentUser?'<button class="btn btn-d btn-sm" onclick="deleteUserConfirm(\''+escJsAttr(u.username)+'\')">🗑</button>':'')
        +'</div></div>';
    });
    h+='</div>';
    document.getElementById('main').innerHTML=h;
    setStatus('ok','caricato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
function openAddUserModal(){
  if(document.getElementById('au-modal'))return;
  modalHtml('au-modal','➕ Nuovo utente',
    '<div class="fld"><label>Username</label><input id="au-user" class="in" placeholder="nome utente univoco" onkeydown="if(event.key===\'Enter\')saveNewUser()"></div>'
    +'<div class="fld"><label>Password</label><input id="au-pass" class="in" type="password" placeholder="min. 6 caratteri" onkeydown="if(event.key===\'Enter\')saveNewUser()"></div>'
    +'<div class="fld"><label>Ruolo</label><select id="au-role" class="in"><option value="editor">Editor (modifica contenuti)</option><option value="admin">Admin (accesso totale)</option></select></div>'
    +'<div class="md-status" id="au-st"></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'au-modal\')">Annulla</button>'
    +'<button class="btn btn-p" onclick="saveNewUser()">CREA</button>');
  document.getElementById('au-user').focus();
}
async function saveNewUser(){
  if(!_checkPerm('users'))return;
  var username=(document.getElementById('au-user').value||'').trim().toLowerCase();
  var password=document.getElementById('au-pass').value;
  var role=document.getElementById('au-role').value;
  var st=document.getElementById('au-st');
  if(!username||username.length<3){if(st){st.textContent='Username: almeno 3 caratteri';st.className='md-status err'}return}
  if(!/^[a-z0-9._-]+$/.test(username)){if(st){st.textContent='Username: solo minuscole, numeri, punto, trattino, underscore';st.className='md-status err'}return}
  if(password.length<6){if(st){st.textContent='Password: almeno 6 caratteri';st.className='md-status err'}return}
  var ok=await _addUser(username,password,role);
  if(st){st.textContent=ok?'✓ Utente creato':'✕ Errore (username già esistente?)';st.className='md-status '+(ok?'ok':'err')}
  if(ok){
    toast('Utente '+username+' creato','success');
    await _logAudit('user_add',username,{role:role});
    closeModal('au-modal');
    openUserManagement();
  }
}
function openEditUserModal(username){
  if(document.getElementById('eu-modal'))return;
  modalHtml('eu-modal','✏️ Modifica — '+esc(username),
    '<input type="hidden" id="eu-user" value="'+escAttr(username)+'">'
    +'<div class="fld"><label>Nuova password (lascia vuota per non cambiarla)</label><input id="eu-pass" class="in" type="password" placeholder="••••••••" onkeydown="if(event.key===\'Enter\')saveEditUser()"></div>'
    +'<div class="fld"><label>Ruolo</label><select id="eu-role" class="in"><option value="editor">Editor (modifica contenuti)</option><option value="admin">Admin (accesso totale)</option></select></div>'
    +'<div class="md-status" id="eu-st"></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'eu-modal\')">Annulla</button>'
    +'<button class="btn btn-p" onclick="saveEditUser()">SALVA</button>');
  var users=window.__usersForEdit||[];
  var u=users.find(function(x){return x.username===username});
  document.getElementById('eu-role').value=(u&&u.role)||'editor';
  document.getElementById('eu-pass').focus();
}
async function saveEditUser(){
  if(!_checkPerm('users'))return;
  var username=document.getElementById('eu-user').value;
  var password=document.getElementById('eu-pass').value;
  var role=document.getElementById('eu-role').value;
  var st=document.getElementById('eu-st');
  if(password&&password.length<6){if(st){st.textContent='Password: almeno 6 caratteri';st.className='md-status err'}return}
  var ok=await _updateUser(username,password,role);
  if(st){st.textContent=ok?'✓ Aggiornato':'✕ Errore';st.className='md-status '+(ok?'ok':'err')}
  if(ok){
    toast('Utente '+username+' aggiornato','success');
    await _logAudit('user_update',username,{role:role});
    closeModal('eu-modal');
    openUserManagement();
  }
}
async function deleteUserConfirm(username){
  if(!_checkPerm('users'))return;
  if(!confirm('Eliminare l\'utente "'+username+'"?\n\nNon potrà più accedere al pannello.'))return;
  var ok=await _deleteUser(username);
  if(ok){
    toast('Utente '+username+' eliminato','success');
    await _logAudit('user_delete',username,{});
    openUserManagement();
  }
}

/* ═══════════════ REGISTRO ATTIVITÀ ═══════════════ */
var _auditEntries=[];
async function openAudit(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('audit');
  closeSidebar();
  setCrumb('Sistema','Registro attività');
  setTitle('Audit log');
  setStatus('saving','caricamento registro…');
  try{
    var r=await fetch('/api/admin?action=get_log',{credentials:'include'});
    var j=await r.json();
    _auditEntries=j.entries||[];
    var h=viewHead('📋','Registro attività','Ultime attività degli admin (30 giorni)', 
      '<input id="aud-q" class="in" style="width:200px" placeholder="Filtra…" oninput="audFilter()">'
      +'<input id="aud-from" class="in" style="width:130px" type="date" oninput="audFilter()" title="Data inizio">'
      +'<input id="aud-to" class="in" style="width:130px" type="date" oninput="audFilter()" title="Data fine">'
      +'<button class="btn btn-soft btn-sm" onclick="exportAuditCSV()">📥 CSV</button>'
      +'<button class="btn btn-p" onclick="openAudit()">⟳ AGGIORNA</button>');
    h+='<div class="panel"><div class="panel-head"><h3>Eventi</h3><span class="hint" id="aud-count">'+_auditEntries.length+' registrati</span></div>'
      +'<div id="aud-body">'+_auditRender('','','')+'</div></div>';
    document.getElementById('main').innerHTML=h;
    setStatus('ok','caricato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast('Registro non disponibile: '+e.message,'error')}
}
function _auditIcon(action){
  if(action==='save_page')return '📝';
  if(action==='cover_page'||action==='set_cover'||action==='remove_cover')return '🖌️';
  if(action==='user_add'||action==='user_update'||action==='user_delete')return '👥';
  if(action==='nav_move'||action==='nav_sec'||action==='nav_sub')return '🧭';
  return '⚙️';
}
function _auditColor(action){
  if(action.indexOf('delete')!==-1||action.indexOf('user_')===0)return 'var(--red)';
  if(action.indexOf('create')!==-1)return 'var(--grn)';
  return 'var(--acc)';
}
function _auditRender(q,from,to){
  var entries=_auditEntries;
  if(q){q=q.toLowerCase();entries=entries.filter(function(e){return (e.action||'').toLowerCase().indexOf(q)!==-1||(e.target||'').toLowerCase().indexOf(q)!==-1})}
  if(from){entries=entries.filter(function(e){return e.timestamp&&e.timestamp>=from})}
  if(to){entries=entries.filter(function(e){return e.timestamp&&e.timestamp<=to+'T23:59:59'})}
  var cnt=document.getElementById('aud-count');
  if(cnt)cnt.textContent=entries.length+' filtrati';
  if(!entries.length)return '<div class="empty"><span class="ei">🗒️</span>Nessun evento'+(q?' per "'+esc(q)+'"':'')+'</div>';
  return entries.map(function(e){
    return '<div class="act-item"><div class="act-dot" style="background:'+_auditColor(e.action)+'"></div>'
      +'<div class="act-main"><div class="act-t">'+_auditIcon(e.action)+' <b>'+esc(e.action||'')+'</b> → '+esc(e.target||'')+'</div>'
      +'<div class="act-s">'+esc(dateFmt(e.timestamp))+(e.extra?' · '+esc(e.extra):'')+'</div></div></div>';
  }).join('');
}
function audFilter(){
  var q=(document.getElementById('aud-q')||{}).value||'';
  var from=(document.getElementById('aud-from')||{}).value||'';
  var to=(document.getElementById('aud-to')||{}).value||'';
  var b=document.getElementById('aud-body');
  if(b)b.innerHTML=_auditRender(q,from,to);
}
function exportAuditCSV(){
  var q=(document.getElementById('aud-q')||{}).value||'';
  var from=(document.getElementById('aud-from')||{}).value||'';
  var to=(document.getElementById('aud-to')||{}).value||'';
  var entries=_auditEntries;
  if(q){q=q.toLowerCase();entries=entries.filter(function(e){return (e.action||'').toLowerCase().indexOf(q)!==-1||(e.target||'').toLowerCase().indexOf(q)!==-1})}
  if(from)entries=entries.filter(function(e){return e.timestamp&&e.timestamp>=from});
  if(to)entries=entries.filter(function(e){return e.timestamp&&e.timestamp<=to+'T23:59:59'});
  var csv='Data,Azione,Target,Utente,Ruolo,Extra\n';
  entries.forEach(function(e){
    csv+='"'+(e.timestamp||'')+'","'+(e.action||'').replace(/"/g,'""')+'","'+(e.target||'').replace(/"/g,'""')+'","'+(e.user||'').replace(/"/g,'""')+'","'+(e.role||'').replace(/"/g,'""')+'","'+((typeof e.extra==='string'?e.extra:JSON.stringify(e.extra||''))).replace(/"/g,'""')+'"\n';
  });
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='arcamis-audit-'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  toast('Audit log esportato come CSV','success');
}

/* ═══════════════ BOOT ═══════════════ */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    document.querySelectorAll('.md-backdrop').forEach(function(el){el.remove()});
  }
});
(function(){
  var dv=localStorage.getItem('arc_view_default');
  if(dv==='md'||dv==='pv')_viewMode=dv;
  var user=sessionStorage.getItem('arcadmin');
  if(user){
    _currentUser=sessionStorage.getItem('arcadmin_user')||'admin';
    _userRole=sessionStorage.getItem('arcadmin_role')||'viewer';
    fetch('/api/admin?action=check',{credentials:'include'}).then(function(r){return r.json()}).then(function(j){
      if(j&&j.ok){
        if(j.role){_userRole=j.role;sessionStorage.setItem('arcadmin_role',j.role);}
        _fetchCsrf();
        document.getElementById('login').classList.add('hide');
        document.getElementById('app').style.display='flex';
        document.getElementById('sb-name').textContent=_currentUser;
        document.getElementById('sb-role').textContent=_userRole;
        document.getElementById('sb-ava').textContent=(_currentUser.charAt(0)||'?').toUpperCase();
        buildSidebar();
        renderDashboard();
        _startAutosave();
      }
    }).catch(function(){});
  }
})();

/* ═══════════════ GRAFO LINK TRA PAGINE ═══════════════ */
async function openLinkGraph(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('link-graph');
  closeSidebar();
  setCrumb('Sistema','Grafo link');
  setTitle('🕸️ Grafo link tra pagine');
  setStatus('saving','analisi link…');
  var h=viewHead('🕸️','Grafo link','Mappa delle connessioni tra pagine. Mostra quali pagine linkano quali.',
    '<button class="btn btn-p" onclick="openLinkGraph()">⟳ AGGIORNA</button>');
  h+='<div class="panel"><div class="panel-head"><h3>Grafo</h3></div><div id="graph-body" style="padding:16px;text-align:center;color:var(--dim)">⏳ Analisi in corso…</div></div>';
  document.getElementById('main').innerHTML=h;
  try{
    var links={};
    var allKeys=PAGES.map(function(p){return p.k});
    allKeys.forEach(function(k){links[k]={incoming:[],outgoing:[]}});
    for(var i=0;i<PAGES.length;i++){
      try{
        var d=await ghGet(CONTENT+'/pages/'+PAGES[i].k+'.json');
        var json=JSON.parse(b64decode(d.content));
        var content=json.content||'';
        var regex=/\[([^\]]*)\]\(([^)]+)\)/g;
        var match;
        while((match=regex.exec(content))!==null){
          var href=match[2].replace(/^\//,'').split('#')[0].split('?')[0];
          if(allKeys.indexOf(href)!==-1){
            if(!links[PAGES[i].k])links[PAGES[i].k]={incoming:[],outgoing:[]};
            if(!links[href])links[href]={incoming:[],outgoing:[]};
            links[PAGES[i].k].outgoing.push(href);
            links[href].incoming.push(PAGES[i].k);
          }
        }
      }catch(e){}
    }
    /* Find orphans (no incoming links) */
    var orphans=allKeys.filter(function(k){return links[k]&&links[k].incoming.length===0});
    var hubs=allKeys.slice().sort(function(a,b){return(links[b]?links[b].outgoing.length:0)-(links[a]?links[a].outgoing.length:0)}).slice(0,5);
    var body=document.getElementById('graph-body');
    if(!body)return;
    var h2='<div style="display:flex;gap:20px;margin-bottom:16px;font-size:13px">';
    h2+='<span>📄 <b>'+allKeys.length+'</b> pagine</span>';
    h2+='<span>🔗 <b>'+Object.values(links).reduce(function(s,l){return s+l.outgoing.length},0)+'</b> link interni</span>';
    h2+='<span style="color:var(--orange)">孤立 <b>'+orphans.length+'</b> pagine senza link in entrata</span>';
    h2+='</div>';
    if(orphans.length){
      h2+='<div style="margin-bottom:12px;font-size:13px;font-weight:600;color:var(--orange)">Pagine orfane (nessun link in entrata)</div>';
      orphans.forEach(function(k){
        var meta=PAGES.find(function(p){return p.k===k});
        h2+='<div class="cover-row" style="cursor:default;border-color:rgba(200,150,60,.2)">'
          +'<div class="si">'+(meta?meta.i:'📄')+'</div>'
          +'<div class="cmain"><div class="ct">'+esc(meta?meta.l:k)+'</div>'
          +'<div class="cs">'+(links[k]?links[k].outgoing.length:0)+' link in uscita, 0 in entrata</div></div></div>';
      });
    }
    if(hubs.length){
      h2+='<div style="margin:16px 0 12px;font-size:13px;font-weight:600;color:var(--teal3)">Pagine hub (più link in uscita)</div>';
      hubs.forEach(function(k){
        if(!links[k]||!links[k].outgoing.length)return;
        var meta=PAGES.find(function(p){return p.k===k});
        h2+='<div class="cover-row" style="cursor:default;border-color:rgba(100,180,220,.2)">'
          +'<div class="si">'+(meta?meta.i:'📄')+'</div>'
          +'<div class="cmain"><div class="ct">'+esc(meta?meta.l:k)+'</div>'
          +'<div class="cs">'+links[k].outgoing.length+' link in uscita, '+links[k].incoming.length+' in entrata</div></div></div>';
      });
    }
    body.innerHTML=h2;
  }catch(e){
    var body=document.getElementById('graph-body');
    if(body)body.innerHTML='<div style="padding:16px;color:var(--red)">❌ Errore: '+esc(e.message)+'</div>';
  }
}

/* ═══════════════ CESTINO (TRASH) ═══════════════ */
async function openTrash(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('trash');
  closeSidebar();
  setCrumb('Sistema','Cestino');
  setTitle('🗑️ Cestino');
  setStatus('saving','caricamento…');
  var h=viewHead('🗑️','Cestino','Pagine eliminate. Ripristinabili per 30 giorni.',
    '<button class="btn btn-soft" onclick="openTrash()">⟳ AGGIORNA</button>'
    +'<button class="btn btn-d btn-sm" onclick="emptyExpiredTrash()">Svuota scaduti</button>');
  h+='<div id="trash-body" style="padding:16px;text-align:center;color:var(--dim)">⏳ Caricamento…</div>';
  document.getElementById('main').innerHTML=h;
  try{
    var r=await fetch('/api/admin?action=list_trash',{credentials:'include'});
    var j=await r.json();
    if(j.error)throw new Error(j.error);
    var body=document.getElementById('trash-body');
    if(!body)return;
    if(!j.items||!j.items.length){
      body.innerHTML='<div style="padding:20px"><span style="font-size:28px">✅</span><div style="margin-top:8px">Il cestino è vuoto.</div></div>';
      return;
    }
    var h2='<div style="padding:0 0 8px;font-size:13px"><b>'+j.items.length+'</b> pagine nel cestino · scadono dopo 30 giorni</div>';
    j.items.forEach(function(item){
      var age=Math.floor((Date.now()-new Date(item.deletedAt).getTime())/(1000*60*60*24));
      var remaining=Math.max(0,30-age);
      h2+='<div class="cover-row" style="cursor:default;border-color:rgba(200,80,80,.15)">'
        +'<div class="si">'+(item.pageIcon||'📄')+'</div>'
        +'<div class="cmain"><div class="ct">'+esc(item.pageTitle||item.pageKey)+'</div>'
        +'<div class="cs">eliminata '+esc(item.deletedAt?new Date(item.deletedAt).toLocaleString('it-IT'):'?')+' · '+remaining+'gg rimanenti</div></div>'
        +'<div class="ract">'
        +'<button class="btn btn-p btn-sm" onclick="restoreFromTrash(\''+escAttr(item.pageKey)+'\')">♻️ RIPRISTINA</button>'
        +'<button class="btn btn-d btn-sm" onclick="permanentDeleteTrash(\''+escAttr(item.pageKey)+'\')">❌ ELIMINA</button>'
        +'</div></div>';
    });
    body.innerHTML=h2;
  }catch(e){
    var body=document.getElementById('trash-body');
    if(body)body.innerHTML='<div style="padding:16px;color:var(--red)">❌ Errore: '+esc(e.message)+'</div>';
  }
}
async function restoreFromTrash(pageKey){
  var ok=await uiConfirm('Ripristinare "'+pageKey+'" dal cestino?\n\nLa pagina verrà ripristinata su GitHub e il deploy avviato automaticamente.',{ok:'RIPRISTINA'});
  if(!ok)return;
  setStatus('saving','ripristino…');
  try{
    var r=await _authPost('/api/admin?action=restore_trash',{pageKey:pageKey});
    var j=await r.json();
    if(j.error)throw new Error(j.error);
    toast('Pagina ripristinata! Deploy in corso…','success');
    startDeployTimer();
    openTrash();
    /* Reload pages list */
    try{
      var pr=await fetch('/api/admin?action=get_registry',{credentials:'include'});
      var pj=await pr.json();
      if(pj.pages)window.PAGES=pj.pages;
      buildSidebar();
    }catch(e){}
  }catch(e){setStatus('err','errore');toast('Errore: '+e.message,'error')}
}
async function permanentDeleteTrash(pageKey){
  var ok=await uiConfirm('Eliminare definitivamente "'+pageKey+'" dal cestino?\n\nOperazione irreversibile.',{danger:true,ok:'ELIMINA DEFINITIVAMENTE'});
  if(!ok)return;
  setStatus('saving','eliminazione…');
  try{
    var r=await _authPost('/api/admin?action=empty_trash',{pageKey:pageKey});
    var j=await r.json();
    if(j.error)throw new Error(j.error);
    toast('Eliminato definitivamente','success');
    openTrash();
  }catch(e){setStatus('err','errore');toast('Errore: '+e.message,'error')}
}
async function emptyExpiredTrash(){
  var ok=await uiConfirm('Svuotare tutte le pagine scadute (>30gg) dal cestino?',{danger:true,ok:'SVUOTA'});
  if(!ok)return;
  setStatus('saving','svuotamento…');
  try{
    var r=await _authPost('/api/admin?action=empty_trash',{});
    var j=await r.json();
    if(j.error)throw new Error(j.error);
    toast((j.deleted||0)+' pagine eliminate definitivamente','success');
    openTrash();
  }catch(e){setStatus('err','errore');toast('Errore: '+e.message,'error')}
}

/* ═══════════════ SESSIONI ATTIVE ═══════════════ */
async function openActiveSessions(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('sessions');
  closeSidebar();
  setCrumb('Sistema','Sessioni attive');
  setTitle('🔐 Sessioni attive');
  setStatus('saving','caricamento…');
  var h=viewHead('🔐','Sessioni attive','Gestisci le sessioni di login attive',
    '<button class="btn btn-p" onclick="openActiveSessions()">⟳ AGGIORNA</button>');
  h+='<div id="sessions-body" style="padding:16px;text-align:center;color:var(--dim)">⏳ Caricamento…</div>';
  document.getElementById('main').innerHTML=h;
  try{
    var r=await fetch('/api/admin?action=get_users',{credentials:'include'});
    var j=await r.json();
    var users=j.users||[];
    var body=document.getElementById('sessions-body');
    if(!body)return;
    var h2='<div style="padding:0 0 12px;font-size:13px"><b>'+users.length+'</b> utenti configurati</div>';
    users.forEach(function(u){
      var role=u.role==='admin'?'badge-ok':'badge-idle';
      h2+='<div class="cover-row" style="cursor:default">'
        +'<div class="si" style="background:var(--gold);color:#14100a;font-weight:700;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center">'+(u.username.charAt(0)||'?').toUpperCase()+'</div>'
        +'<div class="cmain"><div class="ct">'+esc(u.username)+'</div>'
        +'<div class="cs"><span class="badge '+role+'">'+u.role+'</span>'
        +(u.created?' · creato '+new Date(u.created).toLocaleDateString('it-IT'):'')
        +(u.lastLogin?' · ultimo accesso '+new Date(u.lastLogin).toLocaleDateString('it-IT'):'')
        +'</div></div>'
        +'<div class="ract">'
        +(u.username!=='admin'?'<button class="btn btn-d btn-sm" onclick="forceLogoutUser(\''+escAttr(u.username)+'\')">🔓 Forza Logout</button>':'')
        +'</div></div>';
    });
    h2+='<div style="margin-top:16px;padding:12px;background:var(--panel);border:1px solid var(--line);border-radius:8px;font-size:12px;color:var(--dim)">'
      +'💡 Le sessioni sono basate su cookie. Per forzare il logout di un utente, cambia la sua password dalla gestione utenti. Il cookie verrà invalidato al prossimo accesso.</div>';
    body.innerHTML=h2;
  }catch(e){
    var body=document.getElementById('sessions-body');
    if(body)body.innerHTML='<div style="padding:16px;color:var(--red)">❌ Errore: '+esc(e.message)+'</div>';
  }
}
async function forceLogoutUser(username){
  var ok=await uiConfirm('Forzare il logout di "'+username+'"?\n\nDovrà effettuare di nuovo l\'accesso.',{ok:'FORZA LOGOUT'});
  if(!ok)return;
  toast('Per forzare il logout, cambia la password di '+username+' dalla gestione utenti.','info');
  openUserManagement();
}
async function openLinkScanner(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('link-scanner');
  closeSidebar();
  setCrumb('Sistema','Link rotti');
  setTitle('Scanner link rotti');
  setStatus('saving','scansione in corso…');
  var h=viewHead('🔗','Scanner link rotti','Controlla tutti i link interni e le immagini di ogni pagina',
    '<button class="btn btn-p" onclick="openLinkScanner()">⟳ SCANSIONA</button>');
  h+='<div class="panel"><div class="panel-head"><h3>Risultati</h3></div><div id="ls-body" style="padding:16px;text-align:center;color:var(--dim)">⏳ Scansione di tutte le pagine in corso…</div></div>';
  document.getElementById('main').innerHTML=h;
  try{
    var r=await fetch('/api/admin?action=scan_links',{credentials:'include'});
    var j=await r.json();
    if(j.error)throw new Error(j.error);
    var body=document.getElementById('ls-body');
    if(!body)return;
    if(!j.broken.length&&!j.warnings.length){
      body.innerHTML='<div style="padding:20px"><span style="font-size:28px">✅</span><div style="margin-top:8px">Nessun problema trovato! '+j.checked+' pagine controllate.</div></div>';
      return;
    }
    var h2='<div style="padding:8px 0 14px;display:flex;gap:16px;font-size:13px">';
    h2+='<span>📄 <b>'+j.checked+'</b> pagine controllate</span>';
    if(j.summary.totalBroken)h2+='<span style="color:var(--red)">❌ <b>'+j.summary.totalBroken+'</b> problemi</span>';
    if(j.summary.missingAlt)h2+='<span style="color:var(--orange)">♿ <b>'+j.summary.missingAlt+'</b> alt mancanti</span>';
    h2+='</div>';
    if(j.broken.length){
      h2+='<div style="margin-bottom:12px;font-size:13px;font-weight:600;color:var(--red)">Link/immagini rotti</div>';
      j.broken.forEach(function(b){
        var icon=b.type==='image'?'🖼️':'🔗';
        h2+='<div class="cover-row" style="cursor:default;border-color:rgba(200,80,80,.2)">'
          +'<div class="si" style="font-size:18px">'+icon+'</div>'
          +'<div class="cmain"><div class="ct" style="font-size:13px">'+esc(b.page)+'</div>'
          +'<div class="cs" style="font-family:var(--mono);font-size:11px">'+esc(b.target)+'</div>'
          +'<div class="cs">riga '+b.line+'</div></div></div>';
      });
    }
    if(j.warnings.length){
      h2+='<div style="margin:16px 0 12px;font-size:13px;font-weight:600;color:var(--orange)">Alt text mancanti</div>';
      j.warnings.slice(0,30).forEach(function(w){
        h2+='<div class="cover-row" style="cursor:default;border-color:rgba(200,150,60,.2)">'
          +'<div class="si" style="font-size:18px">♿</div>'
          +'<div class="cmain"><div class="ct" style="font-size:13px">'+esc(w.page)+'</div>'
          +'<div class="cs" style="font-family:var(--mono);font-size:11px">'+esc(w.target)+'</div>'
          +'<div class="cs">riga '+w.line+'</div></div></div>';
      });
      if(j.warnings.length>30)h2+='<div style="padding:8px;font-size:12px;color:var(--dim)">… e altre '+(j.warnings.length-30)+' occorrenze</div>';
    }
    body.innerHTML=h2;
  }catch(e){
    var body=document.getElementById('ls-body');
    if(body)body.innerHTML='<div style="padding:16px;color:var(--red)">❌ Errore: '+esc(e.message)+'</div>';
    toast('Errore: '+e.message,'error');
  }
}

/* ═══════════════ FIND & REPLACE GLOBALE ═══════════════ */
async function openGlobalFindReplace(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('find-replace');
  closeSidebar();
  setCrumb('Sistema','Trova & Sostituisci');
  setTitle('Trova & Sostituisci globale');
  var h=viewHead('🔍','Trova & Sostituisci','Cerca e sostituisce testo trasversale a tutte le pagine',
    '<button class="btn btn-soft" onclick="openGlobalFindReplace()">⟳ AGGIORNA</button>');
  h+='<div class="panel"><div class="panel-head"><h3>Cerca e sostituisci</h3></div><div style="padding:16px">';
  h+='<div class="fld"><label>Testo da cercare</label><input id="gfr-find" class="in" placeholder="es. Vecchio nome NPC" onkeydown="if(event.key===\'Enter\')globalFRPreview()"></div>';
  h+='<div class="fld"><label>Testo sostitutivo</label><input id="gfr-replace" class="in" placeholder="es. Nuovo nome NPC" onkeydown="if(event.key===\'Enter\')globalFRPreview()"></div>';
  h+='<div class="fld"><label><input type="checkbox" id="gfr-case"> Rispetta maiuscole/minuscole</label></div>';
  h+='<div style="display:flex;gap:8px;margin-top:8px">';
  h+='<button class="btn btn-soft" onclick="globalFRPreview()">ANTEPRIMA</button>';
  h+='<button class="btn btn-p" onclick="globalFRApply()">APPLICA A TUTTE</button>';
  h+='</div></div></div>';
  h+='<div class="panel"><div class="panel-head"><h3>Risultati</h3></div><div id="gfr-results" style="padding:16px;color:var(--dim);font-size:12px">Inserisci un testo e premi Anteprima</div></div>';
  document.getElementById('main').innerHTML=h;
}
async function globalFRPreview(){
  var find=(document.getElementById('gfr-find').value||'').trim();
  if(!find){toast('Inserisci un testo da cercare','error');return}
  var caseSensitive=document.getElementById('gfr-case').checked;
  setStatus('saving','ricerca…');
  var results=[];
  for(var i=0;i<PAGES.length;i++){
    try{
      var d=await ghGet(CONTENT+'/pages/'+PAGES[i].k+'.json');
      var json=JSON.parse(b64decode(d.content));
      var content=json.content||'';
      var regex=new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),caseSensitive?'g':'gi');
      var matches=content.match(regex);
      if(matches&&matches.length){
        results.push({page:PAGES[i].k,title:PAGES[i].l,count:matches.length,icon:PAGES[i].i});
      }
    }catch(e){}
  }
  var el=document.getElementById('gfr-results');
  if(!el)return;
  if(!results.length){
    el.innerHTML='<div style="padding:12px;color:var(--dim)">Nessun risultato per "'+esc(find)+'"</div>';
  }else{
    var total=results.reduce(function(s,r){return s+r.count},0);
    var h2='<div style="padding:0 0 8px;font-size:13px"><b>'+total+'</b> occorrenze in <b>'+results.length+'</b> pagine</div>';
    results.forEach(function(r){
      h2+='<div class="cover-row" style="cursor:default">'
        +'<div class="si">'+(r.icon||'📄')+'</div>'
        +'<div class="cmain"><div class="ct">'+esc(r.title||r.page)+'</div>'
        +'<div class="cs">'+r.count+' occorrenz'+(r.count===1?'a':'e')+'</div></div></div>';
    });
    el.innerHTML=h2;
  }
  setStatus('idle','pronto');
}
async function globalFRApply(){
  var find=(document.getElementById('gfr-find').value||'').trim();
  var replace=(document.getElementById('gfr-replace').value||'');
  if(!find){toast('Inserisci un testo da cercare','error');return}
  if(find===replace){toast('Cerca e sostituisci sono uguali','error');return}
  var caseSensitive=document.getElementById('gfr-case').checked;
  var ok=await uiConfirm('Sostituire "'+find+'" con "'+replace+'" in TUTTE le pagine?\n\nOperazione irreversibile. Verrà creato un commit per ogni pagina modificata.',{danger:true,ok:'APPLICA'});
  if(!ok)return;
  setStatus('saving','sostituzione…');
  var modified=0;
  for(var i=0;i<PAGES.length;i++){
    try{
      var path=CONTENT+'/pages/'+PAGES[i].k+'.json';
      var d=await ghGet(path);
      var json=JSON.parse(b64decode(d.content));
      var content=json.content||'';
      var regex=new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),caseSensitive?'g':'gi');
      var newContent=content.replace(regex,replace);
      if(newContent!==content){
        json.content=newContent;
        json.lastModified=new Date().toISOString();
        await ghPut(path,'admin: find&replace "'+find+'"→"'+replace+'" in '+PAGES[i].k,JSON.stringify(json,null,2),d.sha);
        modified++;
      }
    }catch(e){}
  }
  setStatus('ok','modificate '+modified+' pagine');
  toast(modified+' pagine modificate','success');
  if(modified)startDeployTimer();
}

/* ═══════════════ PULIZIA MEDIA ORFANI ═══════════════ */
async function openOrphanMedia(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('orphan-media');
  closeSidebar();
  setCrumb('Sistema','Media orfani');
  setTitle('Pulizia media orfani');
  setStatus('saving','ricerca media orfani…');
  var h=viewHead('🗑️','Media orfani','Trova e rimuovi immagini in /images/ non referenziate da nessuna pagina',
    '<button class="btn btn-p" onclick="openOrphanMedia()">⟳ RICERCA</button>');
  h+='<div class="panel"><div class="panel-head"><h3>Risultati</h3></div><div id="orphan-body" style="padding:16px;text-align:center;color:var(--dim)">⏳ Analisi in corso…</div></div>';
  document.getElementById('main').innerHTML=h;
  try{
    var r=await fetch('/api/admin?action=find_orphan_media',{credentials:'include'});
    var j=await r.json();
    if(j.error)throw new Error(j.error);
    var body=document.getElementById('orphan-body');
    if(!body)return;
    if(!j.orphans||!j.orphans.length){
      body.innerHTML='<div style="padding:20px"><span style="font-size:28px">✅</span><div style="margin-top:8px">Nessun file orfano trovato! Tutte le '+j.total+' immagini sono referenziate.</div></div>';
      return;
    }
    var h2='<div style="padding:8px 0 14px;font-size:13px"><b>'+j.orphans.length+'</b> file orfani trovati su '+j.total+' totali ('+j.referenced+' referenziati)</div>';
    h2+='<div style="display:flex;gap:8px;margin-bottom:12px"><button class="btn btn-d btn-sm" onclick="deleteSelectedOrphans()">🗑 ELIMINA SELEZIONATI</button><label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dim)"><input type="checkbox" id="orphan-select-all" onchange="toggleAllOrphans(this.checked)" checked> Seleziona tutti</label></div>';
    j.orphans.forEach(function(name){
      h2+='<div class="cover-row" style="cursor:default">'
        +'<input type="checkbox" class="orphan-cb" value="'+escAttr(name)+'" checked style="accent-color:var(--red)">'
        +'<div class="cover-thumb" style="background-image:url(/images/'+escAttr(name)+')"></div>'
        +'<div class="cmain"><div class="ct" style="font-family:var(--mono);font-size:12px">'+esc(name)+'</div>'
        +'<div class="cs">non referenziato da nessuna pagina</div></div></div>';
    });
    body.innerHTML=h2;
    window.__orphanFiles=j.orphans;
  }catch(e){
    var body=document.getElementById('orphan-body');
    if(body)body.innerHTML='<div style="padding:16px;color:var(--red)">❌ Errore: '+esc(e.message)+'</div>';
    toast('Errore: '+e.message,'error');
  }
}
function toggleAllOrphans(checked){
  document.querySelectorAll('.orphan-cb').forEach(function(cb){cb.checked=checked});
}
async function deleteSelectedOrphans(){
  var selected=[];
  document.querySelectorAll('.orphan-cb:checked').forEach(function(cb){selected.push(cb.value)});
  if(!selected.length){toast('Nessun file selezionato','error');return}
  var ok=await uiConfirm('Eliminare '+selected.length+' file immagine orfani?\n\nOperazione irreversibile. I file verranno rimossi da /images/ su GitHub.',{danger:true,ok:'ELIMINA'});
  if(!ok)return;
  setStatus('saving','eliminazione…');
  try{
    var r=await fetch('/api/admin?action=delete_orphan_media',{method:'POST',credentials:'include',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({filenames:selected})});
    var j=await r.json();
    if(j.error)throw new Error(j.error);
    toast(j.deleted.length+' file eliminati','success');
    await _logAudit('orphan_media_cleanup','images',{deleted:j.deleted.length});
    openOrphanMedia();
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}

/* ═══════════════ REGISTRAZIONE NAMESPACE ═══════════════ */
ArcAdmin.register('system', {
  openUsers: openUserManagement,
  openAudit: openAudit,
  addUserModal: openAddUserModal,
  saveNewUser: saveNewUser,
  editUserModal: openEditUserModal,
  saveEditUser: saveEditUser,
  deleteUser: deleteUserConfirm,
  auditFilter: audFilter,
  exportAuditCSV: exportAuditCSV,
  openTrash: openTrash,
  openLinkScanner: openLinkScanner,
  openLinkGraph: openLinkGraph,
  openGlobalFindReplace: openGlobalFindReplace,
  openActiveSessions: openActiveSessions,
  openOrphanMedia: openOrphanMedia
});
