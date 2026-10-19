import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SETTINGS,
  MAX_SLIDES,
  defaultSlides,
  sanitizeConfig,
  seedSlidesFromLegacy,
  visibleSlides,
} from '../api/_lib/carousel-config.js';

const validators = {
  isValidImage: (v) => v.startsWith('/') || v.startsWith('https://'),
  isValidHref: (v) => !v || v.startsWith('/') || v.startsWith('https://'),
};

function slide(over = {}) {
  return {
    id: 'promo',
    label: 'Promo',
    img: '/images/x.webp',
    tag: 'Tag',
    tit: 'Titolo',
    sub: 'Sottotitolo',
    desc: 'Descrizione',
    btns: [{ label: 'Vai', href: '/lore' }],
    hidden: false,
    ...over,
  };
}

describe('sanitizeConfig', () => {
  it('accetta un manifest completo e normalizza le impostazioni', () => {
    const { config, error } = sanitizeConfig(
      { slides: [slide()], settings: { intervalMs: 9000, pauseOnHover: false } },
      validators
    );
    expect(error).toBeUndefined();
    expect(config.slides).toHaveLength(1);
    expect(config.slides[0].hidden).toBe(false);
    expect(config.slides[0].sub).toBe('Sottotitolo');
    expect(config.settings).toEqual({ intervalMs: 9000, pauseOnHover: false });
  });

  it('applica i default quando mancano le impostazioni', () => {
    const { config } = sanitizeConfig({ slides: [slide()] }, validators);
    expect(config.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('aggancia l’intervallo ai limiti 2s–30s', () => {
    expect(
      sanitizeConfig({ slides: [slide()], settings: { intervalMs: 500 } }, validators).config.settings.intervalMs
    ).toBe(2000);
    expect(
      sanitizeConfig({ slides: [slide()], settings: { intervalMs: 99999 } }, validators).config.settings.intervalMs
    ).toBe(30000);
  });

  it('rifiuta lista vuota, troppa lunga e id invalidi/duplicati', () => {
    expect(sanitizeConfig({ slides: [] }, validators).error).toMatch(/almeno una/);
    const many = Array.from({ length: MAX_SLIDES + 1 }, (_, i) => slide({ id: `s${i}` }));
    expect(sanitizeConfig({ slides: many }, validators).error).toMatch(/Massimo/);
    expect(sanitizeConfig({ slides: [slide({ id: 'NO!' })] }, validators).error).toMatch(/id non valido/);
    expect(sanitizeConfig({ slides: [slide({ id: 'a' }), slide({ id: 'a' })] }, validators).error).toMatch(/duplicato/);
  });

  it('rifiuta testi troppo lunghi, immagini e href non validi', () => {
    expect(sanitizeConfig({ slides: [slide({ tit: 'x'.repeat(201) })] }, validators).error).toMatch(/troppo lungo/);
    expect(sanitizeConfig({ slides: [slide({ sub: 'x'.repeat(201) })] }, validators).error).toMatch(/troppo lungo/);
    expect(sanitizeConfig({ slides: [slide({ img: 'ftp://x' })] }, validators).error).toMatch(/immagine non valida/);
    expect(
      sanitizeConfig({ slides: [slide({ btns: [{ label: 'B', href: 'javascript:x' }] })] }, validators).error
    ).toMatch(/link del bottone/);
    expect(sanitizeConfig({ slides: [slide({ btns: [{ label: '', href: '/x' }] })] }, validators).error).toMatch(
      /bisogno di un testo/
    );
  });

  it('rifiuta il manifest con tutte le slide nascoste', () => {
    const { error } = sanitizeConfig({ slides: [slide({ hidden: true })] }, validators);
    expect(error).toMatch(/visibile/);
  });

  it('salta i bottoni vuoti e tiene hidden', () => {
    const { config } = sanitizeConfig(
      {
        slides: [
          slide({ id: 'a' }),
          slide({
            id: 'b',
            btns: [
              { label: '', href: '' },
              { label: 'Ok', href: '' },
            ],
            hidden: true,
          }),
        ],
      },
      validators
    );
    expect(config.slides[1].btns).toEqual([{ label: 'Ok', href: '' }]);
    expect(config.slides[1].hidden).toBe(true);
  });
});

describe('seedSlidesFromLegacy', () => {
  it('fonde override KV sui default e mantiene i bottoni di seed se assenti', () => {
    const seeded = seedSlidesFromLegacy([
      { key: 'carousel_0', img: '/images/a.webp', meta: { tit: 'Nuovo' }, btns: [] },
      { key: 'carousel_1', img: '', meta: {}, btns: [] },
    ]);
    expect(seeded).toHaveLength(2);
    expect(seeded[0]).toMatchObject({ id: 'carousel_0', img: '/images/a.webp', tit: 'Nuovo' });
    expect(seeded[0].tag).toBe(defaultSlides()[0].tag);
    expect(seeded[0].sub).toBe('');
    expect(defaultSlides().every((s) => s.sub === '')).toBe(true);
    expect(seeded[1].btns).toEqual(defaultSlides()[1].btns);
    expect(seeded.every((s) => s.hidden === false)).toBe(true);
  });
});

describe('visibleSlides', () => {
  it('esclude le nascoste mantenendo l’ordine', () => {
    const out = visibleSlides([{ id: 'a' }, { id: 'b', hidden: true }, { id: 'c', hidden: false }]);
    expect(out.map((s) => s.id)).toEqual(['a', 'c']);
  });
});
