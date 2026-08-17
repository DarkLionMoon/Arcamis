/* ════════════════════════════════════
   ARCAMIS — data.js
   Costanti globali e registro pagine
   (AUTO-GENERATO da sync-registry.py — NON MODIFICARE A MANO)
════════════════════════════════════ */
var ROOT = '2f00274fdc1c801a9b39d8d69800f7a8';
var GUILD = '1348723468157456425';

var pages = [
  {k:'arcamis',l:'Arcamis',i:'🏰',id:'3090274fdc1c80e1a365ce1c36873455'},
  {k:'selva',l:'Selva Fogliabruna',i:'🍂',id:'30d0274fdc1c800999feeb0ca6669b22'},
  {k:'foresta',l:'Foresta Smarrimento',i:'🌲',id:'30d0274fdc1c8016b113d5c2d7662d8f'},
  {k:'volonx',l:'Volonx',i:'🏔️',id:'30d0274fdc1c804b9cb7e366f02bd635'},
  {k:'gilda',l:'Gilda degli avventurieri',i:'🗡️',id:'2f00274fdc1c801b8c13cefd9e15694e'},
  {k:'changelog',l:'Changelog',i:'📝',id:'3000274fdc1c8033a214c44a1aa7f01f'},
  {k:'maestria',l:'Maestria / Titoli',i:'🔨',id:'2f00274fdc1c802a9babd4239d97a319'},
  {k:'la-storia-di-gandora',l:'La Storia di Gandora',i:'🐉',id:'pag-la-storia-di-gandora',sec:'lore',sub:'Storia'},
  {k:'regole-del-server',l:'Regole del Server',i:'📋',id:'pag-regole-del-server',sec:'regole'},
  {k:'materiale-approvato',l:'Materiale Approvato',i:'📖',id:'pag-materiale-approvato',sec:'personaggio',sub:'Regole'},
  {k:'pantheon',l:'Pantheon',i:'🛐',id:'pag-pantheon',sec:'lore'}
];

function getPage(idOrK){
  return pages.find(p => p.id === idOrK || p.k === idOrK);
}

/* ════ SEZIONI MENU (dropdown top bar) ════ */
var SECTIONS = [
  {v:"regole",l:"Regole"},
  {v:"personaggio",l:"Personaggio"},
  {v:"lore",l:"Lore"},
  {v:"mestieri",l:"Mestieri"},
  {v:"homebrew",l:"Homebrew"}
];

/* ════ LAVORI ════ */
var LAVORI = [
  { l:'Gilda avventurieri', i:'🗡️', id:'2f00274fdc1c801b8c13cefd9e15694e' },
  { l:'Bottega farmaceutica', i:'💊', id:'2f00274fdc1c801c9697e75caa8d5f13' },
  { l:'Caserma', i:'🛡️', id:'2ff0274fdc1c80688dd6c2b293a1f626' },
  { l:'Corporazione dei costruttori', i:'🔨', id:'2ff0274fdc1c80769a4ae243f22f0582' },
  { l:'Tribunale', i:'⚖️', id:'3460274fdc1c800c8b3bf9a53d0cbf59' }
];