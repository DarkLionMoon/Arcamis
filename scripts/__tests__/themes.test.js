/* ════════════════════════════════════════════════════════════
   Test di parità dei temi.

   I temi alternativi non devono limitarsi a poche regole per
   topbar e card: ogni tema deve definire lo stesso set di token
   del tema base, e i token usati per il testo devono restare
   leggibili (WCAG AA, 4.5:1) sulle superfici di quel tema.

   Il test legge i CSS reali (style-base.css :root e i blocchi
   body.light / body.theme-* in style-ui.css), quindi non può
   divergere dal foglio di stile: se qualcuno cambia un colore
   senza rispettare il contrasto, la CI lo segnala.
════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const baseCss = fs.readFileSync(path.join(root, 'scripts/css/style-base.css'), 'utf8');
/* theme-v2.css si carica dopo lo base e rimappa i token sulla palette
   Dark Hextech: è il valore effettivo, quindi il test deve leggerlo. */
const v2Css = fs.readFileSync(path.join(root, 'scripts/css/theme-v2.css'), 'utf8');
const uiCss = fs.readFileSync(path.join(root, 'scripts/css/style-ui.css'), 'utf8');

/* Token che ogni tema deve ridefinire per essere "completo". */
const REQUIRED_TOKENS = [
  '--bg',
  '--bg2',
  '--bg3',
  '--bg4',
  '--bg5',
  '--panel',
  '--bdr',
  '--bdr2',
  '--bdr3',
  '--gold',
  '--gold2',
  '--gold3',
  '--gold4',
  '--gold-rgb',
  '--copper',
  '--parch',
  '--text',
  '--text2',
  '--text3',
  '--white',
  '--violet',
  '--violet2',
  '--violet3',
  '--teal',
  '--teal2',
  '--teal3',
  '--glow',
  '--glow2',
  '--vglow',
  '--surface-rgb',
  '--panel-rgb',
  '--accent',
  '--accent-deep',
  '--accent-rgb',
];

/* Ruoli tipografici: devono passare AA su sfondo e pannello. */
const TEXT_TOKENS = ['--text', '--text2', '--text3', '--parch', '--copper', '--gold', '--white'];

function extractBlock(source, selector) {
  const pattern = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([\\s\\S]*?)\\}');
  const match = source.match(pattern);
  return match ? match[1] : '';
}

function parseTokens(block) {
  const tokens = {};
  for (const match of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

function parseColor(value) {
  const text = String(value).trim();
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgba = text.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const parts = rgba[1].split(',').map((part) => parseFloat(part.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  return null;
}

function luminance({ r, g, b }) {
  const channel = (value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/* Composita il testo semitrasparente sulla superficie, come fa il browser. */
function over(foreground, background) {
  const alpha = foreground.a === undefined ? 1 : foreground.a;
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  };
}

function contrast(foreground, background) {
  const fg = over(foreground, background);
  const l1 = luminance(fg);
  const l2 = luminance(background);
  const high = Math.max(l1, l2);
  const low = Math.min(l1, l2);
  return (high + 0.05) / (low + 0.05);
}

const baseTokens = {
  ...parseTokens(extractBlock(baseCss, ':root')),
  ...parseTokens(extractBlock(v2Css, ':root'))
};
const themes = {
  dark: baseTokens,
  light: { ...baseTokens, ...parseTokens(extractBlock(uiCss, 'body.light')) },
  blood: { ...baseTokens, ...parseTokens(extractBlock(uiCss, 'body.theme-blood')) },
  forest: { ...baseTokens, ...parseTokens(extractBlock(uiCss, 'body.theme-forest')) },
  abyss: { ...baseTokens, ...parseTokens(extractBlock(uiCss, 'body.theme-abyss')) },
  alchemy: { ...baseTokens, ...parseTokens(extractBlock(uiCss, 'body.theme-alchemy')) },
};

describe('parità dei temi', () => {
  it('definisce i token della palette v2', () => {
    const v2 = parseTokens(extractBlock(v2Css, ':root'));
    for (const token of ['--void', '--navy', '--bevel', '--accent', '--accent-rgb', '--glow-teal', '--ring']) {
      expect(v2[token], `theme-v2: manca ${token}`).toBeTruthy();
    }
    const accent = parseColor(v2['--accent']);
    const background = parseColor(v2['--bg']);
    expect(contrast(accent, background), 'accento ciano su sfondo').toBeGreaterThanOrEqual(3);
  });

  it('definisce tutti i token in ogni tema', () => {
    for (const [name, tokens] of Object.entries(themes)) {
      const missing = REQUIRED_TOKENS.filter((token) => !(token in tokens));
      expect(missing, `tema ${name}: token mancanti ${missing.join(', ')}`).toEqual([]);
    }
  });

  it('usa colori di testo opachi (niente alpha che abbassa il contrasto)', () => {
    for (const [name, tokens] of Object.entries(themes)) {
      for (const token of ['--text', '--text2', '--text3']) {
        const color = parseColor(tokens[token]);
        expect(color, `tema ${name}: ${token} non parsabile`).toBeTruthy();
        expect(color.a, `tema ${name}: ${token} è semitrasparente`).toBe(1);
      }
    }
  });

  it('mantiene il contrasto AA (4.5:1) su sfondo e pannello', () => {
    for (const [name, tokens] of Object.entries(themes)) {
      const background = parseColor(tokens['--bg']);
      const panel = parseColor(tokens['--panel']);
      expect(background && panel, `tema ${name}: superfici non parsabili`).toBeTruthy();
      for (const token of TEXT_TOKENS) {
        const color = parseColor(tokens[token]);
        expect(color, `tema ${name}: ${token} non parsabile`).toBeTruthy();
        const onBg = contrast(color, background);
        const onPanel = contrast(color, panel);
        expect(onBg, `tema ${name}: ${token} su --bg = ${onBg.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
        expect(onPanel, `tema ${name}: ${token} su --panel = ${onPanel.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
