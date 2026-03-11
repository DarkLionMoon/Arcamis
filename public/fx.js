/* ════════════════════════════════════
   ARCAMIS — fx.js
   Effetti visivi puri (nessuna logica
   di navigazione o dati)
════════════════════════════════════ */

/* ── Glossy shine sulle lcard ── */
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

/* ── Micro sparkle sulle lcard ── */
(function(){
  document.querySelectorAll('.lcard').forEach(function(card){
    card.addEventListener('mouseenter',function(e){ spawnSparks(card,e); });
  });
  function spawnSparks(card){
    var r=card.getBoundingClientRect();
    var n=5+Math.floor(Math.random()*4);
    for(var i=0;i<n;i++){
      (function(idx){
        var sp=document.createElement('div');
        sp.className='spark';
        var ox=Math.random()*r.width;
        var oy=(Math.random()*r.height*0.5)+r.height*0.2;
        var sx=(Math.random()-0.5)*40;
        var sy=-(20+Math.random()*30);
        var sz=(0.6+Math.random()*0.8);
        var hue=Math.random()<0.3?'rgba(255,220,80,'+sz+')':'rgba(200,155,60,'+sz+')';
        sp.style.cssText='left:'+ox+'px;top:'+oy+'px;'
          +'--sx:'+sx+'px;--sy:'+sy+'px;'
          +'background:'+hue+';box-shadow:0 0 4px '+hue+';'
          +'animation-delay:'+(idx*80)+'ms;'
          +'animation-duration:'+(500+Math.random()*300)+'ms;';
        card.appendChild(sp);
        setTimeout(function(){sp.remove();},900+idx*80);
      })(i);
    }
  }
})();

/* ── Sparkle sulle mys-card ── */
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

/* ── Hero particles ── */
(function(){
  var hp=document.getElementById('hero-particles');
  if(!hp)return;
  for(var i=0;i<18;i++){
    var p=document.createElement('div');
    p.className='particle';
    var sz=Math.random()<0.3?3:Math.random()<0.7?2:1;
    p.style.cssText='left:'+Math.random()*100+'%;bottom:'+(Math.random()*40)+'%;'
      +'animation-duration:'+(5+Math.random()*8)+'s;'
      +'animation-delay:-'+Math.random()*7+'s;'
      +'--dx:'+((Math.random()-0.5)*60)+'px;'
      +'width:'+sz+'px;height:'+sz+'px;'
      +'opacity:'+(0.2+Math.random()*0.5);
    hp.appendChild(p);
  }
})();

/* ── Portal particles ── */
(function(){
  var pts=document.getElementById('portal-pts');
  if(!pts)return;
  for(var i=0;i<18;i++){
    var p=document.createElement('div');
    p.className='portal-p';
    var sz=(1.5+Math.random()*2.5);
    p.style.cssText='width:'+sz+'px;height:'+sz+'px;'
      +'left:'+Math.random()*100+'%;'
      +'bottom:'+(Math.random()*30)+'%;'
      +'--pd:'+(3+Math.random()*5).toFixed(1)+'s;'
      +'--po:'+(0.15+Math.random()*0.3).toFixed(2)+';'
      +'animation-delay:'+(Math.random()*6).toFixed(1)+'s;';
    pts.appendChild(p);
  }
})();

/* ── Starfield (slide Pantheon) ── */
(function(){
  var sf=document.getElementById('star-field');
  if(!sf)return;
  for(var i=0;i<110;i++){
    var s=document.createElement('div');
    s.className='star';
    var size=(Math.random()<0.15)?2.5:(Math.random()<0.4)?1.5:1;
    s.style.cssText='left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;'
      +'width:'+size+'px;height:'+size+'px;'
      +'--tw:'+(2+Math.random()*4).toFixed(1)+'s;'
      +'--tb:'+(0.3+Math.random()*0.65).toFixed(2)+';'
      +'animation-delay:'+(Math.random()*5).toFixed(1)+'s;';
    sf.appendChild(s);
  }
  ['60% 20%','30% 65%','80% 75%'].forEach(function(pos,idx){
    var b=document.createElement('div');
    b.style.cssText='position:absolute;border-radius:50%;pointer-events:none;'
      +'width:'+(120+idx*60)+'px;height:'+(80+idx*40)+'px;'
      +'left:'+pos.split(' ')[0]+';top:'+pos.split(' ')[1]+';'
      +'transform:translate(-50%,-50%);'
      +'background:radial-gradient(ellipse,rgba('+(idx===1?'100,40,180':'60,20,140')+','+(0.06+idx*0.02)+'),transparent);'
      +'animation:nebula-pulse '+(6+idx*2)+'s ease-in-out infinite alternate;';
    sf.appendChild(b);
  });
})();

