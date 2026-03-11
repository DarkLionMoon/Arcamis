var ROOT='2f00274fdc1c801a9b39d8d69800f7a8';
var GUILD='1348723468157456425';

var pages=[
  {k:'gameplay',l:'Gameplay',i:'⚔️',id:'2f00274fdc1c8065a11ff45192aa5dcb'},
  {k:'regole',l:'Regole',i:'📜',id:'2f00274fdc1c800b9d8fc366e8e40c5c'},
  {k:'materiale',l:'Materiale approvato',i:'📋',id:'3130274fdc1c807eb61fde24e8236659'},
  {k:'inizia',l:'Come si inizia',i:'🌟',id:'2dd222f22ef8413f8cb48f03bbb4f4b0'},
  {k:'avanti',l:'Andando avanti',i:'📈',id:'5cea525d149f4acb9c59007bf6b3d5ff'},
  {k:'classi',l:'Classi',i:'🎭',id:'30a0274fdc1c804ab56bd3943add26d2'},
  {k:'galleria',l:'Galleria PG',i:'🖼️',id:'2fd0274fdc1c80d8b948c4133f874f28'},
  {k:'biblioteca',l:'Biblioteca',i:'📚',id:'2f00274fdc1c8089bfe6c24434d53b67'},
  {k:'bottega',l:'Bottega farmaceutica',i:'💊',id:'2f00274fdc1c801c9697e75caa8d5f13'},
  {k:'caserma',l:'Caserma',i:'🛡️',id:'2ff0274fdc1c80688dd6c2b293a1f626'},
  {k:'corp',l:'Corporazione costruttori',i:'🔨',id:'2ff0274fdc1c80769a4ae243f22f0582'},
  {k:'forgia',l:'Forgia',i:'🔥',id:'2f00274fdc1c805ca01ec57f18d2ffee'},
  {k:'gilda',l:'Gilda degli avventurieri',i:'🗡️',id:'2f00274fdc1c801b8c13cefd9e15694e'},
  {k:'locanda',l:'Locanda',i:'🍺',id:'2f00274fdc1c80faa99eda064ef0fabc'},
  {k:'ospedale',l:'Ospedale',i:'⚕️',id:'2f00274fdc1c807aa03cc6cbeb3687cc'},
  {k:'sartoria',l:'Sartoria',i:'🧵',id:'2ff0274fdc1c8035bad4f0b6ab705192'},
  {k:'pantheon',l:'Pantheon',i:'🛐',id:'2f00274fdc1c80679bd3c3df8a1fa040'},
  {k:'changelog',l:'Changelog',i:'📝',id:'3000274fdc1c8033a214c44a1aa7f01f'},
  {k:'maestria',l:'Maestria / Titoli ed altro',i:'🔨',id:'2f00274fdc1c802a9babd4239d97a319'},
  {k:'lore',l:'Lore',i:'📚',id:'2f00274fdc1c806f8f17dbc6532d2211'},
  {k:'homebrew',l:'Homebrew',i:'❓',id:'2f00274fdc1c80e78ad7ce985007b7c6'},
  {k:'mappe',l:'Mappe',i:'🗺️',id:'2f10274fdc1c80489f23c49164747770'},
];

/* ── Build overlay quick links ── */
var _ovql=document.getElementById('ov-ql');
if(_ovql){
  ['gameplay','regole','classi','locanda','gilda','pantheon','materiale','changelog'].forEach(function(k){
    var it=pages.find(function(p){return p.k===k});if(!it)return;
    var d=document.createElement('div');d.className='ov-ql-item';
    d.innerHTML='<span class="qli">'+it.i+'</span><span>'+it.l+'</span>';
    d.onclick=function(){cv();gp(it.id,it.l,it.i)};
    _ovql.appendChild(d);
  });
}

/* ══════════════════════════════
   CAROUSEL
══════════════════════════════ */
var slideIdx=0;var slideTimer;
var track=document.getElementById('ctrack');
var slides=document.querySelectorAll('.slide');
var dots=document.querySelectorAll('.cdot');

