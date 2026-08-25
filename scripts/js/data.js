/* ════════════════════════════════════
   ARCAMIS — data.js
   Costanti globali e registro pagine
   (AUTO-GENERATO da sync-registry.py — NON MODIFICARE A MANO)
════════════════════════════════════ */
var ROOT = '2f00274fdc1c801a9b39d8d69800f7a8';
var GUILD = '1348723468157456425';

/* ════ CONFIG INTERFACCIA (admin → Interfaccia) ════ */
var UI_CONFIG = {
 "bottomNav": [
  {
   "icon": "🏰",
   "label": "Home",
   "action": "home"
  },
  {
   "icon": "🧭",
   "label": "Esplora",
   "action": "drawer"
  },
  {
   "icon": "💼",
   "label": "Lavori",
   "action": "page",
   "target": "pag-lavori"
  },
  {
   "icon": "⚙️",
   "label": "Opzioni",
   "action": "options"
  }
 ],
 "drawerSearch": true
};

var pages = [
  {k:'la-storia-di-gandora',l:'La Storia di Gandora',i:'🐉',id:'pag-la-storia-di-gandora',sec:'lore'},
  {k:'regole-del-server',l:'Regole del Server',i:'📋',id:'pag-regole-del-server',sec:'regole'},
  {k:'materiale-approvato',l:'Materiale Approvato',i:'📖',id:'pag-materiale-approvato',sec:'personaggio'},
  {k:'pantheon',l:'Pantheon',i:'🛐',id:'pag-pantheon',sec:'lore'},
  {k:'lavori',l:'Lavoro',i:'💼',id:'pag-lavori',sec:'personaggio'},
  {k:'come-si-inizia',l:'Come si inizia',i:'🌟',id:'pag-come-si-inizia'},
  {k:'andando-avanti',l:'Andando avanti',i:'📈',id:'pag-andando-avanti'},
  {k:'ospedale',l:'Ospedale',i:'⚕️',id:'pag-ospedale',sec:'lavori'},
  {k:'sartoria',l:'Sartoria',i:'🧵',id:'pag-sartoria',sec:'lavori'},
  {k:'maestria-titoli',l:'Maestria / Titoli',i:'🏅',id:'pag-maestria-titoli'},
  {k:'casate-e-compagnie',l:'Casate e Compagnie',i:'🏰',id:'pag-casate-e-compagnie'},
  {k:'storia-del-mondo',l:'Storia del Mondo',i:'📖',id:'pag-storia-del-mondo'},
  {k:'introduzione',l:'Introduzione',i:'📜',id:'pag-introduzione'},
  {k:'npc-storia',l:'Npc',i:'🧝',id:'pag-npc-storia'},
  {k:'piani-di-esistenza',l:'Piani di esistenza',i:'🌌',id:'pag-piani-di-esistenza'},
  {k:'linguaggi',l:'Linguaggi',i:'🗣️',id:'pag-linguaggi'},
  {k:'bibliografia-scoperta',l:'Bibliografia scoperta',i:'📚',id:'pag-bibliografia-scoperta'},
  {k:'esplora-dal-vivo',l:'Esplora dal vivo',i:'🗺️',id:'pag-esplora-dal-vivo'},
  {k:'materiale-extra',l:'Materiale extra',i:'📦',id:'pag-materiale-extra'},
  {k:'mappe',l:'Mappe',i:'🗺️',id:'pag-mappe'},
  {k:'mappa-arcamis',l:'Arcamis',i:'🏙️',id:'pag-mappa-arcamis'},
  {k:'homebrew',l:'Homebrew',i:'⚗️',id:'pag-homebrew'},
  {k:'specie-homebrew',l:'Specie Homebrew',i:'🧬',id:'pag-specie-homebrew'},
  {k:'regole-homebrew',l:'Regole Homebrew',i:'📐',id:'pag-regole-homebrew'},
  {k:'sottoclassi-homebrew',l:'Sottoclassi Homebrew',i:'⚔️',id:'pag-sottoclassi-homebrew'},
  {k:'changelog',l:'Changelog',i:'📝',id:'pag-changelog'},
  {k:'arcamis',l:'Arcamis',i:'📍',id:'pag-arcamis'},
  {k:'selva-fogliabruna',l:'Selva Fogliabruna',i:'🌲',id:'pag-selva-fogliabruna'},
  {k:'foresta-dello-smarrimento',l:'Foresta dello Smarrimento',i:'🌑',id:'pag-foresta-dello-smarrimento'},
  {k:'volonx',l:'Volonx',i:'🏘️',id:'pag-volonx'},
  {k:'vigilius',l:'Vigilius',i:'🏛️',id:'pag-vigilius'},
  {k:'galeton',l:'Galeton',i:'🏘️',id:'pag-galeton'},
  {k:'lago-di-gromot',l:'Lago di Gromot',i:'🌊',id:'pag-lago-di-gromot'},
  {k:'forte-vigilus',l:'Forte Vigilus',i:'🏰',id:'pag-forte-vigilus'},
  {k:'riva-di-ferro',l:'Riva di Ferro',i:'⚓',id:'pag-riva-di-ferro'},
  {k:'fumofosco',l:'Fumofosco',i:'🌫️',id:'pag-fumofosco'},
  {k:'rovine-di-kaldur',l:'Rovine di Kaldur',i:'🗿',id:'pag-rovine-di-kaldur'},
  {k:'rivorosso',l:'Rivorosso',i:'🌊',id:'pag-rivorosso'},
  {k:'circolo-dello-smarrimento',l:'Circolo dello Smarrimento',i:'🪨',id:'pag-circolo-dello-smarrimento'},
  {k:'dimora-degli-ursidi',l:'Dimora degli Ursidi',i:'🐻',id:'pag-dimora-degli-ursidi'}
];

function getPage(idOrK){
  return pages.find(p => p.id === idOrK || p.k === idOrK);
}

/* ════ SEZIONI MENU (dropdown top bar) ════ */
var SECTIONS = [
  {v:"regole",l:"Regole"},
  {v:"personaggio",l:"Personaggio"},
  {v:"lavori",l:"Lavori"},
  {v:"lore",l:"Lore"}
];

/* ════ LAVORI ════ */
var LAVORI = [
  
];