/* ── Nebula pulse keyframe (iniettato una volta) ── */
(function(){
  if(!document.querySelector('style[data-nebula]')){
    var s=document.createElement('style');
    s.setAttribute('data-nebula','1');
    s.textContent='@keyframes nebula-pulse{0%{opacity:.7;transform:translate(-50%,-50%) scale(1)}100%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}}';
    document.head.appendChild(s);
  }
})();

/* ── Mouse parallax sul carousel ── */
(function(){
  var cw=document.getElementById('carousel-wrap');
  if(!cw)return;
  cw.addEventListener('mousemove',function(e){
    var r=cw.getBoundingClientRect();
    var xp=(e.clientX-r.left)/r.width-.5;
    var yp=(e.clientY-r.top)/r.height-.5;
    var slide=document.querySelector('.slide.active');
    if(slide)slide.style.backgroundPosition='calc(center + '+(-xp*18)+'px) calc(45% + '+(-yp*12)+'px)';
  });
  cw.addEventListener('mouseleave',function(){
    var slide=document.querySelector('.slide.active');
    if(slide)slide.style.backgroundPosition='center 45%';
  });
})();

/* ── Ripple sui .sbtn ── */
document.addEventListener('click',function(e){
  var btn=e.target.closest('.sbtn');
  if(!btn)return;
  var r=btn.getBoundingClientRect();
  var rpl=document.createElement('span');
  var sz=Math.max(r.width,r.height);
  rpl.className='ripple';
  rpl.style.cssText='width:'+sz+'px;height:'+sz+'px;'
    +'left:'+(e.clientX-r.left-sz/2)+'px;'
    +'top:'+(e.clientY-r.top-sz/2)+'px';
  btn.appendChild(rpl);
  setTimeout(function(){rpl.remove();},500);
});

/* ── Ripple sul bottone JOIN portale ── */
(function(){
  var btn=document.getElementById('portal-join-btn');
  if(!btn)return;
  btn.addEventListener('click',function(e){
    var r=btn.getBoundingClientRect();
    var rp=document.createElement('span');
    var sz=Math.max(r.width,r.height)*1.2;
    rp.className='ripple';
    rp.style.cssText='width:'+sz+'px;height:'+sz+'px;'
      +'left:'+(e.clientX-r.left-sz/2)+'px;'
      +'top:'+(e.clientY-r.top-sz/2)+'px;';
    btn.appendChild(rp);
    setTimeout(function(){rp.remove();},700);
  });
})();

/* ── Fade-in con IntersectionObserver e stagger ── */
var _fio=new IntersectionObserver(function(entries){
  entries.forEach(function(en){
    if(en.isIntersecting){en.target.classList.add('visible');_fio.unobserve(en.target);}
  });
},{threshold:.1,rootMargin:'0px 0px -30px 0px'});

function initFadeIn(root){
  var els=(root||document).querySelectorAll(
    '.shead,.cgrid,.lcard,.n-db-wrap,.hsec,.arcadia-sec,.fade-in,.mys-card,.step,.fpill'
  );
  els.forEach(function(el,i){
    if(!el.classList.contains('fade-in'))el.classList.add('fade-in');
    var delay=0;
    if(el.classList.contains('mys-card')||el.classList.contains('fpill')||el.classList.contains('step')){
      var siblings=el.parentElement?el.parentElement.children:[];
      for(var j=0;j<siblings.length;j++){if(siblings[j]===el){delay=j*80;break;}}
      el.style.transitionDelay=delay+'ms';
    }
    _fio.observe(el);
  });
}

initFadeIn();

/* ── Tasto Runa Audio ── */
(function(){
  var _aud=null,_on=false;
  window.toggleArcAudio=function(){
    if(!_aud){
      /* usa un audio ambientale da URL pubblico — dark ambient loop */
      _aud=new Audio('https://cdn.freesound.org/previews/459/459977_4921277-lq.mp3');
      _aud.loop=true;_aud.volume=0.18;
    }
    if(_on){
      _aud.pause();_on=false;
      document.getElementById('audio-runa').classList.remove('ara-on');
    }else{
      _aud.play().catch(function(){});_on=true;
      document.getElementById('audio-runa').classList.add('ara-on');
    }
  };
})();
