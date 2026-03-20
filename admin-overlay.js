/* ════════════════════════════════════
   ARCAMIS — admin-overlay.js
   Attivo solo se sessionStorage ha arcadmin=1
   (impostato dal login su /admin)
════════════════════════════════════ */
(function(){
  if(sessionStorage.getItem('arcadmin') !== '1') return;

  /* ── CSS overlay ── */
  var style = document.createElement('style');
  style.textContent = `
    /* Barra admin in cima */
    #arc-admin-bar {
      position:fixed;top:0;left:0;right:0;z-index:9999;height:36px;
      background:linear-gradient(90deg,rgba(100,70,200,.95),rgba(60,40,160,.95));
      border-bottom:1px solid rgba(180,150,255,.4);
      display:flex;align-items:center;padding:0 18px;gap:16px;
      font-family:'Cinzel',serif;font-size:9px;letter-spacing:.15em;
      backdrop-filter:blur(12px);
    }
    #arc-admin-bar .ab-logo { color:rgba(220,200,255,.9);font-weight:700; }
    #arc-admin-bar .ab-badge {
      padding:2px 10px;background:rgba(255,255,255,.1);
      border:1px solid rgba(180,150,255,.3);color:rgba(200,180,255,.8);font-size:7px;
    }
    #arc-admin-bar .ab-sep { flex:1; }
    #arc-admin-bar .ab-exit {
      padding:4px 14px;border:1px solid rgba(255,100,100,.3);
      background:rgba(180,40,30,.15);color:rgba(255,120,120,.8);
      cursor:pointer;font-family:'Cinzel',serif;font-size:8px;letter-spacing:.12em;
      transition:.2s;
    }
    #arc-admin-bar .ab-exit:hover { background:rgba(180,40,30,.35);color:#ff8080; }
    body { padding-top:36px !important; }

    /* Bottone edit generico */
    .arc-edit-btn {
      position:absolute;z-index:500;
      background:rgba(100,70,200,.85);border:1px solid rgba(180,150,255,.5);
      color:#fff;font-family:'Cinzel',serif;font-size:8px;letter-spacing:.1em;
      padding:4px 10px;cursor:pointer;
      backdrop-filter:blur(6px);transition:.18s;white-space:nowrap;
      display:flex;align-items:center;gap:5px;
    }
    .arc-edit-btn:hover { background:rgba(130,100,240,.95);box-shadow:0 0 16px rgba(100,70,200,.5); }
    .arc-edit-btn .aeb-icon { font-size:11px; }

    /* Pannello laterale */
    #arc-edit-panel {
      position:fixed;top:36px;right:0;bottom:0;width:360px;z-index:9998;
      background:rgba(8,6,20,.97);border-left:1px solid rgba(140,110,255,.25);
      display:flex;flex-direction:column;
      transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);
      font-family:'Crimson Pro',serif;
    }
    #arc-edit-panel.open { transform:translateX(0); }
    #arc-panel-header {
      padding:16px 20px;border-bottom:1px solid rgba(140,110,255,.15);
      display:flex;align-items:center;gap:10px;flex-shrink:0;
    }
    #arc-panel-title {
      font-family:'Cinzel',serif;font-size:11px;font-weight:700;
      letter-spacing:.15em;color:rgba(200,180,255,.9);flex:1;
    }
    #arc-panel-close {
      width:28px;height:28px;display:flex;align-items:center;justify-content:center;
      color:rgba(200,180,255,.5);cursor:pointer;font-size:16px;transition:.15s;
    }
    #arc-panel-close:hover { color:rgba(200,180,255,.9); }
    #arc-panel-body {
      flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:14px;
    }
    #arc-panel-body::-webkit-scrollbar{width:3px}
    #arc-panel-body::-webkit-scrollbar-thumb{background:rgba(140,110,255,.3)}

    /* Campi del pannello */
    .ap-field { display:flex;flex-direction:column;gap:5px; }
    .ap-label {
      font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.2em;
      color:rgba(160,130,255,.6);text-transform:uppercase;
    }
    .ap-input, .ap-textarea {
      background:rgba(0,0,0,.4);border:1px solid rgba(140,110,255,.2);
      color:#f0e6d2;font-family:'Crimson Pro',serif;font-size:13px;
      padding:7px 10px;outline:none;transition:.18s;width:100%;
    }
    .ap-input:focus, .ap-textarea:focus { border-color:rgba(180,150,255,.6); }
    .ap-input::placeholder, .ap-textarea::placeholder { color:rgba(140,110,255,.3);font-style:italic; }
    .ap-textarea { resize:vertical;min-height:80px;line-height:1.6; }
    .ap-sep {
      height:1px;background:linear-gradient(90deg,transparent,rgba(140,110,255,.2),transparent);
      margin:4px 0;
    }
    .ap-section-label {
      font-family:'Cinzel',serif;font-size:8px;letter-spacing:.2em;
      color:rgba(200,155,60,.6);text-transform:uppercase;
      display:flex;align-items:center;gap:8px;
    }
    .ap-section-label::before { content:'◆';font-size:6px; }

    /* Upload zone nel pannello */
    .ap-upload {
      border:1px dashed rgba(140,110,255,.2);padding:10px;text-align:center;
      cursor:pointer;position:relative;background:rgba(140,110,255,.03);transition:.2s;
    }
    .ap-upload:hover { border-color:rgba(180,150,255,.4);background:rgba(140,110,255,.07); }
    .ap-upload input[type=file] { position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%; }
    .ap-upload-txt {
      font-family:'Cinzel',serif;font-size:8px;letter-spacing:.1em;
      color:rgba(140,110,255,.5);text-transform:uppercase;
    }
    .ap-or {
      display:flex;align-items:center;gap:8px;
      font-family:'Cinzel',serif;font-size:7px;letter-spacing:.15em;
      color:rgba(140,110,255,.3);
    }
    .ap-or::before,.ap-or::after{content:'';flex:1;height:1px;background:rgba(140,110,255,.15)}

    /* Preview immagine */
    .ap-preview {
      width:100%;height:100px;background-size:cover;background-position:center;
      background-color:rgba(0,0,0,.3);border:1px solid rgba(140,110,255,.15);
      display:flex;align-items:center;justify-content:center;
      color:rgba(140,110,255,.3);font-size:11px;font-style:italic;
    }

    /* Bottoni azione */
    .ap-actions { display:flex;gap:8px;margin-top:4px; }
    .ap-btn-save {
      flex:1;padding:9px;font-family:'Cinzel',serif;font-size:8px;letter-spacing:.12em;
      background:rgba(100,70,200,.2);border:1px solid rgba(140,110,255,.4);
      color:rgba(180,150,255,.9);cursor:pointer;transition:.18s;text-transform:uppercase;
    }
    .ap-btn-save:hover { background:rgba(100,70,200,.35);border-color:rgba(180,150,255,.6); }
    .ap-btn-save:disabled { opacity:.4;cursor:not-allowed; }
    .ap-status { font-size:11px;font-style:italic;height:14px;transition:.2s; }
    .ap-status.ok { color:#6dca7a; }
    .ap-status.err { color:#ff7060; }

    /* Highlight elementi editabili */
    .arc-editable {
      outline:1px dashed rgba(140,110,255,.25);
      outline-offset:2px;
      position:relative;
    }
    .arc-editable:hover { outline-color:rgba(180,150,255,.5); }
  `;
  document.head.appendChild(style);

  /* ── Barra admin ── */
  var bar = document.createElement('div');
  bar.id = 'arc-admin-bar';
  bar.innerHTML = `
    <span class="ab-logo">⚔ ARCAMIS</span>
    <span class="ab-badge">MODALITÀ ADMIN</span>
    <span class="ab-sep"></span>
    <button class="ab-exit" onclick="arcAdminExit()">✕ Esci da admin</button>
  `;
  document.body.appendChild(bar);

  /* ── Pannello laterale ── */
  var panel = document.createElement('div');
  panel.id = 'arc-edit-panel';
  panel.innerHTML = `
    <div id="arc-panel-header">
      <div id="arc-panel-title">Editor</div>
      <div id="arc-panel-close" onclick="arcClosePanel()">✕</div>
    </div>
    <div id="arc-panel-body"></div>
  `;
  document.body.appendChild(panel);

  /* ── Toast ── */
  function arcToast(msg, ok){
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);'
      +'background:rgba(8,6,20,.98);border:1px solid rgba(140,110,255,.35);'
      +'color:'+(ok?'#6dca7a':'#ff7060')+';font-family:Cinzel,serif;font-size:9px;'
      +'letter-spacing:.12em;padding:9px 22px;z-index:99999;opacity:0;transition:opacity .25s;white-space:nowrap;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity='1'; },10);
    setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); },300); },2500);
  }

  /* ── Apri/chiudi pannello ── */
  window.arcClosePanel = function(){
    document.getElementById('arc-edit-panel').classList.remove('open');
  };
  window.arcAdminExit = function(){
    sessionStorage.removeItem('arcadmin');
    location.reload();
  };

  function arcOpenPanel(title, bodyHtml){
    document.getElementById('arc-panel-title').textContent = title;
    document.getElementById('arc-panel-body').innerHTML = bodyHtml;
    document.getElementById('arc-edit-panel').classList.add('open');
  }

  /* ── Utility: compressione immagine ── */
  function compressImg(dataUrl, cb){
    var img = new Image();
    img.onload = function(){
      var MAX=900, w=img.width, h=img.height;
      if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
      if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
      var c=document.createElement('canvas');
      c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      cb(c.toDataURL('image/jpeg',0.82));
    };
    img.src = dataUrl;
  }

  /* ── Utility: salva su KV ── */
  async function arcSave(key, value){
    var r = await fetch('/api/admin?action=set_cover',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({pageId:key, coverUrl:value})
    });
    return (await r.json()).ok;
  }

  /* ── Utility: leggi covers ── */
  async function arcGetCovers(){
    var r = await fetch('/api/admin?action=get_covers');
    return (await r.json()).covers || {};
  }

  function escH(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ════════════════════════════════
     EDITOR CAROUSEL HOMEPAGE
  ════════════════════════════════ */
  var SLIDES_DEF = [
    {
      key:'carousel_0', label:'Slide 1 — Arcamis Porto',
      defTag:'Città Portuale — Marche di Arcamis',
      defTit:'ARCAMIS',
      defDesc:'Città portuale delle Marche di Arcamis, porta d\'ingresso al regno di Arcadia. Solo una piccola parte della regione è esplorata dai giocatori.',
      btns:[
        {defLabel:'Entra nel Discord', defHref:'https://discord.gg/JZPnXZbXEJ'},
        {defLabel:'Scopri la città ↓', defHref:''}
      ]
    },
    {
      key:'carousel_1', label:'Slide 2 — Pantheon',
      defTag:'Pantheon di Arcamis',
      defTit:'LE DIVINITÀ DI ARCAMIS',
      defDesc:'Ogni dio ha lasciato il proprio segno sulla terra. Scopri il Pantheon e i culti che plasmano il mondo.',
      btns:[
        {defLabel:'Scopri il Pantheon →', defHref:''}
      ]
    },
    {
      key:'carousel_2', label:'Slide 3 — Personaggio',
      defTag:'Crea il tuo eroe',
      defTit:'CREA IL TUO PERSONAGGIO',
      defDesc:'Scegli la tua classe, forgia la tua storia. Il tuo personaggio esiste solo su Arcamis.',
      btns:[
        {defLabel:'Come si inizia →', defHref:''}
      ]
    }
  ];

  async function injectCarouselHomeButtons(){
    var covers = await arcGetCovers();
    var slides = document.querySelectorAll('.slide');
    slides.forEach(function(slide, i){
      if(!SLIDES_DEF[i]) return;
      slide.style.position = 'relative';
      slide.classList.add('arc-editable');
      var btn = document.createElement('button');
      btn.className = 'arc-edit-btn';
      btn.style.cssText = 'top:60px;right:20px;';
      btn.innerHTML = '<span class="aeb-icon">✏️</span> Modifica slide';
      btn.onclick = function(e){ e.stopPropagation(); arcOpenSlideEditor(i, covers); };
      slide.appendChild(btn);
    });
  }

  async function arcOpenSlideEditor(idx, covers){
    var sl = SLIDES_DEF[idx];
    var meta = {}; try{ meta=JSON.parse(covers[sl.key+'_meta']||'{}'); }catch(e){}
    var btns = []; try{ btns=JSON.parse(covers[sl.key+'_btns']||'[]'); }catch(e){}
    var curImg = covers[sl.key]||'';

    /* Valori correnti con fallback ai default */
    var curTag  = meta.tag  || sl.defTag  || '';
    var curTit  = meta.tit  || sl.defTit  || '';
    var curDesc = meta.desc || sl.defDesc || '';

    var btnsHtml = sl.btns.map(function(b,bi){
      var sv = btns[bi]||{};
      return '<div class="ap-section-label" style="margin-top:8px">Bottone '+(bi+1)+'</div>'
        +'<div class="ap-field"><div class="ap-label">Testo</div>'
        +'<input class="ap-input" id="asl-btl-'+idx+'-'+bi+'" value="'+escH(sv.label||b.defLabel)+'" placeholder="Testo…"/></div>'
        +'<div class="ap-field"><div class="ap-label">Link / onclick</div>'
        +'<input class="ap-input" id="asl-bth-'+idx+'-'+bi+'" value="'+escH(sv.href||b.defHref)+'" placeholder="https://… o onclick…"/></div>';
    }).join('');

    arcOpenPanel(sl.label, `
      <div class="ap-section-label">Sfondo</div>
      <div class="ap-preview" id="asl-prev-${idx}" style="${curImg?'background-image:url(\''+curImg+'\')':''}">
        ${curImg?'':'Nessuna immagine'}
      </div>
      <div class="ap-upload">
        <input type="file" accept="image/*" onchange="arcSlideUpload(event,${idx})"/>
        <div class="ap-upload-txt">🖼 Carica dal PC</div>
      </div>
      <div class="ap-or">oppure URL</div>
      <div class="ap-field">
        <input class="ap-input" id="asl-url-${idx}" type="url" placeholder="https://…" value="${escH(curImg)}" oninput="document.getElementById('asl-prev-${idx}').style.backgroundImage=this.value?'url('+this.value+')':''"/>
      </div>
      <div class="ap-actions">
        <button class="ap-btn-save" onclick="arcSaveSlideImg(${idx})">Salva sfondo</button>
        <button class="ap-btn-save" style="flex:0;padding:9px 12px;background:rgba(180,40,30,.1);border-color:rgba(180,40,30,.3);color:#ff8888" onclick="arcRemoveSlideImg(${idx})">✕</button>
      </div>
      <div class="ap-status" id="asl-img-status-${idx}"></div>
      <div class="ap-sep"></div>
      <div class="ap-section-label">Testi slide</div>
      <div class="ap-field">
        <div class="ap-label">Tag (piccolo sopra)</div>
        <input class="ap-input" id="asl-tag-${idx}" value="${escH(curTag)}" placeholder="es. Città Portuale…"/>
      </div>
      <div class="ap-field">
        <div class="ap-label">Titolo (grande)</div>
        <input class="ap-input" id="asl-tit-${idx}" value="${escH(curTit)}" placeholder="es. ARCAMIS"/>
      </div>
      <div class="ap-field">
        <div class="ap-label">Descrizione (paragrafo sotto il titolo)</div>
        <textarea class="ap-textarea" id="asl-desc-${idx}" placeholder="Testo descrittivo…">${escH(curDesc)}</textarea>
      </div>
      <div class="ap-actions">
        <button class="ap-btn-save" onclick="arcSaveSlideText(${idx})">Salva testi</button>
      </div>
      <div class="ap-status" id="asl-txt-status-${idx}"></div>
      <div class="ap-sep"></div>
      <div class="ap-section-label">Bottoni CTA</div>
      ${btnsHtml}
      <div class="ap-actions">
        <button class="ap-btn-save" onclick="arcSlideSaveBtns(${idx},${sl.btns.length})">Salva bottoni</button>
      </div>
      <div class="ap-status" id="asl-btn-status-${idx}"></div>
    `);
  }

  /* Upload sfondo slide */
  window.arcSlideUpload = function(event, idx){
    var file = event.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(e){
      compressImg(e.target.result, function(b64){
        var prev = document.getElementById('asl-prev-'+idx);
        var urlI = document.getElementById('asl-url-'+idx);
        if(prev){ prev.style.backgroundImage='url(\''+b64+'\')'; prev.textContent=''; }
        if(urlI) urlI.value = '';
        arcSaveSlideImgVal(idx, b64);
      });
    };
    reader.readAsDataURL(file);
  };

  window.arcSaveSlideImg = async function(idx){
    var val = (document.getElementById('asl-url-'+idx)||{}).value||'';
    if(!val){ arcToast('Nessuna immagine da salvare', false); return; }
    arcSaveSlideImgVal(idx, val);
  };
  window.arcRemoveSlideImg = async function(idx){
    var key = SLIDES_DEF[idx].key;
    var ok = await arcSave(key, '');
    var prev = document.getElementById('asl-prev-'+idx);
    if(prev){ prev.style.backgroundImage=''; prev.textContent='Nessuna immagine'; }
    var slide = document.querySelectorAll('.slide')[idx];
    if(slide){ slide.style.backgroundImage=''; }
    setApStatus('asl-img-status-'+idx, ok?'✓ Rimossa':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Sfondo rimosso':'Errore', ok);
  };
  async function arcSaveSlideImgVal(idx, val){
    var key = SLIDES_DEF[idx].key;
    setApStatus('asl-img-status-'+idx,'Salvataggio…','');
    var ok = await arcSave(key, val);
    var slide = document.querySelectorAll('.slide')[idx];
    if(slide && ok){ slide.style.backgroundImage='url(\''+val+'\')'; slide.style.backgroundSize='cover'; slide.style.backgroundPosition='center 40%'; }
    setApStatus('asl-img-status-'+idx, ok?'✓ Salvato':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Sfondo salvato ✓':'Errore salvataggio', ok);
  }

  /* ── Salva testi slide (tag + titolo + descrizione) ── */
  window.arcSaveSlideText = async function(idx){
    var key  = SLIDES_DEF[idx].key;
    var tag  = (document.getElementById('asl-tag-'+idx)||{}).value||'';
    var tit  = (document.getElementById('asl-tit-'+idx)||{}).value||'';
    var desc = (document.getElementById('asl-desc-'+idx)||{}).value||'';
    setApStatus('asl-txt-status-'+idx,'Salvataggio…','');
    var ok = await arcSave(key+'_meta', JSON.stringify({tag:tag, tit:tit, desc:desc}));
    /* aggiorna live nel DOM */
    var slide = document.querySelectorAll('.slide')[idx];
    if(slide && ok){
      var tagEl  = slide.querySelector('.stag');
      var titEl  = slide.querySelector('.stit');
      var descEl = slide.querySelector('.sdesc');
      if(tagEl)  tagEl.textContent  = tag;
      if(titEl)  titEl.innerHTML    = tit.replace(/\n/g,'<br>');
      if(descEl) descEl.textContent = desc;
    }
    setApStatus('asl-txt-status-'+idx, ok?'✓ Salvati':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Testi salvati ✓':'Errore', ok);
  };

  window.arcSlideSaveBtns = async function(idx, count){
    var key = SLIDES_DEF[idx].key;
    var btns = [];
    for(var i=0;i<count;i++){
      btns.push({
        label:(document.getElementById('asl-btl-'+idx+'-'+i)||{}).value||'',
        href: (document.getElementById('asl-bth-'+idx+'-'+i)||{}).value||''
      });
    }
    setApStatus('asl-btn-status-'+idx,'Salvataggio…','');
    var ok = await arcSave(key+'_btns', JSON.stringify(btns));
    setApStatus('asl-btn-status-'+idx, ok?'✓ Salvati':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Bottoni salvati ✓':'Errore', ok);
  };

  /* ════════════════════════════════
     EDITOR CARD NELLE PAGINE
  ════════════════════════════════ */
  function injectPageCarouselButtons(){
    document.querySelectorAll('#pbody .arc-edit-btn').forEach(function(b){ b.remove(); });

    document.querySelectorAll('#pbody .loc-card').forEach(function(card){
      if(card.querySelector('.arc-edit-btn')) return;
      var onclick = card.getAttribute('onclick') || '';
      var m = onclick.match(/gp\(['"]([a-f0-9]{32})['"]/);
      if(!m) return;
      var pageId = m[1];
      card.style.position = 'relative';
      var btn = document.createElement('button');
      btn.className = 'arc-edit-btn';
      btn.style.cssText = 'top:4px;left:4px;right:auto;font-size:7px;padding:3px 8px;z-index:20;';
      btn.innerHTML = '🖼';
      btn.onclick = function(e){
        e.stopPropagation();
        arcOpenLocCardEditor(card, pageId);
      };
      card.appendChild(btn);
    });

    document.querySelectorAll('#pbody .n-db-grid').forEach(function(grid, gi){
      var wrap = grid.closest('.n-db-wrap') || grid.parentElement;
      if(!wrap || wrap.querySelector('.arc-grid-edit-btn')) return;
      wrap.style.position = 'relative';
      var btn = document.createElement('button');
      btn.className = 'arc-edit-btn arc-grid-edit-btn';
      btn.style.cssText = 'position:relative;display:inline-flex;margin-bottom:10px;';
      btn.innerHTML = '<span class="aeb-icon">🖼</span> Modifica immagini';
      btn.onclick = function(e){ e.stopPropagation(); arcOpenGridEditor(grid, gi); };
      wrap.insertBefore(btn, grid);
    });

    document.querySelectorAll('#pbody .n-db-card').forEach(function(card, ci){
      if(card.closest('.n-db-grid')) return;
      if(card.querySelector('.arc-edit-btn')) return;
      card.style.position = 'relative';
      var btn = document.createElement('button');
      btn.className = 'arc-edit-btn';
      btn.style.cssText = 'top:4px;right:4px;font-size:7px;padding:3px 7px;';
      btn.innerHTML = '🖼';
      btn.onclick = function(e){ e.stopPropagation(); arcOpenSingleCardEditor(card, ci); };
      card.appendChild(btn);
    });
  }

  function arcOpenLocCardEditor(card, pageId){
    var curStyle = card.getAttribute('style') || '';
    var m = curStyle.match(/background-image:url\(["']?([^"')]+)["']?\)/);
    var cur = m ? m[1] : '';
    var name = (card.querySelector('.loc-name')||{}).textContent || pageId;
    var key = pageId;

    var html = '<div class="ap-section-label" style="margin-bottom:8px">'+name+'</div>'
      +'<div class="ap-preview" id="aploc-prev" style="'+(cur?'background-image:url(\''+cur+'\')':'')+'">'+(cur?'':'Nessuna immagine')+'</div>'
      +'<div class="ap-upload"><input type="file" accept="image/*" onchange="arcLocCardUpload(event,\''+pageId+'\')"/>'
      +'<div class="ap-upload-txt">🖼 Carica dal PC</div></div>'
      +'<div class="ap-or">oppure URL</div>'
      +'<input class="ap-input" id="aploc-url" type="url" value="'+escH(cur)+'" placeholder="https://…" '
      +'oninput="document.getElementById(\'aploc-prev\').style.backgroundImage=this.value?\'url(\'+this.value+\')\':\'\'" />'
      +'<div class="ap-actions">'
      +'<button class="ap-btn-save" onclick="arcSaveLocCard(\''+pageId+'\')">Salva</button>'
      +'<button class="ap-btn-save" style="flex:0;padding:9px 12px;background:rgba(180,40,30,.1);border-color:rgba(180,40,30,.3);color:#ff8888" onclick="arcRemoveLocCard(\''+pageId+'\')">✕</button>'
      +'</div>'
      +'<div class="ap-status" id="aploc-status"></div>';
    arcOpenPanel('Sfondo card — '+name, html);
    window._arcEditLocCard = card;
  }

  window.arcLocCardUpload = function(event, pageId){
    var file = event.target.files[0]; if(!file) return;
    var reader = new FileReader();
    reader.onload = function(e){ compressImg(e.target.result, function(b64){
      var prev = document.getElementById('aploc-prev');
      var urlI = document.getElementById('aploc-url');
      if(prev){ prev.style.backgroundImage='url(\''+b64+'\')'; prev.textContent=''; }
      if(urlI) urlI.value='';
      arcSaveLocCardVal(pageId, b64);
    });};
    reader.readAsDataURL(file);
  };

  window.arcSaveLocCard = async function(pageId){
    var val = (document.getElementById('aploc-url')||{}).value||'';
    if(!val){ arcToast('Inserisci URL o carica file', false); return; }
    arcSaveLocCardVal(pageId, val);
  };

  window.arcRemoveLocCard = async function(pageId){
    setApStatus('aploc-status','Rimozione…','');
    var ok = await arcSave(pageId, '');
    if(ok && window._arcEditLocCard){
      var s = window._arcEditLocCard.getAttribute('style')||'';
      window._arcEditLocCard.setAttribute('style', s.replace(/background-image:[^;]+;?/,''));
    }
    setApStatus('aploc-status', ok?'✓ Rimosso':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Sfondo rimosso':'Errore', ok);
  };

  async function arcSaveLocCardVal(pageId, val){
    setApStatus('aploc-status','Salvataggio…','');
    var ok = await arcSave(pageId, val);
    if(ok && window._arcEditLocCard){
      var s = window._arcEditLocCard.getAttribute('style')||'';
      s = s.replace(/background-image:[^;]+;?/g,'');
      window._arcEditLocCard.setAttribute('style', s+'background-image:url(\''+val+'\');background-size:cover;background-position:center;');
    }
    setApStatus('aploc-status', ok?'✓ Salvato':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Sfondo salvato ✓':'Errore', ok);
  }

  function arcOpenGridEditor(gridEl, gi){
    var cards = gridEl.querySelectorAll('.n-db-card');
    var pageId = (window._currentPageId||'unknown').replace(/-/g,'');

    var html = Array.from(cards).map(function(card, ci){
      var coverEl = card.querySelector('.n-db-cover');
      var nameEl = card.querySelector('.n-db-name');
      var cur = coverEl ? coverEl.src : '';
      var name = nameEl ? nameEl.textContent.trim() : ('Card '+(ci+1));
      var key = 'page_'+pageId+'_grid'+gi+'_card'+ci;
      return '<div class="ap-section-label" style="margin-top:'+(ci?'12px':'0')+'px">'+name+'</div>'
        +'<div class="ap-preview" id="apg-prev-'+gi+'-'+ci+'" style="'+(cur?'background-image:url(\''+cur+'\')':'')+'">'+(cur?'':'Nessuna')+'</div>'
        +'<div class="ap-upload"><input type="file" accept="image/*" onchange="arcGridCardUpload(event,\''+key+'\','+gi+','+ci+')"/>'
        +'<div class="ap-upload-txt">🖼 Carica</div></div>'
        +'<div class="ap-or">oppure URL</div>'
        +'<input class="ap-input" id="apg-url-'+gi+'-'+ci+'" type="url" value="'+escH(cur)+'" placeholder="https://…" '
        +'oninput="document.getElementById(\'apg-prev-'+gi+'-'+ci+'\').style.backgroundImage=this.value?\'url(\'+this.value+\')\':\'\'" />'
        +'<div class="ap-actions"><button class="ap-btn-save" onclick="arcSaveGridCard(\''+key+'\','+gi+','+ci+')">Salva</button></div>'
        +'<div class="ap-status" id="apg-status-'+gi+'-'+ci+'"></div>'
        +'<div class="ap-sep"></div>';
    }).join('');

    arcOpenPanel('Griglia immagini', html || '<div style="color:rgba(200,155,60,.4);font-style:italic;font-size:13px;padding:20px 0">Nessuna card trovata.</div>');
    window._arcEditGrid = {el: gridEl, gi: gi};
  }

  function arcOpenSingleCardEditor(card, ci){
    var coverEl = card.querySelector('.n-db-cover');
    var cur = coverEl ? coverEl.src : '';
    var pageId = (window._currentPageId||'unknown').replace(/-/g,'');
    var key = 'page_'+pageId+'_card'+ci;
    var html = '<div class="ap-preview" id="aps-prev-'+ci+'" style="'+(cur?'background-image:url(\''+cur+'\')':'')+'">'+(cur?'':'Nessuna')+'</div>'
      +'<div class="ap-upload"><input type="file" accept="image/*" onchange="arcSingleCardUpload(event,\''+key+'\','+ci+')"/>'
      +'<div class="ap-upload-txt">🖼 Carica</div></div>'
      +'<div class="ap-or">oppure URL</div>'
      +'<input class="ap-input" id="aps-url-'+ci+'" type="url" value="'+escH(cur)+'" placeholder="https://…" '
      +'oninput="document.getElementById(\'aps-prev-'+ci+'\').style.backgroundImage=this.value?\'url(\'+this.value+\')\':\'\'" />'
      +'<div class="ap-actions"><button class="ap-btn-save" onclick="arcSaveSingleCard(\''+key+'\','+ci+')">Salva</button></div>'
      +'<div class="ap-status" id="aps-status-'+ci+'"></div>';
    arcOpenPanel('Immagine card', html);
    window._arcEditCard = {el: card, ci: ci};
  }

  window.arcGridCardUpload = function(event, key, gi, ci){
    var file = event.target.files[0]; if(!file) return;
    var reader = new FileReader();
    reader.onload = function(e){ compressImg(e.target.result, function(b64){
      var prev = document.getElementById('apg-prev-'+gi+'-'+ci);
      var urlI = document.getElementById('apg-url-'+gi+'-'+ci);
      if(prev){ prev.style.backgroundImage='url(\''+b64+'\')'; prev.textContent=''; }
      if(urlI) urlI.value='';
      arcSaveGridCardVal(key, b64, gi, ci);
    });};
    reader.readAsDataURL(file);
  };
  window.arcSaveGridCard = async function(key, gi, ci){
    var val = (document.getElementById('apg-url-'+gi+'-'+ci)||{}).value||'';
    if(!val){ arcToast('Inserisci URL o carica file', false); return; }
    arcSaveGridCardVal(key, val, gi, ci);
  };
  async function arcSaveGridCardVal(key, val, gi, ci){
    setApStatus('apg-status-'+gi+'-'+ci,'Salvataggio…','');
    var ok = await arcSave(key, val);
    if(ok && window._arcEditGrid){
      var cards = window._arcEditGrid.el.querySelectorAll('.n-db-card');
      var coverEl = cards[ci] ? cards[ci].querySelector('.n-db-cover') : null;
      var placeholderEl = cards[ci] ? cards[ci].querySelector('.n-db-cover-placeholder') : null;
      if(coverEl){ coverEl.src = val; coverEl.style.display='block'; if(placeholderEl) placeholderEl.style.display='none'; }
    }
    setApStatus('apg-status-'+gi+'-'+ci, ok?'✓ Salvata':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Immagine salvata ✓':'Errore', ok);
  }

  window.arcSingleCardUpload = function(event, key, ci){
    var file = event.target.files[0]; if(!file) return;
    var reader = new FileReader();
    reader.onload = function(e){ compressImg(e.target.result, function(b64){
      var prev = document.getElementById('aps-prev-'+ci);
      var urlI = document.getElementById('aps-url-'+ci);
      if(prev){ prev.style.backgroundImage='url(\''+b64+'\')'; prev.textContent=''; }
      if(urlI) urlI.value='';
      arcSaveSingleCardVal(key, b64, ci);
    });};
    reader.readAsDataURL(file);
  };
  window.arcSaveSingleCard = async function(key, ci){
    var val = (document.getElementById('aps-url-'+ci)||{}).value||'';
    if(!val){ arcToast('Inserisci URL o carica file', false); return; }
    arcSaveSingleCardVal(key, val, ci);
  };
  async function arcSaveSingleCardVal(key, val, ci){
    setApStatus('aps-status-'+ci,'Salvataggio…','');
    var ok = await arcSave(key, val);
    if(ok && window._arcEditCard){
      var coverEl = window._arcEditCard.el.querySelector('.n-db-cover');
      var placeholderEl = window._arcEditCard.el.querySelector('.n-db-cover-placeholder');
      if(coverEl){ coverEl.src=val; coverEl.style.display='block'; if(placeholderEl) placeholderEl.style.display='none'; }
    }
    setApStatus('aps-status-'+ci, ok?'✓ Salvata':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Immagine salvata ✓':'Errore', ok);
  }

  /* ════════════════════════════════
     EDITOR GALLERIA PG (.gs-card)
  ════════════════════════════════ */
  function injectGalleryButtons(){
    document.querySelectorAll('.gs-card').forEach(function(card){
      if(card.querySelector('.arc-edit-btn')) return;
      var pageId = card.id.replace('gsc-','');
      if(!pageId) return;
      card.style.position = 'relative';
      var btn = document.createElement('button');
      btn.className = 'arc-edit-btn';
      btn.style.cssText = 'top:4px;left:4px;right:auto;font-size:7px;padding:3px 7px;z-index:20;';
      btn.innerHTML = '🖼';
      btn.onclick = function(e){
        e.stopPropagation();
        arcOpenGalleryCardEditor(card, pageId);
      };
      card.appendChild(btn);
    });
  }

  function arcOpenGalleryCardEditor(card, pageId){
    var bgEl = card.querySelector('.gs-card-bg');
    var cur = bgEl ? (bgEl.style.backgroundImage||'').replace(/url\(['"]?/,'').replace(/['"]?\)$/,'') : '';
    var name = (card.querySelector('.gs-card-name')||{}).textContent||pageId;
    var html = '<div class="ap-section-label" style="margin-bottom:8px">'+name+'</div>'
      +'<div class="ap-preview" id="apgal-prev" style="'+(cur?'background-image:url(\''+cur+'\')':'')+'">'+(cur?'':'Nessuna immagine')+'</div>'
      +'<div class="ap-upload"><input type="file" accept="image/*" onchange="arcGalleryCardUpload(event,\''+pageId+'\')"/>'
      +'<div class="ap-upload-txt">🖼 Carica dal PC</div></div>'
      +'<div class="ap-or">oppure URL</div>'
      +'<input class="ap-input" id="apgal-url" type="url" value="'+escH(cur)+'" placeholder="https://…" '
      +'oninput="document.getElementById(\'apgal-prev\').style.backgroundImage=this.value?\'url(\'+this.value+\')\':\'\'" />'
      +'<div class="ap-actions">'
      +'<button class="ap-btn-save" onclick="arcSaveGalleryCard(\''+pageId+'\')">Salva</button>'
      +'<button class="ap-btn-save" style="flex:0;padding:9px 12px;background:rgba(180,40,30,.1);border-color:rgba(180,40,30,.3);color:#ff8888" onclick="arcRemoveGalleryCard(\''+pageId+'\')">✕</button>'
      +'</div>'
      +'<div class="ap-status" id="apgal-status"></div>';
    arcOpenPanel('Cover — '+name, html);
    window._arcEditGalCard = card;
  }

  window.arcGalleryCardUpload = function(event, pageId){
    var file = event.target.files[0]; if(!file) return;
    var reader = new FileReader();
    reader.onload = function(e){ compressImg(e.target.result, function(b64){
      var prev = document.getElementById('apgal-prev');
      var urlI = document.getElementById('apgal-url');
      if(prev){ prev.style.backgroundImage='url(\''+b64+'\')'; prev.textContent=''; }
      if(urlI) urlI.value='';
      arcSaveGalleryCardVal(pageId, b64);
    });};
    reader.readAsDataURL(file);
  };

  window.arcSaveGalleryCard = async function(pageId){
    var val = (document.getElementById('apgal-url')||{}).value||'';
    if(!val){ arcToast('Inserisci URL o carica file', false); return; }
    arcSaveGalleryCardVal(pageId, val);
  };

  window.arcRemoveGalleryCard = async function(pageId){
    setApStatus('apgal-status','Rimozione…','');
    var ok = await arcSave(pageId, '');
    if(ok && window._arcEditGalCard){
      var bgEl = window._arcEditGalCard.querySelector('.gs-card-bg');
      if(bgEl) bgEl.style.backgroundImage = '';
    }
    setApStatus('apgal-status', ok?'✓ Rimossa':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Cover rimossa':'Errore', ok);
  };

  async function arcSaveGalleryCardVal(pageId, val){
    setApStatus('apgal-status','Salvataggio…','');
    var ok = await arcSave(pageId, val);
    if(ok && window._arcEditGalCard){
      var bgEl = window._arcEditGalCard.querySelector('.gs-card-bg');
      if(bgEl) bgEl.style.backgroundImage = 'url(\''+val+'\')';
      var detCover = document.querySelector('.gs-detail-cover-img');
      if(detCover && window._arcEditGalCard.classList.contains('selected')){
        detCover.style.backgroundImage = 'url(\''+val+'\')';
      }
    }
    setApStatus('apgal-status', ok?'✓ Salvata':'✕ Errore', ok?'ok':'err');
    arcToast(ok?'Cover salvata ✓':'Errore', ok);
  }

  /* ── Helper status ── */
  function setApStatus(id, msg, cls){
    var el = document.getElementById(id);
    if(!el) return;
    el.textContent = msg;
    el.className = 'ap-status'+(cls?' '+cls:'');
    if(msg) setTimeout(function(){ if(el){ el.textContent=''; el.className='ap-status'; } }, 3000);
  }

  /* ════════════════════════════════
     INIT — aggancia hooks
  ════════════════════════════════ */
  window.addEventListener('load', function(){
    setTimeout(injectCarouselHomeButtons, 800);
    setTimeout(injectGalleryButtons, 1200);
  });

  var _origAfterPage = window.afterPageRender;
  window.afterPageRender = function(){
    if(_origAfterPage) _origAfterPage();
    setTimeout(function(){
      injectPageCarouselButtons();
      injectGalleryButtons();
    }, 400);
  };

  var _origLoadGallery = window.loadGallery;
  if(typeof _origLoadGallery === 'function'){
    window.loadGallery = function(container){
      var result = _origLoadGallery(container);
      var _obs = new MutationObserver(function(){
        if(container.querySelector('.gs-card')){
          _obs.disconnect();
          setTimeout(injectGalleryButtons, 200);
        }
      });
      _obs.observe(container, {childList:true, subtree:true});
      return result;
    };
  }

  var _injectDebounce = null;
  var _pbodyObs = new MutationObserver(function(mutations){
    for(var i=0;i<mutations.length;i++){
      var t = mutations[i].target;
      if(t.closest && t.closest('#arc-edit-panel')) return;
    }
    clearTimeout(_injectDebounce);
    _injectDebounce = setTimeout(function(){
      injectPageCarouselButtons();
      injectGalleryButtons();
    }, 500);
  });
  var _pbodyEl = document.getElementById('pbody');
  if(_pbodyEl){
    _pbodyObs.observe(_pbodyEl, {childList:true, subtree:true});
  }

  var _origGp = window.gp;
  if(_origGp) window.gp = function(id, label, icon, fromPop){
    window._currentPageId = id;
    return _origGp(id, label, icon, fromPop);
  };

})();
