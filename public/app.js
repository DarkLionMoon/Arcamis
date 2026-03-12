/* ════════════════════════════════════
   ARCAMIS — app.js
   Logica completa (static-first)
════════════════════════════════════ */

/* ── Loader Iniziale ── */
window.addEventListener('load', function() {
  setTimeout(function() {
    var l = document.getElementById('site-loader');
    if (l) l.classList.add('hidden');
  }, 500);
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
  _theme=t;
  document.body.classList.toggle('light',t==='light');
  var btn=document.getElementById('theme-toggle');
  if(btn)btn.textContent=t==='light'?'🌙':'☀️';
  localStorage.setItem('arc_theme',t);
}
applyTheme(_theme);
function toggleTheme(){applyTheme(_theme==='dark'?'light':'dark');}

/* ════ LOGO ════ */
(function(){
  var logo=document.getElementById('tlogo');
  if(logo)logo.addEventListener('click',function(){showHome();});
})();

/* ════ HERO CAROUSEL ════ */
var slideIdx=0,slideTimer=null;
var _slides=document.querySelectorAll('.slide');
function showSlide(n){
  if(!_slides.length)return;
  _slides[slideIdx].classList.remove('active');
  slideIdx=((n%_slides.length)+_slides.length)%_slides.length;
  _slides[slideIdx].classList.add('active');
  document.querySelectorAll('.cdot').forEach(function(d,i){d.classList.toggle('on',i===slideIdx);});
}
function changeSlide(n){showSlide(slideIdx+n);resetTimer();}
function jumpToSlide(n){showSlide(n);resetTimer();}
function resetTimer(){clearInterval(slideTimer);slideTimer=setInterval(function(){showSlide(slideIdx+1);},7000);}
var _cw2=document.getElementById('carousel-wrap');
if(_cw2)resetTimer();

/* ════ LOCATION CAROUSEL (homepage) ════ */
var _locIdx=0;
var _locTrack=document.getElementById('loc-track');
var _locCards=_locTrack?_locTrack.querySelectorAll('.loc-card'):[];
function _locArrows(){
  var wrap=_locTrack?_locTrack.closest('.loc-wrap'):null;
  if(!wrap)return;
  var prev=wrap.querySelector('.la-prev'),next=wrap.querySelector('.la-next');
  var cardW=_locCards.length?(_locCards[0].getBoundingClientRect().width||260):260,gap=16,step=cardW+gap;
  var trackW=_locCards.length*step-gap;
  var outerW=_locTrack?(_locTrack.parentElement.getBoundingClientRect().width||840)-20:840;
  var maxIdx=Math.max(0,Math.ceil((trackW-outerW)/step));
  if(prev){prev.style.opacity=_locIdx<=0?'0.2':'1';prev.style.pointerEvents=_locIdx<=0?'none':'auto';}
  if(next){next.style.opacity=_locIdx>=maxIdx?'0.2':'1';next.style.pointerEvents=_locIdx>=maxIdx?'none':'auto';}
}
function locSlide(dir){
  if(!_locTrack||!_locCards.length)return;
  var cardW=(_locCards[0].getBoundingClientRect().width)||260,gap=16,step=cardW+gap;
  var trackW=_locCards.length*step-gap;
  var outerW=(_locTrack.parentElement.getBoundingClientRect().width||840)-20;
  var maxIdx=Math.max(0,Math.ceil((trackW-outerW)/step));
  _locIdx=Math.min(maxIdx,Math.max(0,_locIdx+dir));
  _locTrack.style.transform='translateX(-'+(_locIdx*step)+'px)';
  _locArrows();
}
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
function goToTop(){var m=document.getElementById('main');if(!m)return;try{m.scrollTo({top:0,behavior:'smooth'});}catch(e){m.scrollTop=0;}}

/* ════ NAV ════ */
var _busy=false;
function xfade(hide,show,cb){
  if(!hide||!show)return;
  hide.classList.add('fo');
  setTimeout(function(){
    hide.style.display='none';hide.classList.remove('fo');
    show.style.display='block';show.style.opacity='0';
    requestAnimationFrame(function(){show.style.transition='opacity .3s';show.style.opacity='1';});
    if(cb)cb();
  },200);
}
function toggleMobileNav(){var mn=document.getElementById('mobile-nav'),hb=document.getElementById('hamburger');mn.classList.contains('open')?closeMobileNav():(mn.classList.add('open'),hb&&hb.classList.add('open'));}
function closeMobileNav(){var mn=document.getElementById('mobile-nav'),hb=document.getElementById('hamburger');if(mn)mn.classList.remove('open');if(hb)hb.classList.remove('open');}
window.addEventListener('resize',function(){if(window.innerWidth>768)closeMobileNav();});

/* ── dropdown — stopPropagation garantisce che i tn-item siano sempre cliccabili ── */
function toggleDd(id,ev){if(ev)ev.stopPropagation();var el=document.getElementById(id),wasOpen=el.classList.contains('open');closeDd();if(!wasOpen)el.classList.add('open');}
function closeDd(){document.querySelectorAll('.tn-drop.open').forEach(function(d){d.classList.remove('open');});}
document.addEventListener('click',function(e){if(!e.target.closest('.tn-drop'))closeDd();});
document.querySelectorAll('.tn-drop').forEach(function(d){d.addEventListener('click',function(e){e.stopPropagation();});});

function setNav(v){document.querySelectorAll('.tn').forEach(function(el){el.classList.toggle('ta',el.dataset.v===v);});}
function showHome(fromPop){
  closeDd();
  var pv2=document.getElementById('pv');if(pv2&&pv2.style.display!=='none')showHomeAnim();
  document.title='Arcamis';
  if(!fromPop)history.pushState(null,'',location.pathname);
  setNav('');
}
function showHomeAnim(){
  var hv=document.getElementById('hv'),pv=document.getElementById('pv');
  if(hv&&pv&&pv.style.display!=='none')xfade(pv,hv);
}

window.addEventListener('popstate',function(e){
  if(e.state&&e.state.id){
    if(typeof gp==='function')gp(e.state.id,e.state.label||'Pagina',e.state.icon||'📄',true);
  }else{
    showHome(true);
  }
});

/* ── deep-link ── */
(function(){var p=new URLSearchParams(location.search).get('p');if(!p)return;var pg=pages.find(function(x){return x.id===p;});if(typeof gp==='function')gp(p,pg?pg.l:'Pagina',pg?pg.i:'📄');})();

/* ════ RICERCA ════ */
var _searchTimer=null;
function hsearch(q){
  q=(q||'').toLowerCase().trim();
  var res=document.getElementById('h-results');if(!res)return;
  if(!q){res.innerHTML='';res.classList.remove('open');return;}
  var hits=pages.filter(function(p){return p.l.toLowerCase().includes(q)||p.k.toLowerCase().includes(q);});
  if(hits.length){
    res.innerHTML=hits.map(function(p){
      return'<div class="h-res-item" onclick="gp(\''+p.id+'\',\''+p.l+'\',\''+p.i+'\');document.getElementById(\'ts\').value=\'\'">'+
        '<span class="qli">'+p.i+'</span><span>'+p.l+'</span></div>';
    }).join('');
    res.classList.add('open');
  }else{
    clearTimeout(_searchTimer);
    _searchTimer=setTimeout(function(){_searchFull(q);},350);
    res.innerHTML='<div class="h-res-item" style="opacity:.5;font-size:11px">Ricerca in corso…</div>';
    res.classList.add('open');
  }
}
async function _searchFull(qq){
  try{
    var r=await fetch('/api/notion?q='+encodeURIComponent(qq));
    if(!r.ok)return;
    var d=await r.json();
    var res=document.getElementById('h-results');if(!res)return;
    if(d.results&&d.results.length){
      res.innerHTML=d.results.map(function(it){
        return'<div class="h-res-item" onclick="gp(\''+it.id+'\',\''+it.title+'\',\''+it.icon+'\');document.getElementById(\'ts\').value=\'\'">'+
          '<span class="qli">'+it.icon+'</span><span>'+it.title+'</span></div>';
      }).join('');
    }else{
      res.innerHTML='<div class="h-res-item" style="opacity:.5;font-size:11px">Nessun risultato</div>';
    }
  }catch(e){}
}
function csearch(){var r=document.getElementById('sr');if(r)r.classList.remove('open');}

/* ════ OVERLAY (Discord live) ════ */
var _ovql=document.getElementById('ov-ql');
function renderRecenti(){
  if(!_ovql)return;
  var rec=JSON.parse(localStorage.getItem('arc_rec')||'[]');
  _ovql.innerHTML=rec.length?rec.map(function(it){
    var d=document.createElement('div');d.className='ov-ql-item';
    d.innerHTML='<span class="qli">'+it.i+'</span><span>'+it.l+'</span>';
    d.onclick=function(){cv();gp(it.id,it.l,it.i);};
    return d.outerHTML;
  }).join(''):'<div style="opacity:.5;font-size:12px;padding:8px">Nessuna pagina recente</div>';
}
async function aggiornaLocanda(){
  var el=document.getElementById('ov-locanda');if(!el)return;
  el.textContent='…';
  try{
    var r=await fetch('/api/notion?pageId='+CHANGELOG_ID);
    if(!r.ok)throw new Error();
    var d=await r.json();
    var bl=(d.blocks||[]).find(function(b){return b.type==='paragraph'&&b.paragraph&&b.paragraph.rich_text&&b.paragraph.rich_text.length;});
    if(bl)el.textContent=bl.paragraph.rich_text.map(function(t){return t.plain_text;}).join('').slice(0,120);
  }catch(e){el.textContent='—';}
}
function ovo(){var ov=document.getElementById('overlay');if(ov){ov.style.display='block';renderRecenti();}}
function cv(){var ov=document.getElementById('overlay');if(ov)ov.style.display='none';}

/* ════ RECENTI ════ */
var _MAX_REC=5;
function addRecente(id,label,icon){
  var rec=JSON.parse(localStorage.getItem('arc_rec')||'[]');
  rec=rec.filter(function(x){return x.id!==id;});
  rec.unshift({id:id,l:label,i:icon});
  localStorage.setItem('arc_rec',JSON.stringify(rec.slice(0,_MAX_REC)));
}

/* ════ CHANGELOG BADGE ════ */
function markChangelogSeen(){
  var d=new Date().toDateString();
  localStorage.setItem('arc_cl_seen',d);
  document.querySelectorAll('.changelog-badge').forEach(function(b){b.style.display='none';});
}
(function(){
  try{
    var seen=localStorage.getItem('arc_cl_seen');
    var today=new Date().toDateString();
    if(seen!==today){
      document.querySelectorAll('.changelog-badge').forEach(function(b){b.style.display='block';});
    }
  }catch(e){}
})();

/* ════ WIKI TOGGLE ════ */
function toggleWiki(){
  var wrap=document.getElementById('wiki-wrap'),arrow=document.getElementById('wiki-arrow');
  if(!wrap)return;
  var open=wrap.classList.toggle('open');
  if(arrow)arrow.style.transform=open?'rotate(180deg)':'';
}

/* ════ SUBMAP ════ */
function closeSubMap(id){var el=document.getElementById(id);if(el)el.classList.remove('open');}

/* ════ KEYBOARD SHORTCUTS ════ */
document.addEventListener('keydown',function(e){
  if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
    e.preventDefault();var ts=document.getElementById('ts');if(ts){ts.focus();ts.select();}
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){
    e.preventDefault();var ts2=document.getElementById('ts');if(ts2){ts2.focus();ts2.select();}
  }
  if(e.key==='Escape'){closeDd();csearch();}
});

