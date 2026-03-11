/* ════════════════════════════════════
   NOTION RENDER — Versione Carosello
════════════════════════════════════ */

// ... (tieni le funzioni iconAccent e renderRichText come prima) ...

function renderBlocks(blocks) {
  var html = '';
  var i = 0;
  
  while (i < blocks.length) {
    var b = blocks[i];

    // LOGICA CAROSELLO: Se troviamo una sequenza di child_page, le mettiamo in un carosello
    if (b.type === 'child_page') {
      html += '<div class="carousel-container">';
      html += '<button class="car-btn left" onclick="scrollCar(this, -1)">‹</button>';
      html += '<div class="carousel-track">';
      
      while (i < blocks.length && blocks[i].type === 'child_page') {
        var cp = blocks[i].child_page;
        var id = blocks[i].id.replace(/-/g,'');
        html += `<div class="lcard fade-in" onclick="gp('${id}','${cp.title}','📄')">
                  <div class="shine"></div>
                  <div class="lcard-title">${cp.title}</div>
                 </div>`;
        i++;
      }
      
      html += '</div>';
      html += '<button class="car-btn right" onclick="scrollCar(this, 1)">›</button>';
      html += '</div>';
      continue; // Salta l'incremento finale perché lo abbiamo già fatto nel loop interno
    }

    // Altri blocchi (Heading, Paragraph, etc.)
    if(b.type === 'paragraph') {
      html += '<p class="n-p">' + renderRichText(b.paragraph.rich_text) + '</p>';
    }
    else if(b.type.includes('heading')) {
      var h = b[b.type];
      var level = b.type.split('_')[1];
      var txt = renderRichText(h.rich_text);
      if(h.is_toggleable) {
        html += '<details class="n-th-wrapper" ontoggle="if(this.open) { loadDbGalleries(this); }">';
        html += '<summary class="n-h' + level + ' n-th">' + txt + '</summary>';
        html += '<div class="n-th-content">' + renderBlocks(b.children || []) + '</div>';
        html += '</details>';
      } else {
        html += '<h' + level + ' class="n-h' + level + '">' + txt + '</h' + level + '>';
      }
    }
    else if(b.type === 'child_database') {
      html += '<div class="n-db-wrap" data-dbid="' + b.id.replace(/-/g,'') + '">';
      html += '<div class="n-db-loading">Caricamento...</div></div>';
    }
    else if(b.type === 'image') {
      var url = b.image.type === 'external' ? b.image.external.url : b.image.file.url;
      html += '<div class="n-image"><img src="' + url + '" loading="lazy"></div>';
    }
    else if(b.type === 'divider') {
      html += '<hr class="n-hr">';
    }
    
    i++;
  }
  return html;
}

// Funzione per far scorrere il carosello
function scrollCar(btn, dir) {
  var track = btn.parentElement.querySelector('.carousel-track');
  var scrollAmount = track.clientWidth * 0.8;
  track.scrollBy({ left: scrollAmount * dir, behavior: 'smooth' });
}

// ... (tieni loadDbGalleries e il resto come prima) ...
