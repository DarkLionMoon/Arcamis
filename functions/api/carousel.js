/* ════════════════════════════════════════════════════════
   ARCAMIS — functions/api/carousel.js
   Endpoint pubblico: legge la config carousel da KV e la restituisce.

   Due forme, a seconda che l'admin abbia salvato il manifest:
   - gestito (`admin_carousel` presente): slide dinamiche + impostazioni
     di rotazione, solo le slide visibili;
   - legacy: override per-chiave sulle 3 slide hardcoded del sito.
   ════════════════════════════════════════════════════════════════ */
import { coverToUrl } from './_lib/covers.js';
import { CAROUSEL_MANIFEST_KEY, DEFAULT_SETTINGS, visibleSlides } from './_lib/carousel-config.js';

export async function onRequest(context) {
  const KV = context.env.ARCAMIS_CACHE;
  const cors = {
    'Access-Control-Allow-Origin': 'https://arcamis.pages.dev',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=600'
  };

  const SLIDE_KEYS = ['carousel_0', 'carousel_1', 'carousel_2'];

  try {
    let manifest = null;
    try {
      const raw = await KV.get(CAROUSEL_MANIFEST_KEY).catch(() => null);
      manifest = raw ? JSON.parse(raw) : null;
    } catch (e) {
      manifest = null;
    }
    if (manifest && Array.isArray(manifest.slides) && manifest.slides.length) {
      const slides = visibleSlides(manifest.slides).map(function (s) {
        return {
          id: s.id,
          img: s.img ? coverToUrl(s.id, s.img) : null,
          tag: s.tag || '',
          tit: s.tit || '',
          sub: s.sub || '',
          desc: s.desc || '',
          btns: Array.isArray(s.btns) ? s.btns : []
        };
      });
      return new Response(
        JSON.stringify({
          managed: true,
          settings: { ...DEFAULT_SETTINGS, ...(manifest.settings || {}) },
          slides
        }),
        { headers: cors }
      );
    }

    const slides = await Promise.all(
      SLIDE_KEYS.map(async function (key) {
        const [img, metaRaw, btnsRaw] = await Promise.all([
          KV.get('admin_cover_' + key).catch(() => null),
          KV.get('admin_cover_' + key + '_meta').catch(() => null),
          KV.get('admin_cover_' + key + '_btns').catch(() => null)
        ]);

        let meta = null;
        try {
          meta = metaRaw ? JSON.parse(metaRaw) : null;
        } catch (e) {}

        let btns = null;
        try {
          btns = btnsRaw ? JSON.parse(btnsRaw) : null;
        } catch (e) {}

        return {
          key,
          img: img ? coverToUrl(key, img) : null,
          meta: meta || null,
          btns: btns || null
        };
      })
    );

    return new Response(JSON.stringify({ managed: false, slides }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: cors
    });
  }
}
