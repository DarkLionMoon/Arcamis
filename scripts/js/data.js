/* ════════════════════════════════════
   ARCAMIS — data.js
   Costanti globali e registro pagine
   (AUTO-GENERATO da sync-registry.py — NON MODIFICARE A MANO)
════════════════════════════════════ */
var ROOT = '2f00274fdc1c801a9b39d8d69800f7a8';
var GUILD = '1348723468157456425';

var pages = [
  {k:'la-storia-di-gandora',l:'La Storia di Gandora',i:'🐉',id:'pag-la-storia-di-gandora',sec:'lore',sub:'Storia'},
  {k:'regole-del-server',l:'Regole del Server',i:'📋',id:'pag-regole-del-server',sec:'regole'},
  {k:'materiale-approvato',l:'Materiale Approvato',i:'📖',id:'pag-materiale-approvato',sec:'personaggio'},
  {k:'pantheon',l:'Pantheon',i:'🛐',id:'pag-pantheon',sec:'lore'},
  {k:'lavori',l:'Lavori',i:'📄',id:'pag-lavori',sec:'personaggio'}
];

function getPage(idOrK){
  return pages.find(p => p.id === idOrK || p.k === idOrK);
}

/* ════ SEZIONI MENU (dropdown top bar) ════ */
var SECTIONS = [
  {v:"regole",l:"Regole"},
  {v:"personaggio",l:"Personaggio"},
  {v:"lore",l:"Lore"}
];

/* ════ LAVORI ════ */
var LAVORI = [
  
];