/* bind via JS per essere indipendenti dalla versione HTML in cache */
(function(){
  var ts=document.getElementById('ts');
  if(ts)ts.addEventListener('input',function(){hsearch(this.value);});
})();

/* ════ BOTTOM NAV ════ */
function setBnavActive(key){
  document.querySelectorAll('.bnav-item').forEach(function(el){el.classList.toggle('active',el.dataset.k===key);});
}

/* ════ PULL TO REFRESH ════ */
(function(){
  var ptr=document.getElementById('ptr-indicator');
  if(!ptr||!('ontouchstart' in window))return;
  var startY=0,pulling=false;
  document.addEventListener('touchstart',function(e){startY=e.touches[0].clientY;},{ passive:true});
  document.addEventListener('touchmove',function(e){
    var m=document.getElementById('main');
    if(!m||m.scrollTop>0)return;
    var dy=e.touches[0].clientY-startY;
    if(dy>50&&!pulling){pulling=true;ptr.classList.add('vis');}
  },{passive:true});
  document.addEventListener('touchend',function(){
    if(pulling){location.reload();}
    pulling=false;ptr.classList.remove('vis');
  });
})();

/* ════ PREFETCH ════ */
function prefetchPage(id){
  var key='pg_'+id;
  if(window._memCache&&_memCache[key])return;
  try{if(sessionStorage.getItem(key))return;}catch(e){}
  /* prova prima file statico */
  fetch('/data/pages/'+id+'.json').then(function(r){return r.ok?r.json():null;})
    .then(function(d){
      if(!d)return;
      var normalized=window.normalizePageData?normalizePageData(d):d;
      if(window._memCache)_memCache[key]=normalized;
      try{sessionStorage.setItem(key,JSON.stringify(normalized));}catch(e){}
    }).catch(function(){});
}
window.addEventListener('load',function(){setTimeout(function(){PREFETCH_IDS.forEach(prefetchPage);},2500);});

