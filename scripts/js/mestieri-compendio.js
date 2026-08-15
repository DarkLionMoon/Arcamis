/* ════════════════════════════════════
   ARCAMIS — mestieri-compendio.js
   Compendio completo dei mestieri,
   crafting, downtime e materiali.
   SPA entry: window.showMestieriCompendio
════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════════

var _CMP_MESTIERI = [
  { id:'alchimista', emoji:'⚗️', nome:'Alchimista', tagline:'Pozioni · Veleni · Antidoti · Composti Alchemici — la scienza come magia',
    desc:'Pozioni, veleni, antidoti e impacchi alchemici — il sapere distillato in una fiala.',
    materLav: [10,25,100,500,750],
    livelli: [
      { lv:1, items:[
        {n:'Potion of Healing', mp:'15 MO Erbe', ms:'10 MO Alcol', tip:'Common', desc:'Recuperi 2d4+2 PF', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Potion of Climbing', mp:'15 MO Muschio', ms:'10 MO Artiglio di ragno', tip:'Common', desc:'Arrampicata potenziata (1h)', url:'https://5e.tools/items.html#potion%20of%20climbing_dmg', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Potion of Watchful Rest', mp:'15 MO Caffè', ms:'10 MO Guano', tip:'Common', desc:'Riposo vigile senza sogni magici', url:'https://5e.tools/', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Potion of Comprehension', mp:'15 MO Polvere di pergamena', ms:'10 MO Sale', tip:'Adventuring Gear', desc:'Comprensione di scritti e linguaggi', url:'https://5e.tools/', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Lilypad Tonic', mp:'15 MO Foglie di ninfea', ms:'10 MO Linfa', tip:'Adventuring Gear', desc:'Camminare su acqua per breve durata', url:'https://5e.tools/', costo:25, vend:50, dt:[1,1,1,1,1]},
        {n:"Fuoco dell'Alchimista", mp:'15 MO Olio', ms:'5 MO Zolfo, 5 MO Fosforo', tip:'Adventuring Gear', desc:'1d4 fuoco, continua a bruciare', url:'https://5e.tools/', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Acido (Ampolla)', mp:'4 MO Sali metallici', ms:'8 MO Vetriolo', tip:'Adventuring Gear', desc:'2d6 acido sul bersaglio', url:'https://5e.tools/', costo:12, vend:24, dt:[2,1,1,1,1]},
        {n:'Antitossina', mp:'15 MO Carbone attivo', ms:'10 MO Mandragora', tip:'Adventuring Gear', desc:'Vantaggio ai TS contro veleno (1h)', url:'https://5e.tools/', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Fumogeno', mp:'5 MO Carbone', ms:'3 MO Salnitrico, 2 MO Zinco', tip:'Adventuring Gear', desc:'Sfera di fumo 3m per 1 minuto', url:'https://5e.tools/', costo:10, vend:20, dt:[1,1,1,1,1]},
        {n:'Olio (15 fiale × DT)', mp:'3 MR Grasso', ms:'2 MR Resina Infiammabile', tip:'Adventuring Gear', desc:'Olio infiammabile da applicare', url:'https://5e.tools/', costo:0.05, vend:0.5, dt:[1,1,1,1,1]},
      
        {n:'Fuoco dell\'Alchimista',prog:true,mp:'15 MO Olio',ms:'5 MO Zolfo, 5 MO Fosforo',tip:'Adventuring Gear',url:'https://5e.tools/items.html#alchemist%27s%20fire_xphb',costo:25,vend:50,dt:[3,1,1,1,1]},
        {n:'Olio (15 fiale x DT)',mp:'3 MR Grasso',ms:'2 MR Resina Infiammabile',tip:'Adventuring Gear',url:'https://5e.tools/items.html#oil_xphb',costo:0.05,vend:0.5,dt:[1,1,1,1,1]},
      ]},
      { lv:2, items:[
        {n:'Bottled Breath', mp:'50 MO Aria di Montagna', ms:'50 MO Vetro Incantato', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Philter of Love', mp:'50 MO Petali di Rosa', ms:'25 MO Polvere di perla, 25 MO Miele', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Oil of Slipperness', mp:'50 MO Bava di Lumaca Gigante', ms:'50 MO Olio di Oliva Magico', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Advantage', mp:'75 MO Polvere di Quadrifoglio', ms:'25 MO Baffi di gatto', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Water Breathing', mp:'75 MO Branchie di Pesce', ms:'25 MO Alghe fosforescenti', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Poison', mp:'65 MO Veleno di vipera', ms:'35 MO Bacche di belladonna', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Hill Giant Strength', mp:'85 MO Unghia di Gigante', ms:'15 MO Polvere di Ferro', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Growth', mp:'75 MO Ortica gigante', ms:'25 MO Lievito Magico', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Greater Healing', mp:'90 MO Bacche di vischio', ms:'10 MO Rosa canina', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Animal Friendship', mp:'85 MO Miele Selvatico', ms:'15 MO Peli di Lupo', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Fire Breath', mp:'95 MO Ghiandola di Drago Rosso', ms:'5 MO Polvere di Zolfo', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Resistance (doppia)', mp:'100 MO 2 Essenze elementali', ms:'150 MO Polvere di diamante', tip:'Uncommon', desc:'2 resistenze invece di 1', costo:250, vend:500, dt:[10,3,1,1]},
        {n:'Potion of Radiant Resistance', mp:'70 MO Olio Benedetto', ms:"30 MO Piume d'angelo", tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Fire Resistance', mp:'65 MO Scaglie di Salamandra', ms:'35 MO Basalto Polverizzato', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Cold Resistance', mp:'75 MO Grasso di Orso Polare', ms:'25 MO Ghiaccio Perenne', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Lightning Resistance', mp:'70 MO Polvere di Rame', ms:'30 MO Gomma Naturale', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Poison Resistance', mp:'80 MO Carbone Vegetale', ms:'20 MO Succo di lime', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Acid Resistance', mp:'50 MO Scaglie di Lumaca Corazzata', ms:'50 MO Acido di drago nero', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Thunder Resistance', mp:'25 MO Quarzo', ms:'75 MO Piume di uccello del tuono', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Force Resistance', mp:'90 MO Polvere di Stelle', ms:'10 MO Ectoplasma Stabile', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Psychic Resistance', mp:'80 MO Estratto di Lavanda Magica', ms:'20 MO Materia Grigia', tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Potion of Necrotic Resistance', mp:'55 MO Terra Sconsacrata', ms:"45 MO Polvere d'ossa di santo", tip:'Uncommon', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
      
        {n:'Potion of Hill Giant Strength',mp:'85 MO Unghia di Gigante',ms:'15 MO Polvere di Ferro',tip:'Uncommon',url:'https://5e.tools/items.html#potion%20of%20hill%20giant%20strength_xdmg',costo:100,vend:200,dt:[4,1,1,1]},
        {n:'Potion of Animal Friendship',mp:'85 Mo Miele Selvatico',ms:'15 MO Peli di Lupo',tip:'Uncommon',url:'https://5e.tools/items.html#potion%20of%20animal%20friendship_xdmg',costo:100,vend:200,dt:[4,1,1,1]},
        {n:'Potion of Polychromy',mp:'75 MO Pigmenti di Arcobaleno',ms:'25 MO Scaglie di pesce combattente',tip:'Uncommon',url:'https://5e.tools/items.html#potion%20of%20polychromy_ditlcot',costo:100,vend:200,dt:[4,1,1,1]},
        {n:'Potion of Controlled Mutation',mp:'80 MO Fluido di Doppelganger',ms:'20 MO Essenza di Camaleonte',tip:'Uncommon',url:'https://5e.tools/items.html#potion%20of%20controlled%20mutation_monstersofdrakkenheim',costo:100,vend:200,dt:[4,1,1,1]},
        {n:'Potion of Resistance',prog:true,mp:'100 MO 2 Essenze elementali (aka il materiale prinicpale delle altre pozioni)',ms:'150 MO Polvere di diamante',tip:'Uncommon',desc:'Questa pozione a differenza delle altre ti consente di avere 2 resistenze anzichè 1 sola',costo:250,vend:500,dt:[10,3,1,1]},
      ]},
      { lv:3, items:[
        {n:'Potion of Superior Healing', mp:'400 MO Radice di Vita', ms:'100 MO Rugiada di Stelle', tip:'Rare', url:'https://5e.tools/', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Potion of Heroism', prog:true, mp:'350 MO Sangue di Eroe', ms:'150 MO Ambra di Coraggio', tip:'Rare', url:'https://5e.tools/', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Potion of Invulnerability', prog:true, mp:'400 MO Scaglie di Drago', ms:'100 MO Ferro Adamantino', tip:'Rare', url:'https://5e.tools/', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Potion of Stone Giant Strength', mp:'350 MO Cuore di Gigante di Pietra', ms:'150 MO Minerali di Targon', tip:'Rare', url:'https://5e.tools/', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Potion of Clairvoyance', mp:'300 MO Occhio di Beholder', ms:'200 MO Cristallo di Profezia', tip:'Rare', url:'https://5e.tools/', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Potion of Mind Reading', prog:true, mp:'400 MO Cervello di Aboleth', ms:'100 MO Sale Psichico', tip:'Rare', url:'https://5e.tools/', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Oil of Etherealness', mp:'350 MO Essenza del Piano Etereo', ms:'150 MO Olio di Banca', tip:'Rare', url:'https://5e.tools/', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Veleno di Drago (10 dosi)', prog:true, mp:'400 MO Ghiandola di Drago', ms:'100 MO Cristallizzante', tip:'Rare — Veleno', desc:'DC 21 Cost., 14d6 veleno o metà. Spalmabile su arma.', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Acido di Drago Nero (5 dosi)', mp:'300 MO Ghiandola di Drago Nero', ms:'200 MO Vetriolo Puro', tip:'Rare — Acido', desc:'6d6 acido immediati, poi 3d6/turno per 1 min. DC 18 Cost.', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Composto Hextech Instabile', prog:true, mp:'450 MO Cristallo Hextech Grezzo', ms:'50 MO Reagenti di Zaun', tip:'Rare — Speciale', desc:'Esplosione 4,5m: 4d8 forza+4d8 fulmine. Con 1 su d6 esplode in mano.', costo:500, vend:1000, dt:[5,2,1]},
        {n:'Antidoto Universale', mp:'250 MO Carbone Ultra-Attivo', ms:'250 MO Radici di Mandragora Rara', tip:'Rare — Antidoto', desc:'Rimuove tutti i veleni, paralisi e accecamento.', costo:500, vend:1000, dt:[4,2,1]},
        {n:'Fumo Psichedelico (Bomba)', prog:true, mp:'300 MO Spore di Funghi del Vuoto', ms:'200 MO Polvere Fatica', tip:'Rare — Equipaggiamento', desc:'Area 6m: DC 16 Sag. o Confused per 1 turno, ripetuto ogni turno per 1 min.', costo:500, vend:1000, dt:[4,2,1]},
      ]},
      { lv:4, items:[
        {n:'Potion of Supreme Healing', mp:'1500 MO Frutto della Vita Eterna', ms:'500 MO Lacrime di Fenice', tip:'Very Rare', url:'https://5e.tools/', costo:2000, vend:4000, dt:[10,3]},
        {n:'Potion of Storm Giant Strength', mp:'1500 MO Cuore di Gigante della Tempesta', ms:'500 MO Fulmine Cristallizzato', tip:'Very Rare', url:'https://5e.tools/', costo:2000, vend:4000, dt:[10,3]},
        {n:'Potion of Invisibility', prog:true, mp:'1200 MO Occhi di Stalker', ms:'800 MO Essenza di Ombra', tip:'Very Rare', url:'https://5e.tools/', costo:2000, vend:4000, dt:[10,3]},
        {n:'Potion of Speed', prog:true, mp:'1000 MO Cuore di Velociraptore', ms:'1000 MO Tempo Cristallizzato di Zilean', tip:'Very Rare', url:'https://5e.tools/', costo:2000, vend:4000, dt:[10,3]},
        {n:'Potion of Flying', prog:true, mp:'1500 MO Piume di Fenice di Targon', ms:'500 MO Etere di Montagna', tip:'Very Rare', url:'https://5e.tools/', costo:2000, vend:4000, dt:[10,3]},
        {n:"Veleno del Vuoto (5 dosi)", prog:true, mp:"1500 MO Essenza del Vuoto", ms:"500 MO Acido di Cho'Gath", tip:'Very Rare — Veleno', desc:"DC 24 Cost., 18d6 veleno + Avvelenato 24h. Se fallisci di 10+ sei Disintegrato.", costo:2000, vend:4000, dt:[10,3]},
        {n:'Elisir di Trasformazione', prog:true, mp:'2000 MO Sangue di Mutaforma', ms:'—', tip:'Very Rare', desc:'Per 1h: Wildshape in qualsiasi Bestia CR 4 o inferiore. Mantieni INT/SAG/CAR.', costo:2000, vend:4000, dt:[10,3]},
        {n:'Pietra Filosofale (1 uso)', prog:true, mp:'1800 MO Mercurio Filosofico', ms:'200 MO Polvere di Stelle di Targon', tip:'Very Rare — Trasmutazione', desc:'Trasforma 500 MO di metallo comune in oro, o trasforma cadavere in Potion of Superior Healing (4h).', costo:2000, vend:4000, dt:[12,3]},
      ]},
      { lv:5, items:[
        {n:'Potion of Longevity', prog:true, mp:'5000 MO Sangue di Drago Antico', ms:'—', tip:'Legendary', url:'https://5e.tools/', costo:5000, vend:10000, dt:[20]},
        {n:"Potion of Dragon's Majesty", prog:true, mp:'6000 MO Essenza di Drago Antico di Shyvana', ms:'—', tip:'Legendary', url:'https://5e.tools/', costo:6000, vend:12000, dt:[25]},
        {n:"Elisir dell'Immortalità (1 anno)", prog:true, mp:'8000 MO Fiore dell\'Alba Eterna di Targon', ms:'2000 MO Sangue di Aspetto del Dio', tip:'Legendary — Speciale', desc:'Non invecchi per 1 anno. +20 PF extra per dado vita. Durata 1 anno.', costo:10000, vend:20000, dt:[30]},
        {n:'Grande Acido Primordiale (3 dosi)', prog:true, mp:"3000 MO Nucleo di Cho'Gath Antico", ms:'2000 MO Acido Vorace del Vuoto', tip:'Legendary — Veleno', desc:"DC 26 Cost., 30d6 acido + Avvelenato. Se fallisci di 10+ sei Petrificato per 1h.", costo:5000, vend:10000, dt:[20]},
        {n:'Siero del Vuoto', prog:true, mp:'4000 MO Cuore del Vuoto Pulsante', ms:'1000 MO Energia Primordiale', tip:'Legendary — Speciale', desc:'+4 a un punteggio di caratteristica (max 24), oppure resistenza permanente. Bevibile una sola volta per creatura.', costo:5000, vend:10000, dt:[25]},
      ]},
    ],
    materialiSpeciali: [
      {nome:'Erbe Common', rarity:'common', costo:'1–5 MO/dose', desc:'Erbe medicinali di base, facilmente reperibili in boschi e prati. Radici di tarassaco, petali di calendula, foglie di menta selvatica.', prop:[{k:'Provenienza',v:'Mercati, erboristi, raccolta libera'},{k:'Usi',v:'Materiale principale per pozioni di LV1'},{k:'Conservazione',v:'3 mesi in barattolo chiuso'}]},
      {nome:'Reagenti Alchemici', rarity:'uncommon', costo:'10–30 MO/dose', desc:'Sali metallici, vetriolo, acidi deboli e basi organiche. La spina dorsale dell\'alchimia pratica. Richiedono handling con cura.', prop:[{k:'Pericolo',v:'Corrosivi: guanti obbligatori'},{k:'Provenienza',v:'Fornitori specializzati di Piltover/Zaun'},{k:'Usi',v:'Materiale secondario LV1-2'}]},
      {nome:'Essenza Elementale', rarity:'rare', costo:'50–150 MO/fiala', desc:'Concentrato liquido di un elemento puro: fuoco, acqua, aria o terra. Estratta dai piani elementali o da creature elementali abbattute. Instabile senza contenimento adeguato.', prop:[{k:'Contenimento',v:'Fiale di vetro incantato'},{k:'Stabilità',v:'6 mesi sigillate'},{k:'Provenienza',v:'Piani Elementali, mercanti rari'}]},
      {nome:'Cristallo Hextech', rarity:'rare', costo:'100–500 MO/frammento', desc:'Cristalli di energia magica grezza provenienti da Piltover. Altamente volatili se non lavorati correttamente. Amplificano reazioni alchemiche in modo imprevedibile ma potente.', prop:[{k:'Rischio',v:'Esplosione se surriscaldato'},{k:'Provenienza',v:'Piltover, commercio regolamentato'},{k:'Usi',v:'Composti Hextech, potenziatori LV3'}]},
      {nome:'Ghiandola di Drago', rarity:'very-rare', costo:'400–1500 MO/ghiandola', desc:'La ghiandola del veleno o del fuoco di un drago abbattuto. Prodotto altamente deperibile che deve essere lavorato entro 72 ore dalla morte della creatura. Ogni tipo di drago produce effetti diversi.', prop:[{k:'Deperibilità',v:'72h dalla morte del drago'},{k:'Tipo',v:'Rosso=fuoco, Nero=acido, Verde=veleno'},{k:'Provenienza',v:'Cacciatori di draghi, bottino di guerra'}]},
      {nome:'Essenza del Vuoto', rarity:'legendary', costo:'1000–5000 MO/campione', desc:"Materia instabile estratta direttamente dalle creature del Vuoto. Corrompe chi la maneggia senza protezioni adeguate (TS SAG DC 16 ogni ora di esposizione). Conferisce proprietà straordinarie ma a un costo altrettanto straordinario.", prop:[{k:'Pericolo',v:'DC 16 SAG/ora senza protezione'},{k:'Provenienza',v:'Rift del Vuoto, creature del Vuoto'},{k:'Usi',v:'Pozioni Leggendarie, Siero del Vuoto'}]},
      {nome:'Sangue di Drago Antico', rarity:'legendary', costo:'3000–8000 MO/fiala', desc:'Il sangue di un drago di età millenaria, denso come mercurio e brillante come oro fuso. Contiene magie primordiali stratificate. Ingrediente di alcuni tra i composti più potenti mai creati.', prop:[{k:'Rarità',v:'Quasi introvabile, solo draghi Wyrmling+ seniori'},{k:'Proprietà',v:'Stabilizza composti altrimenti instabili'},{k:'Conservazione',v:'Indefinita in contenitore adeguato'}]},
    ]
  },
  { id:'architetto', emoji:'🏛️', nome:'Architetto', tagline:'Strutture · Difese · Portali · Fortezze — costruisci il tuo regno',
    desc:'Strutture civili, militari, trappole e meccanismi — costruisci il tuo angolo di Arcamis.',
    materLav: [10,25,100,500,750],
    livelli: [
      { lv:1, items:[
        {n:'Salotto', mp:'35 MO Legno', ms:'35 MO Pietra', tip:'Abitazione', desc:'Stanza obbligatoria per costruire un\'abitazione.', costo:70, vend:140, dt:[7,3,1,1,1]},
        {n:'Camera da Letto', mp:'35 MO Legno', ms:'35 MO Pietra', tip:'Abitazione', desc:'Dormire in un letto conferisce gli effetti di un riposo lungo.', costo:70, vend:140, dt:[7,3,1,1,1]},
        {n:'Bagno', mp:'35 MO Legno', ms:'35 MO Pietra', tip:'Abitazione', desc:'Stanza obbligatoria per costruire un\'abitazione.', costo:70, vend:140, dt:[7,3,1,1,1]},
        {n:'Scantinato', mp:'50 MO Pietra', ms:'50 MO Legno', tip:'Abitazione/Taverna', desc:'Le cibarie non si deteriorano al suo interno.', costo:100, vend:200, dt:[10,4,1,1,1]},
        {n:'Recinzione', mp:'70 MO Legno', ms:'—', tip:'Abitazione', desc:'Delimita il perimetro e difende da piccoli animali.', costo:70, vend:140, dt:[7,3,1,1,1]},
        {n:'Stalla', mp:'70 MO Legno', ms:'—', tip:'Struttura Generale', desc:'Può contenere fino a 5 animali di taglia grande.', costo:70, vend:140, dt:[7,3,1,1,1]},
        {n:'Orto', mp:'50 MO Terra', ms:'30 MO Legno', tip:'Struttura Generale', desc:'Produce 15 MO di Erbe al mese. Max 2 per edificio.', costo:80, vend:160, dt:[8,4,1,1,1]},
        {n:'Cucina', mp:'60 MO Pietra', ms:'10 MO Ferro', tip:'Struttura Generale', desc:'Permette di cucinare alimenti. Richiede 4 MO di combustibile/settimana.', costo:70, vend:140, dt:[7,3,1,1,1]},
        {n:'Magazzino', mp:'120 MO Pietra', ms:'30 MO Legno', tip:'Struttura Generale', desc:'Immagazzina materiali fino a 500 MO di valore.', costo:150, vend:300, dt:[15,6,2,1,1]},
      ]},
      { lv:2, items:[
        {n:'Mura', mp:'Recinzione', ms:'130 MO Pietra', tip:'Abitazione', desc:'Difende da animali medi o grandi.', costo:130, vend:400, dt:[6,2,1,1]},
        {n:'Torre Difensiva', mp:'200 MO Ferro', ms:'50 MO Cristallo Elettrico', tip:'Difensiva', desc:'Torretta automatizzata. Azione bonus: dardo di energia (Gittata 60/120ft, +6 colpire, 2d6 fulmine).', costo:200, vend:400, dt:[6,2,2,2]},
        {n:'Cucina Professionale', mp:'Cucina', ms:'75 MO Acciaio', tip:'Struttura Generale', desc:'Permette piatti speciali da oste. Richiede 8 MO carbone/settimana.', costo:75, vend:150, dt:[3,1,1,1]},
        {n:'Forgia Noxiana', mp:'175 MO Ghisa Noxiana', ms:'75 MO Cemento', tip:'Officina', desc:'Ripara armature/armi durante riposo breve. 1/giorno: conferisce "Distruttrice" (+2 danni vs oggetti) per 24h.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Altare del Devoto', mp:'175 MO Pietra Bianca di Demacia', ms:'75 MO Essenza Celestiale', tip:'Struttura Classe — Paladino', desc:'1/Riposo Lungo: meditazione (d20+prof vs 20-LvPaladino). Successo: +1 attacchi, d4 Carisma in aura fino al prossimo RL.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:"Antro del Cacciatore", mp:'175 MO Legno di Quercia di Ixtal', ms:'75 MO Cuoio di Mostro del Vuoto', tip:'Struttura Classe — Ranger', desc:'1/RL: connessione natura (d20+prof vs 20-LvRanger). Successo: vantaggio sopravvivenza 500m, +1 attacchi e incantesimi.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Campo di Addestramento', mp:'175 MO Acciaio di Noxus', ms:'75 MO Cuoio Rinforzato di Freljord', tip:'Struttura Classe — Guerriero/Barbaro', desc:'1/RL: allenamento (d20+prof vs 20-LvClasse). Successo: d4 vs Spaventato, +1 attacchi e abilità di classe.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Circolo Naturale', mp:'175 MO Pietra Magica di Ionia (Weaveglass)', ms:'75 MO Terriccio dei Giardini di Ixtal', tip:'Struttura Classe — Druido', desc:'1/RL: sintonizzazione (d20+prof vs 20-LvDruido). Successo: parla con animali, conosce creature entro 500m, +1 incantesimi.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Covo Arcano', mp:'175 MO Cristalli a conduzione magica', ms:'75 MO Pergamene e Inchiostri rari', tip:'Struttura Classe — Mago', desc:'1/RL: studio (d20+prof vs 20-LvMago). Successo: d4 extra Intelligenza(Arcano), +1 incantesimi e TS.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Crogiolo di Trama', mp:'175 MO Frammenti di Hextech instabile', ms:'75 MO Polvere di Stelle di Targon', tip:'Struttura Classe — Stregone', desc:'1/RL: riconnessione (d20+prof vs 20-LvStregone). Successo: vede la trama, d4 a un\'abilità, +1 incantesimi.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Sala della Musica', mp:'175 MO Legno armonico di Ionia', ms:'75 MO Seta di Shurima (acustica)', tip:'Struttura Classe — Bardo', desc:'1/RL: pratica (d20+prof vs 20-LvBardo). Successo: rilancia 1 o 2 su Ispirazione Bardica, +1 incantesimi.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Santuario Consacrato', mp:'175 MO Marmo Benedetto', ms:'75 MO Acqua Santa o Reliquie', tip:'Struttura Classe — Chierico', desc:'1/RL: preghiera (d20+prof vs 20-LvChierico). Successo: nessun non morto nel raggio 500m, +1 incantesimi.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Santuario dello Spirito', mp:'175 MO Legno di Bambù delle Prime Terre', ms:'75 MO Incensi di meditazione di Ionia', tip:'Struttura Classe — Monaco', desc:'1/RL: meditazione (d20+prof vs 20-LvMonaco). Successo: d4 extra Percezione e Acrobazia, +1 attacchi.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Stanza degli Esperimenti', mp:'175 MO Componenti Meccanici Piltoveriani', ms:'75 MO Reagenti chimici di Zaun', tip:'Struttura Classe — Artefice', desc:'1/RL: armeggio (d20+prof vs 20-LvArtefice). Successo: d4 extra a strumenti con competenza, +1 incantesimi.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Covo del Fuorilegge', mp:'175 MO Metallo di recupero di Zaun', ms:'75 MO Meccanismi a scatto di Piltover', tip:'Struttura Classe — Ladro', desc:'1/RL: pianificazione (d20+prof vs 20-LvLadro). Successo: d4 extra iniziativa e scasso, +1 attacchi e danni.', costo:250, vend:500, dt:[7,3,1,1]},
        {n:'Antro del Patrono', mp:'175 MO Ossidiana delle Isole Ombra', ms:'75 MO Sangue di Demone o Icore', tip:'Struttura Classe — Warlock', desc:'1/RL: comunione (d20+prof vs 20-LvWarlock). Successo: d4 extra a un\'abilità con competenza, +1 incantesimi.', costo:250, vend:500, dt:[7,3,1,1]},
      
        {n:'Antro del Cacciatore',mp:'175 MO Legno di Quercia di Ixtal',ms:'75 MO Cuoio di Mostro del Vuoto',tip:'-',desc:'Una volta per riposo lungo un Ranger può connettersi con la natura circostante scoprendone i segreti. Quando lo fa può tirare un d20 più il suo bonus competenza contro una Classe difficoltà di 20 - il suo livello da Ranger. In caso di successo fino alla fine del prossimo riposo lungo ha vantaggio alle prove di sopravvivenza nel raggio di 500 m dall’Antro e sa se sono presenti creature al di fuori di bestie GS 1. Fino alla fine del prossimo riposo lungo ottiene +1 ai tiri per colpire con le armi in cui ha Maestria e ottiene un +1 ai tiri per colpire e tiri salvezza dei suoi incantesimi da Ramger.',costo:250,vend:500,dt:[7,3,1,1]},
        {n:'Stanza degli esperimenti',mp:'175 MO Componenti Meccanici Piltoveriani',ms:'75 MO Reagenti chimici di Zaun',tip:'-',desc:'Una volta per riposo lungo un Artefice può mettersi ad armeggiare on i suoi strumenti in questo luogo. Quando lo fa può tirare un d20 più il suo bonus competenza contro una Classe difficoltà di 20 - il suo livello da Artefice. In caso di successo fino al prossimo riposo lungo ottiene d4 extra al tiro con gli strumenti di cui dispone competenza e un +1 ai tiri per colpire e tiri salvezza dei suoi incantesimi da Artefice.',costo:250,vend:500,dt:[7,3,1,1]},
        {n:'Covo del fuorilegge',mp:'175 MO Metallo di recupero di Zaun',ms:'75 MO Meccanismi a scatto di Piltover',tip:'-',desc:'Una volta per riposo lungo un Ladro può rintanarsi nel suo covo prima di un colpo. Quando lo fa può tirare un d20 più il suo bonus competenza contro una Classe difficoltà di 20 - il suo livello da Ladro. In caso di successo il ladro ottiene un d4 extra nel tiro di iniziativa e nelle prove con gli strumenti da scasso fino al prossimo riposo lungo. Inoltre ottiene un +1 ai tiri per colpire e ai danni.',costo:250,vend:500,dt:[7,3,1,1]},
      ]},
      { lv:3, items:[
        {n:'Mura Rinforzate', mp:'Mura', ms:'500 MO Ferro Rinforzato', tip:'Abitazione', desc:'Resistenza ai danni da incantesimo. CA 20, 100 PF.', costo:500, vend:1000, dt:[6,2,1]},
        {n:'Torre del Mago', prog:true, mp:'400 MO Pietra Magica di Ionia', ms:'100 MO Cristalli Arcani', tip:'Struttura Speciale', desc:'Il proprietario vede e sente tutto nel raggio di 30m come azione bonus (concentrazione, 1 min/giorno).', costo:500, vend:1000, dt:[6,2,1]},
        {n:'Prigione con Soppressione Magica', mp:'300 MO Pietra Anti-Magia', ms:'200 MO Ferro di Noxus', tip:'Struttura Militare', desc:'Campo Antimagia solo per le creature al suo interno. I prigionieri non possono usare magie o teletrasportarsi.', costo:500, vend:1000, dt:[6,2,1]},
        {n:'Portale Stabile (Locale)', prog:true, mp:'800 MO Pietra di Nexus', ms:'200 MO Polvere di Rift', tip:'Struttura Arcana', desc:'Portale permanente tra due punti fissi nella stessa città (entro 1 km). 10 usi al giorno.', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Catapulta Balistica Avanzata', mp:'500 MO Acciaio Noxiano', ms:'—', tip:'Struttura Militare', desc:'Gittata 300m, 6d10 contundente su area 3m (DC 17 Des per metà). Richiede 2 persone.', costo:500, vend:1000, dt:[6,2,1]},
        {n:'Laboratorio Alchemico Integrato', mp:'Scantinato', ms:'400 MO Distillatori Piltoveriani', tip:'Struttura Speciale', desc:'-25% costi materiali e dimezza DT per oggetti Alchimista LV1/LV2.', costo:500, vend:1000, dt:[6,2,1]},
        {n:'Giardino Incantato di Ixtal', prog:true, mp:'400 MO Terra Magica di Ixtal', ms:'100 MO Semi di Piante Senzienti', tip:'Struttura Generale', desc:'Produce 50 MO di materiali rari/mese. Chi riposa qui recupera 1d6 PF extra per dado vita.', costo:500, vend:1000, dt:[6,2,1]},
      ]},
      { lv:4, items:[
        {n:'Fortezza Personale', prog:true, mp:'2000 MO Pietra di Demacia', ms:'1000 MO Ferro Incantato', tip:'Struttura Difensiva', desc:'CA 22, 300 PF. Genera campo Guardia Magica (come Alarm) entro 60m.', costo:3000, vend:6000, dt:[12,4]},
        {n:'Portale Interplanar', prog:true, mp:'2500 MO Nexus Crystal', ms:'500 MO Polvere del Vuoto', tip:'Struttura Arcana', desc:'Portale permanente verso un piano di esistenza. 3 usi al giorno.', costo:3000, vend:6000, dt:[15,4]},
        {n:'Cantiere Navale', prog:true, mp:'1500 MO Quercia di Ixtal', ms:'1000 MO Ferro Marino', tip:'Struttura Generale', desc:'-50% DT per costruire/riparare veicoli acquatici LV1-3.', costo:2500, vend:5000, dt:[10,3]},
        {n:'Sala del Trono Arcana', prog:true, mp:'2000 MO Marmo di Demacia', ms:'1000 MO Pietra Magica di Ionia', tip:'Struttura di Prestigio', desc:'Vantaggio a Persuasione, Intimidire e Inganno nella sala. +2 CA passiva al proprietario.', costo:3000, vend:6000, dt:[12,4]},
      ]},
      { lv:5, items:[
        {n:'Castello Auto-Riparante', prog:true, mp:'5000 MO Pietra Vivente di Ionia', ms:'2000 MO Cristalli Runati di Demacia', tip:'Struttura Leggendaria', desc:'Recupera 20 PF strutturali/turno. CA 22, 500 PF. 1/giorno: Muro di Pietra (LV9) senza componenti.', costo:7000, vend:14000, dt:[30]},
        {n:'Nexus della Terra', prog:true, mp:'8000 MO Frammento di Nexus Primordiale', ms:'2000 MO Anima della Terra di Ixtal', tip:'Struttura Leggendaria — Unica', desc:'Raggio 500m: incantatori +1 slot/riposo breve. Controllo Meteorologico 1/giorno. Strutture +4 CA.', costo:10000, vend:20000, dt:[40]},
        {n:'Torre di Avvistamento Omnisciente', prog:true, mp:'6000 MO Occhio del Vuoto Stabilizzato', ms:'1000 MO Lenti di Targon', tip:'Struttura Leggendaria', desc:'Visione 5km. Comunione 3/giorno. Creature nel raggio immuni da Scrying.', costo:7000, vend:14000, dt:[28]},
      ]},
    ],
    materialiSpeciali: [
      {nome:'Pietra da Costruzione', rarity:'common', costo:'5–20 MO/tonnellata', desc:'Pietra calcarea, granito o arenaria estratta dalle cave. Materiale base per qualsiasi struttura di livello 1.', prop:[{k:'Provenienza',v:'Cave locali, mercanti'},{k:'Lavorazione',v:'Scalpello standard'},{k:'Usi',v:'Strutture LV1, fondamenta'}]},
      {nome:'Legno da Costruzione', rarity:'common', costo:'3–15 MO/tonnellata', desc:'Legname da costruzione stagionato: quercia, pino o larice. Deve essere trattato contro umidità e insetti prima dell\'uso strutturale.', prop:[{k:'Stagionatura',v:'Almeno 2 anni'},{k:'Trattamento',v:'Olio di lino o catrame'},{k:'Usi',v:'Strutture LV1-2, rivestimenti'}]},
      {nome:'Ferro Rinforzato di Noxus', rarity:'uncommon', costo:'50–120 MO/lingotto', desc:'Lega ferrosa prodotta con tecniche noxiane di raffinazione. Superiore al ferro comune per resistenza e durezza. Usato per mura avanzate e torrette.', prop:[{k:'Provenienza',v:'Fonderie di Noxus'},{k:'Caratteristiche',v:'+15% resistenza vs ferro comune'},{k:'Usi',v:'Mura Rinforzate, strutture militari LV2-3'}]},
      {nome:'Pietra Magica di Ionia (Weaveglass)', rarity:'rare', costo:'200–800 MO/blocco', desc:'Pietra naturalmente satura di energia magica estratta dalle montagne ioniane. Brilla debolmente al buio e conduce la trama come un filo. Usata per strutture arcane.', prop:[{k:'Provenienza',v:'Miniere di Ionia, alta quota'},{k:'Proprietà',v:'Conduce magia, amplifica incantesimi'},{k:'Usi',v:'Portali, strutture arcane, Circolo Naturale'}]},
      {nome:'Pietra di Nexus', rarity:'very-rare', costo:'500–2000 MO/blocco', desc:'Frammenti cristallizzati attorno ai rift del Nexus. Pulsano di energia arcana pura e sono praticamente indistruttibili. Fondamentale per i portali permanenti.', prop:[{k:'Indistruttibilità',v:'CA 22 strutturale'},{k:'Provenienza',v:'Zone di rift arcano, estremamente rara'},{k:'Usi',v:'Portali, strutture LV4-5'}]},
      {nome:'Pietra Vivente di Ionia', rarity:'legendary', costo:'1000–5000 MO/blocco', desc:'Roccia che risponde alla volontà del proprietario, si ripara autonomamente e respira leggermente. Conosciuta solo nelle profondità delle Prime Terre. Costituisce la base del Castello Auto-Riparante.', prop:[{k:'Auto-riparazione',v:'10 PF/ora passivamente'},{k:'Coscienza',v:'Primordiale, sente chi la possiede'},{k:'Provenienza',v:'Prime Terre di Ionia, rarissima'}]},
      {nome:'Frammento di Nexus Primordiale', rarity:'legendary', costo:'3000–10000 MO/frammento', desc:'Il nucleo cristallizzato di un nexus originario. Contiene abbastanza energia da alimentare un\'intera struttura per secoli. La sua mera presenza altera il campo magico circostante.', prop:[{k:'Effetto ambientale',v:'+1 slot incantesimi nel raggio 500m'},{k:'Pericolo',v:'DC 20 COS ogni giorno senza protezione'},{k:'Provenienza',v:'Nexus primordiali, quasi introvabili'}]},
    ]
  },
  { id:'artigiano', emoji:'🔨', nome:'Artigiano', tagline:'Oggetti Magici · Anelli · Bacchette · Manufatti — magia nel metallo',
    desc:'Oggetti magici, strumenti e manufatti pregiati — la magia nelle mani dell\'artigiano.',
    materLav: [10,25,100,500,750],
    livelli: [
      { lv:1, items:[
        {n:'Adventurer\'s Ring', mp:'40 MO Metallo', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Bottle of Boundless Coffee', mp:'40 MO Metallo', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Breathing Bubble', mp:'40 MO Meduse', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Candle of the Deep', mp:'40 MO Cera', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:"Charlatan's Die", mp:'40 MO Legno', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Cleansing Stone', mp:'40 MO Pietra', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Coin of Delving', mp:'40 MO Metallo', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Cuddly Mascot', mp:'40 MO Stoffa', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Dark Shard Amulet', mp:'40 MO Gemme', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Ersatz Eye', mp:'40 MO Gemme', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Everbright Lantern', mp:'40 MO Metallo', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Feather Token', mp:'40 MO Metallo', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Horn of Silent Alarm', mp:'40 MO Metallo', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Lantern of Tracking', mp:'40 MO Metallo', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Orb of Direction', mp:'40 MO Vetro', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Orb of Shielding', mp:'40 MO Gemme', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Orb of Time', mp:'40 MO Vetro', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Pipe of Smoke Monsters', mp:'40 MO Avorio', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Pot of Awakening', mp:'40 MO Argilla', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Ruby of the War Mage', mp:'40 MO Rubini', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Spellshard', mp:'20 MO Gemme', ms:'20 MO Metallo', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Tankard of Sobriety', mp:'20 MO Metallo', ms:'20 MO Legno', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Thermal Cube', mp:'40 MO Zolfo', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Cannocchiale', mp:'250 MO Metallo', ms:'250 MO Vetro', tip:'Equipaggiamento', desc:'Ingrandisce gli oggetti al doppio.', costo:500, vend:1000, dt:[50,25,5,1,1]},
        {n:'Clessidra', mp:'13 MO Vetro', ms:'—', tip:'Equipaggiamento', costo:13, vend:25, dt:[2,1,1,1,1]},
        {n:'Lanterna Schermata', mp:'3 MO Metallo', ms:'—', tip:'Equipaggiamento', desc:'Luce 9m, riducibile a 1.5m con azione bonus.', costo:3, vend:5, dt:[1,1,1,1,1]},
        {n:'Maschera del Diavolo', mp:'13 MO Legno', ms:'—', tip:'Equipaggiamento', desc:'Svantaggio a Investigation e Insight per scoprire la tua identità.', costo:13, vend:25, dt:[2,1,1,1,1]},
        {n:'Ramponi', mp:'1 MO Metallo', ms:'—', tip:'Equipaggiamento', desc:'Non cadi prono su ghiaccio scivoloso.', costo:1, vend:2, dt:[1,1,1,1,1]},
        {n:'Lente di ingrandimento', mp:'50 MO Vetro', ms:'—', tip:'Equipaggiamento', desc:'Vantaggio per valutare oggetti. Può accendere fuochi con luce solare.', costo:50, vend:100, dt:[5,2,1,1,1]},
      
        {n:'Adventurer\'s Ring',mp:'40 MO Metallo',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#adventurer%27s%20ring_frhof',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Charlatan\'s Die',mp:'40 MO Legno',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#charlatan%27s%20die_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
      ]},
      { lv:2, items:[
        {n:'Amulet of the Devout +1', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Bloodwell Vial +1', mp:'200 MO Vetro', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Amulet of Proof against Detection', mp:'100 MO Metallo', ms:'100 MO Gemme', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Amulet of the Drunkard', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Balance of Harmony', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Circlet of Blasting', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Decanter of Endless Water', mp:'200 MO Vetro', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Driftglobe', mp:'200 MO Vetro', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Eyes of the Eagle', mp:'200 MO Cristalli', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Gem of Brightness', mp:'200 MO Diamante', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Goggles of Night', mp:'200 MO Vetro', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Headband of Intellect', mp:'100 MO Metallo', ms:'100 MO Gemme', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Immovable Rod', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Pearl of Power', mp:'200 MO Perla', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Ring of Jumping', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Ring of Mind Shielding', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Ring of Swimming', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Ring of Warmth', mp:'150 MO Legno', ms:'50 MO Pelliccia', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Stone of Good Luck', mp:'100 MO Pietra', ms:'100 MO Gemme', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
      
        {n:'Amulet of Proof against Detection and Location',prog:true,mp:'100 MO Metallo',ms:'100 MO Gemme',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#amulet%20of%20proof%20against%20detection%20and%20location_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Belt of Weald',mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#belt%20of%20the%20weald_humblewoodtales',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Brooch of Living Essence',mp:'100 MO Gemme',ms:'100 MO Metallo',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#brooch%20of%20living%20essence_egw',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Decanter of Endless Water',mp:'200 MO Vetro',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#decanter%20of%20endless%20water_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Deck of Illusions',mp:'200 MO Carta',ms:'—',tip:'Oggetto Magico Non Comune',desc:'Deck of Illusions',url:'https://5e.tools/items.html#deck%20of%20illusions_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Elemental Gem',mp:'200 MO Gemme',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#elemental%20gem_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Emerald Pen',mp:'200 MO Smeraldi',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#emerald%20pen_ftd',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Eyes of Charming',mp:'200 MO Cristalli',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#eyes%20of%20charming_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Eyes of Minute Seeing',prog:true,mp:'200 MO Cristalli',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#eyes%20of%20minute%20seeing_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Feywild Shard',prog:true,mp:'200 MO Topazio',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#feywild%20shard_tce',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Glowing Ember',prog:true,mp:'100 MO  Cristalli',ms:'100 MO Zolfo',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#glowing%20ember_humblewoodtales',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Guardian Emblem',prog:true,mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#guardian%20emblem_tce',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Headband of Intellect',prog:true,mp:'100 MO Metallo',ms:'100 MO Gemme',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#headband%20of%20intellect_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Lantern of Revealing',mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#lantern%20of%20revealing_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Necklace of Adaptation',prog:true,mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#necklace%20of%20adaptation_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Nest Charm',mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#nest%20charm_humblewoodcampaignsetting',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Periapt of Health',mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#periapt%20of%20health_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Periapt of Wound Closure',prog:true,mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#periapt%20of%20wound%20closure_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Portal Compass',prog:true,mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#portal%20compass_sato',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Prehistoric Figurine of Wondrous Power, Pyrite Plesiosaurus',mp:'200 MO Pirite',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#prehistoric%20figurine%20of%20wondrous%20power%2c%20pyrite%20plesiosaurus_bgg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Ring of Water Walking',mp:'100 MO Metallo',ms:'100 MO Acquamarina',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#ring%20of%20water%20walking_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
      ]},
      { lv:3, items:[
        {n:'Belt of Dwarvenkind', prog:true, mp:'500 MO Metallo Nanico', ms:'500 MO Gemme di Khaz-Algar', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Brooch of Shielding', mp:'600 MO Metallo', ms:'400 MO Cristallo Anti-Magia', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Carpet of Flying (3x5ft)', prog:true, mp:'800 MO Seta di Shurima', ms:"200 MO Fili d'Oro", tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Crystal Ball (base)', prog:true, mp:'900 MO Cristallo di Divinazione', ms:'100 MO Argento Puro', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Figurine of Wondrous Power, Golden Lions', prog:true, mp:'800 MO Oro', ms:'200 MO Gemme', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Ring of Evasion', prog:true, mp:'700 MO Metallo Adamantino', ms:'300 MO Gemma della Velocità', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Ring of Protection', prog:true, mp:'1000 MO Mithral Purissimo', ms:'—', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Wand of Fireballs', prog:true, mp:'700 MO Legno Igneo di Ixtal', ms:'300 MO Polvere Sulfurea Rara', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Bag of Devouring', mp:'500 MO Stomaco di Mimic', ms:'500 MO Seta Extradimensionale', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
      ]},
      { lv:4, items:[
        {n:'Manual of Bodily Health', prog:true, mp:'2500 MO Pergamena Sacra', ms:'2500 MO Inchiostro di Sangue di Drago', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[15,5]},
        {n:'Manual of Gainful Exercise', prog:true, mp:'2500 MO Pergamena Sacra', ms:'2500 MO Inchiostro Ferrato', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[15,5]},
        {n:'Manual of Quickness of Action', prog:true, mp:'2500 MO Pergamena Sacra', ms:'2500 MO Inchiostro di Velocità', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[15,5]},
        {n:'Ring of Regeneration', prog:true, mp:'3000 MO Anello Mithral', ms:'2000 MO Cuore di Troll', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[15,5]},
        {n:'Ring of Shooting Stars', prog:true, mp:'3000 MO Argento di Targon', ms:'2000 MO Polvere di Cometa', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[15,5]},
        {n:'Apparatus of the Crab', mp:'4000 MO Metallo di Piltover', ms:'1000 MO Cristalli Chemtech', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[18,5]},
      ]},
      { lv:5, items:[
        {n:'Ioun Stone of Greater Absorption', prog:true, mp:'5000 MO Gemma di Absorzione', ms:'—', tip:'Leggendario', url:'https://5e.tools/', costo:8000, vend:16000, dt:[30]},
        {n:'Sphere of Annihilation', prog:true, mp:'6000 MO Vuoto Solidificato', ms:'2000 MO Contenitore Anti-Materia', tip:'Leggendario', url:'https://5e.tools/', costo:8000, vend:16000, dt:[35]},
        {n:'Tome of the Stilled Tongue', prog:true, mp:'5000 MO Pergamena di Pelle di Drago', ms:'3000 MO Inchiostro del Signore del Vuoto', tip:'Leggendario', url:'https://5e.tools/', costo:8000, vend:16000, dt:[30]},
        {n:'Luck Blade', prog:true, mp:'7000 MO Acciaio di Stella Cadente', ms:'1000 MO Gemma della Fortuna di Zilean', tip:'Leggendario', url:'https://5e.tools/', costo:8000, vend:16000, dt:[32]},
      ]},
    ],
    materialiSpeciali: [
      {nome:'Metallo Comune', rarity:'common', costo:'1–10 MO/kg', desc:'Ferro, rame, ottone e bronzo. Adatti alla maggior parte degli oggetti di livello 1 non magici.', prop:[{k:'Provenienza',v:'Fonderie, mercanti'},{k:'Usi',v:'Oggetti LV1, componenti'}]},
      {nome:'Gemme Semipreziose', rarity:'uncommon', costo:'10–80 MO/carato', desc:'Quarzo, ametista, tormalina, granato. Sufficienti a condurre piccole quantità di magia per oggetti non comuni.', prop:[{k:'Provenienza',v:'Miniere, commercianti di gemme'},{k:'Conduzione magica',v:'Debole (LV1-2)'},{k:'Usi',v:'Oggetti comuni e non comuni'}]},
      {nome:'Mithral Grezzo', rarity:'rare', costo:'200–600 MO/lingotto', desc:'Lega rara più leggera dell\'acciaio ma di resistenza simile. Particolarmente adatta per oggetti magici di livello raro per la sua affinità con la magia.', prop:[{k:'Proprietà',v:'Leggerissimo, non fruscia'},{k:'Provenienza',v:'Miniere profonde, Nanetti'},{k:'Usi',v:'Ring of Protection, armature mithral'}]},
      {nome:'Adamantio', rarity:'rare', costo:'400–1000 MO/lingotto', desc:'Il metallo più duro conosciuto. Praticamente indistruttibile. Richiede strumenti speciali per essere lavorato e temperature altissime.', prop:[{k:'Durezza',v:'Massima assoluta'},{k:'Lavorazione',v:'Solo forgia con fiamma di drago o Hextech'},{k:'Usi',v:'Ring of Evasion, armature adamantite'}]},
      {nome:'Gemme Preziose Incantate', rarity:'very-rare', costo:'500–2000 MO/carato', desc:'Diamanti, rubini, smeraldi o zaffiri esposti a campo magico per almeno un anno. Conducono quantità significative di magia per oggetti rari e very rare.', prop:[{k:'Conduzione magica',v:'Alta (LV3-4)'},{k:'Attivazione',v:'1 anno in campo magico'},{k:'Usi',v:'Crystal Ball, Wand of Fireballs'}]},
      {nome:'Vuoto Solidificato', rarity:'legendary', costo:'2000–6000 MO/frammento', desc:'Materia compressa dal Vuoto che nega l\'esistenza attorno a sé. Richiede contenimento speciale durante la lavorazione. Ingrediente della Sphere of Annihilation.', prop:[{k:'Pericolo',v:'Annichilisce oggetti non schermati'},{k:'Contenimento',v:'Scatola di adamantio foderata di piombo'},{k:'Usi',v:'Sphere of Annihilation'}]},
    ]
  },
  { id:'metallurgo', emoji:'⚔️', nome:'Metallurgo', tagline:'Armi Metalliche · Armature · Forgia — l\'acciaio forgiato con maestria',
    desc:'Armi metalliche, armature e oggetti da forgia — l\'acciaio forgiato con maestria.',
    materLav: [10,25,100,500,750],
    livelli: [
      { lv:1, items:[
        {n:'Scudo', mp:'5 MO Metallo', ms:'—', tip:'Armatura', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Armatura a Scaglie', mp:'25 MO Metallo', ms:'—', tip:'Armatura Media', desc:'CA: 14+Dex(max 2). Svantaggio Furtività.', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Maglia a Catena', mp:'25 MO Metallo', ms:'—', tip:'Armatura Media', desc:'CA: 13+Dex(max 2).', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Breastplate', mp:'200 MO Metallo', ms:'—', tip:'Armatura Media', desc:'CA: 14+Dex(max 2).', costo:200, vend:400, dt:[20,8,2,1,1]},
        {n:'Mezza a Piastre', mp:'375 MO Metallo', ms:'—', tip:'Armatura Media', desc:'CA: 15+Dex(max 2). Svantaggio Furtività.', costo:375, vend:750, dt:[38,15,4,1,1]},
        {n:'Cotta di Maglia', mp:'38 MO Metallo', ms:'—', tip:'Armatura Pesante', desc:'CA: 16. Req. FOR 13. Svantaggio Furtività.', costo:38, vend:75, dt:[4,2,1,1,1]},
        {n:'Corazza a Strisce', mp:'100 MO Metallo', ms:'—', tip:'Armatura Pesante', desc:'CA: 17. Req. FOR 15. Svantaggio Furtività.', costo:100, vend:200, dt:[10,4,1,1,1]},
        {n:'Completa a Piastre', mp:'750 MO Metallo', ms:'—', tip:'Armatura Pesante', desc:'CA: 18. Req. FOR 15. Svantaggio Furtività.', costo:750, vend:1500, dt:[75,30,8,2,1]},
        {n:'Pugnale', mp:'1 MO Metallo', ms:'—', tip:'Arma Semplice', desc:'1d4 Piercing, Finesse, Light, Thrown 20/60ft. Mastery: Nick.', costo:1, vend:2, dt:[1,1,1,1,1]},
        {n:'Mazza', mp:'3 MO Metallo', ms:'—', tip:'Arma Semplice', desc:'1d6 Bludgeoning. Mastery: Sap.', costo:3, vend:5, dt:[1,1,1,1,1]},
        {n:'Accetta', mp:'3 MO Metallo', ms:'—', tip:'Arma Semplice', desc:'1d6 Slashing, Light, Thrown 20/60ft. Mastery: Vex.', costo:3, vend:5, dt:[1,1,1,1,1]},
        {n:'Spada Corta', mp:'5 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d6 Piercing, Finesse, Light. Mastery: Vex.', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Rapier', mp:'13 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d8 Piercing, Finesse. Mastery: Vex.', costo:13, vend:25, dt:[2,1,1,1,1]},
        {n:'Scimitarra', mp:'13 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d6 Slashing, Finesse, Light. Mastery: Nick.', costo:13, vend:25, dt:[2,1,1,1,1]},
        {n:'Spada Lunga', mp:'8 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d8 Slashing, Versatile(1d10). Mastery: Sap.', costo:8, vend:15, dt:[1,1,1,1,1]},
        {n:'Spadone', mp:'25 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'2d6 Slashing, Heavy, Two-Handed. Mastery: Graze.', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Ascia Bipenne', mp:'15 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d12 Slashing, Heavy, Two-Handed. Mastery: Cleave.', costo:15, vend:30, dt:[2,1,1,1,1]},
        {n:'Martello da Guerra', mp:'8 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d8 Bludgeoning, Versatile(1d10). Mastery: Push.', costo:8, vend:15, dt:[1,1,1,1,1]},
        {n:'Alabarda', mp:'10 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d10 Slashing, Heavy, Reach, Two-Handed. Mastery: Cleave.', costo:10, vend:20, dt:[1,1,1,1,1]},
        {n:'Falcione', mp:'10 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d10 Slashing, Heavy, Reach, Two-Handed. Mastery: Graze.', costo:10, vend:20, dt:[1,1,1,1,1]},
        {n:'Pistola', mp:'125 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d10 Piercing, Range 30/90ft, Loading. Mastery: Vex.', costo:125, vend:250, dt:[13,5,2,1,1]},
        {n:'Moschetto', mp:'250 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d12 Piercing, Range 40/120ft, Loading, Two-Handed. Mastery: Slow.', costo:250, vend:500, dt:[25,10,3,1,1]},
        {n:'Katana', prog:true, mp:'25 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d8 Slashing, Finesse, Versatile(1d10). Mastery: Vex.', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Naginata', prog:true, mp:'15 MO Metallo', ms:'10 MO Legno', tip:'Arma Marziale', desc:'1d10 Slashing, Heavy, Reach, Two-Handed. Mastery: Topple.', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Chakram', prog:true, mp:'2.5 MO Metallo', ms:'—', tip:'Arma Marziale', desc:'1d4 Piercing, Finesse, Light, Returning. Mastery: Slow.', costo:2, vend:5, dt:[1,1,1,1,1]},
        {n:'Shuriken', prog:true, mp:'0.5 MO Metallo', ms:'—', tip:'Arma Semplice', desc:'1d4 Piercing, Finesse, Light, Thrown 20/60ft. Mastery: Nick.', costo:2, vend:1, dt:[1,1,1,1,1]},
        {n:'Dastana', prog:true, mp:'12.5 MO Metallo', ms:'—', tip:'Armatura Addizionale', desc:'Armatura Leggera +1 CA, limita bonus Dex a +2.', costo:12.5, vend:25, dt:[2,1,1,1,1]},
        {n:'Armatura di Placidium', prog:true, mp:'×2 MO Metallo', ms:'—', tip:'Armatura Pesante', desc:'Riduce danni Perforanti di un ammontare pari al bonus competenza.', costo:2, vend:4, dt:[1,1,1,1,1]},
        {n:'Armatura di Shojin', prog:true, mp:'×2 MO Metallo', ms:'—', tip:'Armatura Media', desc:'Puoi aggiungere 3 invece di 2 alla CA se DES ≥ 16.', costo:2, vend:4, dt:[1,1,1,1,1]},
      
        {n:'Armblade',mp:'40 MO Metallo',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#armblade_erlw',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Armor of Gleaming',mp:'40 MO Metallo',ms:'Armatura da incantare',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#armor%20of%20gleaming_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Cast-Off Armor',mp:'40 MO Metallo',ms:'Armatura da incantare',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#cast-off%20armor_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Clockwork Amulet',mp:'40 MO Rame',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#clockwork%20amulet_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Dread Helm',mp:'40 MO Ferro',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#dread%20helm_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Ear Horn of Hearing',mp:'40 MO Ferro',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#ear%20horn%20of%20hearing_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Lock of Trickery',mp:'40 MO Ferro',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#lock%20of%20trickery_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Masque Charm',mp:'40 MO Argento',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#masque%20charm_scc',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Mechanical Wonder (Flying)',mp:'40 MO Metallo',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#mechanical%20wonder%20(flying)_fraif',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Mechanical Wonder (Mobility)',mp:'40 MO Metallo',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#mechanical%20wonder%20(mobility)_fraif',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Moon-Touched Sword',mp:'40 MO Metallo',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#moon-touched%20sword_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Mystery Key',mp:'40 MO Metallo',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#mystery%20key_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Prosthetic Limb',mp:'40 MO Metallo',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#prosthetic%20limb_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Rival Coin',mp:'40 MO Metallo',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#rival%20coin_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Shield of Expression',mp:'40 MO Metallo',ms:'—',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#shield%20of%20expression_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Smoldering Armor',mp:'40 MO Metallo',ms:'Armatura da incantare',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#smoldering%20armor_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Sylvan Talon',prog:true,mp:'40 MO Metallo',ms:'Arma da incantare',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#sylvan%20talon_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Veteran\'s Cane',mp:'30 MO Metallo',ms:'10 MO Legno',tip:'Oggetto magico Comune',url:'https://5e.tools/items.html#veteran%27s%20cane_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Proiettili Arma da Fuoco (10)',mp:'1,5 MO Metallo',ms:'—',tip:'Munizione',costo:1.5,vend:3,dt:[1,1,1,1,1]},
        {n:'Armatura a scaglie',mp:'25 MO Metallo',ms:'—',tip:'Armatura Media',desc:'CA: 14+Dex (max 2) Svantaggio Furtività',costo:25,vend:50,dt:[3,1,1,1,1]},
        {n:'Maglia a catena',mp:'25 MO Metallo',ms:'—',tip:'Armatura Media',desc:'CA: 13+Dex (max 2)',costo:25,vend:50,dt:[3,1,1,1,1]},
        {n:'Cotta di maglia',mp:'38 MO Metallo',ms:'—',tip:'Armatura Pesante',desc:'CA: 16 Requisito Forza: 13 Svantaggio Furtività',costo:38,vend:75,dt:[4,2,1,1,1]},
        {n:'Dardo',mp:'3 MR Metallo',ms:'—',tip:'Arma Semplice a Distanza',desc:'1d4 Piercing Finesse, Thrown (20/60 ft.) Mastery: Vex',costo:0.03,vend:0.05,dt:[1,1,1,1,1]},
        {n:'Lancia',mp:'5 MA Metallo',ms:'—',tip:'Arma Semplice da Mischia',desc:'1d6 Piercing Thrown (20/60 ft.), Versatile (1d8) Mastery: Sap',costo:0.5,vend:1,dt:[1,1,1,1,1]},
        {n:'Falcetto',mp:'5 MA Metallo',ms:'—',tip:'Arma Semplice da Mischia',desc:'1d4 Slashing Light Mastery: Nick',costo:0.5,vend:1,dt:[1,1,1,1,1]},
        {n:'Martello Leggero',mp:'1 MO Metallo',ms:'—',tip:'Arma Semplice da Mischia',desc:'1d4 Bludgeoning Light, Thrown (20/60 ft.) Mastery: Nick',costo:1,vend:2,dt:[1,1,1,1,1]},
        {n:'Picca da Guerra',mp:'3 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',desc:'1d8 Piercing Versatile (1d10) Mastery: Sap',costo:3,vend:5,dt:[1,1,1,1,1]},
        {n:'Tridente',mp:'3 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',desc:'1d8 Piercing Thrown (20/60 ft.), Versatile (1d10) Mastery: Topple',costo:3,vend:5,dt:[1,1,1,1,1]},
        {n:'Picca',mp:'3 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',desc:'1d10 Piercing Heavy, Reach, Two‑Handed Mastery: Push',costo:3,vend:5,dt:[1,1,1,1,1]},
        {n:'Stella del mattino',mp:'8 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',desc:'1d8 Piercing Mastery: Sap',costo:8,vend:15,dt:[1,1,1,1,1]},
        {n:'Maglio',mp:'5 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',desc:'2d6 Bludgeoning Heavy, Two‑Handed Mastery: Topple',costo:5,vend:10,dt:[1,1,1,1,1]},
        {n:'Lancia da Cavaliere',mp:'5 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',desc:'1d10 Piercing Heavy, Reach, Two‑Handed (unless mounted) Mastery: Topple',costo:5,vend:10,dt:[1,1,1,1,1]},
        {n:'Mazzafrusto',mp:'5 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',desc:'1d8 Bludgeoning Mastery: Sap',costo:5,vend:10,dt:[1,1,1,1,1]},
        {n:'Scimitarra a Doppia Lama',mp:'50 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',desc:'2d4 Slashing Two‑handed, special',costo:50,vend:100,dt:[5,2,1,1,1]},
        {n:'Ascia da Battaglia',mp:'5 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',desc:'1d8 Slashing Versatile (1d10) Mastery: Topple',costo:5,vend:10,dt:[1,1,1,1,1]},
        {n:'Ariete Portatile',mp:'2 MO Metallo',ms:'—',tip:'Equipaggiamento da Avventura',desc:'You can use a Portable Ram to break down doors. When doing so, you gain a +4 bonus to the Strength check. One other character can help you use the ram, giving you Advantage on this check.',costo:2,vend:4,dt:[1,1,1,1,1]},
      ]},
      { lv:2, items:[
        {n:'Miglioramento Armi +1', mp:'150 MO Metallo', ms:'Arma da incantare', tip:'Arma Magica', desc:'+1 ai tiri per colpire e ai danni.', costo:150, vend:400, dt:[6,2,1,1]},
        {n:'Scudo +1', mp:'175 MO Metallo', ms:'—', tip:'Scudo Magico', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Spada Lunga +1', mp:'175 MO Metallo', ms:'—', tip:'Arma Marziale', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Spadone +1', mp:'175 MO Metallo', ms:'—', tip:'Arma Marziale', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Ascia Bipenne +1', mp:'175 MO Metallo', ms:'—', tip:'Arma Marziale', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Martello da Guerra +1', mp:'175 MO Metallo', ms:'—', tip:'Arma Marziale', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Scimitarra +1', mp:'175 MO Metallo', ms:'—', tip:'Arma Marziale', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Rapier +1', mp:'175 MO Metallo', ms:'—', tip:'Arma Marziale', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Pugnale +1', mp:'175 MO Metallo', ms:'—', tip:'Arma Semplice', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Pistola +1', mp:'250 MO Metallo', ms:'—', tip:'Arma Marziale', costo:250, vend:500, dt:[10,3,1,1]},
        {n:'Moschetto +1', mp:'350 MO Metallo', ms:'—', tip:'Arma Marziale', costo:350, vend:700, dt:[14,4,1,1]},
        {n:'Gauntlets of Ogre Power', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Helm of Comprehending Languages', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Helm of Telepathy', mp:'200 MO Metallo', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Sentinel Shield', mp:'200 MO Metallo', ms:'—', tip:'Scudo Magico', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
      
        {n:'All-Purpose Tool +1',prog:true,mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#%2b1%20all-purpose%20tool_tce',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Moon Sickle +1',prog:true,mp:'200 MO Metallo',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#%2b1%20moon%20sickle_tce',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Miglioramento Armi del Mestiere +1',mp:'150 MO Metallo',ms:'Arma da incantare',tip:'Arma',desc:'L\'arma guadagna un +1 ai tiri per colpire e ai danni',costo:150,vend:400,dt:[6,2,1,1]},
        {n:'Ascia da Battaglia +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Dardo +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Semplice a Distanza',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Scimitarra a doppia lama +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Mazzafrusto +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Falcione +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'AsciaBipenne +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Alabarda +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Accetta +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Semplice da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Maglio +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Stella del mattino +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Picca +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Stocco +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Falcetto +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Semplice da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Lancia +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Semplice da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Lancia da cavaliere +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Tridente +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Spada corta +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Picca da Guerra +1',mp:'175 MO Metallo',ms:'—',tip:'Arma Marziale da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Enspelled Armor (Cantrip)',prog:true,mp:'200 MO Metallo',ms:'Armatura da incantare',tip:'Armatura',url:'https://5e.tools/items.html#enspelled%20armor%20(cantrip)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Enspelled Armor (Level 1)',prog:true,mp:'200 MO Metallo',ms:'Armatura da incantare',tip:'Armatura',url:'https://5e.tools/items.html#enspelled%20armor%20(level%201)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Enspelled Weapon (Cantrip)',prog:true,mp:'200 MO Metallo',ms:'Arma da incantare',tip:'Arma',url:'https://5e.tools/items.html#enspelled%20weapon%20(cantrip)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Enspelled Weapon (Level 1)',prog:true,mp:'200 MO Metallo',ms:'Arma da incantare',tip:'Arma',url:'https://5e.tools/items.html#enspelled%20weapon%20(level%201)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Figurine of Wondrous Power, Silver Raven',mp:'200 MO Argento',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#figurine%20of%20wondrous%20power%2c%20silver%20raven_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Mariner\'s Armor',mp:'200 MO Metallo',ms:'Armatura da incantare',tip:'Armatura',url:'https://5e.tools/items.html#mariner%27s%20armor_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
      ]},
      { lv:3, items:[
        {n:'Armatura +1 (qualsiasi)', mp:'800 MO Metallo Runato di Noxus', ms:'Armatura da potenziare', tip:'Raro', desc:'+1 CA a qualsiasi armatura media o pesante.', costo:800, vend:1800, dt:[8,3,1]},
        {n:'Arma del Mestiere +2', mp:'600 MO Acciaio Stellare', ms:'Arma da incantare', tip:'Raro', desc:'+2 ai tiri per colpire e ai danni.', costo:600, vend:1500, dt:[8,3,1]},
        {n:'Dwarven Plate', mp:'700 MO Acciaio Nanico', ms:'300 MO Gemme di Rinforzo', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Adamantine Armor', mp:'900 MO Adamantio Grezzo', ms:'100 MO Metallo di Riempimento', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Mithral Armor', mp:'900 MO Mithral Grezzo', ms:'—', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Sword of Life Stealing', prog:true, mp:"700 MO Acciaio dell'Isola Ombra", ms:'300 MO Essenza di Non Morto', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Cannoniere Noxiano (postazione)', prog:true, mp:'700 MO Ghisa di Noxus', ms:'300 MO Polvere da Sparo Rara', tip:'Arma da Postazione', desc:'3d12 perforante, gittata 150/600ft, area 3m (DC 16 Des metà). 2 persone.', costo:1000, vend:2000, dt:[8,3,1]},
      ]},
      { lv:4, items:[
        {n:'Armatura +2 (qualsiasi)', mp:'2000 MO Adamantio Runato', ms:'Armatura da potenziare', tip:'Very Rare', desc:'+2 CA.', costo:2000, vend:5000, dt:[12,4]},
        {n:'Arma del Mestiere +3', mp:'2500 MO Metallo di Nexus', ms:'Arma da incantare', tip:'Very Rare', desc:'+3 ai tiri per colpire e ai danni.', costo:2500, vend:6000, dt:[12,4]},
        {n:'Plate Armor +2', mp:'2000 MO Acciaio Celestiale di Targon', ms:'500 MO Mithral Purissimo', tip:'Very Rare', url:'https://5e.tools/', costo:2500, vend:6000, dt:[15,5]},
        {n:'Vorpal Sword', prog:true, mp:'3000 MO Acciaio di Stella Cadente', ms:'2000 MO Sangue di Drago Antico', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[18,5]},
        {n:'Nine Lives Stealer', prog:true, mp:"2500 MO Acciaio dell'Isola Ombra", ms:'2500 MO Anime Intrappolate', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[15,5]},
      ]},
      { lv:5, items:[
        {n:'Armatura +3 (qualsiasi)', mp:'6000 MO Orichalcum', ms:'Armatura da potenziare', tip:'Leggendario', desc:'+3 CA.', costo:6000, vend:14000, dt:[30]},
        {n:'Holy Avenger', prog:true, mp:'8000 MO Acciaio Sacro di Demacia', ms:'2000 MO Benedizione di un Dio', tip:'Leggendario', url:'https://5e.tools/', costo:10000, vend:20000, dt:[40]},
        {n:'Sword of Sharpness', prog:true, mp:'7000 MO Acciaio di Nexus Primordiale', ms:'1000 MO Pietra di Affilatura Divina', tip:'Leggendario', url:'https://5e.tools/', costo:8000, vend:16000, dt:[35]},
        {n:'Armor of Invulnerability', mp:'7000 MO Adamantio Leggendario', ms:"3000 MO Essenza d'Immortalità", tip:'Leggendario', url:'https://5e.tools/', costo:10000, vend:20000, dt:[40]},
        {n:'Lancia di Noxus (Unica)', prog:true, mp:'5000 MO Acciaio Imperiale di Noxus', ms:'3000 MO Sangue del Generale Caduto', tip:'Leggendario', desc:'+3 attacco/danni. 3 cariche/giorno: +4d8 forza e spingi 3m. Se colpisce muro: +2d6 extra.', costo:8000, vend:16000, dt:[35]},
      ]},
    ],
    materialiSpeciali: [
      {nome:'Ferro Grezzo', rarity:'common', costo:'2–8 MO/kg', desc:'Ferro estratto da miniere locali, grezzo e ancora ricco di impurità. Richiede raffinazione prima dell\'uso.', prop:[{k:'Provenienza',v:'Miniere comuni'},{k:'Raffinazione',v:'2h in forgia standard'},{k:'Usi',v:'Armi e armature LV1'}]},
      {nome:'Acciaio Standard', rarity:'common', costo:'5–15 MO/kg', desc:'Lega di ferro e carbonio bilanciata. Materiale base per qualsiasi metallurgo. Buon equilibrio tra durezza e flessibilità.', prop:[{k:'Provenienza',v:'Fonderie, fabbri'},{k:'Caratteristiche',v:'Resistente, lavorabile'},{k:'Usi',v:'Armi e armature LV1-2'}]},
      {nome:'Acciaio Noxiano', rarity:'uncommon', costo:'40–100 MO/kg', desc:'Acciaio prodotto con tecniche militari noxiane, temperato in acqua salata e trattato con carbonio aggiuntivo. Superiore all\'acciaio comune per tagliente e resistenza.', prop:[{k:'Provenienza',v:'Fonderie imperiali di Noxus'},{k:'Caratteristiche',v:'+10% danni taglienti'},{k:'Usi',v:'Armi LV2-3, armature'}]},
      {nome:'Acciaio Stellare', rarity:'rare', costo:'200–600 MO/kg', desc:'Lega forgiata con frammenti di meteorite. Naturalmente incantata, conduce magia senza additivi. Emette un tenue bagliore azzurrino al buio.', prop:[{k:'Provenienza',v:'Meteoriti, commercianti rari'},{k:'Conduzione magica',v:'Alta (ottimo per +2)'},{k:'Usi',v:'Armi del Mestiere +2'}]},
      {nome:'Mithral', rarity:'rare', costo:'300–800 MO/lingotto', desc:'Metallo argenteo estratto nelle profondità delle montagne nanettesche. Leggero come l\'alluminio ma resistente come l\'acciaio. Le armature in mithral non producono svantaggio alla furtività.', prop:[{k:'Provenienza',v:'Miniere naniche profonde'},{k:'Proprietà speciale',v:'Armature: no svantaggio furtività'},{k:'Usi',v:'Armature mithral, Ring of Protection'}]},
      {nome:'Adamantio', rarity:'very-rare', costo:'500–1500 MO/lingotto', desc:'Il metallo più duro esistente nel piano materiale. Nero-verdastro, quasi impossibile da graffiare. Richiede una forgia a temperatura di drago per essere lavorato. Le armature in adamantio rendono i colpi non critici normali.', prop:[{k:'Durezza',v:'Quasi assoluta'},{k:'Lavorazione',v:'Forgia con fuoco di drago o equivalente'},{k:'Usi',v:'Adamantine Armor, Armatura +2-3'}]},
      {nome:'Orichalcum', rarity:'legendary', costo:'2000–6000 MO/lingotto', desc:'Metallo mitico color oro-rosato, descritto nei testi come il "sangue della terra". Trasmette magia con un\'efficienza del 100% e non si corrode mai. Richiede forgiatura durante un\'eclissi o in prossimità di un nexus.', prop:[{k:'Provenienza',v:'Leggendaria, praticamente scomparso'},{k:'Conduzione magica',v:'Assoluta (perfetta per +3)'},{k:'Forgiatura',v:'Eclissi o nexus attivo'},{k:'Usi',v:'Armatura +3, armi leggendarie'}]},
      {nome:'Acciaio di Stella Cadente', rarity:'legendary', costo:'3000–7000 MO/kg', desc:'Lega di acciaio e frammenti di meteora Leggendaria, forgiata durante la caduta stessa. Mantiene il calore cosmico della sua origine e taglia anche le anime degli esseri non morti.', prop:[{k:'Proprietà',v:'Colpisce i non-corporei come materiale'},{k:'Taglio',v:'Ignora resistenza non magica'},{k:'Usi',v:'Vorpal Sword, Sword of Sharpness'}]},
    ]
  },
  { id:'falegname', emoji:'🪵', nome:'Falegname', tagline:'Armi in Legno · Archi · Strumenti · Veicoli — la forza della natura lavorata',
    desc:'Armi in legno, bacchette, staffe, strumenti musicali e veicoli — la forza del legno lavorato.',
    materLav: [10,25,100,500,750],
    livelli: [
      { lv:1, items:[
        {n:'Arco Lungo', mp:'25 MO Legno', ms:'—', tip:'Arma Marziale', desc:'1d8 Piercing, Range 150/600ft, Heavy, Two-Handed. Mastery: Slow.', costo:25, vend:50, dt:[2,1,1,1,1]},
        {n:'Arco Corto', mp:'13 MO Legno', ms:'—', tip:'Arma Semplice', desc:'1d6 Piercing, Range 80/320ft, Two-Handed. Mastery: Vex.', costo:13, vend:25, dt:[2,1,1,1,1]},
        {n:'Balestra Pesante', mp:'20 MO Legno', ms:'5 MO Metallo', tip:'Arma Marziale', desc:'1d10 Piercing, Range 100/400ft, Heavy, Loading, Two-Handed. Mastery: Push.', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Balestra Leggera', mp:'10 MO Legno', ms:'3 MO Metallo', tip:'Arma Semplice', desc:'1d8 Piercing, Range 80/320ft, Loading, Two-Handed. Mastery: Slow.', costo:13, vend:25, dt:[2,1,1,1,1]},
        {n:'Balestra a Mano', mp:'30 MO Legno', ms:'5 MO Metallo', tip:'Arma Marziale', desc:'1d6 Piercing, Range 30/120ft, Light, Loading. Mastery: Vex.', costo:35, vend:75, dt:[4,2,1,1,1]},
        {n:'Bastone Ferrato', mp:'1 MA Legno', ms:'—', tip:'Arma Semplice', desc:'1d6 Bludgeoning, Versatile(1d8). Mastery: Topple.', costo:0.1, vend:0.2, dt:[1,1,1,1,1]},
        {n:'Clava', mp:'5 MR Legno', ms:'—', tip:'Arma Semplice', desc:'1d4 Bludgeoning, Light. Mastery: Slow.', costo:0.05, vend:0.1, dt:[1,1,1,1,1]},
        {n:'Cerbottana', mp:'10 MO Legno', ms:'—', tip:'Arma Marziale', desc:'1 Piercing, Range 25/100ft, Loading. Mastery: Vex.', costo:10, vend:20, dt:[1,1,1,1,1]},
        {n:'Freccia (20)', mp:'3 MA Legno', ms:'2 MA Metallo', tip:'Munizione', costo:0.5, vend:1, dt:[1,1,1,1,1]},
        {n:'Canoa', mp:'25 MO Legno', ms:'—', tip:'Veicolo Acquatico', desc:'20ft su acqua. Max 1 persona.', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Barca a Remi', mp:'75 MO Legno', ms:'—', tip:'Veicolo Acquatico', desc:'40ft su acqua. Max 4 persone.', costo:75, vend:150, dt:[8,5,1,1,1]},
        {n:'Carretto', mp:'120 MO Legno', ms:'30 MO Metallo', tip:'Veicolo Terrestre', desc:'30ft. Max 4 persone. Richiede animale da tiro.', costo:150, vend:300, dt:[15,6,1,1,1]},
        {n:'Imbued Wood Focus', mp:'40 MO Legno', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Instrument of Illusions', mp:'40 MO Legno', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:"Bacchetta dei Fuochi d'Artificio", mp:'36 MO Legno', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:36, vend:75, dt:[4,2,1,1,1]},
        {n:'Staffa dei Fiori', mp:'40 MO Legno', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
      
        {n:'Quadrello (20)',mp:'3 MA Legno',ms:'2 MA Metallo',tip:'Munizione',costo:0.5,vend:1,dt:[1,1,1,1,1]},
        {n:'Barile',mp:'1 MO Legno',ms:'—',tip:'Equipaggiamento da avventura',desc:'A Barrel holds up to 40 gallons of liquid or up to 4 cubic feet of dry goods.',costo:1,vend:2,dt:[1,1,1,1,1]},
        {n:'Cassa',mp:'3 MO Legno',ms:'—',tip:'Equipaggiamento da avventura',desc:'A Chest holds up to 12 cubic feet of contents.',costo:3,vend:5,dt:[1,1,1,1,1]},
        {n:'Clava Grande',mp:'1 MA Legno',ms:'—',tip:'Arma Semplice da Mischia',desc:'1d8 Bludgeoning Two‑Handed Mastery: Push',costo:0.1,vend:0.2,dt:[1,1,1,1,1]},
        {n:'Giavellotto',mp:'2 MA Legno',ms:'1 MA Metallo',tip:'Arma Semplice da Mischia',desc:'1d6 Piercing Thrown (30/120 ft.) Mastery: Slow',costo:0.3,vend:0.5,dt:[1,1,1,1,1]},
        {n:'Staffa dell\'Ornamento',mp:'40 MO Legno',ms:'—',tip:'Arma Semplice da Mischia, oggetto magico comune',desc:'Clicca Qui',url:'https://5e.tools/items.html#staff%20of%20adornment_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Staffa Richiama Uccelli',mp:'40 MO Legno',ms:'—',tip:'Arma Semeplice da Mischia, oggetto magico comune',desc:'Clicca Qui',url:'https://5e.tools/items.html#staff%20of%20birdcalls_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Bacchetta della Conduzione',mp:'36 MO Legno',ms:'—',tip:'Oggetto magico comune',desc:'Clicca Qui',url:'https://5e.tools/items.html#wand%20of%20conducting_xdmg',costo:36,vend:75,dt:[4,2,1,1,1]},
        {n:'Bacchetta dei Fuochi D\'Artificio',mp:'36 MO Legno',ms:'—',tip:'Oggetto magico comune',desc:'Clicca Qui',url:'https://5e.tools/items.html#wand%20of%20pyrotechnics_xdmg',costo:36,vend:75,dt:[4,2,1,1,1]},
        {n:'Bacchetta dei Bronci',mp:'36 MO Legno',ms:'—',tip:'Oggetto magico comune',desc:'Clicca Qui',url:'https://5e.tools/items.html#wand%20of%20scowls_xge',costo:36,vend:75,dt:[4,2,1,1,1]},
        {n:'Bacchetta dei Sorrisi',mp:'36 MO Legno',ms:'—',tip:'Oggetto magico comune',desc:'Clicca Qui',url:'https://5e.tools/items.html#wand%20of%20smiles_xge',costo:36,vend:75,dt:[4,2,1,1,1]},
        {n:'Slitta',mp:'5 MO Legno',ms:'5 MO Metallo',tip:'Veicolo Terrestre',desc:'Questo veicolo ha una velocità di 20 Feet (6 metri) su superfici innevate Può portare un massimo di una persona e deve essere trainata da un animale',costo:10,vend:20,dt:[1,1,1,1,1]},
        {n:'Instrument of Scribing',mp:'40 MO Legno',ms:'—',tip:'Oggetto magico comune',desc:'Clicca Qui',url:'https://5e.tools/items.html#instrument%20of%20scribing_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Pole of Angling',mp:'40 MO Legno',ms:'—',tip:'Oggetto magico comune',desc:'Clicca Qui',url:'https://5e.tools/items.html#pole%20of%20angling_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Pole of Collapsing',mp:'40 MO Legno',ms:'—',tip:'Oggetto magico comune',desc:'Clicca Qui',url:'https://5e.tools/items.html#pole%20of%20collapsing_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
      ]},
      { lv:2, items:[
        {n:'Arco Lungo +1', mp:'175 MO Legno', ms:'—', tip:'Arma Marziale', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Arco Corto +1', mp:'175 MO Legno', ms:'—', tip:'Arma Semplice', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Balestra Pesante +1', mp:'175 MO Legno', ms:'—', tip:'Arma Marziale', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Bastone Ferrato +1', mp:'175 MO Legno', ms:'—', tip:'Arma Semplice', costo:175, vend:400, dt:[7,2,1,1]},
        {n:'Wand of Magic Missiles', mp:'200 MO Legno', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Wand of Web', mp:'200 MO Legno', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Wand of Entangle', mp:'200 MO Legno', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Staff of the Adder', mp:'200 MO Legno', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Staff of the Python', mp:'200 MO Legno', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Broom of Flying', mp:'200 MO Legno', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Scialuppa', mp:'250 MO Legno', ms:'—', tip:'Veicolo Acquatico', desc:'40ft su acqua. Max 8 persone.', costo:250, vend:500, dt:[10,3,1,1]},
        {n:'Carrozza', mp:'200 MO Legno', ms:'100 MO Metallo', tip:'Veicolo Terrestre', desc:'60ft. Max 4 persone. Richiede 2 animali.', costo:300, vend:600, dt:[12,3,1,1]},
      
        {n:'Miglioramento armi del mestiere +1',mp:'150 MO Legno',ms:'Arma da incantare',tip:'Arma',desc:'L\'arma guadagna un +1 ai tiri per colpire e ai danni',costo:150,vend:350,dt:[6,2,1,1]},
        {n:'Cerbottana +1',mp:'175 MO Legno',ms:'—',tip:'Arma Marziale a Distanza',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Clava +1',mp:'175 MO Legno',ms:'—',tip:'Arma Semplice da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Clava Grande +1',mp:'175 MO Legno',ms:'—',tip:'Arma Semplice da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Balestra a Mano +1',mp:'175 MO Legno',ms:'—',tip:'Arma Marziale a Distanza',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Balestra Leggera +1',mp:'175 MO Legno',ms:'—',tip:'Arma Semplice a Distanza',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Giavellotto +1',mp:'175 MO Legno',ms:'—',tip:'Arma Semplice da Mischia',costo:175,vend:400,dt:[7,2,1,1]},
        {n:'Rhythm-Maker\'s Drum +1',prog:true,mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#%2b1%20rhythm-maker%27s%20drum_tce',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Rod of the Pact Keeper +1',prog:true,mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#%2b1%20rod%20of%20the%20pact%20keeper_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Wand of the War Mage +1',mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#%2b1%20wand%20of%20the%20war%20mage_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Enspelled Staff (Cantrip)',prog:true,mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#enspelled%20staff%20(cantrip)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Enspelled Staff (Level 1)',prog:true,mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#enspelled%20staff%20(level%201)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Instrument of the Bards, Doss Lute',prog:true,mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#instrument%20of%20the%20bards%2c%20doss%20lute_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Instrument of the Bards, Fochlucan Bandore',prog:true,mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#instrument%20of%20the%20bards%2c%20fochlucan%20bandore_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Instrument of the Bards, Mac-Fuirmidh Cittern',prog:true,mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#instrument%20of%20the%20bards%2c%20mac-fuirmidh%20cittern_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Skyblinder Staff',prog:true,mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',desc:'Skyblinder Staff',url:'https://5e.tools/items.html#skyblinder%20staff_ggr',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Wand of Magic Detection',mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#wand%20of%20magic%20detection_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Wand of Secrets',mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#wand%20of%20secrets_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Scialuppa ',mp:'250 MO Legno',ms:'—',tip:'Veicolo Acquatico',desc:'Questo veicolo ha una velocità di 40 Feet (12 metri) su superfici d\'acqua Può portare un massimo di otto persone',costo:250,vend:500,dt:[10,3,1,1]},
        {n:'Antlers of the True Path',mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#antlers%20of%20the%20true%20path_humblewoodtales',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Baba Yaga\'s Dancing Broom',mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#baba%20yaga%27s%20dancing%20broom_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Enspelled Weapon (Cantrip)',prog:true,mp:'200 MO Legno',ms:'Arma da incantare',tip:'Arma',url:'https://5e.tools/items.html#enspelled%20weapon%20(cantrip)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Enspelled Weapon (Level 1)',prog:true,mp:'200 MO Legno',ms:'Arma da incantare',tip:'Arma',url:'https://5e.tools/items.html#enspelled%20weapon%20(level%201)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Pipes of Haunting',mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#pipes%20of%20haunting_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Pipes of the Sewers',mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#pipes%20of%20the%20sewers_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Red-Feather Bow',prog:true,mp:'200 MO Legno',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#red-feather%20bow_humblewoodcampaignsetting',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Wing Crest Shield',prog:true,mp:'200 MO Legno',ms:'—',tip:'Armatura (Scudo)',url:'https://5e.tools/items.html#wing%20crest%20shield_humblewoodcampaignsetting',costo:200,vend:400,dt:[8,2,1,1]},
      ]},
      { lv:3, items:[
        {n:'Arco Corto +2', mp:'600 MO Legno di Yew Antico', ms:'—', tip:'Arma Marziale', url:'https://5e.tools/', costo:600, vend:1500, dt:[8,3,1]},
        {n:'Arco Lungo +2', mp:'700 MO Legno di Quercia di Ixtal', ms:'—', tip:'Arma Marziale', url:'https://5e.tools/', costo:700, vend:1500, dt:[8,3,1]},
        {n:'Oathbow', prog:true, mp:'800 MO Legno di Olmo Sacro', ms:'200 MO Corda d\'Arpa Elfica', tip:'Arma Marziale Rara', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Staff of Withering', prog:true, mp:'700 MO Legno Morto di Ixtal', ms:'300 MO Polvere Necrotica', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Carrozza Volante (piccola)', prog:true, mp:'700 MO Legno di Fenice', ms:"300 MO Piume d'Aquila Gigante", tip:'Veicolo Aereo', desc:"Velocità 60ft (Volo). 2 creature + 100kg. Azione per partire/atterrare.", costo:1000, vend:2000, dt:[8,3,1]},
        {n:"Instrument of the Bards, Anstruth Harp", prog:true, mp:'800 MO Legno Armonico di Ionia', ms:'200 MO Corde di Seta Magica', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
      ]},
      { lv:4, items:[
        {n:'Arco Lungo +3', mp:'2000 MO Legno di Nexus', ms:'—', tip:'Very Rare', url:'https://5e.tools/', costo:2000, vend:4500, dt:[12,4]},
        {n:'Enspelled Staff (Level 3)', prog:true, mp:'1800 MO Legno di Drago', ms:'200 MO Cristallo Astrale', tip:'Very Rare', url:'https://5e.tools/', costo:2000, vend:4000, dt:[15,5]},
        {n:'Nave da Guerra Leggera', prog:true, mp:'1500 MO Quercia di Ixtal', ms:'500 MO Metallo Marino Rinforzato', tip:'Veicolo Acquatico', desc:'Brigantina: cannoni×2, 60ft, 400 PF, CA 16. Trasporta 20 persone e 2t.', costo:2000, vend:4000, dt:[15,4]},
        {n:"Instrument of the Bards, Cli Lyre", prog:true, mp:'1500 MO Legno di Ionia', ms:'500 MO Corde di Unicorno', tip:'Very Rare', url:'https://5e.tools/', costo:2000, vend:4000, dt:[12,4]},
      ]},
      { lv:5, items:[
        {n:'Vorpal Bow', prog:true, mp:"6000 MO Legno dell'Albero del Mondo", ms:'2000 MO Corda di Capello di Divinità', tip:'Leggendario', desc:'+3 attacco/danni. Con 20 naturale: decapita (o 6d8 taglienti extra) se non immune ai critici.', costo:8000, vend:16000, dt:[30]},
        {n:'Nave Ammiraglia Rinforzata', prog:true, mp:'5000 MO Quercia Millenaria di Ixtal', ms:'3000 MO Corallo Adamantino', tip:'Veicolo Leggendario', desc:'600 PF, CA 18, 80ft. Cannoni×4 (3d10). Muro di Forza 3/giorno. Auto-ripara 5 PF/round.', costo:8000, vend:16000, dt:[35]},
        {n:"Instrument of the Bards, Ollamh Harp", prog:true, mp:'8000 MO Legno del Nexus di Ionia', ms:'—', tip:'Leggendario', url:'https://5e.tools/', costo:8000, vend:16000, dt:[30]},
      ]},
    ],
    materialiSpeciali: [
      {nome:'Legno Comune', rarity:'common', costo:'1–5 MO/kg', desc:'Quercia, pino, faggio o noce locali. Legname stagionato adatto per oggetti di base.', prop:[{k:'Stagionatura',v:'Min. 1 anno'},{k:'Usi',v:'Armi LV1, veicoli base'}]},
      {nome:'Legno di Quercia di Ixtal', rarity:'uncommon', costo:'30–80 MO/kg', desc:'Quercia cresciuta nelle foreste magiche di Ixtal. Naturalmente resistente agli incantesimi e alla putrefazione. Ambrato con venature dorate.', prop:[{k:'Provenienza',v:'Foreste di Ixtal'},{k:'Proprietà',v:'Resistente agli incantesimi'},{k:'Usi',v:'Archi LV2-3, Carrozze volanti'}]},
      {nome:'Legno Armonico di Ionia', rarity:'rare', costo:'100–300 MO/kg', desc:'Legno di alberi centenari di Ionia cresciuti vicino a rift spirituali. Risuona con frequenze magiche udibili solo da incantatori. Usato per strumenti bardici.', prop:[{k:'Provenienza',v:'Ionia, zone spirituali'},{k:'Proprietà',v:'Amplifica magia sonora del 20%'},{k:'Usi',v:'Strumenti di Bardic, Archi LV3'}]},
      {nome:'Legno di Fenice', rarity:'rare', costo:'200–500 MO/kg', desc:'Rami raccolti dopo la rinascita di una fenice. Non brucia mai (immune al fuoco), e trasferisce parte della vitalità della fenice agli oggetti forgiati.', prop:[{k:'Proprietà',v:'Immune al fuoco'},{k:'Bonus',v:'+1d4 fuoco ai critici se intagliato come arma'},{k:'Usi',v:'Carrozze Volanti, veicoli aerei'}]},
      {nome:'Legno di Drago', rarity:'very-rare', costo:'500–2000 MO/kg', desc:'Legno di alberi cresciuti su carcasse di drago per secoli. Intriso di magia draconiana, conduce incantesimi come un cristallo. Odora di zolfo e ozono.', prop:[{k:'Provenienza',v:'Zone di caccia draconiana'},{k:'Conduzione magica',v:'Molto alta'},{k:'Usi',v:'Enspelled Staff LV3-4, Archi+3'}]},
      {nome:"Legno dell'Albero del Mondo", rarity:'legendary', costo:'3000–8000 MO/kg', desc:"Un singolo albero che si dice tocchi tutti i piani di esistenza contemporaneamente. Frammenti cadono spontaneamente ogni generazione. Il legno contiene cicatrici di ogni piano che ha attraversato.", prop:[{k:'Provenienza',v:'Un solo albero, posizione sconosciuta'},{k:'Proprietà',v:'Ignora resistenze planari'},{k:'Usi',v:'Vorpal Bow'}]},
    ]
  },
  { id:'oste', emoji:'🍺', nome:'Oste', tagline:'Cibi · Bevande · Banchetti · Elisir — la cucina come arte del potere',
    desc:'Cibi e bevande potenzianti — la cucina come arte del potere.',
    materLav: [10,25,100,500,750],
    livelli: [
      { lv:1, items:[
        {n:'Sidro di Targon', mp:'3 MO Mele Celestiali', ms:'2 MO Erbe montane', tip:'Common', desc:'+1 ai TS Destrezza e prove Atletica (2h)', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Galletta Demaciana', mp:'3 MO Grano del Nord', ms:'2 MO Olio di Pietra', tip:'Common', desc:'PF temporanei pari al bonus competenza del cuoco (max 3 gallette).', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Grog del Macello', mp:'3 MO Rum di Canna', ms:'2 MO Succo Calamaro', tip:'Common', desc:'Vantaggio ai TS contro Veleno e condizione avvelenato (10 min).', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Zuppa di Radici Ioniana', mp:'5 MO Radice di Loto', ms:'3 MO Petali Spirito', tip:'Common', desc:'+1 alla percezione passiva (3h).', costo:8, vend:16, dt:[1,1,1,1,1]},
        {n:"Pane d'Orzo", mp:'3 MO Farina Grezza', ms:'2 MO Sale di Montagna', tip:'Common', desc:'Conta come 2 razioni, non marcisce mai.', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Zuppa del Viandante', mp:'3 MO Carne Secca', ms:'2 MO Radici Selvatiche', tip:'Common', desc:'Recuperi PF pari a un dado vita.', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Birra di Frumento', mp:'3 MO Cereali Misti', ms:'2 MO Luppolo', tip:'Common', desc:'+1 ai TS contro paura e condizione spaventato (1h).', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Vino dei Sogni', mp:'18 MO Uva di Ionia', ms:'7 MO Polvere di Stelle', tip:'Uncommon', desc:'Vantaggio ai TS contro Charme e Sonno (1h).', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Pasta e Fagioli di Shurima', mp:'3 MO Pasta di Grano Arido', ms:'2 MO Fagioli del Deserto', tip:'Common', desc:'+2 PF extra per dado vita speso durante riposo breve.', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Bistecca di Ixtal', mp:'8 MO Lombata di Lucertola Gigante', ms:'2 MO Erbe della giungla', tip:'Common', desc:'Vantaggio alle prove di forza (10 min).', costo:10, vend:20, dt:[1,1,1,1,1]},
        {n:'Ramen delle Piogge d\'Oriente', prog:true, mp:'6 MO Carne di Cervo delle Nebbie', ms:'2 MO Funghi di Bambù Blu', tip:'Common', desc:'Recuperi 1d4 PF aggiuntivi per ogni dado vita speso al prossimo RB.', costo:8, vend:16, dt:[1,1,1,1,1]},
        {n:'Mochi ai Fiori di Loto', prog:true, mp:'4 MO Farina di Riso Lunare', ms:'3 MO Petali di Loto Dorato', tip:'Common', desc:'+1 ai tiri su Persuasione (8h).', costo:7, vend:14, dt:[1,1,1,1,1]},
        {n:'Sake Caldo delle Lanterne', prog:true, mp:'5 MO Riso Fermentato del Sole Nascente', ms:'2 MO Spezie di Cannella Cremisi', tip:'Common', desc:'Vantaggio contro spaventato, svantaggio Furtività (4h).', costo:7, vend:14, dt:[1,1,1,1,1]},
        {n:'Onigiri del Viandante', prog:true, mp:'4 MO Riso delle Colline Ioniane', ms:'3 MO Salmone Affumicato delle Coste', tip:'Common', desc:'+1 ai tiri di Sopravvivenza e Natura (8h).', costo:7, vend:14, dt:[1,1,1,1,1]},
        {n:'Tè al Gelsomino della Prima Terra', prog:true, mp:'4 MO Foglie di Gelsomino Celeste', ms:'2 MO Miele dei Fiori di Alba', tip:'Common', desc:'+1 Intuizione, puoi ritirare un tiro di concentrazione fallito (4h).', costo:6, vend:12, dt:[1,1,1,1,1]},
        {n:'Spiedini Yakitori del Porto di Navori', prog:true, mp:'6 MO Pollo nero di Navori', ms:'1 MO Salsa di Soia Fermentata', tip:'Common', desc:'PF temporanei pari al doppio del bonus competenza (4h).', costo:7, vend:14, dt:[1,1,1,1,1]},
      
        {n:'Pane d\'Orzo',mp:'3 MO Farina Grezza',ms:'2 MO Sale di Montagna',tip:'Common',desc:'Saziante: Conta come 2 razioni giornaliere e non marcisce mai',costo:5,vend:10,dt:[1,1,1,1,1]},
        {n:'Parmigiana Demaciana',mp:'2 MO Melanzane di Campo',ms:'3 MO Formaggio di Petricite',tip:'Common',desc:'Scudo Rustico: Ottieni +1 ai TS contro Incantesimi (1h)',costo:5,vend:10,dt:[1,1,1,1,1]},
        {n:'Pezzetti di Kaskadeur',mp:'6 MO Filetto di Kaskadeur',ms:'4 MO di Sugo di Pomodoro',tip:'Common',desc:'Furia Noxiana: +2 danni extra al prossimo fight (non cumulabile)',costo:8,vend:16,dt:[1,1,1,1,1]},
        {n:'Pizzocheri del Freljord',prog:true,mp:'8 MO Pasta di grano dei ghiacci',ms:'2 MO Verza delle Nevi',tip:'Common',desc:'Resistenza al Gelo: Vantaggio ai TS contro gli effetti del Freddo Estremo (4h)',costo:10,vend:20,dt:[1,1,1,1,1]},
        {n:'Pollo Arrosto di Azir',mp:'3 MO Pollo Ruspante',ms:'3 MO Spezie Dorate',tip:'Common',desc:'Energia Solare: Non puoi essere Sorpreso durante il prossimo turno di guardia nel riposo lungo',costo:6,vend:12,dt:[1,1,1,1,1]},
        {n:'Gateaux alla Piltoviana',prog:true,mp:'4 MO Patate Magiche a Pasta Gialla',ms:'3 MO Salumi Misti',tip:'Common',desc:'Stratificazione: Ottieni PF Temporanei pari a DEX+Competenza del Cuoco (Tali PF durano fino al prox. Riposo Lungo)',costo:7,vend:14,dt:[1,1,1,1,1]},
        {n:'Fagioli all\'Uccelletto Magico',mp:'3 MO Fagioli Alati',ms:'3 MO Salsiccia di Selvaggina',tip:'Common',desc:'Leggerezza: Le tue orma sono più difficili da seguire, +2 alle prove di furtività (2h)',costo:6,vend:12,dt:[1,1,1,1,1]},
        {n:'Insalata del Cacciatore di Serpenti',mp:'6 MO Tentacoli di Kraken',ms:'3 MO Patate di Scogliera',tip:'Common',desc:'Anfibio: Puoi trattenere il respiro sott\'acqua il doppio dei minuti rispetto al normale (2h)',costo:9,vend:18,dt:[1,1,1,1,1]},
      ]},
      { lv:2, items:[
        {n:'Whiskey Rabbioso', mp:'40 MO Sangue di Viverna', ms:'10 MO Bacche elementali', tip:'Rare', desc:'2d4 danni extra del tipo arma ai critici per 1h.', costo:50, vend:100, dt:[2,1,1,1]},
        {n:"Spezzatino d'Idra", mp:'15 MO Carne di Mostro', ms:'10 MO Spezie Naniche', tip:'Uncommon', desc:'2d10 PF Temporanei. Recuperi 1 PF/turno finché li hai (effetto recupero 1h, PF fino al prossimo RL).', costo:25, vend:50, dt:[1,1,1,1]},
        {n:'Liquore di Fuoco', mp:'17 MO Peperoncino', ms:'8 MO Alcol Puro', tip:'Uncommon', desc:'Resistenza ai danni da Freddo per 1h.', costo:25, vend:50, dt:[1,1,1,1]},
        {n:'Birra Baffo di Poro', mp:'12 MO Orzo dei Ghiacci', ms:'13 MO Briciole Snax', tip:'Uncommon', desc:'Rimuove un livello di Affaticamento.', costo:25, vend:50, dt:[1,1,1,1]},
        {n:'Arrosto di Basilisco', mp:'18 MO Carne di Basilisco', ms:'7 MO Sale Nero', tip:'Uncommon', desc:'Vantaggio alle prove su Forza per 2h.', costo:25, vend:50, dt:[1,1,1,1]},
        {n:'Nettare di Zaun', mp:'10 MO Funghi Sump', ms:'15 MO Siero Chemtech', tip:'Uncommon', desc:'+3m (10ft) velocità per 10 minuti.', costo:25, vend:50, dt:[1,1,1,1]},
        {n:"Tè Foglie d'Oro", mp:'15 MO Tè del Deserto', ms:'10 MO Polvere Solare', tip:'Uncommon', desc:'Recuperi uno slot incantesimo di 1° livello. Bevibile 1/Riposo Breve.', costo:25, vend:50, dt:[1,1,1,1]},
        {n:'Vino di Rose Nere', mp:'17 MO Rose Nere', ms:'8 MO Alcol Forte', tip:'Uncommon', desc:'Vantaggio alle prove di Intimidire e Inganno per 1h.', costo:25, vend:50, dt:[1,1,1,1]},
        {n:'Muffin di Piltover', mp:'12 MO Farina Raffinata', ms:'13 MO Polvere Hextech', tip:'Uncommon', desc:'+2 alle prove di Intelligenza per 1h.', costo:25, vend:50, dt:[1,1,1,1]},
        {n:'Scagliapiedi al Salto', mp:'13 MO Placche di Scagliapiedi', ms:'12 MO Pasta Demaciana', tip:'Uncommon', desc:'+1 CA per 1h (non cumulabile).', costo:25, vend:50, dt:[1,1,1,1]},
      
        {n:'Spezzatino d\'Idra',mp:'15 MO Carne di Mostro',ms:'10 MO Spezie Naniche',tip:'Uncommon',desc:'Rigenerazione: Ottieni 2d10 PF Temporanei. Finchè li hai recuperi 1 PF a turno, l\'effetto di recupero dura solo 1h, i PF fino al prossimo Riposo Lungo',costo:25,vend:50,dt:[1,1,1,1]},
        {n:'Tè foglie d\'Oro',prog:true,mp:'15 MO Tè del Deserto',ms:'10 MO Polvere Solare',tip:'Uncommon',desc:'Saggezza di Azir: Recuperi uno slot Incantesimo di 1° livello speso, pui bere questo solo una volta per Riposo Breve',costo:25,vend:50,dt:[1,1,1,1]},
        {n:'Liquore Teemo',prog:true,mp:'20 MO Funghi Velenosi',ms:'5 MO Miele Fatato',tip:'Uncommon',desc:'Tattica della Guerriglia: Vantaggio alle prova di Furtività per 1 ora',costo:25,vend:50,dt:[1,1,1,1]},
      ]},
      { lv:3, items:[
        {n:'Ragù del Barile Esplosivo', prog:true, mp:'50 MO Salsicce Esplosive di Zaun', ms:'25 MO Spezie Caustiche', tip:'Rare', desc:'Resistenza al fuoco per 2h. Quando prendi danni da fuoco: piccola esplosione 1d6 (DC 14 Des).', costo:75, vend:150, dt:[3,1,1]},
        {n:"Idromele di Targon", prog:true, mp:'40 MO Miele Celeste', ms:'35 MO Nettare di Luna', tip:'Rare', desc:'Per 1h: vedi l\'Invisibile e Vantaggio ai TS contro incantesimi.', costo:75, vend:150, dt:[3,1,1]},
        {n:'Zuppa del Lich Gourmet', prog:true, mp:'60 MO Osso di Non Morto', ms:'15 MO Funghi del Crepuscolo', tip:'Rare', desc:'Per 1h: parli con i morti entro 10m. 1/riposo lungo: Parlare con i Morti senza componenti.', costo:75, vend:150, dt:[3,1,1]},
        {n:'Filetto del Dragone Rosso', prog:true, mp:'60 MO Carne di Drago Rosso', ms:'15 MO Spezie Infernali', tip:'Rare', desc:'Immunità al fuoco per 1h. Attacchi: +2d6 fuoco per lo stesso periodo.', costo:75, vend:150, dt:[3,1,1]},
        {n:'Stufato del Cacciatore del Vuoto', prog:true, mp:'50 MO Carne di Creatura del Vuoto', ms:'25 MO Radici Abissali', tip:'Rare', desc:'Per 10 min: attacchi ignorano resistenza (non immunità). Poi DC 14 Cost. o 1 livello Esaurimento.', costo:75, vend:150, dt:[3,1,1]},
        {n:'Caffè di Zilean Blend', prog:true, mp:'45 MO Chicchi di Caffeina Pura', ms:'30 MO Polvere di Clessidra di Zilean', tip:'Rare', desc:'Per 1h: Reazione per ripetere qualsiasi tiro (tuo o alleato entro 9m) 1/turno.', costo:75, vend:150, dt:[3,1,1]},
        {n:'Vino del Primo Nevicare', prog:true, mp:'40 MO Uva Glaciale del Freljord', ms:'35 MO Lacrime di Ashe', tip:'Rare', desc:'Immunità condizione Spento. Reazione: Spruzzo di Gelo 2d8 su chi ti colpisce.', costo:75, vend:150, dt:[3,1,1]},
        {n:'Banquet Reale di Arcamis (per 6)', prog:true, mp:'120 MO Ingredienti Pregiati Misti', ms:'30 MO Vino di Annata', tip:'Rare — Banchetto', desc:'Tutti i commensali: 2d10+10 PF Temporanei, Vantaggio ai TS per 24h, cura di una malattia o veleno.', costo:150, vend:300, dt:[4,2,1]},
      ]},
      { lv:4, items:[
        {n:'Festino degli Dei (per 10)', prog:true, mp:'300 MO Ingredienti Divini', ms:'200 MO Vino Celestiale di Targon', tip:'Very Rare — Banchetto', desc:'Come incantesimo Festino degli Dei. Immunità veleni/malattie 24h + 2d10+20 PF Temporanei.', costo:500, vend:1000, dt:[5,2]},
        {n:'Distillato del Profeta', prog:true, mp:'200 MO Erbe della Visione di Ionia', ms:'300 MO Distillato Astrale', tip:'Very Rare', desc:'Per 1h: Preveggenza (non sorpreso). 1/ora: domanda al DM come Oracolo (Sì/No/Forse).', costo:500, vend:1000, dt:[5,2]},
        {n:'Bibita del Berserker Primordiale', prog:true, mp:'250 MO Bile di Warwick', ms:'250 MO Spezie del Vuoto', tip:'Very Rare', desc:'Per 1 min: +4 FOR e COS, attacchi extra come azione bonus. Poi DC 18 Cost. o 2 livelli Esaurimento.', costo:500, vend:1000, dt:[5,2]},
        {n:"Cena dell'Immortale", prog:true, mp:'300 MO Ambrosia di Targon', ms:'200 MO Erbe della Vita Eterna', tip:'Very Rare', desc:'Per 7 giorni: +1 PF/dado vita, immunità malattie non magiche, non invecchi.', costo:500, vend:1000, dt:[6,2]},
      ]},
      { lv:5, items:[
        {n:'Elisir del Re Gastronauta', prog:true, mp:'2000 MO Ingredienti Leggendari da Tutte le Regioni', ms:'—', tip:'Leggendario', desc:'+2 COS permanente (max 22), immunità ai veleni, 10 PF temporanei/turno (max 30). Una sola volta per creatura.', costo:2000, vend:5000, dt:[20]},
        {n:'Grande Banchetto Cosmico (per 20)', prog:true, mp:'1500 MO Cibo degli Dei', ms:'500 MO Vino del Nexus', tip:'Leggendario — Banchetto Supremo', desc:'Come Festino degli Dei potenziato. +2 a tutti i TS per 7 giorni, tutti gli slot incantesimo recuperati.', costo:2000, vend:4000, dt:[20]},
        {n:'Ricetta Perduta di Ixtal (Unica)', prog:true, mp:'3000 MO Ingredienti Rituali di Ixtal', ms:'—', tip:'Leggendario — Speciale', desc:'8 ore di preparazione. Effetto permanente a scelta: Scurovisione 60ft, Respirare sott\'acqua, Resistenza a un tipo di danno.', costo:3000, vend:6000, dt:[25]},
      ]},
    ],
    materialiSpeciali: [
      {nome:'Erbe e Spezie Comuni', rarity:'common', costo:'1–5 MO/dose', desc:'Erbe medicinali e spezie locali. Basilico, rosmarino, pepe, zenzero. La base di ogni cucina di livello 1.', prop:[{k:'Conservazione',v:'3 mesi secchi'},{k:'Provenienza',v:'Mercati, raccolte'},{k:'Usi',v:'Piatti LV1'}]},
      {nome:'Carne di Mostro', rarity:'uncommon', costo:'10–40 MO/kg', desc:'Carne di creature non comuni come basilisco, idra, viverna o chimera. Nutriente oltre il normale e con proprietà residue della creatura.', prop:[{k:'Proprietà',v:'Trasmette caratteristiche della creatura'},{k:'Conservazione',v:'Deve essere cucinata entro 24h'},{k:'Usi',v:'Piatti LV2'}]},
      {nome:'Ingredienti di Ionia', rarity:'rare', costo:'30–100 MO/dose', desc:'Ingredienti intrisi di energia spirituale ioniana: foglie di gelsomino celeste, uva di spiriti, riso lunare. Conferiscono benefici legati alla percezione e alla magia.', prop:[{k:'Provenienza',v:'Ionia, giardini spirituali'},{k:'Proprietà',v:'Amplificano incantesimi e percezione'},{k:'Usi',v:'Piatti ioniani LV1-3'}]},
      {nome:'Carne di Drago', rarity:'very-rare', costo:'300–1000 MO/kg', desc:'La carne di un drago è pericolosa da preparare e ancora più da mangiare senza esperienza. Contiene la magia elementale della creatura e può bruciare letteralmente il cuoco inesperto.', prop:[{k:'Pericolo cottura',v:'DC 14 DES o 2d6 fuoco/acido'},{k:'Proprietà',v:'Immunità elementale temporanea'},{k:'Usi',v:'Filetto del Dragone, Piatti LV3-4'}]},
      {nome:'Ingredienti Divini di Targon', rarity:'very-rare', costo:'200–800 MO/dose', desc:'Ambrosia, miele celeste, nettare di luna e frutti raccolti sui picchi di Targon. Toccati dalla divinità, conferiscono benefici che durano giorni anziché ore.', prop:[{k:'Provenienza',v:'Vette di Targon, Aspetti'},{k:'Durata effetti',v:'24h–7 giorni'},{k:'Usi',v:'Festino degli Dei, Cena dell\'Immortale'}]},
      {nome:'Ingredienti Leggendari Multisorgente', rarity:'legendary', costo:'500–2000 MO/dose', desc:'Una combinazione di ingredienti rarissimi provenienti da ogni regione conosciuta e oltre: carni di creature leggendarie, spezie di piani di esistenza diversi, frutti che sbocciano solo durante gli allineamenti cosmici.', prop:[{k:'Preparazione',v:'Minimo 8 ore, ricetta segreta'},{k:'Effetto',v:'Permanente o 7+ giorni'},{k:'Usi',v:'Elisir del Re Gastronauta, Ricetta Perduta'}]},
    ]
  },
  { id:'artista', emoji:'🎨', nome:'Artista', tagline:'Pergamene · Tatuaggi · Opere d\'Arte · Composizioni — la creatività come potere',
    desc:'Pergamene, tatuaggi magici, opere d\'arte e composizioni — la creatività si fa potere.',
    materLav: [10,40,80,160,200],
    livelli: [
      { lv:1, items:[
        {n:'Enduring Spellbook', mp:'40 MO Carta', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:"Illuminator's Tattoo", mp:'40 MO Inchiostro', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Masquerade Tattoo', mp:'40 MO Inchiostro', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Spellwrought Tattoo (Cantrip)', mp:'20 MO Inchiostro', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:20, vend:40, dt:[2,1,1,1,1]},
        {n:'Spellwrought Tattoo (1° Livello)', mp:'20 MO Inchiostro', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:20, vend:40, dt:[2,1,1,1,1]},
        {n:'Libro degli Incantesimi', mp:'25 MO Carta', ms:'—', tip:'Equipaggiamento', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Pergamena — Trucchetto', mp:'10 MO Carta', ms:'5 MO Inchiostro', tip:'Pergamena Magica', desc:'Trucchetto a scelta dalla lista incantesimi di una classe del personaggio. Chiunque sappia leggere può attivarla.', costo:15, vend:30, dt:[1,1,1,1,1]},
        {n:'Pergamena — 1° Livello', mp:'10 MO Carta', ms:'15 MO Inchiostro', tip:'Pergamena Magica', desc:'Incantesimo di 1° livello a scelta dalla lista incantesimi di una classe del personaggio. Chiunque sappia leggere può attivarla.', costo:25, vend:50, dt:[1,1,1,1,1]},
      
        {n:'Illuminator\'s Tattoo',mp:'40 MO Inchiostro',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#illuminator%27s%20tattoo_tce',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Spellwrought Tattoo (1st Level)',mp:'20 MO Inchiostro',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#spellwrought%20tattoo%20(1st%20level)_tce',costo:20,vend:40,dt:[2,1,1,1,1]},
        {n:'Libro degli incantesimi',mp:'25 MO Carta',ms:'—',tip:'Equipaggiamento da avventura',costo:25,vend:50,dt:[3,1,1,1,1]},
      ]},
      { lv:2, items:[
        {n:'Arcane Grimoire +1', mp:'200 MO Carta', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Barrier Tattoo (Small)', mp:'200 MO Inchiostro', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Coiling Grasp Tattoo', mp:'200 MO Inchiostro', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Eldritch Claw Tattoo', mp:'200 MO Inchiostro', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Spellwrought Tattoo (2° Livello)', mp:'100 MO Inchiostro', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Spellwrought Tattoo (3° Livello)', mp:'100 MO Inchiostro', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:100, vend:200, dt:[4,1,1,1]},
        {n:'Pergamena — 2° Livello', mp:'50 MO Carta', ms:'50 MO Inchiostro', tip:'Pergamena Magica', desc:'Incantesimo di 2° livello a scelta dalla lista incantesimi di una classe del personaggio.', costo:100, vend:200, dt:[3,2,2,2,1]},
        {n:'Pergamena — 3° Livello', mp:'50 MO Carta', ms:'100 MO Inchiostro', tip:'Pergamena Magica', desc:'Incantesimo di 3° livello a scelta dalla lista incantesimi di una classe del personaggio.', costo:150, vend:300, dt:[5,4,3,2,2]},
      
        {n:'Spellwrought Tattoo (2nd Level)',mp:'100 MO Inchiostro',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#spellwrought%20tattoo%20(2nd%20level)_tce',costo:100,vend:200,dt:[4,1,1,1]},
        {n:'Spellwrought Tattoo (3rd Level)',mp:'100 MO Inchiostro',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#spellwrought%20tattoo%20(3rd%20level)_tce',costo:100,vend:200,dt:[4,1,1,1]},
      ]},
      { lv:3, items:[
        {n:'Arcane Grimoire +2', prog:true, mp:'500 MO Carta Arcana', ms:'500 MO Inchiostro di Astro', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Barrier Tattoo (Large)', mp:'800 MO Inchiostro Runato', ms:'200 MO Aghi di Platino', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Spellwrought Tattoo (4° Livello)', prog:true, mp:'800 MO Inchiostro di Drago', ms:'—', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Ghost Step Tattoo', prog:true, mp:'700 MO Inchiostro Spettrale', ms:'300 MO Polvere di Ossa', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Lifewell Tattoo', prog:true, mp:'600 MO Inchiostro di Foresta di Ionia', ms:'400 MO Sangue di Driade', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Pergamena LV 4 (Magica)', mp:'500 MO Carta Pergamena', ms:'500 MO Inchiostro di Drago', tip:'Pergamena Magica', desc:'Incantesimo di 4° livello a scelta. Usabile da chiunque sappia leggere.', costo:1000, vend:2000, dt:[10,3,1]},
        {n:'Mural di Guerra', prog:true, mp:'700 MO Pigmenti Rari', ms:'300 MO Pennelli di Fenice', tip:"Opera d'Arte — Struttura", desc:'Affresco permanente. Alleati che lo vedono: +10 PF Temporanei prima del combattimento. 1/giorno.', costo:1000, vend:2000, dt:[6,2,1]},
        {n:'Obra Maestra di Arcamis', prog:true, mp:'600 MO Carte Artigianali', ms:'400 MO Oro e Gemme Decorative', tip:'Pergamena Speciale', desc:'Opera con fascino (DC 15 Sag.). Vendi per 1500 MO o tienila: +2 Carisma in negoziazioni nella stanza.', costo:1000, vend:2000, dt:[5,2,1]},
      ]},
      { lv:4, items:[
        {n:'Arcane Grimoire +3', prog:true, mp:'2000 MO Carta di Drago Antico', ms:'3000 MO Inchiostro Primordiale', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[15,5]},
        {n:'Spellwrought Tattoo (5° Livello)', prog:true, mp:'3000 MO Inchiostro del Vuoto', ms:'2000 MO Aghi di Mithral', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[25,5]},
        {n:'Blood Fury Tattoo', prog:true, mp:'2500 MO Inchiostro di Demonio', ms:'2500 MO Sangue di Campione di Noxus', tip:'Very Rare', url:'https://5e.tools/', costo:5000, vend:10000, dt:[15,5]},
        {n:'Pergamena LV 5 (Magica)', prog:true, mp:'2000 MO Carta di Drago', ms:'3000 MO Inchiostro Astrale', tip:'Pergamena Magica', desc:'Incantesimo di 5° livello a scelta. DC 13 per chi non ha proficiency arcana.', costo:5000, vend:10000, dt:[25,5]},
        {n:"Ritratto dell'Eroe (Leggendario)", prog:true, mp:'3000 MO Tela Magica', ms:'2000 MO Pigmenti Plasmati', tip:"Opera d'Arte Leggendaria", desc:'Alleati a 9m: Vantaggio ai TS contro Paura + 15 PF temporanei a inizio combattimento. 1 ritratto attivo.', costo:5000, vend:10000, dt:[15,5]},
      ]},
      { lv:5, items:[
        {n:'Spellwrought Tattoo (6°-9° Livello)', prog:true, mp:'10000 MO Inchiostro della Creazione', ms:'—', tip:'Leggendario', url:'https://5e.tools/', costo:12000, vend:25000, dt:[40]},
        {n:'Icon of Ravenloft (replica)', prog:true, mp:'8000 MO Mithral Sacro', ms:'2000 MO Gemme di Divinità', tip:'Leggendario', url:'https://5e.tools/', costo:10000, vend:20000, dt:[35]},
        {n:'Manifesto della Creazione', prog:true, mp:'7000 MO Tela del Piano Astrale', ms:'3000 MO Inchiostro del Dio della Scrittura', tip:"Opera d'Arte Leggendaria — Unica", desc:'Chi la vede: DC 20 Sag. o smette di attaccare alleati del creatore per 1 min. 1/giorno come azione.', costo:10000, vend:20000, dt:[40]},
        {n:'Pergamena — 6° Livello', prog:true, mp:'5000 MO Carta Arcana', ms:'5000 MO Inchiostro di Drago Antico', tip:'Pergamena Magica', desc:'Incantesimo di 6° livello a scelta dalla lista incantesimi di una classe del personaggio. DC 17 per chi non ha proficiency arcana.', costo:10000, vend:20000, dt:[40,27,20,16,14]},
        {n:'Pergamena — 7° Livello', prog:true, mp:'5000 MO Carta Arcana', ms:'7500 MO Inchiostro di Drago Antico', tip:'Pergamena Magica', desc:'Incantesimo di 7° livello a scelta dalla lista incantesimi di una classe del personaggio. DC 18 per chi non ha proficiency arcana.', costo:12500, vend:25000, dt:[50,34,25,20,17]},
        {n:'Pergamena — 8° Livello', prog:true, mp:'5000 MO Carta Arcana', ms:'10000 MO Inchiostro della Creazione', tip:'Pergamena Magica', desc:'Incantesimo di 8° livello a scelta dalla lista incantesimi di una classe del personaggio. DC 18 per chi non ha proficiency arcana.', costo:15000, vend:30000, dt:[60,40,30,24,20]},
        {n:'Pergamena — 9° Livello', prog:true, mp:'25000 MO Carta Primordiale', ms:'25000 MO Inchiostro della Creazione', tip:'Pergamena Magica', desc:'Incantesimo di 9° livello a scelta dalla lista incantesimi di una classe del personaggio. DC 19 per chi non ha proficiency arcana.', costo:50000, vend:100000, dt:[120,80,60,48,40]},
      ]},
    ],
    materialiSpeciali: [
      {nome:'Carta Comune e Inchiostro', rarity:'common', costo:'1–10 MO/dose', desc:'Carta di media qualità e inchiostro ordinario. Adatti per scritti non magici e opere di LV1 di base.', prop:[{k:'Provenienza',v:'Cartolai, mercati'},{k:'Usi',v:'Libri incantesimi, tattoo di base'}]},
      {nome:'Inchiostro Runato', rarity:'uncommon', costo:'30–100 MO/fiala', desc:'Inchiostro infuso di componenti magici — polvere di gemme, sangue di creature incantate, estratti di piante magiche. Conduce la magia quando applicato.', prop:[{k:'Conduzione magica',v:'Media'},{k:'Provenienza',v:'Arcanisti, botteghe specializzate'},{k:'Usi',v:'Tattoo LV2, Pergamene LV2-3'}]},
      {nome:'Carta Arcana / Pergamena', rarity:'rare', costo:'100–500 MO/foglio', desc:'Carta prodotta con fibre di piante magiche o pergamena di creature incantate. Trattiene gli incantesimi scritti per anni anziché mesi.', prop:[{k:'Durata incantesimo',v:'Anni anziché mesi'},{k:'Provenienza',v:'Artigiani specializzati, templi'},{k:'Usi',v:'Pergamene LV3-4, Grimori +2-3'}]},
      {nome:'Inchiostro di Drago', rarity:'very-rare', costo:'300–1000 MO/fiala', desc:'Inchiostro estratto dal fluido nel sistema circolatorio draconiano. Cambia colore in base al tipo di drago. Lega incantesimi di alto livello con precisione assoluta.', prop:[{k:'Provenienza',v:'Drago abbattuto (max 48h)'},{k:'Tipo',v:'Rosso=fuoco, Nero=acido, Bianco=gelo'},{k:'Usi',v:'Tattoo LV3-4, Pergamene LV4-5'}]},
      {nome:'Inchiostro della Creazione', rarity:'legendary', costo:'2000–10000 MO/fiala', desc:'Una sostanza primordiale che si dice sia residuo dell\'atto cosmico della Creazione stessa. Scrive da solo quando guidato da una mente sufficientemente potente. Permette tattoo di livello 6-9.', prop:[{k:'Provenienza',v:'Piani superiori, artefatti antichi'},{k:'Proprietà',v:'Scrive autonomamente se guidato'},{k:'Usi',v:'Tattoo LV6-9, Manifesto della Creazione'}]},
    ]
  },
  { id:'sarto', emoji:'🧵', nome:'Sarto', tagline:'Armature Leggere · Mantelli · Abiti Magici — eleganza intrecciata alla magia',
    desc:'Abiti, armature leggere e indumenti magici — l\'eleganza intrecciata alla magia.',
    materLav: [40,80,120,160,200],
    livelli: [
      { lv:1, items:[
        {n:'Armatura di Cuoio', mp:'5 MO Cuoio', ms:'—', tip:'Armatura Leggera', desc:'CA: 11+Dex.', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Armatura di Cuoio Borchiato', mp:'23 MO Cuoio', ms:'—', tip:'Armatura Leggera', desc:'CA: 12+Dex.', costo:23, vend:45, dt:[3,1,1,1,1]},
        {n:'Frusta', mp:'1 MO Cuoio', ms:'—', tip:'Arma Marziale', desc:'1d4 Slashing, Finesse, Reach. Mastery: Slow.', costo:1, vend:2, dt:[1,1,1,1,1]},
        {n:'Vestiti da Viaggio', mp:'1 MO Tessuto', ms:'—', tip:'Equipaggiamento', costo:1, vend:2, dt:[1,1,1,1,1]},
        {n:'Abiti Pregiati', mp:'7.5 MO Tessuto', ms:'—', tip:'Equipaggiamento', costo:7.5, vend:15, dt:[1,1,1,1,1]},
        {n:'Abiti Firmati', mp:'15 MO Tessuto', ms:'—', tip:'Equipaggiamento', desc:'Indossati dall\'alta società.', costo:15, vend:30, dt:[2,1,1,1,1]},
        {n:'Abiti Desertici', mp:'5 MO Tessuto', ms:'—', tip:'Equipaggiamento', desc:'Successo automatico ai TS contro caldo estremo.', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Abiti per Climi Freddi', mp:'5 MO Tessuto', ms:'—', tip:'Equipaggiamento', desc:'Successo automatico ai TS contro freddo estremo.', costo:5, vend:10, dt:[1,1,1,1,1]},
        {n:'Cloak of Billowing', mp:'40 MO Cuoio', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Cloak of Many Fashions', mp:'40 MO Cuoio', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Hat of Wizardry', mp:'40 MO Stoffa', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Boots of False Tracks', mp:'40 MO Cuoio', ms:'—', tip:'Comune', url:'https://5e.tools/', costo:40, vend:80, dt:[4,2,1,1,1]},
        {n:'Armatura di Placidium (Cuoio)', prog:true, mp:'×2 MO Cuoio', ms:'—', tip:'Armatura Leggera', desc:'Usa la Saggezza invece della Destrezza per la CA.', costo:2, vend:4, dt:[1,1,1,1,1]},
        {n:'Camuffamento Invernale',mp:'25 MO Tessuto',ms:'—',tip:'Equipaggiamento da avventura',desc:'While you wear Winter Camouflage in an appropriate environment, you have Advantage on Dexterity (Stealth) checks.',costo:25,vend:50,dt:[3,1,1,1,1]},
        {n:'Vesti calde antimicotiche',mp:'5 MO Tessuto',ms:'3 MO Funghi',tip:'Equipaggiamento da avventura',desc:'When you\'re wearing Warm Fungal Clothing, you automatically succeed on saving throws against the effects of extreme cold. See chapter 3 of the Dungeon Master\'s Guide for rules on extreme cold. One pound of fungus is sewn into Fungal Clothing. This fungus can be eaten as food. Once all the fungus is consumed, this becomes a mundane set of Traveler\'s Clothes.',costo:8,vend:15,dt:[1,1,1,1,1]},
        {n:'Vestiti da viaggio',mp:'1 MO Tessuto',ms:'—',tip:'Equipaggiamento da avventura',desc:'Traveler\'s Clothes are resilient garments designed for travel in various environments.',costo:1,vend:2,dt:[1,1,1,1,1]},
        {n:'Vestaglia',mp:'5 MA Tessuto',ms:'—',tip:'Equipaggiamento da avventura',desc:'A Robe has vocational or ceremonial significance. Some events and locations admit only people wearing a Robe bearing certain colors or symbols.',costo:0.5,vend:1,dt:[1,1,1,1,1]},
        {n:'Faretra',mp:'5 MA Cuoio',ms:'—',tip:'Equipaggiamento da avventura',desc:'A Quiver holds up to 20 Arrows.',costo:0.5,vend:1,dt:[1,1,1,1,1]},
        {n:'Tunica del Genio',mp:'25 MO Tessuto',ms:'—',tip:'Equipaggiamento da avventura',desc:'This robe appeals to Elementals associated with a particular Elemental Plane (Air, Earth, Fire, Water). While wearing a Genie Robe, you have Advantage on ability checks made to influence Elementals associated with that plane.',costo:25,vend:50,dt:[3,1,1,1,1]},
        {n:'Costume da Bagno',mp:'3 MO Tessuto',ms:'—',tip:'Equipaggiamento da avventura',desc:'Sono fatti un materiale molto elastico e che si asciuga piuttosto in fretta',costo:3,vend:6,dt:[1,1,1,1,1]},
        {n:'Borsa per Quadrelli',mp:'5 MA Tessuto',ms:'—',tip:'Equipaggiamento da avventura',desc:'A Crossbow Bolt Case holds up to 20 Bolts.',costo:0.5,vend:1,dt:[1,1,1,1,1]},
        {n:'Borsa per Componenti',mp:'13 MO Tessuto',ms:'—',tip:'Equipaggiamento da avventura',desc:'A Component Pouch is watertight and filled with compartments that hold all the free Material components of your spells.',costo:13,vend:25,dt:[2,1,1,1,1]},
        {n:'Abiti per climi freddi',mp:'5 MO Tessuto',ms:'—',tip:'Equipaggiamento da avventura',desc:'This outfit consists of a heavy fur coat or cloak over layers of wool clothing, as well as a fur-lined hat or hood, goggles, and fur-lined leather boots and gloves. As long as cold weather clothing remains dry, its wearer automatically succeeds on saving throws against the effects of extreme cold.',costo:5,vend:10,dt:[1,1,1,1,1]},
        {n:'Armor of Gleaming',mp:'40 MO Cuoio',ms:'Armatura da incantare',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#armor%20of%20gleaming_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Cast-Off Armor',mp:'40 MO Cuoio',ms:'Armatura da incantare',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#cast-off%20armor_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Clothes of Mending',mp:'40 MO Tessuto',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#clothes%20of%20mending_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Common Glamerweave',mp:'40 MO Tessuto',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#common%20glamerweave_erlw',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Hat of Vermin',mp:'40 MO Cuoio',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#hat%20of%20vermin_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Heward\'s Handy Spice Pouch',mp:'40 MO Tessuto',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#heward%27s%20handy%20spice%20pouch_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Rope of Mending',mp:'40 MO Canapa',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#rope%20of%20mending_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Shiftweave',mp:'20 MO Metallo',ms:'20 MO Tessuto',tip:'Oggetto Magico Comune',desc:'Shiftweave',url:'https://5e.tools/items.html#shiftweave_erlw',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Smoldering Armor',mp:'40 MO Cuoio',ms:'Armatura da incantare',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#smoldering%20armor_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Talking Doll',mp:'40 MO Stoffa',ms:'—',tip:'Oggetto Magico Comune',url:'https://5e.tools/items.html#talking%20doll_xdmg',costo:40,vend:80,dt:[4,2,1,1,1]},
        {n:'Fionda ',mp:'5 MR Cuoio',ms:'—',tip:'Arma Semplice a Distanza',desc:'1d4 Bludgeoning Ammunition (Range 30/120 ft.; Sling Bullet) Mastery: Slow',costo:0.05,vend:0.1,dt:[1,1,1,1,1]},
        {n:'Mimetismo Mostruoso',mp:'25 MO Pelle',ms:'—',tip:'Equipaggiamento da avventura',desc:'A suit of Monster Camouflage looks like a Beast or Monstrosity, such as an owlbear. To discern that you\'re disguised, a creature must take the Study action to inspect your appearance and succeed on a DC 10 Intelligence (Investigation or Nature) check. The creature has Advantage on this check if it is within 30 feet of you and automatically succeeds on this check if you do anything the monster you\'re disguised as couldn\'t do.',costo:25,vend:50,dt:[3,1,1,1,1]},
        {n:'Abito di luce e ombra',mp:'25 MO Stoffa',ms:'—',tip:'Equipaggiamento da avventura',desc:'This garb appeals to Fey from one Domain of Delight, such as the Gloaming Court or the Summer Court. While wearing the garb, you have Advantage on ability checks to influence Fey associated with that Domain of Delight.',costo:25,vend:50,dt:[3,1,1,1,1]},
      ]},
      { lv:2, items:[
        {n:'Bag of Holding', mp:'200 MO Tessuto', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Bag of Tricks', mp:'200 MO Tessuto', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Boots of Elvenkind', mp:'200 MO Cuoio', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Boots of Striding and Springing', mp:'200 MO Cuoio', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Bracers of Archery', mp:'200 MO Cuoio', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Cloak of Elvenkind', mp:'200 MO Tessuto', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Cloak of Protection', mp:'200 MO Tessuto', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Gloves of Thievery', mp:'200 MO Tessuto', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Hat of Disguise', mp:'200 MO Stoffa', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Quiver of Ehlonna', mp:'200 MO Cuoio', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Winged Boots', mp:'200 MO Cuoio', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Dragonhide Belt +1', mp:'200 MO Pelle', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
        {n:'Wraps of Unarmed Power +1', mp:'200 MO Tessuto', ms:'—', tip:'Non Comune', url:'https://5e.tools/', costo:200, vend:400, dt:[8,2,1,1]},
      
        {n:'Balloon Pack',mp:'200 MO Tessuto',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#balloon%20pack_pota',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Boots of the Vigilant',prog:true,mp:'200 MO Cuoio',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#boots%20of%20the%20vigilant_taldoreicampaignsettingreborn',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Boots of the Winterlands',prog:true,mp:'200 MO Cuoio',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#boots%20of%20the%20winterlands_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Cap of Water Breathing',mp:'200 MO Cuoio',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#cap%20of%20water%20breathing_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Cloak of Spines',prog:true,mp:'200 MO Tessuto',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#cloak%20of%20spines_humblewoodtales',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Cloak of the Manta Ray',prog:true,mp:'200 MO Tessuto',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#cloak%20of%20the%20manta%20ray_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Enspelled Armor (Cantrip)',prog:true,mp:'200 MO Metallo',ms:'Armatura da incantare',tip:'Armatura',url:'https://5e.tools/items.html#enspelled%20armor%20(cantrip)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Enspelled Armor (Level 1)',prog:true,mp:'200 MO Metallo',ms:'Armatura da incantare',tip:'Armatura',url:'https://5e.tools/items.html#enspelled%20armor%20(level%201)_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Gloves of Missile Snaring',prog:true,mp:'200 MO Cuoio',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#gloves%20of%20missile%20snaring_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Gloves of Swimming and Climbing',mp:'200 MO Pelle',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#gloves%20of%20swimming%20and%20climbing_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Mariner\'s Armor',mp:'200 MO Cuoio',ms:'Armatura da incantare',tip:'Armatura',url:'https://5e.tools/items.html#mariner%27s%20armor_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Nature\'s Mantle',prog:true,mp:'200 MO Tessuto',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#nature%27s%20mantle_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Robe of Useful Items',prog:true,mp:'200 MO Tessuto',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#robe%20of%20useful%20items_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Saddle of the Cavalier',mp:'200 MO Cuoio',ms:'—',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#saddle%20of%20the%20cavalier_xdmg',costo:200,vend:400,dt:[8,2,1,1]},
        {n:'Uncommon Glamerweave',mp:'100 MO Metallo',ms:'100 MO Tessuto',tip:'Oggetto Magico Non Comune',url:'https://5e.tools/items.html#uncommon%20glamerweave_erlw',costo:200,vend:400,dt:[8,2,1,1]},
      ]},
      { lv:3, items:[
        {n:'Armatura di Cuoio +2', mp:'600 MO Cuoio di Drago', ms:'—', tip:'Armatura Leggera Rara', url:'https://5e.tools/', costo:600, vend:1500, dt:[8,3,1]},
        {n:'Cloak of Displacement', prog:true, mp:'600 MO Tessuto del Piano Etereo', ms:'400 MO Fili di Illusione', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Mantle of Spell Resistance', prog:true, mp:'700 MO Tessuto Anti-Magia', ms:'300 MO Fili di Mithral', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Robe of Eyes', prog:true, mp:'800 MO Tessuto di Ragno Fantasma', ms:'200 MO Occhi di Beholder', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Bracers of Defense', prog:true, mp:'700 MO Cuoio Adamantino', ms:'300 MO Rune di Protezione', tip:'Raro', url:'https://5e.tools/', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Armatura da Infiltrato di Zaun', prog:true, mp:'500 MO Pelle di Ombra Viva', ms:'500 MO Chemtech Flessibile', tip:'Armatura Leggera Rara', desc:'Cuoio +1, no svantaggio Furtività. 1/giorno: Invisibile fino a fine prossimo turno (azione bonus).', costo:1000, vend:2000, dt:[8,3,1]},
        {n:'Abito della Corte di Demacia', prog:true, mp:'600 MO Seta Nobile di Demacia', ms:'400 MO Petricite Intrecciato', tip:'Equipaggiamento Raro — Sociale', desc:'+2 Persuasione e Inganno con nobili/autorità. Come armatura: CA 11+Dex.', costo:1000, vend:2000, dt:[8,3,1]},
      ]},
      { lv:4, items:[
        {n:'Robe of the Archmagi', prog:true, mp:'3000 MO Tessuto Astrale', ms:'2000 MO Rune di Potere Supremo', tip:'Leggendario', url:'https://5e.tools/', costo:5000, vend:10000, dt:[20,5]},
        {n:'Cloak of Invisibility', prog:true, mp:'3500 MO Tessuto Etereo', ms:'1500 MO Fili di Ombra Pura', tip:'Leggendario', url:'https://5e.tools/', costo:5000, vend:10000, dt:[20,5]},
        {n:'Armor of Invulnerability (Cuoio)', prog:true, mp:'2500 MO Dragonhide Adamantino', ms:'2500 MO Rune Primordiali', tip:'Armatura Leggera Very Rare', desc:'Cuoio +3, Resistenza ai danni non magici. 1/giorno: Immunità danni non magici per 10 min.', costo:5000, vend:10000, dt:[18,5]},
        {n:'Mantello del Signore delle Ombre', prog:true, mp:'2500 MO Tessuto del Piano delle Ombre', ms:'2500 MO Piume di Corvo di Mordekaiser', tip:'Very Rare', desc:'Non sei mai sorpreso. Vantaggio a Furtività e Inganno. 1/giorno: Forma Gassosa (no concentrazione, 1 min).', costo:5000, vend:10000, dt:[18,5]},
      ]},
      { lv:5, items:[
        {n:'Robe of the Archmagi Potenziata', prog:true, mp:'8000 MO Tessuto del Nexus Primordiale', ms:'2000 MO Stelle Intessute', tip:'Leggendario', url:'https://5e.tools/', costo:10000, vend:20000, dt:[40]},
        {n:'Tessuto del Fato (Unico)', prog:true, mp:"8000 MO Fili dell'Arazzo del Destino", ms:'2000 MO Ago di Zilean', tip:'Leggendario — Unico', desc:'3/giorno: rilanciare qualsiasi tiro prima di conoscerne l\'esito. 1/settimana: lancia Desiderio senza slot.', costo:10000, vend:20000, dt:[40]},
        {n:"Armatura dell'Aspetto del Nexus", prog:true, mp:'7000 MO Cristallo di Nexus Tessuto', ms:'3000 MO Essenza degli Aspetti di Targon', tip:'Armatura Leggera Leggendaria', desc:'Cuoio +3, immunità fulmine e radiante, volo 60ft. 1/giorno: Nova di Luce 6m raggio, 10d10 radiante DC 20.', costo:10000, vend:20000, dt:[40]},
      ]},
    ],
    materialiSpeciali: [
      {nome:'Tessuto Comune e Cuoio', rarity:'common', costo:'1–8 MO/m²', desc:'Lino, cotone, lana, cuoio bovino. Materiali base per qualsiasi abito o armatura di livello 1.', prop:[{k:'Provenienza',v:'Conciatori, tessitori'},{k:'Usi',v:'Armature LV1, abiti'}]},
      {nome:'Seta Pregiata', rarity:'uncommon', costo:'20–60 MO/m²', desc:'Seta proveniente da bachi selvatici o di Shurima. Leggera, resistente e particolarmente adatta a trattenere piccole quantità di magia. Usata per mantelli magici non comuni.', prop:[{k:'Provenienza',v:'Shurima, Ionia'},{k:'Proprietà',v:'Trattiene lievemente la magia'},{k:'Usi',v:'Mantelli LV2, abiti sociali'}]},
      {nome:'Cuoio di Drago', rarity:'rare', costo:'200–600 MO/m²', desc:'Pelle conciata di drago. Naturalmente resistente agli elementi che rappresentavano il drago (fuoco, gelo, ecc.). Richiede conciatura specializzata con acidi.', prop:[{k:'Provenienza',v:'Cacciatori di draghi'},{k:'Resistenza',v:'Elemento del drago al 50%'},{k:'Usi',v:'Armatura di Cuoio +2, oggetti LV3'}]},
      {nome:'Tessuto del Piano Etereo', rarity:'very-rare', costo:'400–1200 MO/m²', desc:'Stoffa intessuta con fili di essenza eterea. Semi-trasparente e leggermente luminosa. Permette a chi la indossa di sfumare nell\'etere per frazioni di secondo, creando uno spostamento visivo.', prop:[{k:'Provenienza',v:'Piano Etereo, Incantatori specializzati'},{k:'Proprietà',v:'Creazione dello spostamento visivo'},{k:'Usi',v:'Cloak of Displacement, Cloak of Invisibility'}]},
      {nome:'Tessuto Astrale', rarity:'legendary', costo:'1000–5000 MO/m²', desc:'Tessuto estratto direttamente dal piano astrale durante la piena luna. Riflette le stelle, non brucia, non marcisce e respinge la magia di 5° livello o inferiore come scala naturale.', prop:[{k:'Provenienza',v:'Piano Astrale'},{k:'Proprietà',v:'Resistenza magica integrata, non deperisce'},{k:'Usi',v:'Robe of the Archmagi'}]},
      {nome:"Fili dell'Arazzo del Destino", rarity:'legendary', costo:'2000–8000 MO/filo', desc:"Fili estratti dall'arazzo del destino tessuto dalle Norne cosmiche. Ciascun filo rappresenta una vita. Intrecciati in un indumento, permettono di manipolare il destino stesso.", prop:[{k:'Provenienza',v:'Norne cosmiche, praticamente inaccessibili'},{k:'Proprietà',v:'Manipolazione del destino'},{k:'Usi',v:'Tessuto del Fato'}]},
    ]
  },
  { id:'meccanico', emoji:'⚙️', nome:'Meccanico', tagline:'Congegni · Automi · Modifiche · Orologi — la precisione come arte',
    desc:'Orologi di precisione, congegni meccanici, protesi e automi — l\'ingegno al servizio dell\'officina.',
    patente:'P.M.T.',
    materLav: [15,40,150,600,1000],
    livelli: [
      { lv:1, items:[
        {n:'Orologio da Tasca', mp:'20 MO Ingranaggi di Ottone', ms:'10 MO Molle di Acciaio', tip:'Equipaggiamento', desc:'Segna l\'ora con precisione. Vantaggio ai tiri di Sopravvivenza per stimare il tempo.', costo:30, vend:60, dt:[3,1,1,1,1]},
        {n:'Trappola a Scatto', mp:'10 MO Ferro', ms:'5 MO Molla d\'Acciaio', tip:'Equipaggiamento', desc:'Immobilizza: DC 13 FOR o Restrained. 1d4 perforante all\'attivazione.', costo:15, vend:30, dt:[2,1,1,1,1]},
        {n:'Lanterna a Ingranaggi', mp:'15 MO Ottone', ms:'10 MO Cristallo Trasparente', tip:'Equipaggiamento', desc:'Funziona senza olio: 8h di luce su area 9m. Ricaricabile con 1 DT.', costo:25, vend:50, dt:[3,1,1,1,1]},
        {n:'Grimaldello di Precisione', mp:'8 MO Filo d\'Acciaio', ms:'4 MO Olio Lubrificante', tip:'Equipaggiamento', desc:'+2 ai tiri per scassinare serrature meccaniche.', costo:12, vend:24, dt:[1,1,1,1,1]},
        {n:'Carrucola Meccanica', mp:'12 MO Ferro', ms:'6 MO Corda Rinforzata', tip:'Equipaggiamento', desc:'Riduce il peso percepito per sollevamento: conta metà del peso.', costo:18, vend:36, dt:[2,1,1,1,1]},
        {n:'Fischietto a Frequenze', mp:'8 MO Ottone', ms:'4 MO Cristallo Risonante', tip:'Equipaggiamento', desc:'Richiama animali addestrati o segnala alla distanza di 300m.', costo:12, vend:24, dt:[1,1,1,1,1]},
        {n:'Molla a Ricarica (kit da 10)', mp:'6 MO Acciaio', ms:'2 MO Lubrificante', tip:'Equipaggiamento', desc:'Componente standard per riparazioni e costruzioni meccaniche di LV1.', costo:8, vend:16, dt:[1,1,1,1,1]},
      ]},
      { lv:2, items:[
        {n:'Protesi Meccanica (arto)', mp:'80 MO Acciaio', ms:'40 MO Ingranaggi di Precisione', tip:'Equipaggiamento', desc:'Sostituisce un arto perso. Funzionale come l\'originale. Richiede 1 DT/mese manutenzione.', costo:120, vend:240, dt:[5,2,2,2,1]},
        {n:'Balestra a Ripetizione', mp:'60 MO Acciaio', ms:'40 MO Meccanismo a Molla', tip:'Arma', desc:'Carica 3 dardi automaticamente. Azione bonus per sparare il secondo dardo.', costo:100, vend:200, dt:[4,2,1,1,1]},
        {n:'Armatura Rinforzata', mp:'70 MO Piastre d\'Acciaio', ms:'30 MO Rivetti di Ferro', tip:'Equipaggiamento', desc:'Aggiunge +1 CA a un\'armatura già esistente. Questa piastra rinforzata è limitata a 10 sessioni di combattimento (Il suo uso deve essere dichiarato a inizio sessione e questo effetto non è cumulabile)', costo:100, vend:200, dt:[4,2,1,1,1]},
        {n:'Congegno Esplosivo (3 cariche)', mp:'50 MO Polvere Nera', ms:'50 MO Carcassa di Rame', tip:'Equipaggiamento', desc:'Innesco ritardato (1–4 turni). 3d6 fuoco in area 3m, DC 14 DEX dimezza.', costo:100, vend:200, dt:[4,2,1,1,1]},
        {n:'Gancio Retrattile', mp:'60 MO Acciaio', ms:'40 MO Cavo d\'Acciaio (15m)', tip:'Equipaggiamento', desc:'Spara e aggancia superfici entro 15m. Supporta 200kg. Velocità raddoppiata per arrampicata.', costo:100, vend:200, dt:[4,2,1,1,1]},
        {n:'Orologio da Muro (pendolo)', mp:'90 MO Ottone e Cristallo', ms:'50 MO Meccanismo a Pesi', tip:'Equipaggiamento — Arredamento', desc:'Oggetto pregiato. Preciso al minuto. Valore decorativo per ambienti nobiliari.', costo:140, vend:280, dt:[5,2,1,1,1]},
        {n:'Meccanismo di Difesa (fisso)', mp:'80 MO Ferro', ms:'50 MO Lame a Molla', tip:'Equipaggiamento', desc:'Installabile in una stanza. Attacca chi entra senza codice: +5 colpire, 1d10 perforante.', costo:130, vend:260, dt:[5,2,1,1,1]},
      ]},
      { lv:3, items:[
        {n:'Clockwork Amulet', mp:'200 MO Ingranaggi d\'Oro', ms:'100 MO Cristallo Arcano', tip:'Oggetto Magico Comune', url:'https://5e.tools/items.html#clockwork%20amulet_xge', desc:'1/giorno: ottieni 10 su un tiro d\'attacco invece di tirare il dado.', costo:300, vend:600, dt:[5,3,2,1,1]},
        {n:'Automa da Ricognizione (Tiny)', prog:true, mp:'250 MO Acciaio e Ottone', ms:'150 MO Cristallo Hextech Grado I', tip:'Oggetto Magico Comune', desc:'Automa volante Tiny. CA 12, 5 PF. Trasmette visione al costruttore entro 60m. 8h autonomia.', costo:400, vend:800, dt:[6,3,2,1,1]},
        {n:'Manifold Tool', mp:'150 MO Metallo Lavorato', ms:'100 MO Ingranaggi Speciali', tip:'Oggetto Magico Comune', url:'https://5e.tools/items.html#manifold%20tool_llk', desc:'Strumento multiuso che si adatta a qualsiasi kit di strumenti artigianali.', costo:250, vend:500, dt:[5,2,2,1,1]},
        {n:'Modifica Arma: Lama Vibrante', prog:true, mp:'200 MO Cristallo Risonante', ms:'150 MO Meccanismo Integrato', tip:'Oggetto Magico Comune', desc:'Modifica su spada/ascia: +1 ai danni (la lama vibra ad alta frequenza). Richiede 1 DT/mese manutenzione.', costo:350, vend:700, dt:[6,3,2,1,1]},
        {n:'Scudo a Deflettore', prog:true, mp:'180 MO Acciaio Trattato', ms:'120 MO Molle Arcane', tip:'Oggetto Magico Comune', desc:'Scudo con meccanismo: reazione per +2 CA contro un attacco/turno.', costo:300, vend:600, dt:[5,3,2,1,1]},
      ]},
      { lv:4, items:[
        {n:'Automa da Combattimento (Small)', prog:true, mp:'1000 MO Acciaio di Noxus', ms:'500 MO Cristallo Hextech Grado II', tip:'Oggetto Magico Non Comune', desc:'Automa Small. CA 14, 30 PF. Attacca su comando: +5 colpire, 1d8+2 perforante. 12h autonomia.', costo:1500, vend:3000, dt:[10,5,3,2]},
        {n:'Esoscheletro (modifica armatura)', prog:true, mp:'800 MO Acciaio Lavorato', ms:'700 MO Pistoni Idraulici', tip:'Oggetto Magico Non Comune', desc:'Modifica su armatura pesante: FOR considerata 20 per capacità di carico, +5ft velocità in armatura pesante.', costo:1500, vend:3000, dt:[10,5,3,2]},
        {n:'Orologio Dimensionale', prog:true, mp:'900 MO Cristallo Temporale', ms:'600 MO Ingranaggi del Piano Etereo', tip:'Oggetto Magico Non Comune', desc:'1/giorno: ferma il tempo soggettivo per 1 round (come Haste, senza concentrazione).', costo:1500, vend:3000, dt:[10,5,3,2]},
        {n:'Modifica Arma: Cannone a Vapore', prog:true, mp:'700 MO Ottone Rinforzato', ms:'800 MO Caldaia Miniaturizzata', tip:'Oggetto Magico Non Comune', desc:'Modifica su arma a distanza: gittata raddoppiata, +1d6 fuoco ai danni, ricarica dopo ogni round.', costo:1500, vend:3000, dt:[10,5,3,2]},
        {n:'Protesi Arcano-Meccanica', prog:true, mp:'600 MO Mithral', ms:'900 MO Cristallo Hextech + Fili d\'Oro', tip:'Oggetto Magico Non Comune', desc:'Protesi avanzata: +1 ai tiri per colpire con quell\'arto, può lanciare Mage Hand 3/giorno (non richiede slot).', costo:1500, vend:3000, dt:[10,5,3,2]},
      ]},
      { lv:5, items:[
        {n:'Automa Guardiano (Medium)', prog:true, mp:'4000 MO Adamantio', ms:'3000 MO Nucleo Hextech Puro', tip:'Oggetto Magico Raro', desc:'Automa Medium senziente. CA 17, 80 PF, +8 colpire, 2d10+5 perforante. Parla Comune. Agisce autonomamente in difesa del creatore.', costo:7000, vend:14000, dt:[25,15,10]},
        {n:'Macchina del Tempo (1 uso)', prog:true, mp:'5000 MO Cristallo Zilean Antico', ms:'5000 MO Frammenti del Filo del Tempo', tip:'Oggetto Magico Raro — Unico', desc:'1 uso: torna indietro di fino a 10 minuti nel tempo. Solo il creatore ricorda gli eventi. Si distrugge dopo l\'uso.', costo:10000, vend:20000, dt:[40]},
        {n:'Fortezza Tascabile', prog:true, mp:'4000 MO Acciaio di Noxus', ms:'3000 MO Ingranaggi del Piano Etereo', tip:'Oggetto Magico Raro', url:'https://5e.tools/items.html#instant%20fortress_dmg', desc:'Versione meccanica dell\'Instant Fortress: torre d\'acciaio 3x3x9m. Deployabile come azione. CA 20, 200 PF.', costo:7000, vend:14000, dt:[30,18,12]},
        {n:'Nucleo Automa Leggendario', prog:true, mp:'6000 MO Adamantio Purissimo', ms:'4000 MO Essenza del Costrutto', tip:'Oggetto Magico Raro', desc:'Nucleo per automa Large o superiore. L\'automa ha INT 10, può imparare 3 lingue e 2 competenze nei strumenti.', costo:10000, vend:20000, dt:[35,20]},
      ]},
    ],
    materialiSpeciali: [
      {nome:'Ingranaggi di Ottone', rarity:'common', costo:'2–8 MO/set', desc:'Ingranaggi di precisione in ottone, prodotti a Piltover. Usati per meccanismi di base e orologi di primo livello.', prop:[{k:'Provenienza',v:'Officine di Piltover, mercati'},{k:'Usi',v:'Meccanismi LV1-2'},{k:'Durabilità',v:'5 anni senza manutenzione'}]},
      {nome:'Molle d\'Acciaio', rarity:'common', costo:'3–10 MO/set', desc:'Molle temprinate in acciaio ad alto carbonio. Fondamentali per meccanismi a scatto, trappole e congegni portabili.', prop:[{k:'Provenienza',v:'Fabbri, Metallurghi'},{k:'Usi',v:'Trappole, bilanciamento orologi LV1-2'},{k:'Tensione',v:'Fino a 50kg di forza'}]},
      {nome:'Cristallo Hextech Grado I', rarity:'uncommon', costo:'30–80 MO/frammento', desc:'Frammenti di cristallo Hextech sufficienti per alimentare congegni di piccole dimensioni. Richiede P.M.T. per l\'acquisto.', prop:[{k:'Provenienza',v:'Piltover, commercio regolamentato'},{k:'Usi',v:'Automi LV3, modifiche magiche'},{k:'Autonomia',v:'8–12h per frammento'}]},
      {nome:'Acciaio di Noxus', rarity:'rare', costo:'80–200 MO/lingotto', desc:'Lega metallica sviluppata dalle fonderie di Noxus. Resistenza eccezionale e lavorabilità superiore all\'acciaio comune. Richiede forgia specializzata.', prop:[{k:'Provenienza',v:'Fonderie di Noxus, commercio militare'},{k:'Resistenza',v:'+20% rispetto ad acciaio comune'},{k:'Usi',v:'Automi LV4, esoscheletri, armature avanzate'}]},
      {nome:'Cristallo Hextech Grado II', rarity:'rare', costo:'200–600 MO/frammento', desc:'Cristallo Hextech di alta purezza, sufficiente per alimentare automi da combattimento e modifiche arcano-meccaniche permanenti.', prop:[{k:'Provenienza',v:'Laboratori certificati Piltover'},{k:'Usi',v:'Automi LV4, modifiche Non Comuni'},{k:'Autonomia',v:'48h per frammento'}]},
      {nome:'Adamantio', rarity:'very-rare', costo:'500–2000 MO/lingotto', desc:'Il metallo più duro conosciuto. Quasi indistruttibile e capace di contenere energie magiche intense senza degradarsi. Richiede forgia a temperature estreme.', prop:[{k:'Provenienza',v:'Miniere profonde, bottino di guerra'},{k:'Proprietà',v:'Immunità ai danni critici strutturali'},{k:'Usi',v:'Automi LV5, Fortezza Tascabile'}]},
      {nome:'Cristallo Zilean Antico', rarity:'legendary', costo:'2000–8000 MO/cristallo', desc:'Cristalli impregnati dell\'energia temporale di Zilean il Custode del Tempo. Estremamente rari e instabili. Permettono di manipolare il tessuto temporale nei congegni.', prop:[{k:'Provenienza',v:'Praticamente inaccessibili, solo da Zilean o sue reliquie'},{k:'Proprietà',v:'Manipolazione temporale'},{k:'Usi',v:'Orologio Dimensionale LV4, Macchina del Tempo LV5'}]},
    ]
  },
]

// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════

var _cmpCurrentMestiere = -1;
var _cmpCurrentSection = 'intro';
var _cmpSearchQ = '';

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function _cmpFmtMO(v) {
  if (v === undefined || v === null) return '—';
  var n = parseFloat(v);
  if (isNaN(n)) return v;
  if (n < 1) return (n * 100).toFixed(0) + ' MR';
  if (n >= 10000) return (n/1000).toFixed(0) + 'k MO';
  if (n >= 1000) return n.toLocaleString('it') + ' MO';
  return n % 1 === 0 ? n + ' MO' : n.toFixed(2) + ' MO';
}

function _cmpTipBadge(t) {
  var tl = (t||'').toLowerCase();
  var cls='cmp-b-other';
  if (tl.indexOf('common') > -1 && tl.indexOf('un') === -1) cls='cmp-b-common';
  else if (tl.indexOf('uncommon') > -1 || tl.indexOf('non comune') > -1) cls='cmp-b-uncommon';
  else if (tl.indexOf('very rare') > -1 || tl.indexOf('very-rare') > -1) cls='cmp-b-veryrare';
  else if (tl.indexOf('rare') > -1 || tl.indexOf('raro') > -1 || tl.indexOf('rara') > -1) cls='cmp-b-rare';
  else if (tl.indexOf('legendary') > -1 || tl.indexOf('leggendario') > -1) cls='cmp-b-legendary';
  return '<span class="cmp-badge ' + cls + '">' + (t||'—') + '</span>';
}

function _cmpDtClass(v,i) {
  if(i===0) return 'cmp-dt-1';
  if(i===1) return 'cmp-dt-2';
  if(i===2) return 'cmp-dt-3';
  if(i===3) return 'cmp-dt-4';
  return 'cmp-dt-5';
}

function _cmpMatRarBadge(r){
  var m={common:'cmp-b-common',uncommon:'cmp-b-uncommon',rare:'cmp-b-rare','very-rare':'cmp-b-veryrare',legendary:'cmp-b-legendary'};
  var l={common:'Comune',uncommon:'Non Comune',rare:'Raro','very-rare':'Very Rare',legendary:'Leggendario'};
  return '<span class="cmp-badge ' + (m[r]||'cmp-b-other') + '">' + (l[r]||r) + '</span>';
}

function _cmpMatches(item, q) {
  if (!q) return true;
  var ql = q.toLowerCase();
  return [item.n, item.mp, item.ms, item.tip, item.desc]
    .filter(function(s){return s;})
    .some(function(s){return s.toLowerCase().indexOf(ql) > -1;});
}

// ═══════════════════════════════════════════════════════════════
//  MOBILE DRAWER
// ═══════════════════════════════════════════════════════════════

function _cmpDrawerEscHandler(e) {
  if (e.key === 'Escape') _cmpCloseDrawer();
}

function _cmpOpenDrawer() {
  var d = document.getElementById('cmp-mobile-drawer');
  var o = document.getElementById('cmp-drawer-overlay');
  if (d) d.classList.add('open');
  if (o) o.classList.add('open');
  document.body.classList.add('drawer-open');
  document.addEventListener('keydown', _cmpDrawerEscHandler);
}

function _cmpCloseDrawer() {
  var d = document.getElementById('cmp-mobile-drawer');
  var o = document.getElementById('cmp-drawer-overlay');
  if (d) d.classList.remove('open');
  if (o) o.classList.remove('open');
  document.body.classList.remove('drawer-open');
  document.removeEventListener('keydown', _cmpDrawerEscHandler);
}

function _cmpSyncMobileDrawer() {
  var desktopNav = document.getElementById('cmp-sidenav');
  var mobileNav = document.getElementById('cmp-mobile-drawer-nav');
  if (mobileNav && desktopNav) mobileNav.innerHTML = desktopNav.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
//  RENDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function _cmpRenderTabs() {
  var el = document.getElementById('cmp-tabs');
  if (!el) return;
  var guideActive = _cmpCurrentMestiere === -1;
  var html = '<button class="cmp-tab' + (guideActive ? ' active' : '') + '" onclick="_cmpSetGuide()">📖 Guida ai Mestieri</button>';
  html += '<div class="cmp-tab-sep"></div>';
  for (var i = 0; i < _CMP_MESTIERI.length; i++) {
    var m = _CMP_MESTIERI[i];
    html += '<button class="cmp-tab' + (i === _cmpCurrentMestiere ? ' active' : '') + '" onclick="_cmpSetMestiere(' + i + ')">' + m.emoji + ' ' + m.nome + '</button>';
  }
  el.innerHTML = html;
}

function _cmpRenderSideNav() {
  var el = document.getElementById('cmp-sidenav');
  if (!el) return;
  if (_cmpCurrentMestiere === -1) { el.innerHTML = ''; return; }
  var m = _CMP_MESTIERI[_cmpCurrentMestiere];
  var html = '<div class="cmp-sidenav-title">Sezioni</div>';
  html += '<button class="cmp-sidenav-btn' + (_cmpCurrentSection === 'intro' ? ' active' : '') + '" onclick="_cmpSetSection(\'intro\')">📖 Introduzione</button>';
  for (var j = 0; j < m.livelli.length; j++) {
    var lv = m.livelli[j];
    var key = 'lv' + lv.lv;
    html += '<button class="cmp-sidenav-btn' + (_cmpCurrentSection === key ? ' active' : '') + '" onclick="_cmpSetSection(\'' + key + '\')">⬟ Livello ' + lv.lv + '</button>';
  }
  if (m.id === 'artista') {
    html += '<button class="cmp-sidenav-btn' + (_cmpCurrentSection === 'pergamene' ? ' active' : '') + '" onclick="_cmpSetSection(\'pergamene\')">📜 Pergamene Magiche</button>';
  }
  html += '<button class="cmp-sidenav-btn' + (_cmpCurrentSection === 'mat' ? ' active' : '') + '" onclick="_cmpSetSection(\'mat\')">💎 Materiali Speciali</button>';
  el.innerHTML = html;
}

function _cmpRenderContent() {
  var m = _cmpCurrentMestiere >= 0 ? _CMP_MESTIERI[_cmpCurrentMestiere] : null;
  var el = document.getElementById('cmp-content');
  if (!el) return;
  var html = '';
  if (_cmpCurrentMestiere === -1) {
    html += _cmpRenderGuide();
  } else if (_cmpSearchQ) {
    html += _cmpRenderSearch(m);
  } else if (_cmpCurrentSection === 'intro') {
    html += _cmpRenderIntro(m);
  } else if (_cmpCurrentSection === 'pergamene' && m && m.id === 'artista') {
    html += _cmpRenderPergamene();
  } else if (_cmpCurrentSection === 'mat') {
    html += _cmpRenderMat(m);
  } else {
    var lvNum = parseInt(_cmpCurrentSection.replace('lv',''));
    var lv = null;
    for (var j = 0; j < m.livelli.length; j++) {
      if (m.livelli[j].lv === lvNum) { lv = m.livelli[j]; break; }
    }
    if (lv) html += _cmpRenderLv(m, lv);
  }
  el.innerHTML = html;
}

function _cmpRenderIntro(m) {
  var LV_LABELS = ['LV1+','LV2+','LV3+','LV4+','LV5+'];
  var html = '';
  if (m.id === 'meccanico') {
    html += '<div class="cmp-wip-banner"><span class="wip-icon">🚧</span><div><strong>Work In Progress</strong><p>Gli oggetti presenti potrebbero essere rimossi o subire modifiche.</p></div></div>';
  }
  html += '<div class="cmp-intro-card">';
  html += '<h2>' + m.emoji + ' ' + m.nome;
  if (m.patente) {
    html += ' <span style="font-size:.6em;font-weight:400;background:rgba(90,138,216,.15);color:rgba(80,200,80,.8);border:1px solid rgba(90,138,216,.3);padding:3px 10px;border-radius:12px;vertical-align:middle;letter-spacing:.08em">' + m.patente + '</span>';
  }
  html += '</h2>';
  html += '<p class="tagline">' + m.tagline + '</p>';
  html += '<p style="color:rgba(220,200,160,.7);font-size:15px;margin-bottom:12px">' + m.desc + '</p>';
  html += '<div class="cmp-rules-grid">';
  html += '<div class="cmp-rule-box"><h4>📈 Livello Personaggio → Mestiere</h4><ul>';
  html += '<li>PG LV 1 → Mestiere LV 1</li>';
  html += '<li>PG LV 5 → Mestiere LV 2</li>';
  html += '<li>PG LV 9 → Mestiere LV 3</li>';
  html += '<li>PG LV 13 → Mestiere LV 4</li>';
  html += '<li>PG LV 17 → Mestiere LV 5</li>';
  html += '</ul></div>';
  html += '<div class="cmp-rule-box"><h4>⏱️ Materiale Lavorabile per DT</h4><ul>';
  for (var i = 0; i < m.materLav.length; i++) {
    html += '<li>LV ' + (i+1) + ': <strong style="color:rgba(200,155,60,.9)">' + m.materLav[i] + ' MO</strong> a Downtime</li>';
  }
  html += '</ul></div>';
  html += '<div class="cmp-rule-box"><h4>📚 Imparare un Progetto</h4><p>Richiede lo stesso tempo e monete d’oro pari ai materiali necessari per la creazione dell’oggetto.</p></div>';
  html += '<div class="cmp-rule-box"><h4>🤝 Collaborazione</h4><p>Consentita fino a <strong style="color:rgba(200,155,60,.9)">3 persone</strong> per oggetto.</p></div>';
  html += '<div class="cmp-rule-box"><h4>⬆️ Aumentare di Livello</h4><p>Solo tramite corso da NPC o giocatori del livello desiderato.</p></div>';
  html += '</div></div>';
  html += '<div class="cmp-ornament">· · · ⚜ · · ·</div>';
  html += '<p style="color:rgba(200,155,60,.35);font-style:italic;margin-bottom:20px;font-family:&quot;Crimson Pro&quot;,serif;font-size:15px">Seleziona un livello nella barra laterale per visualizzare gli oggetti craftabili, oppure consulta i Materiali Speciali in fondo.</p>';
  return html;
}

function _cmpRenderLv(m, lv) {
  var dtHeaders = [];
  for(var i = lv.lv - 1; i < 5; i++) dtHeaders.push('LV' + (i+1) + '+');
  var items = lv.items.filter(function(it) { return !_cmpSearchQ || _cmpMatches(it, _cmpSearchQ); });
  if (!items.length) return '<div class="cmp-no-results">Nessun oggetto trovato.</div>';
  var html = '<div class="cmp-lv-header"><div class="cmp-lv-badge">' + lv.lv + '</div><div><h3>' + m.emoji + ' ' + m.nome + ' — Livello ' + lv.lv + '</h3><p>' + items.length + ' oggetti craftabili</p></div></div>';
  html += '<div class="cmp-table-wrap"><table class="cmp-table"><thead><tr>';
  html += '<th>Nome</th><th>Prog.</th><th>Materiale Principale</th><th>Materiale Secondario</th><th>Tipologia</th><th>Descrizione</th><th style="text-align:right">Craft</th><th style="text-align:right">Vendita</th>';
  for (var h = 0; h < dtHeaders.length; h++) html += '<th class="cmp-dt-cell">' + dtHeaders[h] + '</th>';
  html += '<th>Ref.</th></tr></thead><tbody>';
  for (var k = 0; k < items.length; k++) {
    var it = items[k];
    html += '<tr><td>' + it.n + '</td>';
    html += '<td>' + (it.prog ? '<span class="cmp-prog-yes">✅</span>' : '<span class="cmp-prog-no">—</span>') + '</td>';
    html += '<td>' + (it.mp||'—') + '</td>';
    html += '<td>' + (it.ms||'—') + '</td>';
    html += '<td>' + _cmpTipBadge(it.tip) + '</td>';
    html += '<td><span style="font-size:.85rem;color:rgba(220,200,160,.7)">' + (it.desc||'—') + '</span></td>';
    html += '<td class="cmp-cost cmp-cost-craft" style="text-align:right">' + _cmpFmtMO(it.costo) + '</td>';
    html += '<td class="cmp-cost cmp-cost-sell" style="text-align:right">' + _cmpFmtMO(it.vend) + '</td>';
    var dtCells = (it.dt||[]);
    for (var d = 0; d < dtCells.length; d++) {
      html += '<td class="cmp-dt-cell ' + _cmpDtClass(dtCells[d],d) + '">' + dtCells[d] + '</td>';
    }
    html += '<td>' + (it.url ? '<a href="' + it.url + '" target="_blank">5e.tools ↗</a>' : '—') + '</td></tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

function _cmpRenderPergamene() {
  var PERGAMENE = [
    { lv:'Trucchetto', carta:10, inchiostro:5, dt:[1,1,1,1,1] },
    { lv:'1°', carta:10, inchiostro:15, dt:[1,1,1,1,1] },
    { lv:'2°', carta:50, inchiostro:50, dt:[3,2,2,2,1] },
    { lv:'3°', carta:50, inchiostro:100, dt:[5,4,3,2,2] },
    { lv:'4°', carta:500, inchiostro:500, dt:[10,7,5,4,4] },
    { lv:'5°', carta:500, inchiostro:1000, dt:[25,17,13,10,9] },
    { lv:'6°', carta:5000, inchiostro:5000, dt:[40,27,20,16,14] },
    { lv:'7°', carta:5000, inchiostro:7500, dt:[50,34,25,20,17] },
    { lv:'8°', carta:5000, inchiostro:10000, dt:[60,40,30,24,20] },
    { lv:'9°', carta:25000, inchiostro:25000, dt:[120,80,60,48,40], legendary:true },
  ];
  function fmtPMO(v) { return v >= 1000 ? (v/1000).toLocaleString('it-IT')+'k MO' : v+' MO'; }
  function dtPClass(v) { if (v >= 40) return 'dt-hard'; if (v >= 15) return 'dt-medium'; if (v >= 5) return 'dt-light'; return ''; }
  var html = '<div class="cmp-lv-header"><div class="cmp-lv-badge">📜</div><div><h3>🎨 Artista — Pergamene Magiche</h3><p>Creazione di pergamene incantate tramite Downtime</p></div></div>';
  html += '<div class="cmp-intro-card" style="margin-bottom:24px">';
  html += '<h4 style="color:rgba(200,155,60,.9);font-family:&quot;Cinzel&quot;,serif;margin-bottom:10px">📖 Come funziona</h4>';
  html += '<p style="color:rgba(220,200,160,.7);font-size:15px;line-height:1.7">Come Artista ed Incantatore hai la possibilità di scrivere delle <strong style="color:rgba(200,155,60,.9)">pergamene magiche</strong>.</p>';
  html += '<div class="cmp-rules-grid" style="margin-top:16px">';
  html += '<div class="cmp-rule-box"><h4>📄 Materiali</h4><p>Servono <strong style="color:rgba(200,155,60,.9)">Carta Incantata</strong> e <strong style="color:rgba(200,155,60,.9)">Inchiostro Magico</strong>.</p></div>';
  html += '<div class="cmp-rule-box"><h4>⏱️ Tempo (Downtime)</h4><p>Il numero di Downtime necessari dipende dal livello da Artista.</p></div>';
  html += '<div class="cmp-rule-box"><h4>📚 Incantesimi</h4><p>Gli incantesimi scritti devono appartenere alla lista di almeno una delle classi del personaggio.</p></div>';
  html += '<div class="cmp-rule-box"><h4>🔒 Lettura</h4><p>Le pergamene sono utilizzabili da chiunque sappia leggerle.</p></div>';
  html += '</div></div>';
  html += '<div class="cmp-table-wrap"><table class="cmp-table"><thead><tr>';
  html += '<th style="text-align:center">Livello Incantesimo</th><th style="text-align:right">Costo Carta</th><th style="text-align:right">Costo Inchiostro</th>';
  html += '<th class="cmp-dt-cell">Artista LV1</th><th class="cmp-dt-cell">Artista LV2</th><th class="cmp-dt-cell">Artista LV3</th><th class="cmp-dt-cell">Artista LV4</th><th class="cmp-dt-cell">Artista LV5</th>';
  html += '</tr><tr><th colspan="3" style="text-align:center;font-size:.75rem;color:rgba(200,155,60,.35);font-weight:400;padding-top:2px;padding-bottom:6px">— Numero di Downtime richiesti —</th><th colspan="5"></th></tr></thead><tbody>';
  for (var p = 0; p < PERGAMENE.length; p++) {
    var pg = PERGAMENE[p];
    var leg = pg.legendary ? ' style="background:rgba(0,0,0,.3);color:rgba(240,180,60,.8);font-weight:700"' : '';
    html += '<tr' + leg + '><td style="text-align:center;font-weight:600">' + pg.lv + '</td>';
    html += '<td style="text-align:right">' + fmtPMO(pg.carta) + '</td>';
    html += '<td style="text-align:right">' + fmtPMO(pg.inchiostro) + '</td>';
    for (var d = 0; d < pg.dt.length; d++) {
      html += '<td class="cmp-dt-cell ' + dtPClass(pg.dt[d]) + '"' + leg + '>' + pg.dt[d] + '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  html += '<p style="margin-top:16px;font-size:13px;color:rgba(200,155,60,.35);font-style:italic;text-align:center">💎 Per i materiali necessari consulta la sezione Materiali Speciali</p>';
  return html;
}

function _cmpRenderMat(m) {
  var html = '<div class="cmp-lv-header"><div class="cmp-lv-badge">💎</div><div><h3>' + m.emoji + ' Materiali Speciali — ' + m.nome + '</h3><p>Componenti rari e leggendari per il mestiere</p></div></div>';
  html += '<div class="cmp-mat-grid">';
  for (var i = 0; i < m.materialiSpeciali.length; i++) {
    var mat = m.materialiSpeciali[i];
    html += '<div class="cmp-mat-card">';
    html += '<h4>' + mat.nome + '</h4>';
    html += '<div class="mat-rarity">' + _cmpMatRarBadge(mat.rarity) + '</div>';
    html += '<div class="mat-cost">💰 ' + mat.costo + '</div>';
    html += '<p>' + mat.desc + '</p>';
    if (mat.prop && mat.prop.length) {
      html += '<div class="mat-prop">';
      for (var j = 0; j < mat.prop.length; j++) {
        if (j > 0) html += ' &nbsp;·&nbsp; ';
        html += '<strong>' + mat.prop[j].k + ':</strong> ' + mat.prop[j].v;
      }
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function _cmpRenderSearch(m) {
  var html = '<div class="cmp-search-wrap">Risultati per <strong>"' + _cmpSearchQ + '"</strong> in ' + m.nome + ':</div>';
  var found = false;
  for (var j = 0; j < m.livelli.length; j++) {
    var lv = m.livelli[j];
    var items = lv.items.filter(function(it) { return _cmpMatches(it, _cmpSearchQ); });
    if (items.length) { found = true; html += _cmpRenderLv(m, {lv:lv.lv, items:items}); }
  }
  if (!found) html += '<div class="cmp-no-results">Nessun risultato trovato in questo mestiere.</div>';
  return html;
}

function _cmpRenderGuide() {
  return '<div style="max-width:860px">' +
  '<div class="cmp-guide-hero">' +
  '<h2>🛠️ Guida ai Mestieri<br><small style="font-size:.6em;letter-spacing:.08em;color:rgba(200,155,60,.35)">L\'Economia di Arcamis</small></h2>' +
  '<p>I mestieri sono <strong style="color:rgba(200,155,60,.9)">Macro-Categorie</strong> che accorpano diverse abilità. Dimenticate la vecchia gestione frammentata: ogni personaggio possiede una carriera che progredisce insieme alle sue avventure, basata sulla competenza e sulla gestione del <strong style="color:rgba(200,155,60,.9)">Downtime (DT)</strong>.</p>' +
  '</div>' +
  '<div class="cmp-guide-section"><h3>📈 Progressione e Livelli</h3><div class="cmp-guide-cards">' +
  '<div class="cmp-guide-card"><h4>Come funziona</h4><p>Ogni mestiere parte dal <strong style="color:rgba(200,155,60,.9)">Livello 1</strong>. Si sbloccano <strong style="color:rgba(200,155,60,.9)">4 Checkpoint</strong> da distribuire tra i mestieri, fino a <strong style="color:rgba(200,155,60,.9)">Livello 5</strong>.</p></div>' +
  '<div class="cmp-guide-card"><h4>⚔️ Specialista</h4><p>Investire tutti e 4 i punti in un singolo mestiere, portandolo al <strong style="color:rgba(200,155,60,.9)">Livello 5</strong>.</p></div>' +
  '<div class="cmp-guide-card"><h4>🌐 Versatile</h4><p>Distribuire i punti tra più mestieri. Esempio: <strong style="color:rgba(200,155,60,.9)">Mestiere A Lv 3</strong> e <strong style="color:rgba(200,155,60,.9)">Mestiere B Lv 2</strong>.</p></div>' +
  '<div class="cmp-guide-card"><h4>📚 Aumentare di Livello</h4><p>Solo tramite un corso erogato da un NPC o da un giocatore del livello desiderato.</p></div>' +
  '</div></div>' +
  '<div class="cmp-guide-section"><h3>⏱️ Tabella Produzione Downtime</h3>' +
  '<table class="cmp-dt-table"><thead><tr><th>Livello Mestiere</th><th>Capacità Produttiva per DT</th><th>Note</th></tr></thead><tbody>' +
  '<tr><td>Livello 1</td><td><strong>10 Mo</strong> per Downtime</td><td style="color:rgba(200,155,60,.35)">Apprendista</td></tr>' +
  '<tr><td>Livello 2</td><td><strong>25 Mo</strong> per Downtime</td><td style="color:rgba(200,155,60,.35)">Artigiano</td></tr>' +
  '<tr><td>Livello 3</td><td><strong>100 Mo</strong> per Downtime</td><td style="color:rgba(200,155,60,.35)">Esperto</td></tr>' +
  '<tr><td>Livello 4</td><td><strong>500 Mo</strong> per Downtime</td><td style="color:rgba(200,155,60,.35)">Maestro</td></tr>' +
  '<tr><td>Livello 5</td><td><strong>750 Mo</strong> per Downtime</td><td style="color:rgba(200,155,60,.35)">Gran Maestro</td></tr>' +
  '</tbody></table>' +
  '<div class="cmp-guide-note">⚠️ <strong>Attenzione:</strong> La tabella qui presente è di riferimento generale. Fate sempre affidamento alla tabella nella scheda specifica del mestiere.</div>' +
  '</div>' +
  '<div class="cmp-guide-section"><h3>🏗️ I Mestieri Disponibili</h3><div class="cmp-guide-cards">' +
  '<div class="cmp-guide-card"><h4>⚗️ Alchimista</h4><p style="font-style:italic;color:rgba(200,155,60,.35);margin-bottom:6px">Pozioni, veleni, essenze.</p><div><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Alchemist\'s Supplies</span><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Herbalism Kit</span></div></div>' +
  '<div class="cmp-guide-card"><h4>🍺 Oste</h4><p style="font-style:italic;color:rgba(200,155,60,.35);margin-bottom:6px">Distillati e banchetti.</p><div><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Brewer\'s Supplies</span><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Cook\'s Utensils</span></div></div>' +
  '<div class="cmp-guide-card"><h4>🪵 Falegname</h4><p style="font-style:italic;color:rgba(200,155,60,.35);margin-bottom:6px">Archi, strumenti, veicoli.</p><div><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Carpenter\'s Tools</span></div></div>' +
  '<div class="cmp-guide-card"><h4>🧵 Sarto</h4><p style="font-style:italic;color:rgba(200,155,60,.35);margin-bottom:6px">Armature leggere, vesti.</p><div><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Weaver\'s Tools</span></div></div>' +
  '<div class="cmp-guide-card"><h4>⚔️ Metallurgo</h4><p style="font-style:italic;color:rgba(200,155,60,.35);margin-bottom:6px">Armi, armature, forgia.</p><div><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Forgery Kit</span></div></div>' +
  '<div class="cmp-guide-card"><h4>🏛️ Architetto</h4><p style="font-style:italic;color:rgba(200,155,60,.35);margin-bottom:6px">Fortezze, portali, difese.</p><div><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Mason\'s Tools</span></div></div>' +
  '<div class="cmp-guide-card"><h4>🎨 Artista</h4><p style="font-style:italic;color:rgba(200,155,60,.35);margin-bottom:6px">Pergamene, tatuaggi, opere.</p><div><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Calligrapher\'s Tools</span></div></div>' +
  '<div class="cmp-guide-card"><h4>🔨 Artigiano</h4><p style="font-style:italic;color:rgba(200,155,60,.35);margin-bottom:6px">Oggetti magici, gemme.</p><div><span class="cmp-tab" style="font-size:7px;padding:2px 6px">Jeweler\'s Tools</span></div></div>' +
  '</div></div>' +
  '<div class="cmp-guide-section"><h3>🤝 Collaborazione e Requisiti</h3><div class="cmp-guide-cards">' +
  '<div class="cmp-guide-card"><h4>👥 Limite Collaboratori</h4><p>Massimo <strong style="color:rgba(200,155,60,.9)">3 persone</strong> possono lavorare allo stesso oggetto.</p></div>' +
  '<div class="cmp-guide-card"><h4>⚠️ Requisiti di Livello</h4><p><strong style="color:rgba(200,155,60,.9)">Tutti i partecipanti</strong> devono aver raggiunto il livello richiesto.</p></div>' +
  '<div class="cmp-guide-card"><h4>💰 Costi Materiali</h4><p>Il costo dei materiali è generalmente pari al <strong style="color:rgba(200,155,60,.9)">50% del valore di mercato</strong>.</p></div>' +
  '</div></div></div>';
}

// ═══════════════════════════════════════════════════════════════
//  STATE SETTERS
// ═══════════════════════════════════════════════════════════════

function _cmpSetGuide() {
  _cmpCurrentMestiere = -1;
  _cmpCurrentSection = 'guide';
  _cmpSearchQ = '';
  _cmpRender();
  _cmpCloseDrawer();
}

function _cmpSetMestiere(i) {
  _cmpCurrentMestiere = i;
  _cmpCurrentSection = 'intro';
  _cmpSearchQ = '';
  _cmpRender();
  _cmpCloseDrawer();
}

function _cmpSetSection(s) {
  _cmpCurrentSection = s;
  _cmpSearchQ = '';
  _cmpRender();
  _cmpCloseDrawer();
}

function _cmpDoSearch(q) {
  _cmpSearchQ = q.trim();
  if (_cmpSearchQ) _cmpCurrentSection = '__search__';
  else _cmpCurrentSection = 'intro';
  _cmpRender();
}

function _cmpRender() {
  _cmpRenderTabs();
  _cmpRenderSideNav();
  _cmpRenderContent();
  _cmpSyncMobileDrawer();
}

// ═══════════════════════════════════════════════════════════════
//  SPA ENTRY POINT
// ═══════════════════════════════════════════════════════════════

window.showMestieriCompendio = function() {
  if (typeof navStack === 'undefined') {
    setTimeout(window.showMestieriCompendio, 100);
    return;
  }

  if (typeof closeDd === 'function') closeDd();

  var fakeId = 'mestieri-compendio';
  var _alreadyIn = navStack.length && navStack[navStack.length-1].id === fakeId;
  if (!_alreadyIn) {
    navStack.push({ id: fakeId, label: 'Mestieri di Arcamis', icon: '⚔️' });
  }
  history.pushState(
    { id: fakeId, label: 'Mestieri di Arcamis', icon: '⚔️', stack: navStack.slice(0, -1) },
    '', '/mestieri-compendio'
  );

  var phTitle   = document.getElementById('ph-title');
  var phIcon    = document.getElementById('ph-icon');
  var phCovbg   = document.getElementById('ph-covbg');
  var phOverlay = document.getElementById('ph-overlay');
  var phEyebrow = document.getElementById('ph-eyebrow');
  var phSub     = document.getElementById('ph-sub');
  var phCrumb   = document.getElementById('ph-crumb');
  var pbody     = document.getElementById('pbody');

  if (phTitle)   phTitle.textContent   = 'Mestieri di Arcamis';
  if (phIcon)    phIcon.textContent    = '⚔️';
  if (phEyebrow) phEyebrow.textContent = 'Compila & Regole';
  if (phSub)     phSub.textContent     = 'Compendio completo dei mestieri, crafting, downtime e materiali speciali.';
  if (phCovbg)   phCovbg.style.backgroundImage = '';
  if (phOverlay) phOverlay.style.opacity = '0';
  if (phIcon)    phIcon.style.opacity   = '0.06';
  if (phCrumb)   phCrumb.innerHTML      = '<span onclick="history.back()" style="cursor:pointer;opacity:.6">← Indietro</span> <span style="opacity:.3">/</span> <span>Mestieri di Arcamis</span>';
  document.title = 'Mestieri di Arcamis — Arcamis';

  // Build the page HTML
  var html = '<div class="cmp-wrap" style="animation:fi .22s ease forwards">';
  html += '<div class="cmp-tabs" id="cmp-tabs"></div>';
  html += '<div class="cmp-main">';
  html += '<nav class="cmp-sidenav" id="cmp-sidenav"></nav>';
  html += '<div class="cmp-content" id="cmp-content"></div>';
  html += '</div>';
  // Mobile drawer overlay
  html += '<div class="cmp-mobile-drawer-overlay" id="cmp-drawer-overlay" onclick="_cmpCloseDrawer()"></div>';
  // Mobile drawer
  html += '<div class="cmp-mobile-drawer" id="cmp-mobile-drawer">';
  html += '<div class="cmp-mobile-drawer-header"><h3>📑 Navigazione</h3><button class="cmp-mobile-drawer-close" onclick="_cmpCloseDrawer()">✕</button></div>';
  html += '<nav id="cmp-mobile-drawer-nav"></nav>';
  html += '</div>';
  // Mobile FAB
  html += '<button class="cmp-mobile-fab" id="cmp-mobile-fab" onclick="_cmpOpenDrawer()" title="Navigazione">☰</button>';
  html += '</div>';

  pbody.innerHTML = html;
  pbody.style.maxWidth = 'none';
  pbody.style.width = '100%';

  // Transition
  var hv = document.getElementById('hv');
  if (hv && hv.style.display === 'block') {
    if (typeof xfade === 'function') xfade(hv, document.getElementById('pv'));
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
    pbody.style.opacity = '0';
    pbody.style.transition = 'opacity .15s ease';
    setTimeout(function() { pbody.style.opacity = '1'; }, 50);
  }

  _cmpRender();

  if (typeof afterPageRender === 'function') afterPageRender();
};
