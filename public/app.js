/* ════════════════════════════════════
   ARCAMIS — app.js
   Logica applicazione
   Dipende da: data.js, fx.js, notion-render.js
════════════════════════════════════ */

/* ── Loader ── */
window.addEventListener('load',function(){
  setTimeout(function(){var l=document.getElementById('site-loader');if(l)l.classList.add('hidden');},500);
});

/* ════ FONT SIZE ════ */
var _fs=parseFloat(localStorage.getItem('arc_font')||'1');
function applyFont(s){_fs=Math.max(.85,Math.min(1.3,s));document.documentElement.style.setProperty('--font-scale',_fs);localStorage.setItem('arc_font',_fs);}
applyFont(_fs);
function fontUp(){applyFont(_fs+.08);}
function fontDown(){applyFont(_fs-.08);}

/* ════ THEME ════ */
var _theme=localStorage.getItem('arc_theme')||'dark';
function applyTheme(t){
  _theme=t;document.body.classList.toggle('light',t==='light');
  var btn=document.getElementById('theme-toggle');if(btn)btn.textContent=t==='light'?'🌙':'☀️';
  localStorage.setItem('arc_theme',t);
}
applyTheme(_theme);
function toggleTheme(){applyTheme(_theme==='dark'?'light':'dark');}

/* ════ LOGO ════ */
(async function(){
  try{
    var r=await fetch('/api/notion?pageId='+ROOT);if(!r.ok)return;
    var d=await r.json();var icon=d.page&&d.page.icon;if(!icon)return;
    var url=icon.type==='file'?icon.file&&icon.file.url:icon.external&&icon.external.url;
    if(!url)return;
    var img=document.getElementById('li');
    img.onload=function(){img.style.display='block';document.getElementById('lf').style.display='none';};img.src=url;
  }catch(e){var img2=document.getElementById('li');if(img2){img2.src='Artboard_1.png';img2.style.display='block';var lf=document.getElementById('lf');if(lf)lf.style.display='none';}}
})();
(function(){var img=document.getElementById('li');if(img&&!img.src){img.src='Artboard_1.png';img.style.display='block';var lf=document.getElementById('lf');if(lf)lf.style.display='none';}})();

/* ════ CAROUSEL HERO ════ */
var slideIdx=0,slideTimer;
var track=document.getElementById('ctrack');
var slides=document.querySelectorAll('.slide');
var dots=document.querySelectorAll('.cdot');
function showSlide(n){
  slideIdx=n>=slides.length?0:n<0?slides.length-1:n;
  track.style.transform='translateX(-'+slideIdx*33.3333+'%)';
  slides.forEach(function(s,i){s.classList.toggle('active',i===slideIdx);});
  dots.forEach(function(d,i){d.classList.toggle('ca',i===slideIdx);});
}
function changeSlide(n){showSlide(slideIdx+n);resetTimer();}
function jumpToSlide(n){showSlide(n);resetTimer();}
function resetTimer(){clearInterval(slideTimer);slideTimer=setInterval(function(){showSlide(slideIdx+1);},7000);}
var _cw2=document.getElementById('carousel-wrap');
if(_cw2){_cw2.addEventListener('mouseenter',function(){clearInterval(slideTimer);});_cw2.addEventListener('mouseleave',function(){resetTimer();});}
showSlide(0);resetTimer();

