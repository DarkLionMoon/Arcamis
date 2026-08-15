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
      '<input id="aud-q" class="in" style="width:200px" placeholder="Filtra…" oninput="audFilter(this.value)">'
      +'<button class="btn btn-p" onclick="openAudit()">⟳ AGGIORNA</button>');
    h+='<div class="panel"><div class="panel-head"><h3>Eventi</h3><span class="hint">'+_auditEntries.length+' registrati</span></div>'
      +'<div id="aud-body">'+_auditRender('')+'</div></div>';
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
function _auditRender(q){
  var entries=_auditEntries;
  if(q){q=q.toLowerCase();entries=entries.filter(function(e){return (e.action||'').toLowerCase().indexOf(q)!==-1||(e.target||'').toLowerCase().indexOf(q)!==-1})}
  if(!entries.length)return '<div class="empty"><span class="ei">🗒️</span>Nessun evento'+(q?' per "'+esc(q)+'"':'')+'</div>';
  return entries.map(function(e){
    return '<div class="act-item"><div class="act-dot" style="background:'+_auditColor(e.action)+'"></div>'
      +'<div class="act-main"><div class="act-t">'+_auditIcon(e.action)+' <b>'+esc(e.action||'')+'</b> → '+esc(e.target||'')+'</div>'
      +'<div class="act-s">'+esc(dateFmt(e.timestamp))+(e.extra?' · '+esc(e.extra):'')+'</div></div></div>';
  }).join('');
}
function audFilter(q){var b=document.getElementById('aud-body');if(b)b.innerHTML=_auditRender(q)}

/* ═══════════════ BOOT ═══════════════ */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    ['img-modal','hist-modal','lk-modal','cs-modal','np-modal','rn-modal','nr-modal','cv-modal','au-modal','eu-modal'].forEach(function(id){
      closeModal(id);
    });
  }
});
(function(){
  var dv=localStorage.getItem('arc_view_default');
  if(dv==='md'||dv==='pv')_viewMode=dv;
  var user=sessionStorage.getItem('arcadmin');
  if(user){
    _currentUser=sessionStorage.getItem('arcadmin_user')||'admin';
    _userRole=sessionStorage.getItem('arcadmin_role')||'admin';
    fetch('/api/admin?action=check',{credentials:'include'}).then(function(r){return r.json()}).then(function(j){
      if(j&&j.ok){
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
