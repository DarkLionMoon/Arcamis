/* ════════════════════════════════════
   ARCAMIS — data.js
   Costanti globali e registro pagine
   (Versione Statica Integrale)
════════════════════════════════════ */
var ROOT = '2f00274fdc1c801a9b39d8d69800f7a8';
var GUILD = '1348723468157456425';

var pages = [
  {k:'gameplay',   l:'Gameplay',                i:'⚔️', id:'2f00274fdc1c8065a11ff45192aa5dcb'},
  {k:'regole',     l:'Regole',                  i:'📜', id:'2f00274fdc1c800b9d8fc366e8e40c5c'},
  {k:'materiale',  l:'Materiale approvato',      i:'📋', id:'3130274fdc1c807eb61fde24e8236659'},
  {k:'inizia',     l:'Come si inizia',           i:'🌟', id:'2dd222f22ef8413f8cb48f03bbb4f4b0'},
  {k:'avanti',     l:'Andando avanti',           i:'📈', id:'5cea525d149f4acb9c59007bf6b3d5ff'},
  {k:'galleria',   l:'Galleria PG',             i:'🖼️', id:'2fd0274fdc1c80d8b948c4133f874f28'},
  {k:'biblioteca', l:'Biblioteca',              i:'📚', id:'2f00274fdc1c8089bfe6c24434d53b67'},
  {k:'farmacia',   l:'Bottega farmaceutica',    i:'🧪', id:'2f00274fdc1c804b9015c72cb6121404'},
  {k:'arcamis',    l:'Arcamis',                 i:'🏰', id:'3090274fdc1c80e1a365ce1c36873455'},
  {k:'selva',      l:'Selva Fogliabruna',       i:'🍂', id:'30d0274fdc1c800999feeb0ca6669b22'},
  {k:'foresta',    l:'Foresta Smarrimento',     i:'🌲', id:'30d0274fdc1c8016b113d5c2d7662d8f'},
  {k:'volonx',     l:'Volonx',                  i:'🏔️', id:'30d0274fdc1c804b9cb7e366f02bd635'},
  {k:'arpax',      l:'Arpax',                   i:'🦅', id:'30d0274fdc1c807eb443f55071f00844'},
  {k:'deserto',    l:'Deserto del Crepuscolo',  i:'🔥', id:'2f00274fdc1c805ca01ec57f18d2ffee'},
  {k:'gilda',      l:'Gilda degli avventurieri',i:'🗡️', id:'2f00274fdc1c801b8c13cefd9e15694e'},
  {k:'locanda',    l:'Locanda',                 i:'🍺', id:'2f00274fdc1c80faa99eda064ef0fabc'},
  {k:'ospedale',   l:'Ospedale',                i:'⚕️', id:'2f00274fdc1c807aa03cc6cbeb3687cc'},
  {k:'sartoria',   l:'Sartoria',                i:'🧵', id:'2ff0274fdc1c8035bad4f0b6ab705192'},
  {k:'pantheon',   l:'Pantheon',                i:'🛐', id:'2f00274fdc1c80679bd3c3df8a1fa040'},
  {k:'changelog',  l:'Changelog',               i:'📝', id:'3000274fdc1c8033a214c44a1aa7f01f'},
  {k:'maestria',   l:'Maestria / Titoli',       i:'🔨', id:'2f00274fdc1c80259b3bc01b09b5757d'}
];

function getPage(idOrK){
  return pages.find(p => p.id === idOrK || p.k === idOrK);
}