/* ════ LOCATION CAROUSEL (homepage) ════ */
var _locIdx=0;
var _locTrack=document.getElementById('loc-track');
var _locCards=_locTrack?_locTrack.querySelectorAll('.loc-card'):[];
function _locArrows(){
  /* Carousel infinito: frecce sempre attive */
  var wrap=_locTrack?_locTrack.closest('.loc-wrap'):null;
  if(!wrap)return;
  var prev=wrap.querySelector('.la-prev'),next=wrap.querySelector('.la-next');
  if(prev){prev.style.opacity='1';prev.style.pointerEvents='auto';}
  if(next){next.style.opacity='1';next.style.pointerEvents='auto';}
}
function locSlide(dir){
  if(!_locTrack||!_locCards.length)return;
  var cardW=(_locCards[0].getBoundingClientRect().width)||260,gap=16,step=cardW+gap;
  var trackW=_locCards.length*step-gap;
  var outerW=(_locTrack.parentElement.getBoundingClientRect().width||840)-20;
  var maxIdx=Math.max(0,Math.ceil((trackW-outerW)/step));
  /* infinite loop */
  _locIdx=_locIdx+dir;
  if(_locIdx>maxIdx)_locIdx=0;
  if(_locIdx<0)_locIdx=maxIdx;
  _locTrack.style.transform='translateX(-'+(_locIdx*step)+'px)';
  _locArrows();
}
/* stato iniziale frecce dopo DOM ready */
document.addEventListener('DOMContentLoaded',function(){setTimeout(_locArrows,200);});

/* ════ PROGRESS BAR + TOPBAR SOLID + SCROLL-TOP ════ */
var _pb=document.getElementById('progress-bar');
var _mainEl=document.getElementById('main');
if(_mainEl){
  _mainEl.addEventListener('scroll',function(){
    var s=_mainEl.scrollTop,h=_mainEl.scrollHeight-_mainEl.clientHeight;
    if(_pb){var pv=document.getElementById('pv');_pb.style.width=(!pv||pv.style.display==='none')?'0':(h>0?Math.min(100,(s/h)*100):0)+'%';}
    var tb=document.getElementById('topbar');if(tb)tb.classList.toggle('solid',s>60);
    var stBtn=document.getElementById('scroll-top-btn');if(stBtn)stBtn.classList.toggle('vis',s>300);
  });
}
function goToTop(){
  var m=document.getElementById('main');
  if(!m)return;
  /* scrollTo con smooth non funziona su iOS Safari — uso scrollTop diretto */
  try{m.scrollTo({top:0,behavior:'smooth'});}catch(e){}
  m.scrollTop=0;
}
/* bind via JS per essere indipendenti dalla versione HTML in cache */
document.addEventListener('DOMContentLoaded',function(){
  var btn=document.getElementById('scroll-top-btn');
  if(btn)btn.onclick=function(){goToTop();};
});

/* ════ NAV — xfade ════ */
var _busy=false;
function xfade(hide,show,cb){
  if(_busy)return;_busy=true;
  hide.classList.add('fo');
  setTimeout(function(){
    hide.style.display='none';hide.classList.remove('fo');
    show.style.display='block';show.classList.add('fi');
    setTimeout(function(){show.classList.remove('fi');_busy=false;if(cb)cb();},220);
  },150);
}

/* ── hamburger ── */
function toggleMobileNav(){var mn=document.getElementById('mobile-nav'),hb=document.getElementById('hamburger');mn.classList.contains('open')?closeMobileNav():(mn.classList.add('open'),hb.classList.add('open'));}
function closeMobileNav(){var mn=document.getElementById('mobile-nav'),hb=document.getElementById('hamburger');mn.classList.remove('open');hb.classList.remove('open');}
window.addEventListener('resize',function(){if(window.innerWidth>768)closeMobileNav();});

/* ── dropdown — stopPropagation garantisce che i tn-item siano sempre cliccabili ── */
function toggleDd(id,ev){if(ev)ev.stopPropagation();var el=document.getElementById(id),wasOpen=el.classList.contains('open');closeDd();if(!wasOpen)el.classList.add('open');}
function closeDd(){document.querySelectorAll('.tn-drop.open').forEach(function(d){d.classList.remove('open');});}
document.addEventListener('click',function(e){if(!e.target.closest('.tn-drop'))closeDd();});
document.querySelectorAll('.tn-drop').forEach(function(d){d.addEventListener('click',function(e){e.stopPropagation();});});

