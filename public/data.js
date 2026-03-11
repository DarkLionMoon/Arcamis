/* ════════════════════════════════════
   ARCAMIS — data.js
   Costanti globali e registro pagine
════════════════════════════════════ */
var ROOT='2f00274fdc1c801a9b39d8d69800f7a8';
var GUILD='1348723468157456425';

var pages=[
  {k:'gameplay',   l:'Gameplay',                i:'⚔️', id:'2f00274fdc1c8065a11ff45192aa5dcb'},
  {k:'regole',     l:'Regole',                  i:'📜', id:'2f00274fdc1c800b9d8fc366e8e40c5c'},
  {k:'materiale',  l:'Materiale approvato',      i:'📋', id:'3130274fdc1c807eb61fde24e8236659'},
  {k:'inizia',     l:'Come si inizia',           i:'🌟', id:'2dd222f22ef8413f8cb48f03bbb4f4b0'},
  {k:'avanti',     l:'Andando avanti',           i:'📈', id:'5cea525d149f4acb9c59007bf6b3d5ff'},
  {k:'classi',     l:'Classi',                  i:'🎭', id:'30a0274fdc1c804ab56bd3943add26d2'},
  {k:'galleria',   l:'Galleria PG',             i:'🖼️', id:'2fd0274fdc1c80d8b948c4133f874f28'},
  {k:'biblioteca', l:'Biblioteca',              i:'📚', id:'2f00274fdc1c8089bfe6c24434d53b67'},
  {k:'bottega',    l:'Bottega farmaceutica',    i:'💊', id:'2f00274fdc1c801c9697e75caa8d5f13'},
  {k:'caserma',    l:'Caserma',                 i:'🛡️', id:'2ff0274fdc1c80688dd6c2b293a1f626'},
  {k:'corp',       l:'Corporazione costruttori',i:'🔨', id:'2ff0274fdc1c80769a4ae243f22f0582'},
  {k:'forgia',     l:'Forgia',                  i:'🔥', id:'2f00274fdc1c805ca01ec57f18d2ffee'},
  {k:'gilda',      l:'Gilda degli avventurieri',i:'🗡️', id:'2f00274fdc1c801b8c13cefd9e15694e'},
  {k:'locanda',    l:'Locanda',                 i:'🍺', id:'2f00274fdc1c80faa99eda064ef0fabc'},
  {k:'ospedale',   l:'Ospedale',                i:'⚕️', id:'2f00274fdc1c807aa03cc6cbeb3687cc'},
  {k:'sartoria',   l:'Sartoria',                i:'🧵', id:'2ff0274fdc1c8035bad4f0b6ab705192'},
  {k:'pantheon',   l:'Pantheon',                i:'🛐', id:'2f00274fdc1c80679bd3c3df8a1fa040'},
  {k:'changelog',  l:'Changelog',               i:'📝', id:'3000274fdc1c8033a214c44a1aa7f01f'},
  {k:'maestria',   l:'Maestria / Titoli ed altro',i:'🔨',id:'2f00274fdc1c802a9babd4239d97a319'},
  {k:'lore',       l:'Lore',                    i:'📚', id:'2f00274fdc1c806f8f17dbc6532d2211'},
  {k:'homebrew',   l:'Homebrew',                i:'❓', id:'2f00274fdc1c80e78ad7ce985007b7c6'},
  {k:'mappe',      l:'Mappe',                   i:'🗺️', id:'2f10274fdc1c80489f23c49164747770'},
];

/* ID da prefetchare all'avvio */
var PREFETCH_IDS=[
  '2f00274fdc1c8065a11ff45192aa5dcb', /* Gameplay      */
  '2f00274fdc1c800b9d8fc366e8e40c5c', /* Regole        */
  '2f00274fdc1c801b8c13cefd9e15694e', /* Gilda         */
  '2f00274fdc1c80faa99eda064ef0fabc', /* Locanda       */
  '2f00274fdc1c80679bd3c3df8a1fa040', /* Pantheon      */
  '2f00274fdc1c806f8f17dbc6532d2211', /* Lore          */
];

var CHANGELOG_ID='3000274fdc1c8033a214c44a1aa7f01f';
