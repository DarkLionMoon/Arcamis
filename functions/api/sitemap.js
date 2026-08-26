export async function onRequestGet(context) {
  const { env } = context;
  const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
  const GH_BRANCH = env.GH_BRANCH || 'main';
  const token = env.GH_TOKEN;
  const base = 'https://api.github.com/repos/' + GH_REPO + '/contents/';
  const headers = {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ArcamisSitemap'
  };

  let urls = [];
  const siteBase = 'https://arcamis.pages.dev';

  // Add homepage
  urls.push({
    loc: siteBase + '/',
    changefreq: 'weekly',
    priority: '1.0'
  });

  try {
    // Fetch registry for all page paths
    const regRes = await fetch(base + 'content/pages/registry.json?ref=' + GH_BRANCH, { headers });
    if (regRes.ok) {
      const regData = await regRes.json();
      const decoded = decodeURIComponent(escape(atob(regData.content)));
      const registry = JSON.parse(decoded);

      if (registry.pages && Array.isArray(registry.pages)) {
        for (const page of registry.pages) {
          const slug = page.k || page.slug;
          const section = page.sec || page.section || '';
          if (!slug) continue;

          // Determine changefreq and priority based on section
          let changefreq = 'monthly';
          let priority = '0.6';

          if (section === 'lore' || section === 'regole') {
            changefreq = 'monthly';
            priority = '0.8';
          } else if (section === 'lavori') {
            priority = '0.7';
          }

          // Special pages get higher priority
          if (slug === 'la-storia-di-gandora' || slug === 'pantheon') {
            priority = '0.9';
            changefreq = 'monthly';
          }

          urls.push({
            loc: siteBase + '/' + section + '/' + slug,
            changefreq,
            priority
          });
        }
      }
    }
  } catch (e) {
    // Fallback: add changelog at minimum
  }

  // Add changelog
  urls.push({
    loc: siteBase + '/changelog',
    changefreq: 'weekly',
    priority: '0.5'
  });

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const url of urls) {
    xml += '  <url>\n';
    xml += '    <loc>' + escapeXml(url.loc) + '</loc>\n';
    xml += '    <changefreq>' + url.changefreq + '</changefreq>\n';
    xml += '    <priority>' + url.priority + '</priority>\n';
    xml += '  </url>\n';
  }
  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