/* ── setNav + showHome ── */
function setNav(v){document.querySelectorAll('.tn').forEach(function(el){el.classList.toggle('ta',el.dataset.v===v);});}
function showHome(fromPop){
  var hv=document.getElementById('hv'),pv=document.getElementById('pv');
  navStack=[];if(!fromPop)history.pushState({home:true},'',location.pathname);
  if(hv.style.display==='block'){_mainEl&&_mainEl.scrollTo({top:0,behavior:'smooth'});return;}
  xfade(pv,hv);setNav('home');document.title='Arcamis';setBnavActive('home');
}

/* ── popstate ── */
window.addEventListener('popstate',function(e){
  if(!e.state||e.state.home){showHome(true);return;}
  navStack=e.state.stack||[];
  var hv=document.getElementById('hv'),pv=document.getElementById('pv');
  if(hv.style.display==='block'){hv.style.display='none';pv.style.display='block';}
  document.getElementById('pbody').innerHTML='<div class="ldwrap"><div class="spin"></div></div>';
  if(_mainEl)_mainEl.scrollTo({top:0});
  var phCrumb=document.getElementById('ph-crumb');if(phCrumb)phCrumb.innerHTML=buildCrumb(e.state.label);
  document.title=(e.state.label||'Pagina')+' — Arcamis';
  _gpRender(e.state.id,e.state.label,e.state.icon);
});

/* ── ricerca full-text (Notion API + fallback locale) ── */
var _searchTimer=null;
function hsearch(q){
  var el=document.getElementById('sr');
  var qq=q.trim();
  if(!qq){el.classList.remove('open');return;}
  /* feedback immediato con risultati locali */
  var local=pages.filter(function(p){return p.l.toLowerCase().includes(qq.toLowerCase());});
  if(local.length){
    el.innerHTML=local.slice(0,5).map(function(p){
      return'<div class="sri" onmousedown="gp(\''+p.id+'\',\''+p.l.replace(/'/g,"\\'")+'\',\''+p.i+'\')">'
        +'<span class="si2">'+p.i+'</span><span class="sl">'+p.l+'</span>'
        +'<span class="sri-tag">nome</span></div>';
    }).join('');
    el.classList.add('open');
  }
  /* debounce: chiama Notion search dopo 350ms di pausa */
  clearTimeout(_searchTimer);
  _searchTimer=setTimeout(function(){_searchFull(qq);},350);
}
async function _searchFull(qq){
  var el=document.getElementById('sr');
  try{
    var r=await fetch('/api/notion?q='+encodeURIComponent(qq));
    if(!r.ok)return;
    var d=await r.json();
    if(!d.results||!d.results.length){
      /* nessun risultato dall'API — tieni quelli locali */
      return;
    }
    el.innerHTML=d.results.slice(0,10).map(function(p){
      var safe=p.title.replace(/'/g,"\\'");
      return'<div class="sri" onmousedown="gp(\''+p.id+'\',\''+safe+'\',\''+p.icon+'\')">'
        +'<span class="si2">'+p.icon+'</span><span class="sl">'+p.title+'</span>'
        +'</div>';
    }).join('');
    el.classList.add('open');
  }catch(e){/* mantieni risultati locali in caso di errore */}
}
function csearch(){document.getElementById('sr').classList.remove('open');}

/* ── quick links overlay ── */
var _ovql=document.getElementById('ov-ql');
if(_ovql){
  ['gameplay','regole','classi','locanda','gilda','pantheon','materiale','changelog'].forEach(function(k){
    var it=pages.find(function(p){return p.k===k;});if(!it)return;
    var d=document.createElement('div');d.className='ov-ql-item';
    d.innerHTML='<span class="qli">'+it.i+'</span><span>'+it.l+'</span>';
    d.onclick=function(){cv();gp(it.id,it.l,it.i);};_ovql.appendChild(d);
  });
}

/* ── deep-link ── */
(function(){var p=new URLSearchParams(location.search).get('p');if(!p)return;var pg=pages.find(function(x){return x.id===p;});gp(p,pg?pg.l:'Pagina',pg?pg.i:'📄');})();

/* ════ WIKI TOGGLE ════ */
function toggleWiki(){
  var wrap=document.getElementById('wiki-wrap'),arrow=document.getElementById('wiki-arrow');
  wrap.classList.toggle('wiki-open');arrow.textContent=wrap.classList.contains('wiki-open')?'▼':'▶';
}

/* ════ OVERLAY + DISCORD ════ */
async function aggiornaLocanda(){
  var list=document.getElementById('roster-list'),count=document.getElementById('avv-count');
  try{
    var res=await fetch('https://discord.com/api/guilds/'+GUILD+'/widget.json');
    var data=await res.json();
    if(data.members){
      count.innerText='['+data.presence_count+' presenti]';
      list.innerHTML=data.members.map(function(u){
        return'<div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid rgba(200,155,60,0.08)">'
          +'<img src="'+u.avatar_url+'" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--gold);padding:1px;background:var(--bg2)">'
          +'<div style="flex:1"><div style="font-family:\'Cinzel\';font-size:13px;color:var(--parch);font-weight:600">'+u.username+'</div>'
          +'<div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:5px">'
          +'<span style="width:6px;height:6px;background:#6aa020;border-radius:50%;box-shadow:0 0 6px #6aa020"></span> Online</div></div></div>';
      }).join('')||'<div style="text-align:center;color:var(--text3);padding:40px">La locanda è vuota.</div>';
    }
  }catch(e){list.innerHTML='<div style="text-align:center;color:var(--text3);padding:40px">Errore nella connessione.</div>';}
}
function ovo(){document.getElementById('overlay').style.display='block';aggiornaLocanda();renderRecenti();}
function cv(){document.getElementById('overlay').style.display='none';}

/* ════ KEYBOARD SHORTCUTS ════ */
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.shiftKey&&e.key==='Tab'){e.preventDefault();document.getElementById('overlay').style.display==='block'?cv():ovo();return;}
  if(e.key==='Escape'){
    var ov=document.getElementById('overlay');
    if(ov&&ov.style.display==='block'){cv();return;}
    closeDd();var pv2=document.getElementById('pv');if(pv2&&pv2.style.display!=='none')showHome();return;
  }
  if((e.key==='/'&&!e.ctrlKey&&!e.metaKey)||(e.key==='k'&&(e.ctrlKey||e.metaKey))){e.preventDefault();var si=document.getElementById('ts');if(si){si.focus();si.select();}return;}
  if(e.key==='ArrowLeft'&&e.altKey)history.back();
  if(e.key==='ArrowRight'&&e.altKey)history.forward();
});

