/* ════════════════════════════════════════════════════════════════
   Test della configurazione e del renderer della homepage.

   La home pubblica è HTML statico generato da content/homepage.json:
   qui si verifica che la configurazione sia valida e idempotente, che
   il rendering rispetti ordine/visibilità, che i testi siano sempre
   escapati e che index.html conservi i marcatori usati dal build.
   Se dist/ esiste, si controlla anche l'artefatto pubblicato.
   ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HOMEPAGE,
  HOMEPAGE_MAP_MARKER_END,
  HOMEPAGE_MAP_MARKER_START,
  HOMEPAGE_MARKER_END,
  HOMEPAGE_MARKER_START,
  defaultHomepage,
  homepageHash,
  normalizeHomepage,
  renderHomepageSections,
} from '../lib/homepage.mjs';

const root = process.cwd();
const contentFile = path.join(root, 'content/homepage.json');
const config = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const distFile = path.join(root, 'dist/index.html');
const hasDist = fs.existsSync(distFile);

describe('homepage — configurazione', () => {
  it('content/homepage.json è valido e senza avvisi', () => {
    const { errors, warnings, config: normalized } = normalizeHomepage(config);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(normalized.sections.length).toBeGreaterThan(0);
    expect(normalized.sections.map((section) => section.id)).toEqual(config.sections.map((section) => section.id));
  });

  it('la normalizzazione è idempotente (nessuna perdita al salvataggio)', () => {
    const once = normalizeHomepage(config).config;
    const twice = normalizeHomepage(JSON.parse(JSON.stringify(once))).config;
    expect(twice).toEqual(once);
  });

  it('i default del codice e il file versionato coincidono', () => {
    expect(normalizeHomepage(DEFAULT_HOMEPAGE).config.sections).toEqual(normalizeHomepage(config).config.sections);
    expect(defaultHomepage()).not.toBe(DEFAULT_HOMEPAGE);
  });

  it('scarta i tipi sconosciuti, rinomina gli id duplicati e blocca gli href pericolosi', () => {
    const { config: normalized, warnings } = normalizeHomepage({
      version: 1,
      sections: [
        { id: 'x', type: 'sconosciuta', label: 'X' },
        {
          id: 'news',
          type: 'news',
          label: 'News',
          links: [{ label: 'male', href: 'javascript:alert(1)' }],
        },
        { id: 'news', type: 'steps', label: 'Doppia' },
      ],
    });
    expect(normalized.sections.map((section) => section.id)).toEqual(['news', 'news-2']);
    expect(normalized.sections[0].links).toEqual([]);
    expect(warnings.join(' ')).toMatch(/duplicato/);
  });

  it('una configurazione assente ricade sui default', () => {
    const { config: normalized, warnings } = normalizeHomepage(null);
    expect(normalized.sections.length).toBe(defaultHomepage().sections.length);
    expect(warnings.length).toBe(1);
  });
});

describe('homepage — rendering', () => {
  it('rispetta ordine e visibilità delle sezioni', () => {
    const html = renderHomepageSections(config);
    const marche = html.indexOf('MARCHE DI ARCAMIS');
    const arcadia = html.indexOf('ARCADIA');
    const steps = html.indexOf('PARTI ALL');
    expect(marche).toBeGreaterThan(-1);
    expect(arcadia).toBeGreaterThan(marche);
    expect(steps).toBeGreaterThan(arcadia);
    expect(html).not.toContain('Wiki Completa');
  });

  it('scarta le sezioni nascoste e aggiunge il separatore solo dove previsto', () => {
    const { config: normalized } = normalizeHomepage(config);
    const news = normalized.sections.find((section) => section.id === 'novita');
    const custom = {
      ...normalized,
      sections: normalized.sections.map((section) =>
        section.id === 'novita' ? { ...news, visible: false } : section
      ),
    };
    const html = renderHomepageSections(custom);
    expect(html).not.toContain('NOVITÀ DAL SERVER');
    /* Tre sezioni visibili con divider (marche, arcadia, come iniziare):
       la sezione novità, nascosta, non ne aggiunge un quarto. */
    expect(html.match(/class="gold-sep"/g)?.length).toBe(3);
    expect(html.indexOf('class="gold-sep"')).toBeLessThan(html.indexOf('MARCHE DI ARCAMIS'));
  });

  it('escapa i testi e accetta solo il markup inline previsto', () => {
    const { config: normalized } = normalizeHomepage(config);
    const html = renderHomepageSections({
      ...normalized,
      sections: normalized.sections.map((section) =>
        section.type === 'marche'
          ? {
              ...section,
              title: '<script>alert(1)</script>',
              description: 'Una **Specie** e *classe*',
            }
          : section
      ),
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('<strong style="color:var(--gold2)">Specie</strong>');
    expect(html).toContain('<em>classe</em>');
  });

  it('inserisce la mappa solo dove richiesto e ne conserva il markup', () => {
    const map = '<div id="arcamis-map">map</div>';
    const withMap = renderHomepageSections(config, { mapHtml: map });
    expect(withMap).toContain(map);

    const { config: normalized } = normalizeHomepage(config);
    const noMap = renderHomepageSections(
      {
        ...normalized,
        sections: normalized.sections.map((section) => (section.type === 'marche' ? { ...section, showMap: false } : section)),
      },
      { mapHtml: map }
    );
    expect(noMap).not.toContain(map);
  });

  it('collega i card wiki alla rotta reale della pagina', () => {
    const { config: normalized } = normalizeHomepage(config);
    const html = renderHomepageSections(
      {
        ...normalized,
        sections: normalized.sections.map((section) => (section.type === 'wiki' ? { ...section, visible: true } : section)),
      },
      { pagePaths: { 'pag-mappe': 'lore/mappe' } }
    );
    expect(html).toContain('href="/lore/mappe"');
  });

  it('l’impronta cambia con l’ordine e con il contenuto', () => {
    const base = homepageHash(config);
    expect(homepageHash(JSON.parse(JSON.stringify(config)))).toBe(base);
    const reordered = {
      ...config,
      sections: [config.sections[1], config.sections[0], ...config.sections.slice(2)],
    };
    expect(homepageHash(reordered)).not.toBe(base);
    const edited = {
      ...config,
      sections: config.sections.map((section) =>
        section.type === 'arcadia' ? { ...section, title: 'ARCADIA NUOVA' } : section
      ),
    };
    expect(homepageHash(edited)).not.toBe(base);
  });

  it('l’impronta è scritta nell’HTML generato', () => {
    const html = renderHomepageSections(config);
    expect(html).toContain(`<!-- homepage:${homepageHash(config)} -->`);
  });
});

