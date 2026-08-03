/* ════════════════════════════════════
   ARCAMIS — admin-preview.js
   Modal di anteprima prima del salvataggio.
   
   Sostituisce i salvataggi diretti con
   un flusso: modifica → preview → conferma/annulla
   
   Aggiungi questo file DOPO admin-overlay.js
   nel tuo HTML admin.
════════════════════════════════════ */

/* ── Inietta il modal nel DOM ── */
(function(){
  if(document.getElementById('arc-preview-modal')) return;

  var modal = document.createElement('div');
  modal.id = 'arc-preview-modal';
  modal.innerHTML =
    '<div class="arc-preview-inner">' +
      '<div class="arc-preview-title">Anteprima modifica</div>' +
      '<div id="arc-preview-body"></div>' +
      '<div class="arc-preview-btns">' +
        '<button class="arc-preview-cancel" onclick="arcPreviewCancel()">Annulla</button>' +
        '<button class="arc-preview-confirm" onclick="arcPreviewConfirm()">✓ Conferma e salva</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  // Chiudi cliccando fuori
  modal.addEventListener('click', function(e){
    if(e.target === modal) arcPreviewCancel();
  });

  // Chiudi con ESC
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') arcPreviewCancel();
  });
})();

/* ── Stato interno ── */
var _previewPending = null; // { type, data, saveFn }

/* ── Apri preview ── */
window.arcPreviewOpen = function(opts) {
  /*
    opts = {
      type: 'cover_carousel' | 'cover_page' | 'meta_carousel' | 'btns_carousel',
      preview: {
        imageUrl: '...',   // opzionale - URL immagine da mostrare
        lines: [           // righe di testo descrittive
          { label: 'Slide', value: '1' },
          { label: 'Tag', value: 'NUOVA AVVENTURA' },
        ]
      },
      saveFn: async function(){ ... }  // funzione che esegue il salvataggio
    }
  */
  _previewPending = opts;

  var body = document.getElementById('arc-preview-body');
  if(!body) return;

  var html = '';

  // Immagine anteprima
  if(opts.preview && opts.preview.imageUrl){
    html += '<img class="arc-preview-img" src="' + opts.preview.imageUrl + '" alt="Anteprima" />';
  }

  // Righe descrittive
  if(opts.preview && opts.preview.lines && opts.preview.lines.length){
    html += '<div class="arc-preview-meta" style="display:flex;flex-direction:column;gap:6px;margin-top:10px">';
    opts.preview.lines.forEach(function(line){
      html += '<div><span style="opacity:.5;margin-right:8px">' + _escHtml(line.label) + ':</span>'
           +  '<span>' + _escHtml(String(line.value || '—')) + '</span></div>';
    });
    html += '</div>';
  }

  body.innerHTML = html;

  var modal = document.getElementById('arc-preview-modal');
  if(modal) modal.classList.add('open');
};

/* ── Conferma → esegui salvataggio ── */
window.arcPreviewConfirm = async function() {
  if(!_previewPending || !_previewPending.saveFn) {
    arcPreviewCancel();
    return;
  }

  var confirmBtn = document.querySelector('.arc-preview-confirm');
  if(confirmBtn){
    confirmBtn.textContent = '⏳ Salvataggio...';
    confirmBtn.disabled = true;
  }

  try {
    await _previewPending.saveFn();
    arcPreviewCancel();
    showToast('Salvato con successo', '✓', 2400);
  } catch(e) {
    if(confirmBtn){
      confirmBtn.textContent = '✓ Conferma e salva';
      confirmBtn.disabled = false;
    }
    showToast('Errore nel salvataggio', '⚠️', 3000);
    console.error(e);
  }
};

/* ── Annulla ── */
window.arcPreviewCancel = function() {
  _previewPending = null;
  var modal = document.getElementById('arc-preview-modal');
  if(modal) modal.classList.remove('open');

  // Re-abilita il bottone conferma
  var confirmBtn = document.querySelector('.arc-preview-confirm');
  if(confirmBtn){
    confirmBtn.textContent = '✓ Conferma e salva';
    confirmBtn.disabled = false;
  }
};

function _escHtml(str){
  return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


/* ════════════════════════════════════
   ESEMPIO D'USO in admin-overlay.js
   
   // PRIMA (salvataggio diretto):
   async function saveCarouselCover(idx, base64) {
     await fetch('/api/admin', { method:'POST', body: JSON.stringify({...}) });
     showToast('Salvato', '✓', 2000);
   }
   
   // DOPO (con preview):
   async function saveCarouselCover(idx, base64) {
     arcPreviewOpen({
       type: 'cover_carousel',
       preview: {
         imageUrl: base64,
         lines: [
           { label: 'Slide', value: idx + 1 },
           { label: 'Tipo', value: 'Immagine di sfondo' }
         ]
       },
       saveFn: async function() {
         await fetch('/api/admin', { method:'POST', body: JSON.stringify({...}) });
         // writeAdminLog verrà chiamato lato server
       }
     });
   }
════════════════════════════════════ */
