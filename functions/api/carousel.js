/* ════════════════════════════════════════════════════════
   ARCAMIS — functions/api/carousel.js
   Endpoint pubblico: legge config carousel da KV e la restituisce.
════════════════════════════════════════════════════════ */
import { coverToUrl } from './_lib/covers.js';

export async function onRequest(context) {
  const KV = context.env.ARCAMIS_CACHE;
  const cors = {
    'Access-Control-Allow-Origin': 'https://arcamis.pages.dev',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
  };

  const SLIDE_KEYS = ['carousel_0', 'carousel_1', 'carousel_2'];

  try {
    const slides = await Promise.all(
      SLIDE_KEYS.map(async function (key) {
        const [img, metaRaw, btnsRaw] = await Promise.all([
          KV.get('admin_cover_' + key).catch(() => null),
          KV.get('admin_cover_' + key + '_meta').catch(() => null),
          KV.get('admin_cover_' + key + '_btns').catch(() => null),
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
          btns: btns || null,
        };
      })
    );

    return new Response(JSON.stringify({ slides }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: cors,
    });
  }
}
