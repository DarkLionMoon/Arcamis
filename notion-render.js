/* ════════════════════════════════════════════════════════════════════════════
   NOTION RENDER — ULTRA-RECOVERY (Deep Scanning + Media Fix)
   ════════════════════════════════════════════════════════════════════════════ */

var navStack = []; 
var isRendering = false; 

/* ── CONFIGURAZIONE MAPPA ── */
var mapPageIds = new Set(['3090274fdc1c80e1a365ce1c36873455', '30d0274fdc1c800999feeb0ca6669b22', '30d0274fdc1c8016b113d5c2d7662d8f', '30d0274fdc1c804b9cb7e366f02bd635', '31f0274fdc1c8059a923c73da185a0e3', '31f0274fdc1c8019945af2b26306462f', '30d0274fdc1c803387c4fda013b857e9', '30d0274fdc1c8090aee7ed0430170414', '31f0274fdc1c8075b0dec2e2a6bc359e', '31f0274fdc1c805b89b8f0678463e615', '31f0274fdc1c808191abe4df86d176e6', '31e0274fdc1c80f3a3cee348f59cede0', '30d0274fdc1c80038beec3f444e45f8b', '30d0274fdc1c80cf8cdaf328e339dfc7', '3130274fdc1c80848fe5dfd7d2610c06', '31e0274fdc1c80f581f4f9cd7284bff0']);

/* ── UTILS RICH TEXT ── */
function rt(arr){
  if(!arr || !arr.length) return '';
  return arr.map(r => {
    let t = (r.plain_text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const a = r.annotations || {};
    let cls = [];
    if(a.bold) cls.push('rb'); if(a.italic) cls.push('ri'); if(a.code) cls.push('rc');
    if(a.color && a.color !== 'default') cls.push('r' + a.color.charAt(0));
    let inner = cls.length ? `<span class="${cls.join(' ')}">${t}</span>` : t;
    if(r.href){
      const m = r.href.match(/([a-f0-9]{32})(?:[?#]|$)/);
      if(m) return `<a class="rl" onclick="gp('${m[1]}','Pagina','📄')">${inner}</a>`;
      return `<a href="${r.href}" target="_blank" rel="noopener" class="rl">${inner}</a>`;
    }
    return inner;
  }).join('');
}

/* ── NAVIGAZIONE (gp) ── */
async function gp(id, label, icon, _fromPop){
  if(isRendering) return; 
  isRendering = true;
  try {
    const cleanId = id.replace(/-/g, '');
    if(!_fromPop){
      navStack.push({id: cleanId, label, icon});
      history.pushState({id: cleanId, label, icon, stack: navStack.slice(0,-1)}, '', `?p=${cleanId}`);
    }
    const pbody = document.getElementById('pbody');
    document.getElementById('ph-title').textContent = label;
    document.getElementById('ph-icon').textContent = icon;
    document.getElementById('main').scrollTo({top:0, behavior:'smooth'});
    pbody.innerHTML = '<div class="ldwrap"><div class="spin"></div></div>';
    await _gpRender(cleanId, label, icon);
  } finally {
    isRendering = false;
  }
}

async function _gpRender(id, label, icon){
  const pbody = document.getElementById('pbody');
  try {
    const r = await fetch(`/api/notion?pageId=${id}`);
    if(!r.ok) throw new Error(`Status ${r.status}`);
    const data = await r.json();
    
    // Scansione profonda dei blocchi
    const html = renderBlocks(data.blocks || [], true);
    
    if(!html || html.trim() === ""){
        pbody.innerHTML = `<div class="errbox">📭 Contenuto non trovato. Verifica la condivisione su Notion.</div>`;
    } else {
        pbody.innerHTML = `<div class="nc" style="animation:fi .3s ease forwards">${html}</div>`;
    }
    
    applyGlossary(pbody);
    if(window.loadDbGalleries) window.loadDbGalleries(pbody);
  } catch(e) {
    pbody.innerHTML = `<div class="errbox">⚠️ Errore: ${e.message}</div>`;
  }
}

/* ── RENDERING RICORSIVO (Fondamentale per colonne e sync) ── */
function renderBlocks(blocks, isRoot){
  if(!blocks || !Array.isArray(blocks)) return '';
  let h = '';
  
  for(let i=0; i<blocks.length; i++){
    const b = blocks[i];
    const type = b.type;
    const d = b[type];
    if(!d) continue;

    // Se il blocco ha figli (es. colonne, elenchi annidati), li processiamo subito
    let children = (b.children && b.children.length) ? renderBlocks(b.children, false) : '';

    switch(type){
      case 'paragraph': h += `<p class="n-p">${rt(d.rich_text)}${children}</p>`; break;
      case 'heading_1': h += `<h2 class="n-h1">${rt(d.rich_text)}</h2>${children}`; break;
      case 'heading_2': h += `<h3 class="n-h2">${rt(d.rich_text)}</h3>${children}`; break;
      case 'heading_3': h += `<h4 class="n-h3">${rt(d.rich_text)}</h4>${children}`; break;
      case 'bulleted_list_item': h += `<ul class="n-ul"><li>${rt(d.rich_text)}${children}</li></ul>`; break;
      case 'numbered_list_item': h += `<ol class="n-ol"><li>${rt(d.rich_text)}${children}</li></ol>`; break;
      case 'quote': h += `<blockquote class="n-quote">${rt(d.rich_text)}${children}</blockquote>`; break;
      case 'callout':
        const ic = d.icon?.emoji || '💡';
        h += `<div class="n-callout"><div class="n-callout-icon">${ic}</div><div class="n-callout-body">${rt(d.rich_text)}${children}</div></div>`;
        break;
      case 'image': 
        const imgUrl = d.type === 'external' ? d.external.url : d.file.url;
        h += `<figure class="n-image"><img src="${imgUrl}" loading="lazy"></figure>`;
        break;
      case 'child_database':
        h += `<div class="n-db-wrap"><div class="n-db-grid" id="db-${b.id.replace(/-/g,'')}">⏳ Caricamento Database...</div></div>`;
        break;
      case 'child_page':
        const subId = b.id.replace(/-/g,'');
        if(!mapPageIds.has(subId)){
          h += `<div class="loc-card" onclick="gp('${subId}','${d.title.replace(/'/g,"\\'")}','📄')">
            <div class="loc-ov"><div class="loc-badge">📄</div><div class="loc-name">${d.title}</div><div class="loc-cta">APRI ◆</div></div>
          </div>`;
        }
        break;
      // Blocchi contenitore: passano semplicemente il contenuto dei figli
      case 'column_list':
      case 'column':
      case 'synced_block':
      case 'toggle':
        h += `<div class="n-container-${type}">${children}</div>`;
        break;
      case 'divider': h += `<div class="n-divider">✦</div>`; break;
    }
  }
  return h;
}

/* ── MODULI ACCESSORI ── */
var _glossary = { 'gp':'Pezzi d\'oro', 'PG':'Personaggio Giocante', 'DM':'Dungeon Master' };
function applyGlossary(root){
  root.querySelectorAll('.n-p, .n-callout-body').forEach(el => {
    let html = el.innerHTML;
    Object.keys(_glossary).forEach(term => {
      const regex = new RegExp('(?<![\\w>])' + term + '(?![\\w<])', 'g');
      html = html.replace(regex, `<span class="gterm" data-def="${_glossary[term]}">${term}</span>`);
    });
    el.innerHTML = html;
  });
}
