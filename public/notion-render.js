/* ════════════════════════════════════
   NOTION RENDER — Arcamis Engine (FIXED)
════════════════════════════════════ */

function iconAccent(emoji) {
  if(!emoji) return {c:'rgba(200,155,60,.7)', bg:'rgba(200,155,60,.06)'};
  const e = emoji;
  if(['🔥','⚔️','🗡️','⚠️','🛡️','⚡','🐉','💀'].includes(e)) return {c:'rgba(220,70,50,.75)', bg:'rgba(180,50,40,.06)'};
  if(['📚','📜','📖','🗒️','🏛️','📋'].includes(e)) return {c:'rgba(190,140,60,.75)', bg:'rgba(150,110,40,.06)'};
  return {c:'rgba(200,155,60,.7)', bg:'rgba(200,155,60,.06)'};
}

function renderRichText(rt) {
  if(!rt) return '';
  return rt.map(t => {
    let txt = t.plain_text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if(t.annotations.bold) txt = `<b>${txt}</b>`;
    if(t.annotations.italic) txt = `<i>${txt}</i>`;
    if(t.annotations.code) txt = `<code>${txt}</code>`;
    if(t.href) txt = `<a href="${t.href}" target="_blank">${txt}</a>`;
    return txt;
  }).join('');
}

function renderBlocks(blocks) {
  if(!blocks || !blocks.length) return '';
  let html = '';
  
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];

    // GESTIONE CAROSELLO (Solo per child_page consecutive)
    if (b.type === 'child_page') {
      let pages = [];
      let j = i;
      while (j < blocks.length && blocks[j].type === 'child_page') {
        pages.push(blocks[j]);
        j++;
      }
      
      if (pages.length > 1) {
        html += '<div class="carousel-container"><button class="car-btn left" onclick="scrollCar(this,-1)">‹</button><div class="carousel-track">';
        pages.forEach(p => {
          const id = p.id.replace(/-/g, '');
          html += `<div class="lcard fade-in" onclick="gp('${id}','${p.child_page.title.replace(/'/g, "\\'")}','📄')"><div class="shine"></div><div class="lcard-title">${p.child_page.title}</div></div>`;
        });
        html += '</div><button class="car-btn right" onclick="scrollCar(this,1)">›</button></div>';
        i = j - 1; // Salta le pagine già processate
        continue;
      } else {
        // Se è una pagina singola, caricala come card normale
        const id = b.id.replace(/-/g, '');
        html += `<div class="lcard single-card fade-in" onclick="gp('${id}','${b.child_page.title.replace(/'/g, "\\'")}','📄')"><div class="shine"></div><div class="lcard-title">${b.child_page.title}</div></div>`;
        continue;
      }
    }

    // IMMAGINI
    if (b.type === 'image') {
      const url = b.image.type === 'external' ? b.image.external.url : b.image.file.url;
      html += `<div class="n-image"><img src="${url}" loading="lazy"></div>`;
    }
    // PARAGRAFI
    else if (b.type === 'paragraph') {
      html += `<p class="n-p">${renderRichText(b.paragraph.rich_text)}</p>`;
    }
    // TITOLI (Heading)
    else if (b.type.includes('heading')) {
      const level = b.type.split('_')[1];
      const h = b[b.type];
      const txt = renderRichText(h.rich_text);
      if (h.is_toggleable) {
        html += `<details class="n-th-wrapper" ontoggle="if(this.open)loadDbGalleries(this)"><summary class="n-h${level} n-th">${txt}</summary><div class="n-th-content">${renderBlocks(b.children || [])}</div></details>`;
      } else {
        html += `<h${level} class="n-h${level}">${txt}</h${level}>`;
      }
    }
    // CALLOUT
    else if (b.type === 'callout') {
      const acc = iconAccent(b.callout.icon?.emoji);
      html += `<div class="n-callout" style="border-color:${acc.c};background:${acc.bg}">${b.callout.icon ? `<div class="n-callout-icon">${b.callout.icon.emoji}</div>` : ''}<div class="n-callout-body">${renderRichText(b.callout.rich_text)}</div></div>`;
    }
    // DATABASE
    else if (b.type === 'child_database') {
      html += `<div class="n-db-wrap" data-dbid="${b.id.replace(/-/g, '')}"><div class="n-db-loading">Caricamento...</div></div>`;
    }
    // DIVIDER
    else if (b.type === 'divider') {
      html += '<hr class="n-hr">';
    }
    // ELENCHI (Bulleted List)
    else if (b.type === 'bulleted_list_item') {
      html += `<ul class="n-ul"><li>${renderRichText(b.bulleted_list_item.rich_text)}</li></ul>`;
    }
  }
  return html;
}

function scrollCar(btn, dir) {
  const track = btn.parentElement.querySelector('.carousel-track');
  const step = track.clientWidth * 0.8;
  track.scrollBy({ left: step * dir, behavior: 'smooth' });
}

async function loadDbGalleries(root) {
  const dbs = (root || document).querySelectorAll('.n-db-wrap[data-dbid]');
  for (const el of dbs) {
    if (el.dataset.loaded) continue;
    const dbId = el.dataset.dbid;
    try {
      const res = await fetch(`/api/notion?dbId=${dbId}`);
      const data = await res.json();
      el.innerHTML = ''; el.dataset.loaded = "true";
      const grid = document.createElement('div'); grid.className = 'cgrid';
      data.pages.forEach(p => {
        const card = document.createElement('div');
        card.className = 'lcard fade-in';
        card.style.backgroundImage = p.cover ? `url(${p.cover})` : 'linear-gradient(135deg, #1a1c22, #0c0e12)';
        card.innerHTML = `<div class="shine"></div><div class="lcard-title">${p.icon || ''} ${p.title}</div>`;
        card.onclick = () => gp(p.id, p.title, p.icon || '📄');
        grid.appendChild(card);
      });
      el.appendChild(grid);
      if (window.attachShine) attachShine(el);
    } catch (e) { el.innerHTML = '<div class="n-err">Errore database.</div>'; }
  }
}
