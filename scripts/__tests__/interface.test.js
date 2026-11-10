/* ════════════════════════════════════════════════════════════════
   Test di identità, footer e testi globali del sito.

   La configurazione vive in content/interface.json e viene scolpita
   nell'HTML dal build: qui si verifica che sia valida e idempotente,
   che i testi siano escapati, che i link pericolosi siano scartati,
   che i marcatori della shell esistano e — se dist/ è stato appena
   generato — che l'artefatto porti l'impronta e i valori giusti.
   ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SITE_INTERFACE,
  SITE_INTERFACE_MAX_LINKS,
  applyDocumentIdentity,
  applyErrorPageIdentity,
  applyInterfaceMarkup,
  applyManifestIdentity,
  defaultSiteInterface,
  normalizeSiteInterface,
  renderInterfaceBrand,
  renderInterfaceFooter,
  renderInterfaceLoader,
  renderInterfaceSkipLink,
  siteInterfaceHash,
  siteInterfaceMarker,
} from '../lib/site-interface.mjs';
import { collectRoutes } from '../lib/routes.mjs';

const root = process.cwd();
const contentFile = path.join(root, 'content/interface.json');
const config = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const distHtml = path.join(root, 'dist/index.html');
const hasDist = fs.existsSync(distHtml);

describe('interfaccia — configurazione', () => {
  it('content/interface.json è valido e senza avvisi', () => {
    const { errors, warnings, config: normalized } = normalizeSiteInterface(config);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(normalized.site.name).toBe('Arcamis Wiki');
    expect(normalized.footer.links.length).toBe(3);
  });

  it('la normalizzazione è idempotente (nessuna perdita al salvataggio)', () => {
    const once = normalizeSiteInterface(config).config;
    const twice = normalizeSiteInterface(JSON.parse(JSON.stringify(once))).config;
    expect(twice).toEqual(once);
  });

  it('i default del codice e il file versionato coincidono', () => {
    expect(normalizeSiteInterface(DEFAULT_SITE_INTERFACE).config).toEqual(normalizeSiteInterface(config).config);
    expect(defaultSiteInterface()).not.toBe(DEFAULT_SITE_INTERFACE);
  });

  it('scarta link e logo non validi senza svuotare il footer', () => {
    const { config: normalized, warnings } = normalizeSiteInterface({
      version: 1,
      site: { name: 'Test', brand: 'T', logo: 'javascript:alert(1)' },
      footer: {
        legal: 'Nota',
        links: [
          { label: 'Ok', href: '/changelog', external: false },
          { label: 'Male', href: 'javascript:alert(1)' },
          { label: 'Crediti', kind: 'credits' },
        ],
      },
    });
    expect(normalized.site.logo).toBe(DEFAULT_SITE_INTERFACE.site.logo);
    expect(normalized.footer.links.map((link) => link.label)).toEqual(['Ok', 'Crediti']);
    expect(normalized.texts.skipLink).toBe(DEFAULT_SITE_INTERFACE.texts.skipLink);
    expect(warnings.join(' ')).toMatch(/logo/i);
  });

  it('limita il numero di link del footer', () => {
    const links = Array.from({ length: SITE_INTERFACE_MAX_LINKS + 3 }, (_, i) => ({
      label: `Link ${i}`,
      href: '/x',
    }));
    const { config: normalized } = normalizeSiteInterface({ version: 1, footer: { links } });
    expect(normalized.footer.links.length).toBe(SITE_INTERFACE_MAX_LINKS);
  });

  it('una configurazione assente ricade sui default', () => {
    const { config: normalized, warnings } = normalizeSiteInterface(null);
    expect(normalized.site.name).toBe(DEFAULT_SITE_INTERFACE.site.name);
    expect(warnings.length).toBe(1);
  });
});

describe('interfaccia — rendering', () => {
  it('escapa nome, tagline, nota legale e link', () => {
    const { config: normalized } = normalizeSiteInterface({
      version: 1,
      site: { name: '<script>x</script>', brand: 'B<&>', tagline: 'Tag "x"' },
      footer: {
        legal: '<b>nota</b>',
        links: [{ label: '<b>link</b>', href: '/x?a=1&b=2' }],
      },
      texts: { searchPlaceholder: 'Cerca & trova' },
    });
    const html = [
      renderInterfaceLoader(normalized),
      renderInterfaceBrand(normalized),
      renderInterfaceFooter(normalized),
      renderInterfaceSkipLink(normalized),
    ].join('\n');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).toContain('Tag &quot;x&quot;');
    expect(html).toContain('&lt;b&gt;nota&lt;/b&gt;');
    expect(html).toContain('href="/x?a=1&amp;b=2"');
  });

  it('la voce Crediti usa la pagina interna, non un href arbitrario', () => {
    const html = renderInterfaceFooter({
      ...defaultSiteInterface(),
      footer: { legal: '', links: [{ label: 'Legale', href: 'javascript:alert(1)', external: false, kind: 'credits' }] },
    });
    expect(html).toContain("onclick=\"gp('pag-credits'");
    expect(html).not.toContain('javascript:');
  });

  it('sostituisce i marcatori della shell e i placeholder di ricerca', () => {
    const html = applyInterfaceMarkup(indexHtml, {
      ...config,
      texts: { ...config.texts, searchPlaceholder: 'Cerca nel sito' },
    });
    expect(html).not.toContain('INTERFACE:LOADER:START');
    expect(html).not.toContain('INTERFACE:FOOTER:START');
    expect(html).toContain('<span id="tlt">ARCAMIS</span>');
    expect((html.match(/id="site-footer"/g) || []).length).toBe(1);
    expect((html.match(/placeholder="Cerca nel sito"/g) || []).length).toBe(2);
    expect(html).not.toContain('placeholder="Cerca nella wiki…"');
  });

  it('nome e metadati della home seguono la configurazione', () => {
    const html = applyDocumentIdentity(indexHtml, {
      ...config,
      site: { ...config.site, name: 'Nuovo Nome' },
    });
    expect(html).toContain('<title>Nuovo Nome — Il mondo di Arcamis</title>');
    expect(html).toContain('<meta property="og:site_name" content="Nuovo Nome">');
    expect(html).toContain('"name":"Nuovo Nome"');
  });

  it('404 e manifest seguono nome e nome breve', () => {
    const errorPage = applyErrorPageIdentity(
      '<title>Pagina non trovata — Arcamis</title><div class="sigil">Arcamis</div>',
      { ...config, site: { ...config.site, name: 'Nuovo Nome', brand: 'NUOVO' } }
    );
    expect(errorPage).toContain('Pagina non trovata — Nuovo Nome');
    expect(errorPage).toContain('<div class="sigil">NUOVO</div>');

    const manifest = applyManifestIdentity(
      JSON.stringify({ name: 'Arcamis Wiki — D&D', short_name: 'Arcamis' }),
      { ...config, site: { ...config.site, name: 'Nuovo Nome', brand: 'NUOVO' } }
    );
    expect(JSON.parse(manifest)).toMatchObject({ name: 'Nuovo Nome — D&D', short_name: 'NUOVO' });
  });

  it('l’impronta cambia con la configurazione ed è stabile a parità di valori', () => {
    expect(siteInterfaceHash(config)).toMatch(/^[0-9a-f]{8}$/);
    expect(siteInterfaceHash(config)).toBe(siteInterfaceHash(JSON.parse(JSON.stringify(config))));
    expect(siteInterfaceHash({ ...config, site: { ...config.site, brand: 'ALTRO' } })).not.toBe(
      siteInterfaceHash(config)
    );
  });
});

describe('interfaccia — integrazione con il sito', () => {
  it('index.html conserva i marcatori usati dal build', () => {
    for (const marker of [
      '<!-- INTERFACE:LOADER:START -->',
      '<!-- INTERFACE:LOADER:END -->',
      '<!-- INTERFACE:BRAND:START -->',
      '<!-- INTERFACE:BRAND:END -->',
      '<!-- INTERFACE:FOOTER:START -->',
      '<!-- INTERFACE:FOOTER:END -->',
      '<!-- INTERFACE:SKIP:START -->',
      '<!-- INTERFACE:SKIP:END -->',
    ]) {
      expect(indexHtml).toContain(marker);
    }
  });

  it('i titoli delle rotte usano il nome configurato', () => {
    const routes = collectRoutes(root);
    expect(routes[0].title).toMatch(/— Il mondo di Arcamis$/);
    expect(routes[0].title.startsWith(config.site.name)).toBe(true);
  });

  it('se dist/ esiste, l’artefatto porta impronta, footer e identità', () => {
    if (!hasDist) return;
    const html = fs.readFileSync(distHtml, 'utf8');
    if (!html.includes('<!-- interface:')) return;
    expect(html).toContain(siteInterfaceMarker(config));
    expect(html).toContain(`<span class="sf-name">${config.site.brand}</span>`);
    expect(html).toContain(`<title>${config.site.name} — Il mondo di Arcamis</title>`);
    expect(html).not.toContain('INTERFACE:LOADER:START');
    expect((html.match(new RegExp(`placeholder="${config.texts.searchPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) || []).length).toBe(2);
  });
});