function showSlide(n){
  if(n>=slides.length) slideIdx=0;
  else if(n<0) slideIdx=slides.length-1;
  else slideIdx=n;
  track.style.transform='translateX(-'+slideIdx*33.3333+'%)';
  slides.forEach(function(s,i){s.classList.toggle('active',i===slideIdx)});
  dots.forEach(function(d,i){d.classList.toggle('ca',i===slideIdx)});
}
function changeSlide(n){showSlide(slideIdx+n);resetTimer();}
function jumpToSlide(n){showSlide(n);resetTimer();}
function resetTimer(){clearInterval(slideTimer);slideTimer=setInterval(function(){showSlide(slideIdx+1)},7000);}

// Pausa su hover
var _cw2=document.getElementById('carousel-wrap');
if(_cw2){
  _cw2.addEventListener('mouseenter',function(){clearInterval(slideTimer)});
  _cw2.addEventListener('mouseleave',function(){resetTimer()});
}

// Init
showSlide(0);
resetTimer();

/* ── Load server icon ── */
(async function(){
  try{
    var r=await fetch('/api/notion?pageId='+ROOT);
    if(!r.ok)return;
    var d=await r.json();
    var icon=d.page&&d.page.icon;if(!icon)return;
    var url=icon.type==='file'?icon.file&&icon.file.url:icon.external&&icon.external.url;
    if(!url)return;
    var img=document.getElementById('li');
    img.onload=function(){img.style.display='block';document.getElementById('lf').style.display='none'};
    img.src=url;
  }catch(e){
    // fallback to local logo
    var img2=document.getElementById('li');
    if(img2){img2.src='Artboard_1.png';img2.style.display='block';var lf=document.getElementById('lf');if(lf)lf.style.display='none';}
  }
})();
// Also preload local logo as immediate fallback
(function(){
  var img=document.getElementById('li');
  if(img&&!img.src){img.src='Artboard_1.png';img.style.display='block';var lf=document.getElementById('lf');if(lf)lf.style.display='none';}
})();

/* ══════════════════════════════
   GLOSSY SHINE
══════════════════════════════ */
function attachShine(root){
  (root||document).querySelectorAll('.lcard').forEach(function(card){
    var shine=card.querySelector('.shine');if(!shine)return;
    card.addEventListener('mousemove',function(e){
      var rc=card.getBoundingClientRect();
      var x=((e.clientX-rc.left)/rc.width)*100;
      var y=((e.clientY-rc.top)/rc.height)*100;
      shine.style.background='radial-gradient(circle at '+x+'% '+y+'%,rgba(255,255,255,.11) 0%,rgba(255,255,255,.04) 26%,transparent 58%)';
    });
    card.addEventListener('mouseleave',function(){
      shine.style.background='radial-gradient(circle at 50% 50%,rgba(255,255,255,.07) 0%,transparent 58%)';
    });
  });
}
attachShine();

/* ══════════════════════════════
   NAVIGATION
══════════════════════════════ */
var _busy=false;
function xfade(hide,show,cb){
  if(_busy)return;_busy=true;
  hide.classList.add('fo');
  setTimeout(function(){
    hide.style.display='none';hide.classList.remove('fo');
    show.style.display='block';show.classList.add('fi');
    setTimeout(function(){show.classList.remove('fi');_busy=false;if(cb)cb()},220);
  },150);
}
/* ══════════════════════════════
   HAMBURGER MOBILE
══════════════════════════════ */
function toggleMobileNav(){
  var mn=document.getElementById('mobile-nav');
  var hb=document.getElementById('hamburger');
  var isOpen=mn.classList.contains('open');
  if(isOpen){closeMobileNav();}
  else{mn.classList.add('open');hb.classList.add('open');}
}
function closeMobileNav(){
  var mn=document.getElementById('mobile-nav');
  var hb=document.getElementById('hamburger');
  mn.classList.remove('open');
  hb.classList.remove('open');
}
// Chiudi mobile nav al resize desktop
window.addEventListener('resize',function(){if(window.innerWidth>768)closeMobileNav();});

