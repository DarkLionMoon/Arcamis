/* ════════════════════════════════════════════════════════════════
   ARCAMIS — controllo della tab Race Info

   Confronta la tab `Race Info` del file XLSX ufficiale con
   public/data/specie-scheda.json, cioè con i dati che il builder usa
   davvero. Se la scheda cambia e il JSON non viene rigenerato, il
   controllo elenca le differenze.

   Uso:
     node scripts/check-scheda-race-info.mjs
     node scripts/check-scheda-race-info.mjs --warn   # non fallisce
     node scripts/check-scheda-race-info.mjs --json /tmp/specie.json

   Non usa dipendenze esterne: il lettore ZIP/XML è volutamente minimo
   e copre solo i file OOXML necessari.
   ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const XLSX_PATH = path.join(ROOT, 'public/sheets/arcamis-scheda-base.xlsx');
const JSON_PATH = path.join(ROOT, 'public/data/specie-scheda.json');

const FIELDS = [
  ['ac', 'D', 'CA naturale'],
  ['speed', 'E', 'Velocità'],
  ['hp', 'F', 'PF bonus per livello'],
  ['resistances', 'G', 'Resistenze, immunità e vulnerabilità'],
  ['languages', 'H', 'Lingue'],
  ['attack', 'I', 'Attacco naturale'],
  ['proficiencies', 'J', 'Competenze armi e armature'],
  ['features', 'K', 'Altri tratti e competenze']
];

function decodeXml(text) {
  return String(text || '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, code) => {
    const key = String(code).toLowerCase();
    if (key.charAt(0) === '#') {
      const value =
        key.charAt(1) === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
      try {
        return String.fromCodePoint(value);
      } catch (_error) {
        return match;
      }
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[key] || match;
  });
}

function textNodes(xml) {
  const values = [];
  const re = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
  let match;
  while ((match = re.exec(xml))) values.push(decodeXml(match[1]));
  return values.join('');
}

function readZipEntries(buffer) {
  let eocd = -1;
  const min = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= min; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('ZIP: directory centrale non trovata');

  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('ZIP: voce della directory centrale non valida');
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    entries.set(name, { method, compressedSize, uncompressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function readZipText(buffer, entries, name) {
  const entry = entries.get(name);
  if (!entry) throw new Error('ZIP: file mancante ' + name);
  if (buffer.readUInt32LE(entry.localOffset) !== 0x04034b50) {
    throw new Error('ZIP: intestazione locale non valida per ' + name);
  }
  const nameLength = buffer.readUInt16LE(entry.localOffset + 26);
  const extraLength = buffer.readUInt16LE(entry.localOffset + 28);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(start, start + entry.compressedSize);
  let data;
  if (entry.method === 0) data = compressed;
  else if (entry.method === 8) data = zlib.inflateRawSync(compressed);
  else throw new Error('ZIP: compressione non supportata (' + entry.method + ') per ' + name);
  return data.toString('utf8');
}

function resolveRaceInfoSheet(entries, readText) {
  const workbook = readText('xl/workbook.xml');
  const sheetTag = /<sheet\b[^>]*\bname="Race Info"[^>]*>/i.exec(workbook);
  if (!sheetTag) throw new Error('XLSX: tab "Race Info" non trovata');
  const relationId = /\br:id="([^"]+)"/i.exec(sheetTag[0]);
  if (!relationId) throw new Error('XLSX: relazione della tab "Race Info" non trovata');

  const rels = readText('xl/_rels/workbook.xml.rels');
  const relPattern = new RegExp(
    '<Relationship\\b[^>]*\\bId="' + relationId[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*>',
    'i'
  );
  const relTag = relPattern.exec(rels);
  if (!relTag) throw new Error('XLSX: file della tab "Race Info" non trovato');
  const target = /\bTarget="([^"]+)"/i.exec(relTag[0]);
  if (!target) throw new Error('XLSX: percorso della tab "Race Info" non trovato');

  const normalized = target[1].replace(/^\/+/, '');
  return normalized.startsWith('xl/') ? normalized : 'xl/' + normalized;
}

function readSharedStrings(entries, readText) {
  if (!entries.has('xl/sharedStrings.xml')) return [];
  const xml = readText('xl/sharedStrings.xml');
  const values = [];
  const re = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match;
  while ((match = re.exec(xml))) values.push(textNodes(match[1].replace(/<rPh\b[\s\S]*?<\/rPh>/gi, '')));
  return values;
}

function readCells(xml, sharedStrings) {
  const cells = new Map();
  const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let match;
  while ((match = cellRe.exec(xml))) {
    const attrs = match[1] || '';
    const inner = match[2] || '';
    const ref = /\br="([A-Z]+\d+)"/i.exec(attrs);
    if (!ref) continue;
    const rowMatch = /^([A-Z]+)(\d+)$/.exec(ref[1]);
    if (!rowMatch) continue;
    const type = /\bt="([^"]+)"/i.exec(attrs);
    let value = '';
    if (type && type[1] === 'inlineStr') {
      value = textNodes(inner);
    } else {
      const v = /<v\b[^>]*>([\s\S]*?)<\/v>/i.exec(inner);
      if (v) {
        value = decodeXml(v[1]);
        if (type && type[1] === 's') value = sharedStrings[Number(value)] || '';
      }
    }
    const row = Number(rowMatch[2]);
    if (!cells.has(row)) cells.set(row, {});
    cells.get(row)[rowMatch[1]] = value;
  }
  return cells;
}

function clean(value) {
  const text = String(value == null ? '' : value)
    .replace(/\r\n/g, '\n')
    .trim();
  return text === '-' ? '' : text;
}

function normalizeSpeed(value) {
  const text = clean(value);
  if (/^\d+(?:\.0+)?$/.test(text)) return String(Math.trunc(Number(text))) + ' ft';
  return text;
}

function normalizeInteger(value) {
  const text = clean(value);
  return /^\d+\.0+$/.test(text) ? text.replace(/\.0+$/, '') : text;
}

export function readRaceInfoFromXlsx(buffer) {
  const entries = readZipEntries(buffer);
  const readText = (name) => readZipText(buffer, entries, name);
  const sheetPath = resolveRaceInfoSheet(entries, readText);
  const sharedStrings = readSharedStrings(entries, readText);
  const cells = readCells(readText(sheetPath), sharedStrings);

  let headerRow = 0;
  for (const [row, values] of cells) {
    if (clean(values.B) === 'Race Name') {
      headerRow = row;
      break;
    }
  }
  if (!headerRow) throw new Error('XLSX: intestazione "Race Name" non trovata');

  const races = {};
  const rows = {};
  const rowNumbers = [...cells.keys()].filter((row) => row > headerRow).sort((a, b) => a - b);
  for (const row of rowNumbers) {
    const values = cells.get(row);
    const name = clean(values.B);
    if (!name) continue;
    if (races[name]) {
      throw new Error('XLSX: razza duplicata "' + name + '" alla riga ' + row);
    }
    const record = {};
    for (const [key, column] of FIELDS) {
      let value = clean(values[column]);
      if (key === 'speed') value = normalizeSpeed(value);
      if (key === 'hp') value = normalizeInteger(value);
      if (value) record[key] = value;
    }
    races[name] = record;
    rows[name] = row;
  }

  return { sheetPath, headerRow, races, rows, count: Object.keys(races).length };
}

function formatValue(value) {
  if (value === undefined) return '(assente)';
  return JSON.stringify(value);
}

export function compareRaceInfo(buffer, importedData) {
  const parsed = readRaceInfoFromXlsx(buffer);
  const imported = importedData && importedData.races ? importedData.races : importedData || {};
  const differences = [];
  const importedNames = Object.keys(imported);
  const sheetNames = Object.keys(parsed.races);

  for (const name of sheetNames) {
    const row = parsed.rows[name];
    if (!Object.prototype.hasOwnProperty.call(imported, name)) {
      differences.push('Razza nella scheda ma non importata: "' + name + '" (riga ' + row + ')');
      continue;
    }
    for (const [key, , label] of FIELDS) {
      const fromSheet = parsed.races[name][key] || '';
      const fromBuilder = imported[name][key] || '';
      if (fromSheet !== fromBuilder) {
        differences.push(
          name +
            ' · ' +
            label +
            ': scheda ' +
            formatValue(fromSheet) +
            ' ≠ builder ' +
            formatValue(fromBuilder)
        );
      }
    }
  }

  for (const name of importedNames) {
    if (!Object.prototype.hasOwnProperty.call(parsed.races, name)) {
      differences.push('Razza importata ma non più nella scheda: "' + name + '"');
    }
  }

  return {
    parsed,
    importedCount: importedNames.length,
    differences
  };
}

function argument(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : '';
}

function main() {
  const warnOnly = process.argv.includes('--warn');
  const xlsxPath = argument('--xlsx') || XLSX_PATH;
  const jsonPath = argument('--json') || JSON_PATH;
  try {
    const buffer = fs.readFileSync(xlsxPath);
    const imported = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const result = compareRaceInfo(buffer, imported);

    if (result.differences.length) {
      console.warn(
        '\n⚠ Race Info non allineata: la scheda e public/data/specie-scheda.json differiscono.'
      );
      console.warn(
        '  Scheda: ' +
          result.parsed.count +
          ' razze · builder: ' +
          result.importedCount +
          ' razze · differenze: ' +
          result.differences.length
      );
      result.differences.slice(0, 40).forEach((difference) => console.warn('  - ' + difference));
      if (result.differences.length > 40) {
        console.warn('  … e altre ' + (result.differences.length - 40) + ' differenze.');
      }
      console.warn(
        '  Rigenera public/data/specie-scheda.json dalla tab Race Info e riprova.\n'
      );
      if (!warnOnly) process.exitCode = 1;
    } else {
      console.log(
        '✔ Race Info allineata: ' +
          result.parsed.count +
          ' razze e ' +
          FIELDS.length +
          ' campi coincidono con il builder.'
      );
    }
  } catch (error) {
    if (warnOnly) {
      console.warn('\n⚠ Controllo Race Info non eseguito: ' + error.message + '\n');
      return;
    }
    console.error('\n✖ Controllo Race Info non eseguito: ' + error.message + '\n');
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