/* ════ TOAST — Notifiche del Destino ════ */
(function(){
  var _wrap=null;
  function ensureWrap(){
    if(_wrap)return _wrap;
    _wrap=document.createElement('div');_wrap.id='toast-wrap';
    document.body.appendChild(_wrap);return _wrap;
  }
  window.showToast=function(msg,icon,dur){
    var w=ensureWrap();
    var t=document.createElement('div');t.className='arc-toast';
    t.innerHTML='<span class="arc-toast-icon">'+(icon||'✦')+'</span><span class="arc-toast-msg">'+msg+'</span>';
    w.appendChild(t);
    requestAnimationFrame(function(){t.classList.add('in');});
    setTimeout(function(){t.classList.remove('in');t.classList.add('out');setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},400);},dur||2800);
  };
})();

/* ════ WHISPER SIDEBAR — indice sezioni ════ */
function buildWhisperNav(){
  var existing=document.getElementById('whisper-nav');if(existing)existing.remove();
  var pb=document.getElementById('pbody');
  if(!pb||document.getElementById('pv').style.display==='none')return;
  var heads=pb.querySelectorAll('.n-h1,.n-h2');if(heads.length<2)return;
  var nav=document.createElement('nav');nav.id='whisper-nav';
  heads.forEach(function(h,i){
    if(!h.id)h.id='wsec-'+i;
    var dot=document.createElement('a');dot.className='wn-dot';dot.href='#';
    dot.setAttribute('data-label',h.textContent.trim().slice(0,32));
    dot.addEventListener('click',function(e){e.preventDefault();h.scrollIntoView({behavior:'smooth',block:'start'});});
    nav.appendChild(dot);
  });
  document.body.appendChild(nav);
}

/* ════ COPY LINK ════ */
window.copyPageLink=function(){
  var url=location.href;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){if(window.showToast)showToast('Link copiato','🔗',2400);}).catch(function(){fallbackCopy(url);});
  }else{fallbackCopy(url);}
};
function fallbackCopy(text){
  var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');if(window.showToast)showToast('Link copiato','🔗',2400);}catch(e){}
  document.body.removeChild(ta);
}