/* ══════════════════════════════
   DROPDOWN NAV
══════════════════════════════ */
function toggleDd(id){
  var el=document.getElementById(id);
  var wasOpen=el.classList.contains('open');
  closeDd();
  if(!wasOpen)el.classList.add('open');
}
function closeDd(){
  document.querySelectorAll('.tn-drop.open').forEach(function(d){d.classList.remove('open')});
}
// Close dropdown on outside click
document.addEventListener('click',function(e){
  if(!e.target.closest('.tn-drop'))closeDd();
});
// Close on ESC
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDd()});

function setNav(v){
  document.querySelectorAll('.tn').forEach(function(el){el.classList.toggle('ta',el.dataset.v===v)});
}
function showHome(){
  var hv=document.getElementById('hv'),pv=document.getElementById('pv');
  if(hv.style.display==='block'){document.getElementById('main').scrollTo({top:0,behavior:'smooth'});return}
  xfade(pv,hv);setNav('home');document.title='Arcamis';
}
function hsearch(q){
  var el=document.getElementById('sr');var qq=q.toLowerCase().trim();
  if(!qq){el.classList.remove('open');return}
  var res=pages.filter(function(p){return p.l.toLowerCase().includes(qq)});
  if(!res.length){el.classList.remove('open');return}
  el.innerHTML=res.slice(0,8).map(function(p){
    return'<div class="sri" onmousedown="gp(\''+p.id+'\',\''+p.l.replace(/'/g,"\\'")+'\',\''+p.i+'\')">'
      +'<span class="si2">'+p.i+'</span><span class="sl">'+p.l+'</span></div>';
  }).join('');
  el.classList.add('open');
}
function csearch(){document.getElementById('sr').classList.remove('open')}

/* ══════════════════════════════
   OVERLAY + DISCORD LIVE
══════════════════════════════ */
async function aggiornaLocanda() {
  var guildId='1348723468157456425';
  var list=document.getElementById('roster-list');
  var count=document.getElementById('avv-count');
  try{
    var res=await fetch('https://discord.com/api/guilds/'+guildId+'/widget.json');
    var data=await res.json();
    if(data.members){
      count.innerText='['+data.presence_count+' presenti]';
      var html='';
      data.members.forEach(function(user){
        html+='<div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid rgba(200,155,60,0.08);transition:background .2s;">'
          +'<img src="'+user.avatar_url+'" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--gold);padding:1px;background:var(--bg2);">'
          +'<div style="flex:1">'
          +'<div style="font-family:\'Cinzel\';font-size:13px;color:var(--parch);font-weight:600;">'+user.username+'</div>'
          +'<div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:5px;">'
          +'<span style="width:6px;height:6px;background:#6aa020;border-radius:50%;box-shadow:0 0 6px #6aa020;"></span> Online'
          +'</div></div></div>';
      });
      list.innerHTML=html||'<div style="text-align:center;color:var(--text3);padding:40px;">La locanda è attualmente vuota.</div>';
    }
  }catch(e){
    list.innerHTML='<div style="text-align:center;color:var(--text3);padding:40px;">Errore magico nella connessione.</div>';
  }
}
function ovo(){document.getElementById('overlay').style.display='block';aggiornaLocanda();}
function cv(){document.getElementById('overlay').style.display='none';}
document.addEventListener('keydown',function(e){
  if(e.shiftKey&&e.key==='Tab'){e.preventDefault();
    document.getElementById('overlay').style.display==='block'?cv():ovo();}
  if(e.key==='Escape')cv();
});

/* ══════════════════════════════
   PROGRESS BAR
══════════════════════════════ */
var _pb=document.getElementById('progress-bar');
document.getElementById('main').addEventListener('scroll',function(){
  var m=this,s=m.scrollTop,h=m.scrollHeight-m.clientHeight;
  _pb.style.width=(h>0?(s/h*100):0)+'%';
  // topbar solid after scrolling past carousel
  var tb=document.getElementById('topbar');
  tb.classList.toggle('solid', s > 60);
});

/* ══════════════════════════════
   MOUSE PARALLAX ON CAROUSEL
══════════════════════════════ */
var _cw=document.getElementById('carousel-wrap');
_cw.addEventListener('mousemove',function(e){
  var r=_cw.getBoundingClientRect();
  var xp=(e.clientX-r.left)/r.width-.5;
  var yp=(e.clientY-r.top)/r.height-.5;
  var slide=document.querySelector('.slide.active');
  if(slide) slide.style.backgroundPosition='calc(center + '+(-xp*18)+'px) calc(45% + '+(-yp*12)+'px)';
});
_cw.addEventListener('mouseleave',function(){
  var slide=document.querySelector('.slide.active');
  if(slide) slide.style.backgroundPosition='center 45%';
});

/* ══════════════════════════════
   RIPPLE ON BUTTONS
══════════════════════════════ */
document.addEventListener('click',function(e){
  var btn=e.target.closest('.sbtn');
  if(!btn)return;
  var r=btn.getBoundingClientRect();
  var rpl=document.createElement('span');
  var sz=Math.max(r.width,r.height);
  rpl.className='ripple';
  rpl.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+(e.clientX-r.left-sz/2)+'px;top:'+(e.clientY-r.top-sz/2)+'px';
  btn.appendChild(rpl);
  setTimeout(function(){rpl.remove()},500);
});

/* ══════════════════════════════
   HERO PARTICLES
══════════════════════════════ */
(function(){
  var hp=document.getElementById('hero-particles');
  if(!hp)return;
  for(var i=0;i<18;i++){
    var p=document.createElement('div');
    p.className='particle';
    var left=Math.random()*100;
    var delay=Math.random()*7;
    var dur=5+Math.random()*8;
    var dx=(Math.random()-0.5)*60;
    var sz=Math.random()<0.3?3:Math.random()<0.7?2:1;
    p.style.cssText='left:'+left+'%;bottom:'+(Math.random()*40)+'%;'
      +'animation-duration:'+dur+'s;animation-delay:-'+delay+'s;'
      +'--dx:'+dx+'px;width:'+sz+'px;height:'+sz+'px;'
      +'opacity:'+(0.2+Math.random()*0.5);
    hp.appendChild(p);
  }
})();

/* ══════════════════════════════
   LOCATION CAROUSEL
══════════════════════════════ */
var _locIdx=0;
var _locTrack=document.getElementById('loc-track');
var _locCards=_locTrack?_locTrack.querySelectorAll('.loc-card'):[];

function locSlide(dir){
  if(!_locTrack||!_locCards.length)return;
  _locIdx+=dir;
  var cardW=(_locCards[0].getBoundingClientRect().width)||260;
  var gap=16;
  var step=cardW+gap;
  // Larghezza totale della track
  var trackW=_locCards.length*cardW+(_locCards.length-1)*gap;
  // Larghezza visibile del container (esclude padding 10px per lato)
  var outerW=(_locTrack.parentElement.getBoundingClientRect().width||840)-20;
  // Max translateX in px → converti in indice
  var maxPx=Math.max(0,trackW-outerW);
  var maxIdx=Math.floor(maxPx/step);
  if(_locIdx<0)_locIdx=0;
  if(_locIdx>maxIdx)_locIdx=maxIdx;
  _locTrack.style.transform='translateX(-'+(_locIdx*step)+'px)';
}

/* ══════════════════════════════
   WIKI TOGGLE
══════════════════════════════ */
function toggleWiki(){
  var wrap=document.getElementById('wiki-wrap');
  var arrow=document.getElementById('wiki-arrow');
  wrap.classList.toggle('wiki-open');
  arrow.textContent=wrap.classList.contains('wiki-open')?'▼':'▶';
}

/* ══════════════════════════════
   PORTAL — Particelle + Ripple
══════════════════════════════ */
(function(){
  var pts=document.getElementById('portal-pts');
  if(!pts)return;
  for(var i=0;i<18;i++){
    var p=document.createElement('div');
    p.className='portal-p';
    var sz=(1.5+Math.random()*2.5);
    var dur=(3+Math.random()*5).toFixed(1)+'s';
    var delay=(Math.random()*6).toFixed(1)+'s';
    var op=(0.15+Math.random()*0.3).toFixed(2);
    p.style.cssText='width:'+sz+'px;height:'+sz+'px;'
      +'left:'+Math.random()*100+'%;'
      +'bottom:'+(Math.random()*30)+'%;'
      +'--pd:'+dur+';--po:'+op+';'
      +'animation-delay:'+delay+';';
    pts.appendChild(p);
  }
})();

/* Ripple sul bottone JOIN */
(function(){
  var btn=document.getElementById('portal-join-btn');
  if(!btn)return;
  btn.addEventListener('click',function(e){
    var r=btn.getBoundingClientRect();
    var rp=document.createElement('span');
    rp.className='ripple';
    var sz=Math.max(r.width,r.height)*1.2;
    rp.style.cssText='width:'+sz+'px;height:'+sz+'px;'
      +'left:'+(e.clientX-r.left-sz/2)+'px;'
      +'top:'+(e.clientY-r.top-sz/2)+'px;';
    btn.appendChild(rp);
    setTimeout(function(){rp.remove();},700);
  });
})();

/* ══════════════════════════════
   MYS-CARD sparkle (same pool as lcard)
══════════════════════════════ */
(function(){
  document.querySelectorAll('.mys-card').forEach(function(card){
    card.addEventListener('mouseenter',function(){
      var n=4+Math.floor(Math.random()*3);
      for(var i=0;i<n;i++){
        (function(idx){
          var sp=document.createElement('div');
          sp.className='spark';
          var r=card.getBoundingClientRect();
          var ox=Math.random()*r.width;
          var oy=Math.random()*r.height*0.6;
          var sx=(Math.random()-0.5)*35;
          var sy=-(15+Math.random()*28);
          var bri=(0.5+Math.random()*0.5);
          sp.style.cssText='left:'+ox+'px;top:'+oy+'px;'
            +'--sx:'+sx+'px;--sy:'+sy+'px;'
            +'background:rgba(140,100,220,'+bri+');'
            +'box-shadow:0 0 5px rgba(140,100,220,'+bri+');'
            +'animation-delay:'+(idx*90)+'ms;'
            +'animation-duration:'+(450+Math.random()*250)+'ms;';
          card.appendChild(sp);
          setTimeout(function(){sp.remove();},800+idx*90);
        })(i);
      }
    });
  });
})();

/* ══════════════════════════════
   FADE-IN con stagger
══════════════════════════════ */
var _fio=new IntersectionObserver(function(entries){
  entries.forEach(function(en){
    if(en.isIntersecting){
      en.target.classList.add('visible');
      _fio.unobserve(en.target);
    }
  });
},{threshold:.1,rootMargin:'0px 0px -30px 0px'});

function initFadeIn(root){
  var els=(root||document).querySelectorAll('.shead,.cgrid,.lcard,.n-db-wrap,.hsec,.arcadia-sec,.fade-in,.mys-card,.step,.fpill');
  els.forEach(function(el,i){
    if(!el.classList.contains('fade-in')){el.classList.add('fade-in');}
    // Stagger delay per gruppi di card
    var delay=0;
    if(el.classList.contains('mys-card')||el.classList.contains('fpill')||el.classList.contains('step')){
      var siblings=el.parentElement?el.parentElement.children:[];
      for(var j=0;j<siblings.length;j++){if(siblings[j]===el){delay=j*80;break;}}
      el.style.transitionDelay=delay+'ms';
    }
    _fio.observe(el);
  });
}
/* ══════════════════════════════
   STARFIELD — Slide Pantheon
══════════════════════════════ */
(function(){
  var sf=document.getElementById('star-field');
  if(!sf)return;
  var count=110;
  for(var i=0;i<count;i++){
    var s=document.createElement('div');
    s.className='star';
    var size=(Math.random()<0.15)?2.5:(Math.random()<0.4)?1.5:1;
    var bright=(0.3+Math.random()*0.65).toFixed(2);
    var dur=(2+Math.random()*4).toFixed(1)+'s';
    var delay=(Math.random()*5).toFixed(1)+'s';
    s.style.cssText='left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;'
      +'width:'+size+'px;height:'+size+'px;'
      +'--tw:'+dur+';--tb:'+bright+';'
      +'animation-delay:'+delay+';';
    sf.appendChild(s);
  }
  // Nebula violet glow blobs
  ['60% 20%','30% 65%','80% 75%'].forEach(function(pos,i){
    var b=document.createElement('div');
    b.style.cssText='position:absolute;border-radius:50%;pointer-events:none;'
      +'width:'+(120+i*60)+'px;height:'+(80+i*40)+'px;'
      +'left:'+pos.split(' ')[0]+';top:'+pos.split(' ')[1]+';'
      +'transform:translate(-50%,-50%);'
      +'background:radial-gradient(ellipse,rgba('+(i===1?'100,40,180':'60,20,140')+','+(0.06+i*0.02)+'),transparent);'
      +'animation:nebula-pulse '+(6+i*2)+'s ease-in-out infinite alternate;';
    sf.appendChild(b);
  });
})();

/* ══════════════════════════════
   LCARD — Micro sparkle
══════════════════════════════ */
(function(){
  document.querySelectorAll('.lcard').forEach(function(card){
    card.addEventListener('mouseenter',function(e){
      spawnSparks(card,e);
    });
  });
  function spawnSparks(card,e){
    var r=card.getBoundingClientRect();
    var n=5+Math.floor(Math.random()*4);
    for(var i=0;i<n;i++){
      (function(){
        var sp=document.createElement('div');
        sp.className='spark';
        var ox=(Math.random()*r.width);
        var oy=(Math.random()*r.height*0.5)+r.height*0.2;
        var sx=(Math.random()-0.5)*40;
        var sy=-(20+Math.random()*30);
        var sz=(0.6+Math.random()*0.8);
        var hue=Math.random()<0.3?'rgba(255,220,80,'+sz+')':'rgba(200,155,60,'+sz+')';
        sp.style.cssText='left:'+ox+'px;top:'+oy+'px;'
          +'--sx:'+sx+'px;--sy:'+sy+'px;'
          +'background:'+hue+';'
          +'box-shadow:0 0 4px '+hue+';'
          +'animation-delay:'+(i*80)+'ms;'
          +'animation-duration:'+(500+Math.random()*300)+'ms;';
        card.appendChild(sp);
        setTimeout(function(){sp.remove();},900+i*80);
      })();
    }
  }
})();

/* Nebula pulse animation */
(function(){
  if(!document.querySelector('style[data-nebula]')){
    var s=document.createElement('style');
    s.setAttribute('data-nebula','1');
    s.textContent='@keyframes nebula-pulse{0%{opacity:.7;transform:translate(-50%,-50%) scale(1)}100%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}}';
    document.head.appendChild(s);
  }
})();

initFadeIn();/* ════════════════════════════════════
   MAPPA INTERATTIVA JS
════════════════════════════════════ */
(function(){
  var tip=document.getElementById('map-tip');
  var tname=document.getElementById('mt-name');
  var tdesc=document.getElementById('mt-desc');
  var thint=document.getElementById('mt-hint');
  var mapEl=document.getElementById('arcamis-map');
  if(!tip||!mapEl)return;

  function moveTip(e){
    var rect=mapEl.getBoundingClientRect();
    var x=e.clientX-rect.left+16;
    var y=e.clientY-rect.top-10;
    if(x+220>rect.width)x=e.clientX-rect.left-230;
    if(y+80>rect.height)y=e.clientY-rect.top-85;
    tip.style.left=x+'px';tip.style.top=y+'px';
  }
  function hideTip(){tip.classList.remove('vis');}

  window.closeSubMap=function(id){
    var p=document.getElementById(id);
    if(p)p.classList.remove('open');
  };

  document.querySelectorAll('.mpin').forEach(function(el){
    var nm=el.getAttribute('data-name')||'';
    var ds=el.getAttribute('data-desc')||'';
    var sb=el.getAttribute('data-sub')||'';
    var id=el.getAttribute('data-id')||'';

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

  /* sub-panel mloc */
  document.querySelectorAll('.mloc').forEach(function(el){
    var nm=el.getAttribute('data-name')||'';
    var ds=el.getAttribute('data-desc')||'';
    var id=el.getAttribute('data-id')||'';
    el.addEventListener('click',function(){if(id)gp(id,nm,'📍');});
  });
})();