/* ════════════════════════════════════
   custom-nav.js
   Inietta nel menu del sito le pagine
   custom create dall'admin (entries di
   data.js con campo "sec").
   ════════════════════════════════════ */
(function(){
  var SEC = {
    regole:      { dd:'dd-regole',  mn:'mn-sec-regole' },
    personaggio: { dd:'dd-pg',      mn:'mn-sec-pg'     },
    lavori:      { dd:'dd-lavori',  mn:null            },
    lore:        { dd:'dd-lore',    mn:'mn-sec-lore'   }
  };

  function _customPages(){
    return (typeof pages !== 'undefined')
      ? pages.filter(function(p){ return p.sec && p.id; })
      : [];
  }

  function _makeDesktop(menu, p){
    if(menu.querySelector('.tn-item[data-cp="'+p.k+'"]')) return;
    var el = document.createElement('div');
    el.className = 'tn-item';
    el.dataset.cp = p.k;
    el.innerHTML = '<span class="tn-ii">'+(p.i||'📄')+'</span>'+p.l;
    el.addEventListener('click', function(){ closeDd(); gp(p.id, p.l, p.i); });
    menu.appendChild(el);
  }

  function _makeMobile(section, p){
    if(section.querySelector('.mn-item[data-cp="'+p.k+'"]')) return;
    var el = document.createElement('div');
    el.className = 'mn-item';
    el.dataset.cp = p.k;
    el.innerHTML = '<span class="mn-ii">'+(p.i||'📄')+'</span>'+p.l;
    el.addEventListener('click', function(){ closeMobileNav(); gp(p.id, p.l, p.i); });
    section.appendChild(el);
  }

  function inject(){
    var custom = _customPages();
    if(!custom.length) return;
    custom.forEach(function(p){
      var sec = SEC[p.sec];
      if(!sec) return;
      var menu = sec.dd ? document.querySelector('#'+sec.dd+' .tn-menu') : null;
      if(menu){
        if(!menu.querySelector('.tn-item[data-cp]')){
          var div = document.createElement('div');
          div.className = 'tn-div';
          div.dataset.cp = 'sep';
          menu.appendChild(div);
        }
        _makeDesktop(menu, p);
      }
      var mn = null;
      if(sec.mn) mn = document.querySelector('#mobile-nav .'+sec.mn);
      else if(p.sec === 'lavori') mn = document.querySelector('#mobile-nav .mn-section--lavori');
      if(mn) _makeMobile(mn, p);
    });
  }

  function init(){
    if(!document.getElementById('tnav') && !document.getElementById('mobile-nav')) return;
    inject();
    if(document.getElementById('mobile-nav')){
      var t = setInterval(function(){
        if(document.querySelector('#mobile-nav .mn-item')){
          clearInterval(t);
          inject();
        }
      }, 250);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
