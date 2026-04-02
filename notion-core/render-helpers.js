/* ════════════════════════════════════
   notion-core/render-helpers.js
   Costanti e funzioni helper pure:
   safeCoverUrl, iconAccent, iconGradient,
   calloutColor, safeHost, mapPageIds,
   GALLERY_DB_ID.

   ⚠️ Deve essere caricato PRIMA di:
      render-blocks.js e render-db.js
════════════════════════════════════ */

var GALLERY_DB_ID = '2fd0274fdc1c80038889fc072a360bae';

var mapPageIds = new Set([
  '3090274fdc1c80e1a365ce1c36873455',
  '30d0274fdc1c800999feeb0ca6669b22',
  '30d0274fdc1c8016b113d5c2d7662d8f',
  '30d0274fdc1c804b9cb7e366f02bd635',
  '31f0274fdc1c8059a923c73da185a0e3',
  '31f0274fdc1c8019945af2b26306462f',
  '30d0274fdc1c803387c4fda013b857e9',
  '30d0274fdc1c8090aee7ed0430170414',
  '31f0274fdc1c8075b0dec2e2a6bc359e',
  '31f0274fdc1c805b89b8f0678463e615',
  '31f0274fdc1c808191abe4df86d176e6',
  '31e0274fdc1c80f3a3cee348f59cede0',
  '30d0274fdc1c80038beec3f444e45f8b',
  '30d0274fdc1c80cf8cdaf328e339dfc7',
  '3130274fdc1c80848fe5dfd7d2610c06',
  '31e0274fdc1c80f581f4f9cd7284bff0',
]);

function safeCoverUrl(url){
  if(!url)return null;
  if(url.indexOf('s3.us-west')>-1||url.indexOf('prod-files-secure')>-1){
    return'/api/notion?img='+encodeURIComponent(url);
  }
  return url;
}

window.iconAccent = function(emoji){
  if(!emoji)return{c:'rgba(200,155,60,.7)',bg:'rgba(200,155,60,.06)'};
  var e=emoji;
  if(['🔥','⚔️','🗡️','⚠️','🛡️','⚡','🐉','💀'].indexOf(e)>-1)return{c:'rgba(220,70,50,.75)',bg:'rgba(180,50,40,.06)'};
  if(['📚','📜','📖','🗒️','🏛️','📋'].indexOf(e)>-1)return{c:'rgba(190,140,60,.75)',bg:'rgba(150,110,40,.06)'};
  if(['🌊','💧','🌙','🐋','🚢','⚓','🌐'].indexOf(e)>-1)return{c:'rgba(60,120,220,.75)',bg:'rgba(40,80,180,.06)'};
  if(['🌿','🌱','🍃','🌲','🌳','🌾','🍀'].indexOf(e)>-1)return{c:'rgba(50,160,80,.75)',bg:'rgba(30,120,50,.06)'};
  if(['🔮','💜','🌑','👁️','🧿','✨','🌌'].indexOf(e)>-1)return{c:'rgba(140,80,240,.75)',bg:'rgba(100,50,200,.06)'};
  if(['🍺','🍻','🥂','🍖','🧀','🍴'].indexOf(e)>-1)return{c:'rgba(180,110,40,.75)',bg:'rgba(140,80,30,.06)'};
  if(['💊','⚕️','🏥','🌡️','🩺'].indexOf(e)>-1)return{c:'rgba(80,180,160,.75)',bg:'rgba(40,140,120,.06)'};
  return{c:'rgba(200,155,60,.7)',bg:'rgba(200,155,60,.06)'};
};

function iconGradient(emoji){
  var e=emoji||'';
  if(['🔥','⚔️','🗡️','⚠️','🛡️','⚡','🐉','💀'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#300a06 0%,#180402 50%,#080100 100%)';
  if(['📚','📜','📖','🗒️','🏛️','📋'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#201408 0%,#120c04 50%,#060400 100%)';
  if(['🌊','💧','🌙','🐋','🚢','⚓','🌐'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#081c30 0%,#041016 50%,#020608 100%)';
  if(['🌿','🌱','🍃','🌲','🌳','🌾','🍀'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#0a1e0c 0%,#061008 50%,#020602 100%)';
  if(['🔮','💜','🌑','👁️','🧿','✨','🌌'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#14083c 0%,#0a0420 50%,#04020e 100%)';
  if(['🍺','🍻','🥂','🍖','🍴'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#1e1006 0%,#100804 50%,#060200 100%)';
  if(['💊','⚕️','🏥','🌡️','🩺'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#061c1a 0%,#040e0e 50%,#020606 100%)';
  return'radial-gradient(ellipse 90% 60% at 50% 80%,#0e0c04 0%,#080602 50%,#040200 100%)';
}

function calloutColor(ic){
  if(['📜','📖','📚','🗒️'].indexOf(ic)>-1)return{bg:'rgba(120,90,40,.07)',c:'rgba(180,130,50,.6)'};
  if(['⚠️','🔥','⚡','🗡️','⚔️','💀'].indexOf(ic)>-1)return{bg:'rgba(180,50,40,.07)',c:'rgba(210,70,55,.6)'};
  if(['🌊','💧','🌙','⭐','✨','🌌'].indexOf(ic)>-1)return{bg:'rgba(40,80,180,.07)',c:'rgba(70,110,220,.6)'};
  if(['🌿','🌱','🍃','🌲','🌳'].indexOf(ic)>-1)return{bg:'rgba(30,100,50,.07)',c:'rgba(60,150,80,.6)'};
  if(['🔮','💜','🌑','👁️','🧿'].indexOf(ic)>-1)return{bg:'rgba(100,50,180,.07)',c:'rgba(140,80,240,.6)'};
  return{bg:'rgba(200,155,60,.04)',c:'rgba(200,155,60,.55)'};
}

function safeHost(url){try{return new URL(url).hostname;}catch(e){return url;}}
