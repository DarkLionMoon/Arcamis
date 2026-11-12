import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { compareRaceInfo } from '../check-scheda-race-info.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const xlsx = fs.readFileSync(path.join(root, 'public/sheets/arcamis-scheda-base.xlsx'));
const imported = JSON.parse(
  fs.readFileSync(path.join(root, 'public/data/specie-scheda.json'), 'utf8')
);

describe('crea-pg · Race Info', () => {
  it('coincide con i dati importati nel builder', () => {
    const result = compareRaceInfo(xlsx, imported);
    if (result.differences.length) {
      throw new Error(
        'La tab Race Info non coincide più con il builder:\n' +
          result.differences.slice(0, 40).join('\n')
      );
    }
    expect(result.parsed.count).toBe(124);
    expect(result.importedCount).toBe(124);
  });

  it('segnala una differenza tra scheda e builder', () => {
    const altered = structuredClone(imported);
    altered.races.Aarakocra.speed = '99 ft';
    const result = compareRaceInfo(xlsx, altered);
    expect(result.differences.some((difference) => difference.includes('Aarakocra'))).toBe(true);
    expect(result.differences.some((difference) => difference.includes('Velocità'))).toBe(true);
  });
});