describe('homepage — integrazione con index.html', () => {
  it('index.html conserva i marcatori della zona generata', () => {
    expect(indexHtml).toContain(HOMEPAGE_MARKER_START);
    expect(indexHtml).toContain(HOMEPAGE_MARKER_END);
    expect(indexHtml.indexOf(HOMEPAGE_MARKER_START)).toBeLessThan(indexHtml.indexOf(HOMEPAGE_MARKER_END));
  });

  it('i marcatori stanno nella vista home e non in quella pagina', () => {
    const homeView = indexHtml.indexOf('id="hv"');
    const pageView = indexHtml.indexOf('id="pv"');
    expect(homeView).toBeGreaterThan(-1);
    expect(pageView).toBeGreaterThan(homeView);
    const start = indexHtml.indexOf(HOMEPAGE_MARKER_START);
    const end = indexHtml.indexOf(HOMEPAGE_MARKER_END);
    expect(start).toBeGreaterThan(homeView);
    expect(end).toBeLessThan(pageView);
  });

  it('il markup della mappa è delimitato per essere reinserito', () => {
    expect(indexHtml).toContain(HOMEPAGE_MAP_MARKER_START);
    expect(indexHtml).toContain(HOMEPAGE_MAP_MARKER_END);
    expect(indexHtml.indexOf('id="arcamis-map"')).toBeGreaterThan(indexHtml.indexOf(HOMEPAGE_MAP_MARKER_START));
  });
});

describe.runIf(hasDist)('homepage — artefatto pubblicato', () => {
  it('dist/index.html contiene la home generata e l’impronta attesa', () => {
    const html = fs.readFileSync(distFile, 'utf8');
    const expected = homepageHash(JSON.parse(fs.readFileSync(contentFile, 'utf8')));
    expect(html).toContain(`<!-- homepage:${expected} -->`);
    expect(html).toContain('MARCHE DI ARCAMIS');
    expect(html).toContain('NOVITÀ DAL SERVER');
    /* Il markup della mappa è dentro la sezione generata, non duplicato. */
    expect(html.match(/id="arcamis-map"/g)?.length).toBe(1);
    /* Nessuna sezione nascosta finisce online. */
    expect(html).not.toContain('Wiki Completa');
  });

  it('le sezioni della home non finiscono nelle pagine interne', () => {
    const routeFile = path.join(root, 'dist', 'novita.html');
    if (!fs.existsSync(routeFile)) return;
    const html = fs.readFileSync(routeFile, 'utf8');
    /* La shell contiene la home in un contenitore nascosto: la vista pagina
       non deve contenere il titolo della sezione MARCHE. */
    const pageView = html.slice(html.indexOf('id="pv"'));
    expect(pageView).not.toContain('MARCHE DI ARCAMIS');
  });
});
