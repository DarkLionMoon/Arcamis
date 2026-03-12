/* ════════════════════════════════════════════════════════════════════════════
   NOTION RENDER — COMPLETE & STABLE (No Cache / Full Content)
   ════════════════════════════════════════════════════════════════════════════ */

var navStack = []; 
var isRendering = false; 

/* ── CONFIGURAZIONE MAPPA ── */
var mapPageIds = new Set([
  '3090274fdc1c80e1a365ce1c36873455', '30d0274fdc1c800999feeb0ca6669b22',
  '30d0274fdc1c8016b113d5c2d7662d8f', '30d0274fdc1c804b9cb7e366f02bd635',
  '31f0274fdc1c8059a923c73da185a0e3', '31f0274fdc1c8019945af2b26306462f',
  '30d0274fdc1c803387c4fda013b857e9', '30d0274fdc1c8090aee7ed0430170414',
  '31f0274fdc1c8075b0dec2e2a6bc359e', '31f0274fdc1c805b89b8f0678463e615',
  '31f0274fdc1c808191abe4df86d176e6', '31e0274fdc1c80f3a3cee348f59cede0',
  '30d0274fdc1c80038beec3f444e45f8b', '30d0274fdc1c80cf8cdaf328e339dfc7',
  '3130274fdc1c80848fe5dfd7d2610c06', '31e0274fdc1c80f581f4f9cd7284bff0'
]);

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
    const hv = document.getElementById('hv'), pv = document.getElementById('pv');
    const pbody = document.getElementById('pbody');
    document.getElementById('ph-title').textContent = label;
    document.getElementById('ph-icon').textContent = icon;
    document.getElementById('main').scrollTo({top:0, behavior:'smooth'});
    if(hv.style.display !== 'none') xfade(hv, pv);
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
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const html = renderBlocks(data.blocks, true);
    pbody.innerHTML = `<div class="nc" style="animation:fi .3s ease forwards">${html}</div>`;
    
    // Inizializzazione moduli
    applyGlossary(pbody);
    if(window.loadDbGalleries) window.loadDbGalleries(pbody);
    if(window.buildWhisperNav) window.buildWhisperNav();
  } catch(e) {
    pbody.innerHTML = `<div class="errbox">⚠️ Errore critico nel recupero dati.<br><small>${e.message}</small></div>`;
  }
}

/* ── IL CUORE DEL RENDERING (TUTTI I BLOCCHI) ── */
function renderBlocks(blocks, isRoot){
  if(!blocks) return '';
  let h = '';
  for(let i=0; i<blocks.length; i++){
    const b = blocks[i];
    const d = b[b.type];
    if(!d) continue;

    switch(b.type){
      case 'paragraph': h += `<p class="n-p">${rt(d.rich_text) || '<br>'}</p>`; break;
      case 'heading_1': h += `<h2 class="n-h1">${rt(d.rich_text)}</h2>`; break;
      case 'heading_2': h += `<h3 class="n-h2">${rt(d.rich_text)}</h3>`; break;
      case 'heading_3': h += `<h4 class="n-h3">${rt(d.rich_text)}</h4>`; break;
      case 'bulleted_list_item': h += `<ul class="n-ul"><li>${rt(d.rich_text)}</li></ul>`; break;
      case 'numbered_list_item': h += `<ol class="n-ol"><li>${rt(d.rich_text)}</li></ol>`; break;
      case 'divider': h += `<div class="n-divider">✦</div>`; break;
      case 'quote': h += `<blockquote class="n-quote">${rt(d.rich_text)}</blockquote>`; break;
      case 'callout':
        const ic = d.icon?.emoji || '💡';
        h += `<div class="n-callout"><div class="n-callout-icon">${ic}</div><div class="n-callout-body">${rt(d.rich_text)}</div></div>`;
        break;
      case 'image': 
        const imgUrl = d.type === 'external' ? d.external.url : d.file.url;
        h += `<figure class="n-image"><img src="${imgUrl}" loading="lazy"></figure>`;
        break;
      case 'video':
        const vUrl = d.type === 'external' ? d.external.url : d.file.url;
        h += `<div class="n-video"><iframe src="${vUrl.replace('watch?v=', 'embed/')}" allowfullscreen></iframe></div>`;
        break;
      case 'table':
        h += `<div class="n-twrap"><table class="n-tbl"><tbody>`;
        if(b.children) b.children.forEach(row => {
          h += `<tr>${row.table_row.cells.map(c => `<td>${rt(c)}</td>`).join('')}</tr>`;
        });
        h += `</tbody></table></div>`;
        break;
      case 'child_page':
        if(b._done) break;
        let cards = '';
        let j = i;
        while(j < blocks.length && blocks[j].type === 'child_page'){
          const sub = blocks[j];
          const subId = sub.id.replace(/-/g,'');
          if(!mapPageIds.has(subId)){
            cards += `<div class="loc-card" onclick="gp('${subId}','${sub.child_page.title.replace(/'/g,"\\'")}','📄')">
              <div class="loc-ov"><div class="loc-badge">📄</div><div class="loc-name">${sub.child_page.title}</div><div class="loc-cta">APRI ◆</div></div>
            </div>`;
          }
          blocks[j]._done = true;
          j++;
        }
        h += `<div class="n-db-lc-wrap"><div class="loc-wrap"><div class="loc-track-outer"><div class="loc-track" style="gap:16px;display:flex">${cards}</div></div></div></div>`;
        break;
      case 'synced_block':
        if(b.children) h += renderBlocks(b.children, false);
        break;
    }
  }
  return h;
}

/* ── MODULI ACCESSORI ── */
var _glossary = { 'gp':'Pezzi d\'oro', 'PG':'Personaggio Giocante', 'DM':'Dungeon Master', 'CA':'Classe Armatura' };
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

window.addEventListener('popstate', (e) => {
  if(e.state && e.state.id) gp(e.state.id, e.state.label, e.state.icon, true);
});