/* ════ RECENTI ════ */
var _MAX_REC=5;
function addRecente(id,label,icon){
  var list=JSON.parse(localStorage.getItem('arc_rec')||'[]');
  list=list.filter(function(r){return r.id!==id;});
  list.unshift({id:id,label:label,icon:icon});
  localStorage.setItem('arc_rec',JSON.stringify(list.slice(0,_MAX_REC)));
  renderRecenti();
}
function renderRecenti(){
  var el=document.getElementById('ov-recenti');if(!el)return;
  var list=JSON.parse(localStorage.getItem('arc_rec')||'[]');
  if(!list.length){el.style.display='none';return;}
  el.style.display='block';
  el.innerHTML='<div class="ov-rec-label">Visitati di recente</div>'
    +list.map(function(r){return'<div class="ov-rec-item" onclick="cv();gp(\''+r.id+'\',\''+r.label.replace(/'/g,"\\'")+'\',\''+r.icon+'\')">'+'<span class="ov-rec-icon">'+r.icon+'</span><span>'+r.label+'</span></div>';}).join('');
}
renderRecenti();

/* ════ CHANGELOG BADGE ════ */
(async function(){
  try{
    var seen=localStorage.getItem('arc_cl_seen')||'';
    var r=await fetch('/api/notion?pageId='+CHANGELOG_ID);if(!r.ok)return;
    var d=await r.json();var ts=d.page&&d.page.last_edited_time;
    if(ts&&ts!==seen)document.querySelectorAll('.changelog-badge').forEach(function(b){b.classList.add('vis');});
  }catch(e){}
})();
function markChangelogSeen(){
  document.querySelectorAll('.changelog-badge').forEach(function(b){b.classList.remove('vis');});
  fetch('/api/notion?pageId='+CHANGELOG_ID).then(function(r){return r.json();})
    .then(function(d){if(d.page&&d.page.last_edited_time)localStorage.setItem('arc_cl_seen',d.page.last_edited_time);}).catch(function(){});
}

/* ════ PULL TO REFRESH ════ */
(function(){
  var ptr=document.getElementById('ptr-indicator'),sy=0,pulling=false;
  if(!_mainEl||!ptr)return;
  _mainEl.addEventListener('touchstart',function(e){if(_mainEl.scrollTop>5)return;sy=e.touches[0].clientY;pulling=true;},{passive:true});
  _mainEl.addEventListener('touchmove',function(e){if(!pulling)return;if(e.touches[0].clientY-sy>55)ptr.classList.add('vis');},{passive:true});
  _mainEl.addEventListener('touchend',function(e){
    if(!pulling)return;pulling=false;
    var dy=(e.changedTouches[0]||{clientY:sy}).clientY-sy;ptr.classList.remove('vis');
    if(dy>80){
      var pv3=document.getElementById('pv');
      if(pv3&&pv3.style.display!=='none'&&navStack.length){
        var cur=navStack[navStack.length-1];
        try{sessionStorage.removeItem('pg_'+cur.id);}catch(ex){}
        document.getElementById('pbody').innerHTML='<div class="ldwrap"><div class="spin"></div></div>';
        _gpRender(cur.id,cur.label,cur.icon);
      }else{location.reload();}
    }
  },{passive:true});
})();

/* ════ PREFETCH ════ */
function prefetchPage(id){
  var key='pg_'+id;
  /* salta se già in memoria o sessionStorage */
  if(window._memCache&&_memCache[key])return;
  try{if(sessionStorage.getItem(key))return;}catch(e){}
  fetch('/api/notion?pageId='+id).then(function(r){return r.ok?r.json():null;})
    .then(function(d){
      if(!d)return;
      /* salva in entrambi i livelli */
      if(window._memCache)_memCache[key]=d;
      try{sessionStorage.setItem(key,JSON.stringify(d));}catch(e){}
    }).catch(function(){});
}
window.addEventListener('load',function(){setTimeout(function(){PREFETCH_IDS.forEach(prefetchPage);},2500);});

/* ════ BOTTOM NAV ════ */
function setBnavActive(key){
  document.querySelectorAll('.bnav-item').forEach(function(el){el.classList.toggle('active',el.dataset.k===key);});
}
/* forza il binding del bottom nav lavori via JS, indipendente dall'HTML in cache */
document.addEventListener('DOMContentLoaded',function(){
  var lavoriBtn=document.querySelector('.bnav-item[data-k="lavori"]');
  if(lavoriBtn)lavoriBtn.onclick=function(){toggleMobileNav();};
});

/* ════ MAPPA INTERATTIVA ════ */
(function(){
  var tip=document.getElementById('map-tip'),tname=document.getElementById('mt-name'),
      tdesc=document.getElementById('mt-desc'),thint=document.getElementById('mt-hint'),
      mapEl=document.getElementById('arcamis-map');
  if(!tip||!mapEl)return;
  function moveTip(e){
    var rect=mapEl.getBoundingClientRect(),x=e.clientX-rect.left+16,y=e.clientY-rect.top-10;
    if(x+220>rect.width)x=e.clientX-rect.left-230;if(y+80>rect.height)y=e.clientY-rect.top-85;
    tip.style.left=x+'px';tip.style.top=y+'px';
  }
  function hideTip(){tip.classList.remove('vis');}
  window.closeSubMap=function(id){var p=document.getElementById(id);if(p)p.classList.remove('open');};
  document.querySelectorAll('.mpin').forEach(function(el){
    var nm=el.getAttribute('data-name')||'',ds=el.getAttribute('data-desc')||'',
        sb=el.getAttribute('data-sub')||'',id=el.getAttribute('data-id')||'';
    el.addEventListener('mouseenter',function(e){
      tname.textContent=nm;tdesc.textContent=ds;
      if(sb){thint.textContent='Clicca per esplorare →';thint.className='map-tip-hint sub';}
      else{thint.textContent='Clicca per aprire';thint.className='map-tip-hint';}
      tip.classList.add('vis');moveTip(e);
    });
    el.addEventListener('mousemove',moveTip);
    el.addEventListener('mouseleave',hideTip);
    el.addEventListener('click',function(){
      hideTip();
      if(sb){var p=document.getElementById('sub-'+sb);if(p)p.classList.add('open');}
      else if(id){gp(id,nm,'📍');}
    });
  });
  document.querySelectorAll('.mloc').forEach(function(el){
    var nm=el.getAttribute('data-name')||'',id=el.getAttribute('data-id')||'';
    el.addEventListener('click',function(){if(id)gp(id,nm,'📍');});
  });
})();
/* ════ TOAST — Notifiche del Destino ════ */
(function(){
  var _wrap=null;
  function ensureWrap(){
    if(_wrap)return _wrap;
    _wrap=document.createElement('div');
    _wrap.id='toast-wrap';
    document.body.appendChild(_wrap);
    return _wrap;
  }
  window.showToast=function(msg,icon,dur){
    var w=ensureWrap();
    var t=document.createElement('div');
    t.className='arc-toast';
    t.innerHTML='<span class="arc-toast-icon">'+(icon||'✦')+'</span><span class="arc-toast-msg">'+msg+'</span>';
    w.appendChild(t);
    requestAnimationFrame(function(){t.classList.add('in');});
    setTimeout(function(){
      t.classList.remove('in');t.classList.add('out');
      setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},400);
    },dur||2800);
  };
})();

/* ════ WHISPER SIDEBAR — indice sezioni rapido ════ */
function buildWhisperNav(){
  var existing=document.getElementById('whisper-nav');
  if(existing)existing.remove();
  var pb=document.getElementById('pbody');
  if(!pb||document.getElementById('pv').style.display==='none')return;
  var heads=pb.querySelectorAll('.n-h1,.n-h2');
  if(heads.length<2)return;
  var nav=document.createElement('nav');
  nav.id='whisper-nav';
  /* assegna ID agli heading se mancano */
  heads.forEach(function(h,i){
    if(!h.id)h.id='wsec-'+i;
    var dot=document.createElement('a');
    dot.className='wn-dot';
    dot.href='#';
    dot.setAttribute('data-label',h.textContent.trim().slice(0,32));
    dot.addEventListener('click',function(e){
      e.preventDefault();
      h.scrollIntoView({behavior:'smooth',block:'start'});
    });
    nav.appendChild(dot);
  });
  document.body.appendChild(nav);
}
/* rebuilda ogni volta che si naviga */
var _origGpRender=window._gpRenderDone;
/* hook sul completamento della pagina */
(function(){
  var _origAfter=window.afterPageRender;
  window.afterPageRender=function(){
    if(_origAfter)_origAfter();
    setTimeout(buildWhisperNav,300);
  };
})();
/* ════ COPY LINK ════ */
window.copyPageLink=function(){
  var url=location.href;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){
      showToast('Link copiato','🔗',2400);
    }).catch(function(){fallbackCopy(url);});
  }else{fallbackCopy(url);}
};
function fallbackCopy(text){
  var ta=document.createElement('textarea');
  ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');showToast('Link copiato','🔗',2400);}
  catch(e){showToast('Impossibile copiare','⚠️',2400);}
  document.body.removeChild(ta);
}
