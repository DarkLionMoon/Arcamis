/* ════════════════════════════════════════════════════════════════
   ARCAMIS — test del builder del personaggio

   Il builder legge i contenuti reali della wiki: questi test usano i
   JSON versionati, non fixture inventate. Se una pagina homebrew cambia
   struttura o la tabella approvata perde righe, il test lo segnala.
   ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

function readContent(key) {
  return JSON.parse(fs.readFileSync(path.join(root, 'content/pages', `${key}.json`), 'utf8')).content;
}

function loadBuilder() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/crea-pg.js'), 'utf8'), sandbox);
  return sandbox.window.ArcCharacterBuilder;
}

const builder = loadBuilder();
const approvedRows = builder.parseApprovedTable(readContent('materiale-approvato'));
const catalog = builder.buildCatalog(approvedRows, readContent('specie-homebrew'), readContent('sottoclassi-homebrew'));

describe('crea-pg · materiale approvato', () => {
  it('legge la tabella senza intestazioni né righe separatore', () => {
    expect(approvedRows.length).toBeGreaterThan(240);
    expect(approvedRows.some((row) => row.name === 'Voce')).toBe(false);
    expect(approvedRows.some((row) => /^:?-+:?$/.test(row.name))).toBe(false);
  });

  it('riconosce le specie approvate e la nota di Khoravar', () => {
    expect(catalog.approvedSpecies).toHaveLength(92);
    expect(catalog.approvedSpecies.find((item) => item.name === 'Khoravar')).toMatchObject({
      source: 'EFA',
      note: 'Half-Elf nel server',
    });
  });

  it('tiene le sottoclassi approvate e lascia l’homebrew alle pagine dedicate', () => {
    expect(catalog.approvedSubclasses).toHaveLength(141);
    expect(catalog.approvedSubclasses.some((item) => item.source === 'Homebrew')).toBe(false);
    expect(catalog.approvedSubclasses.find((item) => item.name === 'Champion')).toMatchObject({
      classKey: 'fighter',
      source: "PHB'24",
    });
  });
});

describe('crea-pg · homebrew', () => {
  it('legge tutte le specie homebrew e i loro metadati', () => {
    expect(catalog.homebrewSpecies).toHaveLength(34);
    expect(catalog.homebrewSpecies.find((item) => item.name === 'Asceso di Shurima')).toMatchObject({
      type: 'Mostruosità',
      size: 'Media',
    });
  });

  it('mappa le sottoclassi homebrew sulla classe italiana', () => {
    expect(catalog.homebrewSubclasses).toHaveLength(18);
    expect(catalog.homebrewSubclasses.find((item) => item.name === 'Sentiero degli abissi')).toMatchObject({
      classKey: 'barbarian',
      className: 'Barbaro',
    });
    expect(catalog.homebrewSubclasses.find((item) => item.name === 'Patto della Nebbia Oscura')).toMatchObject({
      classKey: 'warlock',
    });
  });

  it('non duplica gli id nel catalogo combinato', () => {
    const ids = catalog.allSpecies.concat(catalog.allSubclasses).map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(catalog.allSpecies).toHaveLength(126);
    expect(catalog.allSubclasses).toHaveLength(159);
  });

  it('usa i nomi della scheda e mostra la razza madre', () => {
    expect(catalog.approvedSpecies.find((item) => item.name === 'Astral Elf')).toMatchObject({
      parent: 'Elf',
      subrace: 'Astral',
      label: 'Elf (Astral)',
      sheetName: 'Elf (Astral)',
    });
    expect(catalog.homebrewSpecies.find((item) => item.name === 'Accidia')).toMatchObject({
      parent: 'Demone Capitale',
      subrace: 'Accidia',
      label: 'Demone Capitale (Accidia)',
      sheetName: 'Demone Capitale (Accidia)',
    });
    expect(catalog.homebrewSpecies.find((item) => item.name === 'Briny')).toMatchObject({
      parent: 'Vastaya',
      subrace: 'Bryni',
      label: 'Vastaya (Bryni)',
      sheetName: 'Vastaya (Bryni)',
    });
    expect(catalog.homebrewSpecies.find((item) => item.name === 'Liotlan')).toMatchObject({
      parent: 'Vastaya',
      subrace: 'Lhotlan',
      label: 'Vastaya (Lhotlan)',
      sheetName: 'Vastaya (Lhotlan)',
    });
    expect(
      catalog.approvedSpecies.find(
        (item) => item.name === 'Dragonborn Metallici e Cromatici' && item.subrace === 'Black'
      )
    ).toMatchObject({ label: 'Dragonborn (Black)', sheetName: 'Dragonborn (Black)' });
    expect(
      catalog.approvedSpecies.find((item) => item.name === 'Elf' && item.subrace === 'Wood')
    ).toMatchObject({ label: 'Elf (Wood)', sheetName: 'Elf (Wood)' });
    expect(catalog.approvedSpecies.find((item) => item.name === 'Khoravar')).toMatchObject({
      label: 'Half elf',
      sheetName: 'Half elf',
    });
    expect(catalog.approvedSpecies.find((item) => item.name === 'Yuan-ti')).toMatchObject({
      label: 'Yuan-Ti',
      sheetName: 'Yuan-Ti',
    });
    expect(
      catalog.homebrewSpecies.find((item) => item.name === 'Baccai' && item.subrace === 'Bestiale')
    ).toMatchObject({ label: 'Baccai (Bestiale)', sheetName: 'Baccai (Bestiale)' });
  });
});

describe('crea-pg · regole e calcoli', () => {
  it('calcola modificatori e costi Point Buy', () => {
    expect(builder.abilityMod(8)).toBe(-1);
    expect(builder.abilityMod(10)).toBe(0);
    expect(builder.abilityMod(15)).toBe(2);
    expect(builder.pointBuyCost(8)).toBe(0);
    expect(builder.pointBuyCost(14)).toBe(7);
    expect(builder.pointBuyCost(15)).toBe(9);
  });

  it('riconosce lo Standard Array e il suo costo', () => {
    const state = builder.defaultState();
    expect(builder.validateStandardArray(state.scores)).toBe(true);
    expect(builder.pointBuyTotal(state.scores)).toBe(27);
  });

  it('calcola PF, CA, tiri salvezza e percezione passiva', () => {
    const state = {
      ...builder.defaultState(),
      name: 'Test',
      klass: 'fighter',
      species: 'approved:species:aarakocra',
      subclass: 'approved:subclass:fighter:champion',
      scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      skills: ['athletics', 'perception'],
      armor: 'chain-mail',
      shield: true,
    };
    const sheet = builder.computeSheet(state, catalog);
    expect(sheet.hp).toBe(11);
    expect(sheet.ac).toBe(18);
    expect(sheet.initiative).toBe(2);
    expect(sheet.saves.str).toMatchObject({ value: 4, proficient: true });
    expect(sheet.saves.con).toMatchObject({ value: 3, proficient: true });
    expect(sheet.saves.dex).toMatchObject({ value: 2, proficient: false });
    expect(sheet.passive).toBe(12);
    expect(sheet.skills.find((skill) => skill.id === 'athletics')).toMatchObject({
      label: 'Atletica',
      mod: 4,
    });
  });

  it('calcola il profilo magico per un incantatore', () => {
    const state = {
      ...builder.defaultState(),
      klass: 'wizard',
      scores: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
    };
    const sheet = builder.computeSheet(state, catalog);
    expect(sheet.spellSave).toBe(12);
    expect(sheet.spellAttack).toBe(4);
  });

  it('applica i tre incrementi della specie e il PF bonus della scheda server', () => {
    const state = {
      ...builder.defaultState(),
      klass: 'fighter',
      scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      abilityIncreases: { str: 1, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
      bonusHp: 1,
    };
    const sheet = builder.computeSheet(state, catalog);
    expect(sheet.scores).toMatchObject({ str: 16, dex: 15, con: 14 });
    expect(sheet.mods.str).toBe(3);
    expect(sheet.mods.con).toBe(2);
    expect(sheet.hp).toBe(13);
    expect(builder.abilityIncreaseTotal(state.abilityIncreases)).toBe(3);
  });

  it('limita a tre gli incrementi anche importando un JSON più permissivo', () => {
    const state = builder.normalizeState({
      abilityIncreases: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    });
    expect(builder.abilityIncreaseTotal(state.abilityIncreases)).toBe(3);
  });

  it('calcola la CA delle difese di classe e delle formule della scheda', () => {
    const barbarian = {
      ...builder.defaultState(),
      klass: 'barbarian',
      armor: 'none',
      scores: { str: 16, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
    };
    expect(builder.computeSheet(barbarian, catalog).ac).toBe(15);

    const monk = {
      ...builder.defaultState(),
      klass: 'monk',
      armor: 'none',
      scores: { str: 10, dex: 16, con: 12, int: 10, wis: 14, cha: 8 },
    };
    expect(builder.computeSheet(monk, catalog).ac).toBe(15);

    const natural = {
      ...builder.defaultState(),
      klass: 'fighter',
      armor: 'none',
      acMode: 'natural1',
      scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    };
    expect(builder.computeSheet(natural, catalog).ac).toBe(13);
  });

  it('mostra le competenze di classe della scheda server', () => {
    const fighter = builder.CLASSES.find((cls) => cls.id === 'fighter');
    expect(builder.classProficiencyText(fighter)).toContain('Tutte le armature');
    expect(builder.classProficiencyText(fighter)).toContain('Armi semplici e da guerra');
  });
});
