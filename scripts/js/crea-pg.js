/* ════════════════════════════════════
   ARCAMIS — crea-pg.js
   Builder del personaggio (livello 1).

   Legge le stesse fonti della wiki:
     - content/pages/materiale-approvato.json (tabella)
     - content/pages/specie-homebrew.json (schede #)
     - content/pages/sottoclassi-homebrew.json (schede #)

   Tutto resta nel browser: la bozza vive in localStorage e non viene
   inviata da nessuna parte. Il calcolo è volutamente trasparente:
   mostra i numeri, non nasconde le regole.
════════════════════════════════════ */

(function (global) {
  'use strict';

  var STORAGE_KEY = 'arcamis.crea-pg.v1';
  var STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
  var POINT_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

  var ABILITIES = [
    { key: 'str', short: 'FOR', label: 'Forza' },
    { key: 'dex', short: 'DES', label: 'Destrezza' },
    { key: 'con', short: 'COS', label: 'Costituzione' },
    { key: 'int', short: 'INT', label: 'Intelligenza' },
    { key: 'wis', short: 'SAG', label: 'Saggezza' },
    { key: 'cha', short: 'CAR', label: 'Carisma' }
  ];

  var SKILLS = [
    { id: 'acrobatics', label: 'Acrobazia', ability: 'dex' },
    { id: 'animal-handling', label: 'Addestrare Animali', ability: 'wis' },
    { id: 'arcana', label: 'Arcano', ability: 'int' },
    { id: 'athletics', label: 'Atletica', ability: 'str' },
    { id: 'deception', label: 'Inganno', ability: 'cha' },
    { id: 'history', label: 'Storia', ability: 'int' },
    { id: 'insight', label: 'Intuizione', ability: 'wis' },
    { id: 'intimidation', label: 'Intimidire', ability: 'cha' },
    { id: 'investigation', label: 'Indagare', ability: 'int' },
    { id: 'medicine', label: 'Medicina', ability: 'wis' },
    { id: 'nature', label: 'Natura', ability: 'int' },
    { id: 'perception', label: 'Percezione', ability: 'wis' },
    { id: 'performance', label: 'Intrattenere', ability: 'cha' },
    { id: 'persuasion', label: 'Persuasione', ability: 'cha' },
    { id: 'religion', label: 'Religione', ability: 'int' },
    { id: 'sleight-of-hand', label: 'Rapidità di Mano', ability: 'dex' },
    { id: 'stealth', label: 'Furtività', ability: 'dex' },
    { id: 'survival', label: 'Sopravvivenza', ability: 'wis' }
  ];

  var SKILL_IDS = SKILLS.map(function (skill) {
    return skill.id;
  });
  var SKILL_BY_ID = {};
  SKILLS.forEach(function (skill) {
    SKILL_BY_ID[skill.id] = skill;
  });

  // La scheda server scrive le sottorazze come "Razza (Sottorazza)".
  // La chiave resta il nome usato dalla wiki, così la bozza salvata non cambia.
  var SPECIES_GROUPS = {
    'Astral Elf': { parent: 'Elf', subrace: 'Astral', sheetName: 'Elf (Astral)' },
    'Dragonborn Metallici e Cromatici': {
      parent: 'Dragonborn',
      subrace: 'Metallici e Cromatici',
      sheetName: ''
    },
    'Dragonborn Gemmati': { parent: 'Dragonborn', subrace: 'Gemmati', sheetName: '' },
    'Asceso di Shurima': { parent: 'Asceso', subrace: 'Shurima', sheetName: 'Asceso (Shurima)' },
    'Asceso di Targon': { parent: 'Asceso', subrace: 'Targon', sheetName: 'Asceso (Targon)' },
    Darkin: { parent: 'Asceso', subrace: 'Darkin', sheetName: 'Asceso (Darkin)' },
    Accidia: { parent: 'Demone Capitale', subrace: 'Accidia', sheetName: 'Demone Capitale (Accidia)' },
    Avarizia: { parent: 'Demone Capitale', subrace: 'Avarizia', sheetName: 'Demone Capitale (Avarizia)' },
    Gola: { parent: 'Demone Capitale', subrace: 'Gola', sheetName: 'Demone Capitale (Gola)' },
    Invidia: { parent: 'Demone Capitale', subrace: 'Invidia', sheetName: 'Demone Capitale (Invidia)' },
    Ira: { parent: 'Demone Capitale', subrace: 'Ira', sheetName: 'Demone Capitale (Ira)' },
    Lussuria: { parent: 'Demone Capitale', subrace: 'Lussuria', sheetName: 'Demone Capitale (Lussuria)' },
    Superbia: { parent: 'Demone Capitale', subrace: 'Superbia', sheetName: 'Demone Capitale (Superbia)' },
    Anfibio: { parent: 'Yordle', subrace: 'Anfibio', sheetName: 'Yordle (Anfibio)' },
    Foreste: { parent: 'Yordle', subrace: 'Foresta', sheetName: 'Yordle (Foresta)' },
    Inventore: { parent: 'Yordle', subrace: 'Inventore', sheetName: 'Yordle (Inventore)' },
    Besheb: { parent: 'Vastaya', subrace: 'Besheb', sheetName: 'Vastaya (Besheb)' },
    Briny: { parent: 'Vastaya', subrace: 'Bryni', sheetName: 'Vastaya (Bryni)' },
    Killash: { parent: 'Vastaya', subrace: 'Killash', sheetName: 'Vastaya (Killash)' },
    Liotlan: { parent: 'Vastaya', subrace: 'Lhotlan', sheetName: 'Vastaya (Lhotlan)' },
    Marai: { parent: 'Vastaya', subrace: 'Marai', sheetName: 'Vastaya (Marai)' },
    'Oovi-Kat': { parent: 'Vastaya', subrace: 'Oovi-Kat', sheetName: 'Vastaya (Oovi-Kat)' },
    Ottrani: { parent: 'Vastaya', subrace: 'Ottrani', sheetName: 'Vastaya (Ottrani)' },
    Shimon: { parent: 'Vastaya', subrace: 'Shimon', sheetName: 'Vastaya (Shimon)' },
    Vesani: { parent: 'Vastaya', subrace: 'Vesani', sheetName: 'Vastaya (Vesani)' },
    Burattino: { parent: 'Ludofatto', subrace: 'Burattino', sheetName: 'Ludofatto (Burattino)' },
    Ceramico: { parent: 'Ludofatto', subrace: 'Ceramica', sheetName: 'Ludofatto (Ceramica)' },
    Metallici: { parent: 'Ludofatto', subrace: 'Metallico', sheetName: 'Ludofatto (Metallico)' },
    Peluche: { parent: 'Ludofatto', subrace: 'Peluche', sheetName: 'Ludofatto (Peluche)' },
    Chemtech: { parent: 'Potenziato', subrace: 'Chemtech', sheetName: 'Potenziato (Chemtech)' },
    Hextech: { parent: 'Potenziato', subrace: 'Hextech', sheetName: 'Potenziato (Hextech)' }
  };

  var GOOGLE_SHEET_ID = '1zS6kffFUEkNhTXMf_vhTzd_DfG-XULPI_mYv1RFKklE';
  var GOOGLE_SHEET_COPY_URL = 'https://docs.google.com/spreadsheets/d/' + GOOGLE_SHEET_ID + '/copy';
  var GOOGLE_SHEET_XLSX_URL = '/sheets/arcamis-scheda-base.xlsx';

  // La scheda server usa tre incrementi da +1 scelti dal giocatore.
  // Sono suggerimenti per il campo Talento di Origine: il testo resta libero.
  var FEATS = [
    'Feat: Aberrant DragonMark',
    'Feat: Actor',
    'Feat: Alert',
    'Feat: Athlete (DEX)',
    'Feat: Athlete (STR)',
    'Feat: Chef (CON)',
    'Feat: Chef (WIS)',
    'Feat: Crusher',
    'Feat: Dual Wielder',
    'Feat: Durable',
    'Feat: Fey Touched (CHA)',
    'Feat: Fey Touched (WIS)',
    'Feat: Gift of the Gem Dragon (CHA)',
    'Feat: Gift of the Gem Dragon (INT)',
    'Feat: Gift of the Gem Dragon (WIS)',
    'Feat: Heavily Armored',
    'Feat: Heavy Armor Master',
    'Feat: Keen Mind',
    'Feat: Lightly Armored (DEX)',
    'Feat: Lightly Armored (STR)',
    'Feat: Linguist',
    'Feat: Mobile',
    'Feat: Moderately Armored (DEX)',
    'Feat: Moderately Armored (STR)',
    'Feat: Observant (INT)',
    'Feat: Observant (WIS)',
    'Feat: Piercer (DEX)',
    'Feat: Piercer (STR)',
    'Feat: Resilient (Charisma)',
    'Feat: Resilient (Constitution)',
    'Feat: Resilient (Dexterity)',
    'Feat: Resilient (Intelligence)',
    'Feat: Resilient (Strength)',
    'Feat: Resilient (Wisdom)',
    'Feat: Shadow Touched (CHA)',
    'Feat: Shadow Touched (INT)',
    'Feat: Shadow Touched (WIS)',
    'Feat: Skill Expert (Charisma)',
    'Feat: Skill Expert (Constitution)',
    'Feat: Skill Expert (Dexterity)',
    'Feat: Skill Expert (Intelligence)',
    'Feat: Skill Expert (Strength)',
    'Feat: Skill Expert (Wisdom)',
    'Feat: Slasher (DEX)',
    'Feat: Slasher (STR)',
    'Feat: Tavern Brawler (CON)',
    'Feat: Tavern Brawler (STR)',
    'Feat: Telekinetic (CHA)',
    'Feat: Telekinetic (INT)',
    'Feat: Telekinetic (WIS)',
    'Feat: Telepathic (CHA)',
    'Feat: Telepathic (INT)',
    'Feat: Telepathic (WIS)',
    'Feat: Mythal Touched (CHA)',
    'Feat: Mythal Touched (INT)',
    'Feat: Mythal Touched (WIS)',
    'Feat: Weapon Master (DEX)',
    'Feat: Weapon Master (STR)',
    'Fighting Style: Archery',
    'Fighting Style: Defense',
    'Fighting Style: Dueling'
  ];

  var AC_MODES = [
    { id: 'auto', label: 'Automatica (armatura e difese di classe)' },
    { id: 'armor', label: 'Solo armatura' },
    { id: 'unarmored', label: 'Senza armatura (10 + Des)' },
    { id: 'barbarian', label: 'Difesa del barbaro (10 + Des + Cos)' },
    { id: 'monk', label: 'Difesa del monaco (10 + Des + Sag)' },
    { id: 'dance', label: 'Danza del bardo (10 + Des + Car)' },
    { id: 'natural', label: 'Armatura naturale (10 + Des)' },
    { id: 'natural1', label: 'Armatura naturale +1 (10 + Des + 1)' },
    { id: 'natural-con', label: 'Armatura naturale (12 + Cos)' },
    { id: 'natural-pb', label: 'Armatura naturale (12 + competenza)' }
  ];
  var AC_MODE_IDS = AC_MODES.map(function (mode) {
    return mode.id;
  });

  var CLASSES = [
    {
      id: 'artificer',
      name: 'Artefice',
      en: 'Artificer',
      die: 8,
      primary: 'Intelligenza',
      saves: ['con', 'int'],
      spell: 'int',
      skillCount: 2,
      skills: ['arcana', 'history', 'investigation', 'medicine', 'nature', 'perception', 'sleight-of-hand']
    },
    {
      id: 'barbarian',
      name: 'Barbaro',
      en: 'Barbarian',
      die: 12,
      primary: 'Forza',
      saves: ['str', 'con'],
      spell: '',
      skillCount: 2,
      skills: ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival']
    },
    {
      id: 'bard',
      name: 'Bardo',
      en: 'Bard',
      die: 8,
      primary: 'Carisma',
      saves: ['dex', 'cha'],
      spell: 'cha',
      skillCount: 3,
      skills: SKILL_IDS.slice()
    },
    {
      id: 'cleric',
      name: 'Chierico',
      en: 'Cleric',
      die: 8,
      primary: 'Saggezza',
      saves: ['wis', 'cha'],
      spell: 'wis',
      skillCount: 2,
      skills: ['history', 'insight', 'medicine', 'persuasion', 'religion']
    },
    {
      id: 'druid',
      name: 'Druido',
      en: 'Druid',
      die: 8,
      primary: 'Saggezza',
      saves: ['int', 'wis'],
      spell: 'wis',
      skillCount: 2,
      skills: ['arcana', 'animal-handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival']
    },
    {
      id: 'fighter',
      name: 'Guerriero',
      en: 'Fighter',
      die: 10,
      primary: 'Forza o Destrezza',
      saves: ['str', 'con'],
      spell: '',
      skillCount: 2,
      skills: ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'persuasion', 'survival']
    },
    {
      id: 'monk',
      name: 'Monaco',
      en: 'Monk',
      die: 8,
      primary: 'Destrezza e Saggezza',
      saves: ['str', 'dex'],
      spell: '',
      skillCount: 2,
      skills: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth']
    },
    {
      id: 'paladin',
      name: 'Paladino',
      en: 'Paladin',
      die: 10,
      primary: 'Forza e Carisma',
      saves: ['wis', 'cha'],
      spell: 'cha',
      skillCount: 2,
      skills: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion']
    },
    {
      id: 'ranger',
      name: 'Ranger',
      en: 'Ranger',
      die: 10,
      primary: 'Destrezza e Saggezza',
      saves: ['str', 'dex'],
      spell: 'wis',
      skillCount: 3,
      skills: ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival']
    },
    {
      id: 'rogue',
      name: 'Ladro',
      en: 'Rogue',
      die: 8,
      primary: 'Destrezza',
      saves: ['dex', 'int'],
      spell: '',
      skillCount: 4,
      skills: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight-of-hand', 'stealth']
    },
    {
      id: 'sorcerer',
      name: 'Stregone',
      en: 'Sorcerer',
      die: 6,
      primary: 'Carisma',
      saves: ['con', 'cha'],
      spell: 'cha',
      skillCount: 2,
      skills: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion']
    },
    {
      id: 'warlock',
      name: 'Warlock',
      en: 'Warlock',
      die: 8,
      primary: 'Carisma',
      saves: ['wis', 'cha'],
      spell: 'cha',
      skillCount: 2,
      skills: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion']
    },
    {
      id: 'wizard',
      name: 'Mago',
      en: 'Wizard',
      die: 6,
      primary: 'Intelligenza',
      saves: ['int', 'wis'],
      spell: 'int',
      skillCount: 2,
      skills: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion']
    }
  ];

  var CLASS_BY_ID = {};
  var CLASS_ALIASES = {};
  CLASSES.forEach(function (cls) {
    CLASS_BY_ID[cls.id] = cls;
    CLASS_ALIASES[slugify(cls.en)] = cls.id;
    CLASS_ALIASES[slugify(cls.name)] = cls.id;
  });

  // Competenze di 1° livello, riassunte dalla colonna "1st Level Exclusive
  // Proficiencies" della scheda server. Restano modificabili nel form.
  var CLASS_PROFICIENCIES = {
    artificer: {
      armor: 'Armature leggere e medie, scudi',
      weapons: 'Armi semplici, pistola, moschetto',
      tools: '2 strumenti (utensili da ladro, utensili da inventore, qualsiasi)'
    },
    barbarian: {
      armor: 'Armature leggere e medie, scudi',
      weapons: 'Armi semplici e da guerra',
      tools: '—'
    },
    bard: {
      armor: 'Armature leggere',
      weapons: 'Armi semplici',
      tools: '2 strumenti musicali'
    },
    cleric: {
      armor: 'Armature leggere e medie, scudi',
      weapons: 'Armi semplici',
      tools: '—'
    },
    druid: {
      armor: 'Armature leggere, scudi (non metallici)',
      weapons: 'Armi semplici',
      tools: 'Kit da erborista, Druidico'
    },
    fighter: {
      armor: 'Tutte le armature, scudi',
      weapons: 'Armi semplici e da guerra',
      tools: '—'
    },
    monk: {
      armor: '—',
      weapons: 'Armi semplici e da guerra',
      tools: '1 strumento (artigiano o musicale)'
    },
    paladin: {
      armor: 'Tutte le armature, scudi',
      weapons: 'Armi semplici e da guerra',
      tools: '—'
    },
    ranger: {
      armor: 'Armature leggere e medie, scudi',
      weapons: 'Armi semplici e da guerra',
      tools: '1 competenza extra tra le abilità della classe'
    },
    rogue: {
      armor: 'Armature leggere',
      weapons: 'Armi semplici e da guerra',
      tools: '1 strumento, 2 lingue extra'
    },
    sorcerer: {
      armor: '—',
      weapons: 'Armi semplici',
      tools: '—'
    },
    warlock: {
      armor: 'Armature leggere',
      weapons: 'Armi semplici',
      tools: '—'
    },
    wizard: {
      armor: '—',
      weapons: 'Armi semplici',
      tools: '—'
    }
  };

  function classProficiencyText(cls) {
    if (!cls) return '';
    var prof = CLASS_PROFICIENCIES[cls.id];
    if (!prof) return '';
    return (
      'Armature: ' + prof.armor + ' · Armi: ' + prof.weapons + ' · Strumenti: ' + prof.tools
    );
  }

  var ARMORS = [
    { id: 'none', label: 'Nessuna armatura', base: 10, dex: 'full' },
    { id: 'leather', label: 'Cuoio', base: 11, dex: 'full' },
    { id: 'studded', label: 'Cuoio borchiato', base: 12, dex: 'full' },
    { id: 'hide', label: 'Cuoio rinforzato', base: 12, dex: 'max2' },
    { id: 'chain-shirt', label: 'Giaco di maglia', base: 13, dex: 'max2' },
    { id: 'scale', label: 'Corazza di scaglie', base: 14, dex: 'max2' },
    { id: 'breastplate', label: 'Corazza di petto', base: 14, dex: 'max2' },
    { id: 'half-plate', label: 'Mezza armatura', base: 15, dex: 'max2' },
    { id: 'ring', label: 'Armatura ad anelli', base: 14, dex: 'none' },
    { id: 'chain-mail', label: 'Cotta di maglia', base: 16, dex: 'none' },
    { id: 'splint', label: 'Armatura a strisce', base: 17, dex: 'none' },
    { id: 'plate', label: 'Corazza a piastre', base: 18, dex: 'none' }
  ];
  var ARMOR_BY_ID = {};
  ARMORS.forEach(function (armor) {
    ARMOR_BY_ID[armor.id] = armor;
  });

  var ui = {
    speciesFilter: 'all',
    subclassFilter: 'all'
  };
  var catalog = null;
  var state = null;
  var appRoot = null;

  /* ── Helpers ─────────────────────────────────────────────── */

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function nl2br(value) {
    return esc(value).replace(/\r?\n/g, '<br>');
  }

  function slugify(value) {
    return (
      String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') || 'voce'
    );
  }

  function cleanText(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function speciesLabel(item) {
    if (!item) return '';
    return item.label || item.name;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function integer(value, fallback) {
    var number = parseInt(value, 10);
    return isFinite(number) ? number : fallback;
  }

  function abilityMod(score) {
    return Math.floor((integer(score, 10) - 10) / 2);
  }

  function fmtMod(value) {
    return (value >= 0 ? '+' : '') + value;
  }

  function pointBuyCost(score) {
    return Object.prototype.hasOwnProperty.call(POINT_COSTS, score) ? POINT_COSTS[score] : null;
  }

  function pointBuyTotal(scores) {
    var total = 0;
    ABILITIES.forEach(function (ability) {
      total += pointBuyCost(integer(scores && scores[ability.key], 8)) || 0;
    });
    return total;
  }

  function validateStandardArray(scores) {
    var counts = {};
    ABILITIES.forEach(function (ability) {
      var score = integer(scores && scores[ability.key], 0);
      counts[score] = (counts[score] || 0) + 1;
    });
    return STANDARD_ARRAY.every(function (value) {
      return counts[value] === 1;
    }) && Object.keys(counts).length === STANDARD_ARRAY.length;
  }

  function defaultScores() {
    var scores = {};
    ABILITIES.forEach(function (ability, index) {
      scores[ability.key] = STANDARD_ARRAY[index];
    });
    return scores;
  }

  function defaultAbilityIncreases() {
    var increases = {};
    ABILITIES.forEach(function (ability) {
      increases[ability.key] = 0;
    });
    return increases;
  }

  function normalizeAbilityIncreases(raw) {
    var increases = defaultAbilityIncreases();
    if (!raw || typeof raw !== 'object') return increases;
    var total = 0;
    ABILITIES.forEach(function (ability) {
      if (raw[ability.key] === 1 && total < 3) {
        increases[ability.key] = 1;
        total += 1;
      }
    });
    return increases;
  }

  function abilityIncreaseTotal(increases) {
    var normalized = normalizeAbilityIncreases(increases);
    return ABILITIES.reduce(function (total, ability) {
      return total + normalized[ability.key];
    }, 0);
  }

  function finalScoreFor(key, current) {
    var stateValue = current || defaultState();
    var base = integer(stateValue.scores && stateValue.scores[key], 10);
    var increases = normalizeAbilityIncreases(stateValue.abilityIncreases);
    return base + (increases[key] || 0);
  }

  /* ── Stato ───────────────────────────────────────────────── */

  function defaultState() {
    return {
      name: '',
      player: '',
      background: '',
      alignment: '',
      deity: '',
      originFeat: '',
      species: '',
      klass: '',
      subclass: '',
      method: 'standard',
      scores: defaultScores(),
      abilityIncreases: defaultAbilityIncreases(),
      skills: [],
      extraSkills: '',
      armor: 'none',
      shield: false,
      acMode: 'auto',
      bonusHp: 0,
      weapon: '',
      equipment: '',
      languages: '',
      resistances: '',
      attacks: '',
      proficiencies: '',
      gold: 50,
      speed: '30 ft',
      appearance: '',
      personality: '',
      backstory: '',
      notes: ''
    };
  }

  function normalizeState(raw) {
    var base = defaultState();
    if (!raw || typeof raw !== 'object') return base;
    base.name = String(raw.name || '').slice(0, 120);
    base.player = String(raw.player || '').slice(0, 120);
    base.background = String(raw.background || '').slice(0, 160);
    base.alignment = String(raw.alignment || '').slice(0, 80);
    base.deity = String(raw.deity || '').slice(0, 120);
    base.originFeat = String(raw.originFeat || '').slice(0, 160);
    base.species = String(raw.species || '');
    base.klass = CLASS_BY_ID[raw.klass] ? raw.klass : '';
    base.subclass = String(raw.subclass || '');
    base.method = ['standard', 'pointbuy', 'manual'].indexOf(raw.method) >= 0 ? raw.method : 'standard';
    if (raw.scores && typeof raw.scores === 'object') {
      ABILITIES.forEach(function (ability) {
        base.scores[ability.key] = clamp(integer(raw.scores[ability.key], base.scores[ability.key]), 3, 18);
      });
    }
    base.abilityIncreases = normalizeAbilityIncreases(raw.abilityIncreases);
    base.acMode = AC_MODE_IDS.indexOf(raw.acMode) >= 0 ? raw.acMode : 'auto';
    base.bonusHp = clamp(integer(raw.bonusHp, 0), 0, 99);
    base.languages = String(raw.languages || '').slice(0, 300);
    base.resistances = String(raw.resistances || '').slice(0, 300);
    base.attacks = String(raw.attacks || '').slice(0, 1200);
    base.proficiencies = String(raw.proficiencies || '').slice(0, 600);
    base.skills = Array.isArray(raw.skills)
      ? raw.skills.filter(function (id) {
          return !!SKILL_BY_ID[id];
        })
      : [];
    base.extraSkills = String(raw.extraSkills || '').slice(0, 300);
    base.armor = ARMOR_BY_ID[raw.armor] ? raw.armor : 'none';
    base.shield = raw.shield === true;
    base.weapon = String(raw.weapon || '').slice(0, 160);
    base.equipment = String(raw.equipment || '').slice(0, 1200);
    base.gold = clamp(integer(raw.gold, 50), 0, 999999);
    base.speed = String(raw.speed || '30 ft').slice(0, 40);
    base.appearance = String(raw.appearance || '').slice(0, 1200);
    base.personality = String(raw.personality || '').slice(0, 1200);
    base.backstory = String(raw.backstory || '').slice(0, 2400);
    base.notes = String(raw.notes || '').slice(0, 1200);
    return base;
  }

  function reconcileState() {
    if (!catalog || !state) return;
    if (state.species && !findById(catalog.allSpecies, state.species)) state.species = '';
    if (state.subclass && !findById(catalog.allSubclasses, state.subclass)) state.subclass = '';
    var subclass = findById(catalog.allSubclasses, state.subclass);
    if (subclass && state.klass && subclass.classKey !== state.klass) state.subclass = '';
    if (state.klass && !CLASS_BY_ID[state.klass]) state.klass = '';
    var cls = CLASS_BY_ID[state.klass];
    state.skills = state.skills.filter(function (id) {
      return !!SKILL_BY_ID[id] && (!cls || cls.skills.indexOf(id) !== -1);
    });
    if (cls && state.skills.length > cls.skillCount) state.skills = state.skills.slice(0, cls.skillCount);
  }

  function loadState() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : defaultState();
    } catch (_error) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      if (!global.localStorage) return false;
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (_error) {
      return false;
    }
  }

  /* ── Parsing delle fonti ─────────────────────────────────── */

  function parseApprovedTable(markdown) {
    var rows = [];
    String(markdown || '')
      .split(/\r?\n/)
      .forEach(function (line) {
        var trimmed = line.trim();
        if (trimmed.charAt(0) !== '|') return;
        var cells = trimmed
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map(cleanText);
        if (cells.length < 5) return;
        if (/^:?-+:?$/.test(cells[0])) return;
        if (/^voce$/i.test(cells[0])) return;
        rows.push({
          name: cells[0],
          category: cells[1],
          klass: cells[2],
          source: cells[3],
          note: cells[4]
        });
      });
    return rows;
  }

  function firstMatch(body, pattern) {
    var match = String(body || '').match(pattern);
    return match ? cleanText(match[1]) : '';
  }

  function firstSummary(body) {
    var lines = String(body || '').split(/\r?\n/);
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!line || line === '---' || line.charAt(0) === '#' || line.charAt(0) === '!') continue;
      if (/^\*Classe:\*/.test(line) || /^[-*+]\s/.test(line) || /^\|/.test(line) || /^>/.test(line)) continue;
      return cleanText(line).slice(0, 240);
    }
    return '';
  }

  function parseHomebrewSpecies(markdown) {
    var sections = String(markdown || '').split(/^# /m);
    sections.shift();
    return sections
      .map(function (section) {
        var lines = section.split(/\r?\n/);
        var name = cleanText(lines.shift());
        if (!name) return null;
        var body = lines.join('\n');
        var group = SPECIES_GROUPS[name] || null;
        return {
          id: 'homebrew:species:' + slugify(name),
          name: name,
          label: group ? group.parent + ' — ' + group.subrace : name,
          parent: group ? group.parent : '',
          subrace: group ? group.subrace : '',
          sheetName: group ? group.sheetName : name,
          origin: 'homebrew',
          source: 'Homebrew',
          type: firstMatch(body, /\*\*Tipologia:\*\*\s*([^\n]+)/),
          size: firstMatch(body, /\*\*Taglia:\*\*\s*([^\n]+)/),
          speed: firstMatch(body, /\*\*Velocità:\*\*\s*([^\n]+)/),
          summary: firstSummary(body),
          url: '/lore/specie-homebrew'
        };
      })
      .filter(Boolean);
  }

  function parseHomebrewSubclasses(markdown) {
    var sections = String(markdown || '').split(/^# /m);
    sections.shift();
    return sections
      .map(function (section) {
        var lines = section.split(/\r?\n/);
        var name = cleanText(lines.shift());
        if (!name) return null;
        var body = lines.join('\n');
        var className = firstMatch(body, /\*Classe:\*\s*([^\n]+)/);
        var classKey = CLASS_ALIASES[slugify(className)] || '';
        if (!classKey) return null;
        return {
          id: 'homebrew:subclass:' + classKey + ':' + slugify(name),
          name: name,
          origin: 'homebrew',
          source: 'Homebrew',
          classKey: classKey,
          className: CLASS_BY_ID[classKey].name,
          summary: firstSummary(body),
          url: '/lore/sottoclassi-homebrew'
        };
      })
      .filter(Boolean);
  }

  function buildCatalog(approvedRows, speciesMarkdown, subclassesMarkdown) {
    var approvedSpecies = [];
    var approvedSubclasses = [];
    (approvedRows || []).forEach(function (row) {
      if (row.category === 'Specie') {
        var group = SPECIES_GROUPS[row.name] || null;
        approvedSpecies.push({
          id: 'approved:species:' + slugify(row.name),
          name: row.name,
          label: group ? group.parent + ' — ' + group.subrace : row.name,
          parent: group ? group.parent : '',
          subrace: group ? group.subrace : '',
          sheetName: group ? group.sheetName : row.name,
          origin: 'approved',
          source: row.source || 'Materiale approvato',
          note: row.note || '',
          url: '/personaggio/materiale-approvato'
        });
        return;
      }
      if (row.category !== 'Sottoclasse' || !row.klass) return;
      if (String(row.source || '').toLowerCase() === 'homebrew') return;
      var classKey = CLASS_ALIASES[slugify(row.klass)] || '';
      if (!classKey) return;
      approvedSubclasses.push({
        id: 'approved:subclass:' + classKey + ':' + slugify(row.name),
        name: row.name,
        origin: 'approved',
        source: row.source || 'Materiale approvato',
        classKey: classKey,
        className: CLASS_BY_ID[classKey].name,
        note: row.note || '',
        url: '/personaggio/materiale-approvato'
      });
    });

    var homebrewSpecies = parseHomebrewSpecies(speciesMarkdown);
    var homebrewSubclasses = parseHomebrewSubclasses(subclassesMarkdown);
    return {
      approvedSpecies: approvedSpecies,
      approvedSubclasses: approvedSubclasses,
      homebrewSpecies: homebrewSpecies,
      homebrewSubclasses: homebrewSubclasses,
      allSpecies: approvedSpecies.concat(homebrewSpecies),
      allSubclasses: approvedSubclasses.concat(homebrewSubclasses)
    };
  }

  function findById(items, id) {
    if (!id || !items) return null;
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function selectedSpecies() {
    return catalog ? findById(catalog.allSpecies, state.species) : null;
  }

  function selectedSubclass() {
    return catalog ? findById(catalog.allSubclasses, state.subclass) : null;
  }

  function selectedClass() {
    return CLASS_BY_ID[state.klass] || null;
  }

  /* ── Calcolo della scheda ────────────────────────────────── */

  function computeSheet(stateValue, dataCatalog) {
    var current = stateValue || defaultState();
    var increases = normalizeAbilityIncreases(current.abilityIncreases);
    var baseScores = {};
    var scores = {};
    ABILITIES.forEach(function (ability) {
      var baseScore = integer(current.scores && current.scores[ability.key], 10);
      baseScores[ability.key] = baseScore;
      scores[ability.key] = baseScore + (increases[ability.key] || 0);
    });
    var mods = {};
    ABILITIES.forEach(function (ability) {
      mods[ability.key] = abilityMod(scores[ability.key]);
    });

    var cls = CLASS_BY_ID[current.klass] || null;
    var species = dataCatalog ? findById(dataCatalog.allSpecies, current.species) : null;
    var subclass = dataCatalog ? findById(dataCatalog.allSubclasses, current.subclass) : null;
    if (subclass && cls && subclass.classKey !== cls.id) subclass = null;

    var armor = ARMOR_BY_ID[current.armor] || ARMOR_BY_ID.none;
    var dexForAc = mods.dex;
    if (armor.dex === 'max2') dexForAc = Math.min(dexForAc, 2);
    if (armor.dex === 'none') dexForAc = 0;
    var armorAc = armor.base + dexForAc;
    var unarmoredAc = 10 + mods.dex;
    var classAc = null;
    if (cls && cls.id === 'barbarian') classAc = 10 + mods.dex + mods.con;
    if (cls && cls.id === 'monk') classAc = 10 + mods.dex + mods.wis;
    if (subclass && /dance|danza/i.test(subclass.name)) classAc = 10 + mods.dex + mods.cha;
    var naturalAc = 10 + mods.dex;
    var acMode = AC_MODE_IDS.indexOf(current.acMode) >= 0 ? current.acMode : 'auto';
    var baseAc = armorAc;
    if (acMode === 'auto') {
      baseAc = Math.max(armorAc, unarmoredAc, naturalAc, classAc === null ? -Infinity : classAc);
    } else if (acMode === 'unarmored') {
      baseAc = unarmoredAc;
    } else if (acMode === 'barbarian') {
      baseAc = 10 + mods.dex + mods.con;
    } else if (acMode === 'monk') {
      baseAc = 10 + mods.dex + mods.wis;
    } else if (acMode === 'dance') {
      baseAc = 10 + mods.dex + mods.cha;
    } else if (acMode === 'natural') {
      baseAc = naturalAc;
    } else if (acMode === 'natural1') {
      baseAc = naturalAc + 1;
    } else if (acMode === 'natural-con') {
      baseAc = 12 + mods.con;
    } else if (acMode === 'natural-pb') {
      baseAc = 12 + 2;
    }
    var ac = baseAc + (current.shield ? 2 : 0);
    var hp = cls ? Math.max(1, cls.die + mods.con + (integer(current.bonusHp, 0) || 0)) : 0;
    var proficiencies = [classProficiencyText(cls), current.proficiencies].filter(Boolean).join(' · ');

    var saves = {};
    ABILITIES.forEach(function (ability) {
      var proficient = !!cls && cls.saves.indexOf(ability.key) !== -1;
      saves[ability.key] = {
        value: mods[ability.key] + (proficient ? 2 : 0),
        proficient: proficient
      };
    });

    var skills = (current.skills || [])
      .map(function (id) {
        var skill = SKILL_BY_ID[id];
        return skill
          ? {
              id: skill.id,
              label: skill.label,
              ability: skill.ability,
              mod: mods[skill.ability] + 2
            }
          : null;
      })
      .filter(Boolean);
    var hasPerception = skills.some(function (skill) {
      return skill.id === 'perception';
    });
    var passive = 10 + mods.wis + (hasPerception ? 2 : 0);

    return {
      mods: mods,
      scores: scores,
      baseScores: baseScores,
      abilityIncreases: increases,
      cls: cls,
      species: species,
      subclass: subclass,
      armor: armor,
      acMode: acMode,
      ac: ac,
      hp: hp,
      bonusHp: integer(current.bonusHp, 0) || 0,
      proficiency: 2,
      saves: saves,
      skills: skills,
      passive: passive,
      initiative: mods.dex,
      spellSave: cls && cls.spell ? 8 + 2 + mods[cls.spell] : null,
      spellAttack: cls && cls.spell ? 2 + mods[cls.spell] : null,
      speed: current.speed || '30 ft',
      gold: current.gold,
      proficiencies: proficiencies,
      languages: current.languages || '',
      resistances: current.resistances || '',
      attacks: current.attacks || '',
      classProficiencies: classProficiencyText(cls)
    };
  }

  /* ── HTML del form ───────────────────────────────────────── */

  function option(value, label, selected) {
    return (
      '<option value="' +
      esc(value) +
      '"' +
      (String(selected) === String(value) ? ' selected' : '') +
      '>' +
      esc(label) +
      '</option>'
    );
  }

  function sourceBadge(item) {
    if (!item) return '';
    return (
      '<span class="cpg-badge ' +
      (item.origin === 'homebrew' ? 'is-homebrew' : 'is-approved') +
      '">' +
      esc(item.origin === 'homebrew' ? 'Homebrew' : item.source || 'Approvato') +
      '</span>'
    );
  }

  function sourceLink(item) {
    if (!item) return '';
    return (
      '<a class="cpg-link" href="' +
      esc(item.url) +
      '" target="_blank" rel="noopener">Apri la scheda fonte ↗</a>'
    );
  }

  function renderShell() {
    var classOptions = CLASSES.map(function (cls) {
      return option(cls.id, cls.name + ' (' + cls.en + ')', state.klass);
    }).join('');
    var armorOptions = ARMORS.map(function (armor) {
      return option(armor.id, armor.label, state.armor);
    }).join('');

    return (
      '<div class="cpg-builder">' +
      '<div class="cpg-main">' +
      '<p class="cpg-save" id="cpg-save-status" role="status" aria-live="polite"></p>' +
      '<nav class="cpg-steps" aria-label="Passi del builder">' +
      '<button type="button" data-action="go" data-target="cpg-step-identita"><b>1</b>Identità</button>' +
      '<button type="button" data-action="go" data-target="cpg-step-specie"><b>2</b>Specie</button>' +
      '<button type="button" data-action="go" data-target="cpg-step-classe"><b>3</b>Classe</button>' +
      '<button type="button" data-action="go" data-target="cpg-step-caratteristiche"><b>4</b>Caratteristiche</button>' +
      '<button type="button" data-action="go" data-target="cpg-step-competenze"><b>5</b>Competenze</button>' +
      '<button type="button" data-action="go" data-target="cpg-step-equipaggiamento"><b>6</b>Equipaggiamento</button>' +
      '<button type="button" data-action="go" data-target="cpg-step-scheda"><b>7</b>Scheda</button>' +
      '</nav>' +

      '<section class="cpg-card" id="cpg-step-identita">' +
      '<div class="cpg-card-head"><span class="cpg-stepnum">1</span><div><h2>Identità</h2>' +
      '<p>Il nome, il background e i dettagli che raccontano chi è il personaggio.</p></div></div>' +
      '<div class="cpg-grid2">' +
      '<label class="cpg-field">Nome del personaggio<input type="text" data-field="name" maxlength="120" value="' + esc(state.name) + '" placeholder="Es. Lyra Voss"></label>' +
      '<label class="cpg-field">Giocatore<input type="text" data-field="player" maxlength="120" value="' + esc(state.player) + '" placeholder="Il tuo nome"></label>' +
      '<label class="cpg-field">Background<input type="text" data-field="background" maxlength="160" value="' + esc(state.background) + '" placeholder="Es. Guardia cittadina, Studioso…"></label>' +
      '<label class="cpg-field">Allineamento<input type="text" data-field="alignment" maxlength="80" value="' + esc(state.alignment) + '" placeholder="Es. Neutrale buono"></label>' +
      '<label class="cpg-field">Divinità o patrono<input type="text" data-field="deity" maxlength="120" value="' + esc(state.deity) + '" placeholder="Facoltativo"></label>' +
      '<label class="cpg-field">Talento di Origine<input type="text" data-field="originFeat" list="cpg-feats" maxlength="160" value="' + esc(state.originFeat) + '" placeholder="Se previsto dal background"></label>' +
      '</div>' +
      '<datalist id="cpg-feats">' +
      FEATS.map(function (feat) {
        return '<option value="' + esc(feat) + '"></option>';
      }).join('') +
      '</datalist>' +
      '<label class="cpg-field">Competenze da background o altre fonti<input type="text" data-field="extraSkills" maxlength="300" value="' + esc(state.extraSkills) + '" placeholder="Es. Storia, Persuasione"></label>' +
      '<div class="cpg-grid2">' +
      '<label class="cpg-field">Aspetto<textarea data-field="appearance" rows="3" maxlength="1200" placeholder="Tratti fisici, abbigliamento, segni particolari…">' + esc(state.appearance) + '</textarea></label>' +
      '<label class="cpg-field">Personalità<textarea data-field="personality" rows="3" maxlength="1200" placeholder="Carattere, ideali, legami, difetti…">' + esc(state.personality) + '</textarea></label>' +
      '</div>' +
      '<label class="cpg-field">Storia<textarea data-field="backstory" rows="5" maxlength="2400" placeholder="Una storia breve, coerente con la lore di Arcamis e con un PG di livello 1.">' + esc(state.backstory) + '</textarea></label>' +
      '</section>' +

      '<section class="cpg-card" id="cpg-step-specie">' +
      '<div class="cpg-card-head"><span class="cpg-stepnum">2</span><div><h2>Specie</h2>' +
      '<p>Scegli tra materiale approvato e specie homebrew. La fonte resta sempre visibile.</p></div></div>' +
      '<div class="cpg-filter" data-filter-group="species"><span>Mostra:</span>' +
      '<button type="button" data-action="filter-species" data-value="all">Tutti</button>' +
      '<button type="button" data-action="filter-species" data-value="approved">Approvato</button>' +
      '<button type="button" data-action="filter-species" data-value="homebrew">Homebrew</button>' +
      '</div>' +
      '<label class="cpg-field">Specie<select id="cpg-species" data-field="species"></select></label>' +
      '<div id="cpg-species-info"></div>' +
      '</section>' +

      '<section class="cpg-card" id="cpg-step-classe">' +
      '<div class="cpg-card-head"><span class="cpg-stepnum">3</span><div><h2>Classe e sottoclasse</h2>' +
      '<p>La classe definisce dado vita, tiri salvezza e competenze. La sottoclasse può essere scelta ora o in seguito.</p></div></div>' +
      '<div class="cpg-grid2">' +
      '<label class="cpg-field">Classe<select id="cpg-class" data-field="klass"><option value="">Scegli una classe…</option>' + classOptions + '</select></label>' +
      '<label class="cpg-field">Sottoclasse<select id="cpg-subclass" data-field="subclass"></select></label>' +
      '</div>' +
      '<div class="cpg-filter" data-filter-group="subclass"><span>Mostra sottoclassi:</span>' +
      '<button type="button" data-action="filter-subclass" data-value="all">Tutte</button>' +
      '<button type="button" data-action="filter-subclass" data-value="approved">Approvate</button>' +
      '<button type="button" data-action="filter-subclass" data-value="homebrew">Homebrew</button>' +
      '</div>' +
      '<div id="cpg-class-info"></div>' +
      '<div id="cpg-subclass-info"></div>' +
      '</section>' +

      '<section class="cpg-card" id="cpg-step-caratteristiche">' +
      '<div class="cpg-card-head"><span class="cpg-stepnum">4</span><div><h2>Caratteristiche</h2>' +
      '<p>Point Buy da 27 punti oppure Standard Array. Poi assegna i tre incrementi da +1 previsti dalla scheda server.</p></div></div>' +
      '<label class="cpg-field">Metodo<select id="cpg-method" data-field="method">' +
      option('standard', 'Standard Array (15-14-13-12-10-8)', state.method) +
      option('pointbuy', 'Point Buy (27 punti)', state.method) +
      option('manual', 'Inserimento manuale', state.method) +
      '</select></label>' +
      '<div id="cpg-stat-fields"></div>' +
      '<p class="cpg-hint" id="cpg-points-hint"></p>' +
      '<h3 class="cpg-subhead">Incrementi della specie</h3>' +
      '<div id="cpg-asi-fields"></div>' +
      '<p class="cpg-hint" id="cpg-asi-hint"></p>' +
      '<button type="button" class="cpg-btn cpg-btn-ghost" data-action="standard-array">Ripristina l’array standard</button>' +
      '</section>' +

      '<section class="cpg-card" id="cpg-step-competenze">' +
      '<div class="cpg-card-head"><span class="cpg-stepnum">5</span><div><h2>Competenze</h2>' +
      '<p>Scegli le competenze concesse dalla classe. Le competenze da background si annotano nel passo 1.</p></div></div>' +
      '<div id="cpg-skills-grid"></div>' +
      '</section>' +

      '<section class="cpg-card" id="cpg-step-equipaggiamento">' +
      '<div class="cpg-card-head"><span class="cpg-stepnum">6</span><div><h2>Equipaggiamento</h2>' +
      '<p>Il server parte da 50 gp. Armatura e scudo servono solo a calcolare la CA.</p></div></div>' +
      '<div class="cpg-grid2">' +
      '<label class="cpg-field">Armatura<select id="cpg-armor" data-field="armor">' + armorOptions + '</select></label>' +
      '<label class="cpg-field">Formula CA<select id="cpg-ac-mode" data-field="acMode">' +
      AC_MODES.map(function (mode) {
        return option(mode.id, mode.label, state.acMode);
      }).join('') +
      '</select></label>' +
      '<label class="cpg-check"><input type="checkbox" data-field="shield"' + (state.shield ? ' checked' : '') + '> Scudo (+2 CA)</label>' +
      '<label class="cpg-field">PF bonus per livello<input type="number" data-field="bonusHp" min="0" max="99" value="' + esc(state.bonusHp) + '" placeholder="0"></label>' +
      '<label class="cpg-field">Arma principale<input type="text" data-field="weapon" maxlength="160" value="' + esc(state.weapon) + '" placeholder="Es. Spada lunga, arco corto…"></label>' +
      '<label class="cpg-field">Oro iniziale (gp)<input type="number" data-field="gold" min="0" max="999999" value="' + esc(state.gold) + '"></label>' +
      '<label class="cpg-field">Velocità<input type="text" data-field="speed" maxlength="40" value="' + esc(state.speed) + '" placeholder="30 ft (9 m)"></label>' +
      '</div>' +
      '<label class="cpg-field">Lingue<input type="text" data-field="languages" maxlength="300" value="' + esc(state.languages) + '" placeholder="Es. Comune, 2 lingue extra"></label>' +
      '<label class="cpg-field">Resistenze, immunità e vulnerabilità<input type="text" data-field="resistances" maxlength="300" value="' + esc(state.resistances) + '" placeholder="Es. Resistenza al fuoco; immunità al veleno"></label>' +
      '<label class="cpg-field">Competenze aggiuntive<input type="text" data-field="proficiencies" maxlength="600" value="' + esc(state.proficiencies) + '" placeholder="Armi, armature, strumenti o altre competenze non coperte dalla classe"></label>' +
      '<label class="cpg-field">Attacchi<textarea data-field="attacks" rows="4" maxlength="1200" placeholder="Es. Spada lunga +5, 1d8+3 taglienti; Arco corto +4, 1d6+2 perforanti">' + esc(state.attacks) + '</textarea></label>' +
      '<label class="cpg-field">Inventario e note<textarea data-field="equipment" rows="5" maxlength="1200" placeholder="Oggetti iniziali, borsa, strumenti, altro equipaggiamento…">' + esc(state.equipment) + '</textarea></label>' +
      '</section>' +

      '<section class="cpg-card cpg-sheet-card" id="cpg-step-scheda">' +
      '<div class="cpg-card-head"><span class="cpg-stepnum">7</span><div><h2>Scheda del personaggio</h2>' +
      '<p>Una bozza pronta da stampare, copiare o esportare. Non sostituisce la scheda ufficiale dell’Assistenza Tecnica.</p></div></div>' +
      '<div id="cpg-sheet"></div>' +
      '<p class="cpg-hint">Copia Google e XLSX sono il modello ufficiale della scheda server, pronti da compilare.</p>' +
      '<div class="cpg-actions">' +
      '<button type="button" class="cpg-btn" data-action="print">Stampa / PDF</button>' +
      '<button type="button" class="cpg-btn cpg-btn-ghost" data-action="copy">Copia riepilogo</button>' +
      '<a class="cpg-btn cpg-btn-ghost" href="' + GOOGLE_SHEET_COPY_URL + '" target="_blank" rel="noopener">Copia scheda Google</a>' +
      '<a class="cpg-btn cpg-btn-ghost" href="' + GOOGLE_SHEET_XLSX_URL + '" download="arcamis-scheda-personaggio.xlsx">Scarica scheda XLSX</a>' +
      '<button type="button" class="cpg-btn cpg-btn-ghost" data-action="export">Scarica JSON</button>' +
      '<label class="cpg-btn cpg-btn-ghost cpg-import">Importa JSON<input type="file" accept="application/json,.json" data-import></label>' +
      '<button type="button" class="cpg-btn cpg-btn-danger" data-action="reset">Nuovo personaggio</button>' +
      '</div>' +
      '</section>' +
      '</div>' +
      '<aside class="cpg-summary" aria-label="Riepilogo del personaggio"><div id="cpg-summary"></div></aside>' +
      '</div>'
    );
  }

  /* ── Rendering dinamico ──────────────────────────────────── */

  function refreshFilterButtons() {
    if (!appRoot) return;
    appRoot.querySelectorAll('[data-action="filter-species"]').forEach(function (button) {
      var active = button.getAttribute('data-value') === ui.speciesFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    appRoot.querySelectorAll('[data-action="filter-subclass"]').forEach(function (button) {
      var active = button.getAttribute('data-value') === ui.subclassFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function renderSpeciesSelect() {
    if (!appRoot || !catalog) return;
    var select = appRoot.querySelector('#cpg-species');
    if (!select) return;
    var groups = [
      { label: 'Materiale approvato', items: catalog.approvedSpecies, origin: 'approved' },
      { label: 'Homebrew', items: catalog.homebrewSpecies, origin: 'homebrew' }
    ];
    var html = '<option value="">Scegli una specie…</option>';
    groups.forEach(function (group) {
      if (ui.speciesFilter !== 'all' && ui.speciesFilter !== group.origin) return;
      if (!group.items.length) return;
      html += '<optgroup label="' + esc(group.label) + '">';
      group.items.forEach(function (item) {
        var label = speciesLabel(item) + ' — ' + (item.origin === 'homebrew' ? 'Homebrew' : item.source);
        html += option(item.id, label, state.species);
      });
      html += '</optgroup>';
    });
    select.innerHTML = html;
    select.value = state.species;
    if (select.value !== state.species) {
      state.species = '';
      select.value = '';
    }
  }

  function renderSubclassSelect() {
    if (!appRoot || !catalog) return;
    var select = appRoot.querySelector('#cpg-subclass');
    if (!select) return;
    var cls = selectedClass();
    select.disabled = !cls;
    var html = '<option value="">' + (cls ? 'Scegli una sottoclasse (facoltativa)…' : 'Scegli prima una classe') + '</option>';
    if (cls) {
      var groups = [
        { label: 'Materiale approvato', items: catalog.approvedSubclasses, origin: 'approved' },
        { label: 'Homebrew', items: catalog.homebrewSubclasses, origin: 'homebrew' }
      ];
      groups.forEach(function (group) {
        if (ui.subclassFilter !== 'all' && ui.subclassFilter !== group.origin) return;
        var items = group.items.filter(function (item) {
          return item.classKey === cls.id;
        });
        if (!items.length) return;
        html += '<optgroup label="' + esc(group.label) + '">';
        items.forEach(function (item) {
          html += option(item.id, item.name + ' — ' + (item.origin === 'homebrew' ? 'Homebrew' : item.source), state.subclass);
        });
        html += '</optgroup>';
      });
    }
    select.innerHTML = html;
    select.value = state.subclass;
    if (select.value !== state.subclass) {
      state.subclass = '';
      select.value = '';
    }
  }

  function renderSpeciesInfo() {
    var target = appRoot && appRoot.querySelector('#cpg-species-info');
    if (!target) return;
    var item = selectedSpecies();
    if (!item) {
      target.innerHTML = '<p class="cpg-muted">Scegli una specie per vedere fonte, tipo e dettagli disponibili.</p>';
      return;
    }
    var meta = [];
    if (item.parent) meta.push('Sottorazza di ' + item.parent);
    if (item.sheetName && item.sheetName !== speciesLabel(item)) meta.push('Scheda server: ' + item.sheetName);
    if (item.type) meta.push('Tipo: ' + item.type);
    if (item.size) meta.push('Taglia: ' + item.size);
    if (item.speed) meta.push('Velocità: ' + item.speed);
    target.innerHTML =
      '<div class="cpg-pick">' +
      '<div class="cpg-pick-head"><strong>' + esc(speciesLabel(item)) + '</strong>' + sourceBadge(item) + '</div>' +
      (meta.length ? '<p class="cpg-pick-meta">' + esc(meta.join(' · ')) + '</p>' : '') +
      (item.note ? '<p class="cpg-pick-note">' + esc(item.note) + '</p>' : '') +
      (item.summary ? '<p class="cpg-pick-note">' + esc(item.summary) + '</p>' : '') +
      (item.speed ? '<button type="button" class="cpg-btn cpg-btn-ghost" data-action="use-species-speed" data-speed="' + esc(item.speed) + '">Usa la velocità della specie</button>' : '') +
      sourceLink(item) +
      '</div>';
  }

  function renderClassInfo() {
    var target = appRoot && appRoot.querySelector('#cpg-class-info');
    if (!target) return;
    var cls = selectedClass();
    if (!cls) {
      target.innerHTML = '<p class="cpg-muted">Scegli una classe per vedere dado vita, tiri salvezza e competenze disponibili.</p>';
      return;
    }
    var saves = cls.saves
      .map(function (key) {
        for (var i = 0; i < ABILITIES.length; i += 1) {
          if (ABILITIES[i].key === key) return ABILITIES[i].label;
        }
        return key;
      })
      .join(', ');
    target.innerHTML =
      '<div class="cpg-pick">' +
      '<div class="cpg-pick-head"><strong>' + esc(cls.name) + ' <small>(' + esc(cls.en) + ')</small></strong></div>' +
      '<p class="cpg-pick-meta">Dado vita d' + cls.die + ' · Caratteristica principale: ' + esc(cls.primary) + '</p>' +
      '<p class="cpg-pick-meta">Tiri salvezza: ' + esc(saves) + ' · Competenze: ' + cls.skillCount + '</p>' +
      (classProficiencyText(cls) ? '<p class="cpg-pick-meta">' + esc(classProficiencyText(cls)) + '</p>' : '') +
      '</div>';
  }

  function renderSubclassInfo() {
    var target = appRoot && appRoot.querySelector('#cpg-subclass-info');
    if (!target) return;
    var item = selectedSubclass();
    if (!item) {
      target.innerHTML = '<p class="cpg-muted">La sottoclasse è facoltativa in questa bozza: puoi sceglierla ora o annotarla in seguito.</p>';
      return;
    }
    target.innerHTML =
      '<div class="cpg-pick">' +
      '<div class="cpg-pick-head"><strong>' + esc(item.name) + '</strong>' + sourceBadge(item) + '</div>' +
      '<p class="cpg-pick-meta">' + esc(item.className) + '</p>' +
      (item.summary ? '<p class="cpg-pick-note">' + esc(item.summary) + '</p>' : '') +
      sourceLink(item) +
      '</div>';
  }

  function renderStats() {
    var target = appRoot && appRoot.querySelector('#cpg-stat-fields');
    var hint = appRoot && appRoot.querySelector('#cpg-points-hint');
    if (!target || !hint) return;
    if (state.method === 'standard' && !validateStandardArray(state.scores)) {
      state.scores = defaultScores();
    }
    if (state.method === 'pointbuy') {
      ABILITIES.forEach(function (ability) {
        state.scores[ability.key] = clamp(state.scores[ability.key], 8, 15);
      });
    }

    if (state.method === 'standard') {
      target.innerHTML =
        '<div class="cpg-stat-grid">' +
        ABILITIES.map(function (ability) {
          var options = STANDARD_ARRAY.map(function (value) {
            return option(value, String(value), state.scores[ability.key]);
          }).join('');
          return (
            '<label class="cpg-stat"><span>' +
            esc(ability.label) +
            '</span><select data-standard="' +
            ability.key +
            '">' +
            options +
            '</select><em>' +
            fmtMod(abilityMod(finalScoreFor(ability.key, state))) +
            '</em></label>'
          );
        }).join('') +
        '</div>';
      hint.textContent = 'Ogni valore dell’array va usato una sola volta: cambiando un punteggio, il builder scambia automaticamente il valore con l’altra caratteristica.';
      hint.className = 'cpg-hint';
      return;
    }

    if (state.method === 'pointbuy') {
      var total = pointBuyTotal(state.scores);
      target.innerHTML =
        '<div class="cpg-pb-grid">' +
        ABILITIES.map(function (ability) {
          var score = state.scores[ability.key];
          var cost = pointBuyCost(score) || 0;
          var canMinus = score > 8;
          var canPlus = score < 15 && total - cost + (pointBuyCost(score + 1) || 0) <= 27;
          return (
            '<div class="cpg-pb-row"><span class="cpg-pb-name">' +
            esc(ability.label) +
            '</span><button type="button" class="cpg-pb-btn" data-action="pb" data-delta="-1" data-ability="' +
            ability.key +
            '" aria-label="Riduci ' +
            esc(ability.label) +
            '"' +
            (canMinus ? '' : ' disabled') +
            '>−</button><output aria-live="polite">' +
            score +
            '</output><button type="button" class="cpg-pb-btn" data-action="pb" data-delta="1" data-ability="' +
            ability.key +
            '" aria-label="Aumenta ' +
            esc(ability.label) +
            '"' +
            (canPlus ? '' : ' disabled') +
            '>+</button><em>' +
            fmtMod(abilityMod(finalScoreFor(ability.key, state))) +
            ' · costo ' +
            cost +
            '</em></div>'
          );
        }).join('') +
        '</div>';
      hint.textContent = total + ' / 27 punti spesi · ' + (27 - total) + ' disponibili.';
      hint.className = total > 27 ? 'cpg-hint is-warn' : 'cpg-hint';
      return;
    }

    target.innerHTML =
      '<div class="cpg-stat-grid cpg-stat-grid-manual">' +
      ABILITIES.map(function (ability) {
        return (
          '<label class="cpg-stat"><span>' +
          esc(ability.label) +
          '</span><input type="number" min="3" max="18" data-stat-manual="' +
          ability.key +
          '" value="' +
          state.scores[ability.key] +
          '"><em>' +
          fmtMod(abilityMod(finalScoreFor(ability.key, state))) +
          '</em></label>'
        );
      }).join('') +
      '</div>';
    hint.textContent = 'Inserimento manuale: i punteggi restano tra 3 e 18. Il modificatore si calcola come (punteggio − 10) / 2, arrotondato per difetto.';
    hint.className = 'cpg-hint';
  }

  function renderAbilityIncreases() {
    var target = appRoot && appRoot.querySelector('#cpg-asi-fields');
    var hint = appRoot && appRoot.querySelector('#cpg-asi-hint');
    if (!target || !hint) return;
    var total = abilityIncreaseTotal(state.abilityIncreases);
    target.innerHTML =
      '<div class="cpg-asi-grid">' +
      ABILITIES.map(function (ability) {
        var checked = state.abilityIncreases[ability.key] === 1;
        return (
          '<label class="cpg-asi' +
          (checked ? ' is-checked' : '') +
          '"><input type="checkbox" data-asi="' +
          ability.key +
          '"' +
          (checked ? ' checked' : '') +
          (!checked && total >= 3 ? ' disabled' : '') +
          '><span>' +
          esc(ability.label) +
          '</span><em>+1</em></label>'
        );
      }).join('') +
      '</div>';
    hint.textContent =
      total +
      ' / 3 incrementi assegnati. La scheda server usa tre +1 a scelta: il totale viene aggiunto ai punteggi base e aggiorna i modificatori.';
    hint.className = 'cpg-hint';
  }

  function renderSkills() {
    var target = appRoot && appRoot.querySelector('#cpg-skills-grid');
    if (!target) return;
    var cls = selectedClass();
    if (!cls) {
      target.innerHTML = '<p class="cpg-muted">Scegli prima una classe: il builder mostrerà solo le competenze previste.</p>';
      return;
    }
    state.skills = state.skills.filter(function (id) {
      return !!SKILL_BY_ID[id] && cls.skills.indexOf(id) !== -1;
    });
    if (state.skills.length > cls.skillCount) state.skills = state.skills.slice(0, cls.skillCount);
    var atLimit = state.skills.length >= cls.skillCount;
    var hint =
      'Seleziona ' +
      cls.skillCount +
      (cls.skillCount === 1 ? ' competenza' : ' competenze') +
      ' tra quelle della classe (' +
      state.skills.length +
      '/' +
      cls.skillCount +
      ').';
    var items = cls.skills.map(function (id) {
      var skill = SKILL_BY_ID[id];
      var checked = state.skills.indexOf(id) !== -1;
      return (
        '<label class="cpg-skill' +
        (checked ? ' is-checked' : '') +
        '"><input type="checkbox" data-skill="' +
        id +
        '"' +
        (checked ? ' checked' : '') +
        (!checked && atLimit ? ' disabled' : '') +
        '><span>' +
        esc(skill.label) +
        '</span><em>' +
        abilityLabel(skill.ability) +
        '</em></label>'
      );
    }).join('');
    target.innerHTML =
      '<p class="cpg-hint">' +
      esc(hint) +
      '</p><div class="cpg-skills">' +
      items +
      '</div>';
  }

  function abilityLabel(key) {
    for (var i = 0; i < ABILITIES.length; i += 1) {
      if (ABILITIES[i].key === key) return ABILITIES[i].short;
    }
    return key;
  }

  function renderSummary() {
    var target = appRoot && appRoot.querySelector('#cpg-summary');
    if (!target) return;
    var sheet = computeSheet(state, catalog);
    var cls = sheet.cls;
    var species = sheet.species;
    var subclass = sheet.subclass;
    var warnings = [];
    if (!species) warnings.push('Scegli una specie.');
    if (!cls) warnings.push('Scegli una classe.');
    if (state.method === 'pointbuy' && pointBuyTotal(state.scores) > 27) warnings.push('Point Buy oltre 27 punti.');
    if (state.method === 'standard' && !validateStandardArray(state.scores)) warnings.push('Array standard non valido.');
    if (abilityIncreaseTotal(state.abilityIncreases) !== 3) warnings.push('Incrementi della specie: ' + abilityIncreaseTotal(state.abilityIncreases) + '/3.');
    if (cls && state.skills.length !== cls.skillCount) warnings.push('Competenze di classe: ' + state.skills.length + '/' + cls.skillCount + '.');
    if (species && species.origin === 'homebrew') warnings.push('Specie homebrew: soggetta ad approvazione staff.');
    if (subclass && subclass.origin === 'homebrew') warnings.push('Sottoclasse homebrew: soggetta ad approvazione staff.');

    target.innerHTML =
      '<div class="cpg-summary-head"><span>Anteprima</span><strong>' +
      esc(state.name || 'Il tuo personaggio') +
      '</strong><p>Livello 1' +
      (species ? ' · ' + esc(speciesLabel(species)) : '') +
      (cls ? ' · ' + esc(cls.name) : '') +
      (subclass ? ' — ' + esc(subclass.name) : '') +
      '</p></div>' +
      '<div class="cpg-mini-stats">' +
      ABILITIES.map(function (ability) {
        return (
          '<div><span>' +
          ability.short +
          '</span><strong>' +
          sheet.scores[ability.key] +
          '</strong><em>' +
          fmtMod(sheet.mods[ability.key]) +
          '</em></div>'
        );
      }).join('') +
      '</div>' +
      '<dl class="cpg-summary-list">' +
      '<div><dt>Punti ferita</dt><dd>' + (cls ? sheet.hp : '—') + '</dd></div>' +
      '<div><dt>Classe armatura</dt><dd>' + (cls || sheet.armor.id !== 'none' || sheet.acMode !== 'auto' ? sheet.ac : '—') + '</dd></div>' +
      '<div><dt>Iniziativa</dt><dd>' + fmtMod(sheet.initiative) + '</dd></div>' +
      '<div><dt>Competenza</dt><dd>+2</dd></div>' +
      '<div><dt>Percezione passiva</dt><dd>' + sheet.passive + '</dd></div>' +
      '<div><dt>Velocità</dt><dd>' + esc(sheet.speed) + '</dd></div>' +
      '</dl>' +
      (sheet.skills.length
        ? '<p class="cpg-summary-skills"><b>Competenze:</b> ' +
          esc(
            sheet.skills
              .map(function (skill) {
                return skill.label + ' ' + fmtMod(skill.mod);
              })
              .join(', ')
          ) +
          '</p>'
        : '') +
      (warnings.length ? '<ul class="cpg-warnings">' + warnings.map(function (warning) { return '<li>' + esc(warning) + '</li>'; }).join('') + '</ul>' : '') +
      '<button type="button" class="cpg-btn" data-action="go" data-target="cpg-step-scheda">Vai alla scheda →</button>';
  }

  function renderSheet() {
    var target = appRoot && appRoot.querySelector('#cpg-sheet');
    if (!target) return;
    target.innerHTML = sheetHtml(computeSheet(state, catalog));
  }

  function sheetHtml(sheet) {
    var cls = sheet.cls;
    var species = sheet.species;
    var subclass = sheet.subclass;
    var details = [
      ['Giocatore', state.player],
      ['Background', state.background],
      ['Allineamento', state.alignment],
      ['Divinità o patrono', state.deity],
      ['Talento di Origine', state.originFeat],
      ['Competenze extra', state.extraSkills],
      ['Arma', state.weapon],
      ['Oro', state.gold + ' gp']
    ];
    return (
      '<article class="cpg-sheet">' +
      '<header class="cpg-sheet-head"><div><p class="cpg-sheet-kicker">Arcamis · Scheda di livello 1</p><h2>' +
      esc(state.name || 'Senza nome') +
      '</h2><p class="cpg-sheet-sub">' +
      (species ? esc(speciesLabel(species)) + (species.origin === 'homebrew' ? ' (Homebrew)' : ' (' + esc(species.source) + ')') : 'Specie da scegliere') +
      ' · ' +
      (cls ? esc(cls.name) : 'Classe da scegliere') +
      (subclass ? ' — ' + esc(subclass.name) + (subclass.origin === 'homebrew' ? ' (Homebrew)' : '') : '') +
      '</p></div><div class="cpg-sheet-mark" aria-hidden="true">✦</div></header>' +
      '<div class="cpg-sheet-abilities">' +
      ABILITIES.map(function (ability) {
        return (
          '<div><span>' +
          ability.short +
          '</span><strong>' +
          sheet.scores[ability.key] +
          '</strong><em>' +
          fmtMod(sheet.mods[ability.key]) +
          '</em></div>'
        );
      }).join('') +
      '</div>' +
      '<div class="cpg-sheet-combat">' +
      '<div><span>Punti ferita</span><strong>' + (cls ? sheet.hp : '—') + '</strong></div>' +
      '<div><span>Classe armatura</span><strong>' + (cls || sheet.armor.id !== 'none' || sheet.acMode !== 'auto' ? sheet.ac : '—') + '</strong></div>' +
      '<div><span>Iniziativa</span><strong>' + fmtMod(sheet.initiative) + '</strong></div>' +
      '<div><span>Velocità</span><strong>' + esc(sheet.speed) + '</strong></div>' +
      '<div><span>Competenza</span><strong>+2</strong></div>' +
      '<div><span>Percezione passiva</span><strong>' + sheet.passive + '</strong></div>' +
      '</div>' +
      '<div class="cpg-sheet-columns">' +
      '<section><h3>Tiri salvezza</h3><ul class="cpg-sheet-list">' +
      ABILITIES.map(function (ability) {
        var save = sheet.saves[ability.key];
        return (
          '<li><span>' +
          esc(ability.label) +
          (save.proficient ? ' <b class="cpg-prof" title="Competente">●</b>' : '') +
          '</span><em>' +
          fmtMod(save.value) +
          '</em></li>'
        );
      }).join('') +
      '</ul></section>' +
      '<section><h3>Competenze</h3>' +
      (sheet.skills.length
        ? '<ul class="cpg-sheet-list">' +
          sheet.skills
            .map(function (skill) {
              return '<li><span>' + esc(skill.label) + '</span><em>' + fmtMod(skill.mod) + '</em></li>';
            })
            .join('') +
          '</ul>'
        : '<p class="cpg-sheet-empty">Nessuna competenza di classe selezionata.</p>') +
      '</section>' +
      '</div>' +
      '<div class="cpg-sheet-columns">' +
      '<section><h3>Dettagli</h3><dl class="cpg-sheet-details">' +
      details
        .filter(function (item) {
          return item[1] !== '' && item[1] !== null && item[1] !== undefined;
        })
        .map(function (item) {
          return '<div><dt>' + esc(item[0]) + '</dt><dd>' + nl2br(item[1]) + '</dd></div>';
        })
        .join('') +
      '</dl></section>' +
      '<section><h3>Magia</h3><dl class="cpg-sheet-details">' +
      (cls && cls.spell
        ? '<div><dt>Caratteristica da incantatore</dt><dd>' + esc(abilityLabel(cls.spell)) + '</dd></div>' +
          '<div><dt>TS incantesimi</dt><dd>' + sheet.spellSave + '</dd></div>' +
          '<div><dt>Attacco con incantesimi</dt><dd>' + fmtMod(sheet.spellAttack) + '</dd></div>'
        : '<div><dt>Incantesimi</dt><dd>' + (cls ? 'La classe non lancia incantesimi al livello 1.' : 'Scegli una classe per vedere il profilo magico.') + '</dd></div>') +
      '</dl><p class="cpg-sheet-note">Talento di Origine e incantesimi vanno verificati sul manuale approvato e con l’Assistenza Tecnica.</p></section>' +
      '</div>' +
      '<div class="cpg-sheet-columns">' +
      '<section><h3>Competenze e lingue</h3><dl class="cpg-sheet-details">' +
      '<div><dt>Competenze</dt><dd>' + (sheet.proficiencies ? nl2br(sheet.proficiencies) : '—') + '</dd></div>' +
      '<div><dt>Lingue</dt><dd>' + (sheet.languages ? nl2br(sheet.languages) : '—') + '</dd></div>' +
      '<div><dt>Resistenze</dt><dd>' + (sheet.resistances ? nl2br(sheet.resistances) : '—') + '</dd></div>' +
      '</dl></section>' +
      '<section><h3>Attacchi</h3>' +
      (sheet.attacks ? '<p class="cpg-sheet-pre">' + nl2br(sheet.attacks) + '</p>' : '<p class="cpg-sheet-empty">Nessun attacco annotato.</p>') +
      '</section>' +
      '</div>' +
      '<section class="cpg-sheet-story"><h3>Storia</h3><p>' +
      (state.backstory ? nl2br(state.backstory) : '—') +
      '</p><h3>Aspetto e personalità</h3><p>' +
      (state.appearance || state.personality
        ? nl2br([state.appearance, state.personality].filter(Boolean).join('\n\n'))
        : '—') +
      '</p><h3>Equipaggiamento e note</h3><p>' +
      (state.equipment || state.notes ? nl2br([state.equipment, state.notes].filter(Boolean).join('\n\n')) : '—') +
      '</p></section>' +
      '<footer class="cpg-sheet-foot"><p><b>Fonti:</b> ' +
      (species ? esc(speciesLabel(species)) + ' — ' + esc(species.origin === 'homebrew' ? 'Homebrew' : species.source) : 'specie da scegliere') +
      '; ' +
      (subclass ? esc(subclass.name) + ' — ' + esc(subclass.origin === 'homebrew' ? 'Homebrew' : subclass.source) : 'sottoclasse facoltativa') +
      '.</p><p>Bozza non ufficiale generata dal sito. Le scelte homebrew e la scheda definitiva richiedono l’approvazione dello staff.</p></footer>' +
      '</article>'
    );
  }

  function refreshAll() {
    renderSpeciesSelect();
    renderSpeciesInfo();
    renderClassInfo();
    renderSubclassSelect();
    renderSubclassInfo();
    renderStats();
    renderAbilityIncreases();
    renderSkills();
    renderSummary();
    renderSheet();
    refreshFilterButtons();
  }

  /* ── Salvataggio e feedback ─────────────────────────────── */

  function setStatus(message, warning) {
    if (!appRoot) return;
    var target = appRoot.querySelector('#cpg-save-status');
    if (!target) return;
    target.textContent = message;
    target.className = warning ? 'cpg-save is-warn' : 'cpg-save';
  }

  function saveAndRefresh() {
    var saved = saveState();
    if (saved) {
      var now = new Date();
      setStatus(
        'Bozza salvata in questo browser · ' +
          String(now.getHours()).padStart(2, '0') +
          ':' +
          String(now.getMinutes()).padStart(2, '0')
      );
    } else {
      setStatus('Salvataggio locale non disponibile: esporta il JSON per non perdere la bozza.', true);
    }
    renderSummary();
    renderSheet();
  }

  function refreshAfterStructuralChange() {
    reconcileState();
    renderSubclassSelect();
    renderClassInfo();
    renderSubclassInfo();
    renderStats();
    renderAbilityIncreases();
    renderSkills();
    renderSummary();
    renderSheet();
    refreshFilterButtons();
  }

  /* ── Azioni ─────────────────────────────────────────────── */

  function goTo(targetId) {
    var target = global.document && global.document.getElementById(targetId);
    if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function printSheet() {
    var sheet = computeSheet(state, catalog);
    var html =
      '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>' +
      esc(state.name || 'Scheda personaggio') +
      '</title><style>' +
      PRINT_CSS +
      '</style></head><body>' +
      sheetHtml(sheet) +
      '</body></html>';
    var win = global.open('', '_blank');
    if (!win) {
      setStatus('Il browser ha bloccato la finestra di stampa. Consenti i popup e riprova.', true);
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    global.setTimeout(function () {
      try {
        win.print();
      } catch (_error) {
        /* La finestra resta aperta: l’utente può usare Ctrl/Cmd+P. */
      }
    }, 250);
  }

  function plainSummary() {
    var sheet = computeSheet(state, catalog);
    var lines = [];
    lines.push('ARCAMIS — ' + (state.name || 'Personaggio senza nome'));
    lines.push(
      'Livello 1 · ' +
        (sheet.species ? speciesLabel(sheet.species) : 'specie da scegliere') +
        ' · ' +
        (sheet.cls ? sheet.cls.name : 'classe da scegliere') +
        (sheet.subclass ? ' — ' + sheet.subclass.name : '')
    );
    lines.push('');
    lines.push('CARATTERISTICHE');
    ABILITIES.forEach(function (ability) {
      lines.push(ability.label + ': ' + sheet.scores[ability.key] + ' (' + fmtMod(sheet.mods[ability.key]) + ')');
    });
    lines.push('');    lines.push('PF ' + (sheet.cls ? sheet.hp : '—') + ' · CA ' + sheet.ac + ' · Iniziativa ' + fmtMod(sheet.initiative) + ' · Velocità ' + sheet.speed);
    lines.push('Competenza +2 · Percezione passiva ' + sheet.passive);
    lines.push('LINGUE: ' + (sheet.languages || '—'));
    lines.push('RESISTENZE: ' + (sheet.resistances || '—'));
    lines.push('COMPETENZE DI CLASSE: ' + (sheet.proficiencies || '—'));
    lines.push('ATTACCHI: ' + (sheet.attacks || '—'));
    lines.push('');
    lines.push('TIRI SALVEZZA');
    ABILITIES.forEach(function (ability) {
      var save = sheet.saves[ability.key];
      lines.push(ability.label + ': ' + fmtMod(save.value) + (save.proficient ? ' (competente)' : ''));
    });
    lines.push('');
    lines.push('COMPETENZE');
    lines.push(sheet.skills.length ? sheet.skills.map(function (skill) { return skill.label + ' ' + fmtMod(skill.mod); }).join(', ') : '—');
    lines.push('');
    lines.push('BACKGROUND: ' + (state.background || '—'));
    lines.push('TALENTO DI ORIGINE: ' + (state.originFeat || '—'));
    lines.push('ARMA: ' + (state.weapon || '—'));
    lines.push('EQUIPAGGIAMENTO: ' + (state.equipment || '—'));
    lines.push('');
    lines.push('Bozza non ufficiale — scelte homebrew soggette ad approvazione staff.');
    return lines.join('\n');
  }

  function copySummary() {
    var text = plainSummary();
    function done() {
      setStatus('Riepilogo copiato negli appunti.');
    }
    function fallback() {
      var area = global.document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      global.document.body.appendChild(area);
      area.select();
      try {
        global.document.execCommand('copy');
        done();
      } catch (_error) {
        setStatus('Copia non disponibile: usa Stampa / PDF oppure scarica il JSON.', true);
      }
      global.document.body.removeChild(area);
    }
    if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(text).then(done).catch(fallback);
      return;
    }
    fallback();
  }

  function exportJson() {
    try {
      var payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        character: state
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = global.document.createElement('a');
      link.href = url;
      link.download = slugify(state.name || 'personaggio') + '-arcamis.json';
      global.document.body.appendChild(link);
      link.click();
      global.document.body.removeChild(link);
      global.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      setStatus('JSON esportato.');
    } catch (_error) {
      setStatus('Esportazione non disponibile in questo browser.', true);
    }
  }

  function importJson(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(String(reader.result || '{}'));
        var raw = payload.character || payload.state || payload;
        state = normalizeState(raw);
        reconcileState();
        saveState();
        appRoot.innerHTML = renderShell();
        refreshAll();
        setStatus('Personaggio importato e salvato in questo browser.');
      } catch (_error) {
        setStatus('Il file non è un JSON valido per questo builder.', true);
      }
    };
    reader.onerror = function () {
      setStatus('Impossibile leggere il file selezionato.', true);
    };
    reader.readAsText(file);
  }

  function resetCharacter() {
    if (global.confirm && !global.confirm('Azzerare la bozza del personaggio? L’operazione non può essere annullata.')) return;
    state = defaultState();
    try {
      if (global.localStorage) global.localStorage.removeItem(STORAGE_KEY);
    } catch (_error) {
      /* localStorage può essere disabilitato: lo stato in memoria è già pulito. */
    }
    appRoot.innerHTML = renderShell();
    refreshAll();
    setStatus('Nuovo personaggio pronto.');
  }

  /* ── Eventi ─────────────────────────────────────────────── */

  function onInput(event) {
    var target = event.target;
    if (!target) return;
    if (target.matches('input[data-field]:not([type="checkbox"]), textarea[data-field]')) {
      var field = target.getAttribute('data-field');
      if (field === 'gold') state.gold = clamp(integer(target.value, 0), 0, 999999);
      else if (field === 'bonusHp') state.bonusHp = clamp(integer(target.value, 0), 0, 99);
      else state[field] = String(target.value || '');
      saveAndRefresh();
      return;
    }
    if (target.matches('input[data-stat-manual]')) {
      var ability = target.getAttribute('data-stat-manual');
      state.scores[ability] = clamp(integer(target.value, 10), 3, 18);
      saveAndRefresh();
    }
  }

  function onChange(event) {
    var target = event.target;
    if (!target) return;
    if (target.matches('select[data-field]')) {
      var field = target.getAttribute('data-field');
      state[field] = target.value;
      if (field === 'klass') {
        state.subclass = '';
        state.skills = [];
        saveState();
        refreshAfterStructuralChange();
        return;
      }
      if (field === 'method') {
        if (state.method === 'standard' && !validateStandardArray(state.scores)) state.scores = defaultScores();
        if (state.method === 'pointbuy') {
          ABILITIES.forEach(function (ability) {
            state.scores[ability.key] = clamp(state.scores[ability.key], 8, 15);
          });
        }
        saveState();
        renderStats();
        renderSummary();
        renderSheet();
        return;
      }
      saveAndRefresh();
      if (field === 'species') renderSpeciesInfo();
      if (field === 'subclass') renderSubclassInfo();
      if (field === 'armor') renderSummary();
      return;
    }

    if (target.matches('select[data-standard]')) {
      var key = target.getAttribute('data-standard');
      var value = parseInt(target.value, 10);
      var previous = state.scores[key];
      ABILITIES.forEach(function (ability) {
        if (ability.key !== key && state.scores[ability.key] === value) state.scores[ability.key] = previous;
      });
      state.scores[key] = value;
      saveState();
      renderStats();
      renderSummary();
      renderSheet();
      return;
    }

    if (target.matches('input[data-skill]')) {
      var id = target.getAttribute('data-skill');
      var index = state.skills.indexOf(id);
      if (target.checked && index === -1) state.skills.push(id);
      if (!target.checked && index !== -1) state.skills.splice(index, 1);
      saveState();
      renderSkills();
      renderSummary();
      renderSheet();
      return;
    }

    if (target.matches('input[data-asi]')) {
      var abilityKey = target.getAttribute('data-asi');
      if (target.checked && abilityIncreaseTotal(state.abilityIncreases) >= 3) {
        target.checked = false;
        return;
      }
      state.abilityIncreases[abilityKey] = target.checked ? 1 : 0;
      saveState();
      renderAbilityIncreases();
      renderStats();
      renderSummary();
      renderSheet();
      return;
    }

    if (target.matches('input[data-field="shield"]')) {
      state.shield = target.checked;
      saveAndRefresh();
      return;
    }

    if (target.matches('input[data-import]')) {
      importJson(target.files && target.files[0]);
    }
  }

  function onClick(event) {
    var target = event.target.closest ? event.target.closest('[data-action]') : null;
    if (!target) return;
    var action = target.getAttribute('data-action');
    if (action === 'go') {
      goTo(target.getAttribute('data-target'));
      return;
    }
    if (action === 'use-species-speed') {
      state.speed = target.getAttribute('data-speed') || state.speed;
      var speedInput = appRoot && appRoot.querySelector('[data-field="speed"]');
      if (speedInput) speedInput.value = state.speed;
      saveAndRefresh();
      return;
    }
    if (action === 'filter-species') {
      ui.speciesFilter = target.getAttribute('data-value');
      var species = selectedSpecies();
      if (species && ui.speciesFilter !== 'all' && species.origin !== ui.speciesFilter) state.species = '';
      renderSpeciesSelect();
      renderSpeciesInfo();
      refreshFilterButtons();
      renderSummary();
      renderSheet();
      return;
    }
    if (action === 'filter-subclass') {
      ui.subclassFilter = target.getAttribute('data-value');
      var subclass = selectedSubclass();
      if (subclass && ui.subclassFilter !== 'all' && subclass.origin !== ui.subclassFilter) state.subclass = '';
      renderSubclassSelect();
      renderSubclassInfo();
      refreshFilterButtons();
      renderSummary();
      renderSheet();
      return;
    }
    if (action === 'pb') {
      var ability = target.getAttribute('data-ability');
      var delta = parseInt(target.getAttribute('data-delta'), 10);
      var score = state.scores[ability];
      var next = score + delta;
      var total = pointBuyTotal(state.scores);
      var nextTotal = total - (pointBuyCost(score) || 0) + (pointBuyCost(next) || 0);
      if (next < 8 || next > 15 || nextTotal > 27) return;
      state.scores[ability] = next;
      saveState();
      renderStats();
      renderSummary();
      renderSheet();
      return;
    }
    if (action === 'standard-array') {
      state.scores = defaultScores();
      saveState();
      renderStats();
      renderSummary();
      renderSheet();
      return;
    }
    if (action === 'print') {
      printSheet();
      return;
    }
    if (action === 'copy') {
      copySummary();
      return;
    }
    if (action === 'export') {
      exportJson();
      return;
    }
    if (action === 'reset') {
      resetCharacter();
    }
  }

  function bindEvents(root) {
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
  }

  /* ── Avvio ──────────────────────────────────────────────── */

  function loadCatalog() {
    return Promise.all([
      fetch('/content/pages/materiale-approvato.json').then(function (response) {
        if (!response.ok) throw new Error('materiale approvato');
        return response.json();
      }),
      fetch('/content/pages/specie-homebrew.json').then(function (response) {
        if (!response.ok) throw new Error('specie homebrew');
        return response.json();
      }),
      fetch('/content/pages/sottoclassi-homebrew.json').then(function (response) {
        if (!response.ok) throw new Error('sottoclassi homebrew');
        return response.json();
      })
    ]).then(function (documents) {
      return buildCatalog(
        parseApprovedTable(documents[0].content),
        documents[1].content,
        documents[2].content
      );
    });
  }

  function mount(root) {
    if (!root) return;
    appRoot = root;
    root.innerHTML = '<div class="cpg-loading" role="status" aria-live="polite">Caricamento del materiale approvato e homebrew…</div>';
    loadCatalog()
      .then(function (dataCatalog) {
        catalog = dataCatalog;
        state = loadState();
        reconcileState();
        root.innerHTML = renderShell();
        bindEvents(root);
        refreshAll();
        setStatus('Bozza salvata in questo browser.');
      })
      .catch(function () {
        root.innerHTML =
          '<div class="cpg-error"><strong>Non riesco a caricare il materiale.</strong>' +
          '<p>Controlla la connessione e riprova: il builder legge i JSON della wiki.</p>' +
          '<button type="button" class="cpg-btn" data-action="retry">Riprova</button></div>';
        var retry = root.querySelector('[data-action="retry"]');
        if (retry) retry.addEventListener('click', function () { mount(root); });
      });
  }

  /* ── Stili di stampa autocontenuti ───────────────────────── */

  var PRINT_CSS =
    'body{font-family:Georgia,serif;color:#1b160d;background:#fff;margin:28px;font-size:12px;line-height:1.45}' +
    '.cpg-sheet{max-width:820px;margin:0 auto;border:1px solid #b28a35;padding:26px 30px}' +
    '.cpg-sheet-head{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #b28a35;padding-bottom:12px}' +
    '.cpg-sheet-kicker{margin:0 0 4px;text-transform:uppercase;letter-spacing:.16em;font-size:9px;color:#6d531d}' +
    '.cpg-sheet h2{font-size:26px;margin:0 0 3px}.cpg-sheet-sub{margin:0;color:#4d4128}' +
    '.cpg-sheet-mark{font-size:30px;color:#b28a35}.cpg-sheet-abilities{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:16px 0}' +
    '.cpg-sheet-abilities>div{border:1px solid #c9b27d;text-align:center;padding:7px 4px}' +
    '.cpg-sheet-abilities span{display:block;font-size:8px;letter-spacing:.12em;color:#6d531d}' +
    '.cpg-sheet-abilities strong{display:block;font-size:18px}.cpg-sheet-abilities em{font-style:normal;font-size:10px}' +
    '.cpg-sheet-combat{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 16px}' +
    '.cpg-sheet-combat>div{border:1px solid #d8c9a3;padding:7px 9px}' +
    '.cpg-sheet-combat span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:#6d531d}' +
    '.cpg-sheet-combat strong{font-size:16px}.cpg-sheet-columns{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:14px}' +
    '.cpg-sheet h3{font-size:12px;text-transform:uppercase;letter-spacing:.12em;border-bottom:1px solid #c9b27d;padding-bottom:4px;margin:0 0 7px}' +
    '.cpg-sheet-list{list-style:none;padding:0;margin:0}.cpg-sheet-list li{display:flex;justify-content:space-between;gap:16px;border-bottom:1px dotted #d8c9a3;padding:3px 0}' +
    '.cpg-sheet-list em{font-style:normal}.cpg-prof{color:#8a641c}.cpg-sheet-details{margin:0}.cpg-sheet-details>div{display:flex;gap:8px;padding:3px 0;border-bottom:1px dotted #d8c9a3}' +
    '.cpg-sheet-details dt{min-width:112px;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#6d531d}.cpg-sheet-details dd{margin:0}' +
    '.cpg-sheet-story{margin-top:10px}.cpg-sheet-story p{margin:0 0 9px;white-space:normal}' +
    '.cpg-sheet-pre{margin:0;white-space:pre-wrap;font-family:inherit;font-size:12px;line-height:1.45}' +
    '.cpg-sheet-note{font-size:9px;color:#6d531d;margin:8px 0 0}.cpg-sheet-foot{border-top:1px solid #c9b27d;margin-top:14px;padding-top:8px;font-size:9px;color:#4d4128}' +
    '.cpg-sheet-empty{font-style:italic;color:#6d531d}@page{margin:14mm}@media print{.cpg-sheet{border:none;padding:0;max-width:none}}';

  global.ArcCharacterBuilder = {
    parseApprovedTable: parseApprovedTable,
    parseHomebrewSpecies: parseHomebrewSpecies,
    parseHomebrewSubclasses: parseHomebrewSubclasses,
    buildCatalog: buildCatalog,
    abilityMod: abilityMod,
    pointBuyCost: pointBuyCost,
    pointBuyTotal: pointBuyTotal,
    validateStandardArray: validateStandardArray,
    computeSheet: computeSheet,
    defaultState: defaultState,
    normalizeState: normalizeState,
    slugify: slugify,
    CLASSES: CLASSES,
    SKILLS: SKILLS,
    STANDARD_ARRAY: STANDARD_ARRAY,
    AC_MODES: AC_MODES,
    FEATS: FEATS,
    abilityIncreaseTotal: abilityIncreaseTotal,
    classProficiencyText: classProficiencyText,
    finalScoreFor: finalScoreFor
  };
  global._creaPgInit = mount;
})(window);
