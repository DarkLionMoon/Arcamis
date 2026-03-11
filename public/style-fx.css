/* ════════════════════════════════════
   LUME DI CANDELA — cursor vignette
════════════════════════════════════ */
#candlelight-overlay{
  position:fixed;inset:0;pointer-events:none;z-index:9;
  background:radial-gradient(
    circle 240px at var(--clx,50%) var(--cly,50%),
    transparent 0%,
    rgba(0,0,0,.0) 35%,
    rgba(0,0,0,.38) 70%,
    rgba(0,0,0,.62) 100%
  );
  opacity:0;transition:opacity .5s;
}
#candlelight-overlay.cl-on{opacity:1}
/* su mobile nasconde il pulsante (nessun cursore) */
@media(hover:none){#candle-toggle{display:none!important}}

/* ════════════════════════════════════
   ECO DELLE RUNE — decifrazione titoli
════════════════════════════════════ */
@keyframes runeDecrypt{
  0%{
    filter:blur(4px);opacity:.15;
    letter-spacing:.35em;color:rgba(200,155,60,.35);
  }
  45%{filter:blur(2px);opacity:.55;letter-spacing:.12em}
  80%{filter:blur(.5px);opacity:.9;letter-spacing:.06em}
  100%{filter:blur(0);opacity:1;letter-spacing:inherit;color:inherit}
}
.rr{animation:runeDecrypt 1.1s cubic-bezier(.4,0,.2,1) forwards}

/* ════════════════════════════════════
   FOG OF WAR — nebbia su mpin inesplorati
════════════════════════════════════ */
.mpin[data-explored="false"]{
  filter:grayscale(1) brightness(.45) sepia(.3);
  opacity:.6;
  transition:filter .6s ease,opacity .6s ease;
}
.mpin[data-explored="false"]:hover{
  filter:grayscale(.4) brightness(.7);
  opacity:.8;
}
.mpin[data-explored="true"]{
  filter:none;opacity:1;
  transition:filter .6s ease,opacity .6s ease;
}

/* ════════════════════════════════════
   TOAST — Notifiche del Destino
════════════════════════════════════ */
#toast-wrap{
  position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
  z-index:9200;display:flex;flex-direction:column;align-items:center;gap:8px;
  pointer-events:none;
}
.arc-toast{
  display:flex;align-items:center;gap:10px;
  background:rgba(4,5,14,.97);border:1px solid rgba(200,155,60,.35);
  color:var(--parch);font-family:'Cinzel',serif;font-size:10px;
  letter-spacing:.1em;padding:9px 18px;
  box-shadow:0 4px 24px rgba(0,0,0,.7),0 0 0 1px rgba(200,155,60,.07),var(--glow);
  opacity:0;transform:translateY(14px);
  transition:opacity .28s ease,transform .28s ease;
  white-space:nowrap;
}
.arc-toast.in{opacity:1;transform:translateY(0)}
.arc-toast.out{opacity:0;transform:translateY(-8px)}
.arc-toast-icon{font-size:14px;color:var(--gold);flex-shrink:0}
.arc-toast-msg{color:var(--parch)}
@media(max-width:768px){#toast-wrap{bottom:72px;left:16px;right:16px;transform:none;}
  .arc-toast{font-size:9.5px;padding:8px 14px;white-space:normal}}

/* ════════════════════════════════════
   WHISPER SIDEBAR — indice sezioni
════════════════════════════════════ */
#whisper-nav{
  position:fixed;right:10px;top:50%;transform:translateY(-50%);
  z-index:170;display:flex;flex-direction:column;gap:10px;
  pointer-events:auto;
}
.wn-dot{
  display:block;width:7px;height:7px;border-radius:50%;
  background:rgba(200,155,60,.25);border:1px solid rgba(200,155,60,.2);
  position:relative;cursor:pointer;
  transition:background .2s,transform .2s,box-shadow .2s;
}
.wn-dot::after{
  content:attr(data-label);
  position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);
  background:rgba(4,5,14,.97);border:1px solid rgba(200,155,60,.25);
  color:var(--parch);font-family:'Cinzel',serif;font-size:8.5px;
  letter-spacing:.08em;padding:5px 10px;white-space:nowrap;
  opacity:0;pointer-events:none;
  transition:opacity .18s;
}
.wn-dot:hover{
  background:rgba(200,155,60,.7);
  transform:scale(1.6);
  box-shadow:0 0 8px rgba(200,155,60,.4);
}
.wn-dot:hover::after{opacity:1}
@media(max-width:768px){#whisper-nav{display:none}}
/* ── Copy link button nel page-hero ── */
.ph-copy-btn{
  margin-top:12px;
  display:inline-flex;align-items:center;gap:6px;
  background:transparent;border:1px solid rgba(200,155,60,.2);
  color:rgba(200,155,60,.45);font-family:'Cinzel',serif;font-size:8px;
  letter-spacing:.15em;padding:5px 12px;cursor:pointer;
  transition:border-color .2s,color .2s,background .2s;
}
.ph-copy-btn:hover{border-color:rgba(200,155,60,.5);color:var(--gold2);background:rgba(200,155,60,.06)}
/* ── Pulsante Lume di Candela ── */
#candle-toggle{
  position:fixed;bottom:168px;right:18px;z-index:180;
  width:38px;height:38px;border-radius:50%;
  background:rgba(4,5,14,.92);border:1px solid rgba(200,155,60,.18);
  color:var(--text3);font-size:16px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:border-color .2s,color .2s,box-shadow .2s;
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  title:'Lume di candela';
}
#candle-toggle:hover{border-color:rgba(200,155,60,.4);color:rgba(200,155,60,.7)}
#candle-toggle.cl-on{border-color:var(--gold);color:var(--gold2);box-shadow:0 0 12px rgba(200,155,60,.3)}
@media(max-width:768px){#candle-toggle{display:none}}
