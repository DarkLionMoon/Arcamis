/* ════════════════════════════════════════════════════════════
   /api/sitemap → /sitemap.xml

   La sitemap non è più costruita a runtime dalle API GitHub (che
   restituivano 2 URL e richiedevano un token): `npm run build:site`
   scrive dist/sitemap.xml con tutte le rotte pubbliche, ricavate da
   scripts/lib/routes.mjs.

   L'endpoint resta come redirect permanente per i crawler e per le
   vecchie dichiarazioni, così non esistono due sitemap diverse.
════════════════════════════════════════════════════════════ */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  return Response.redirect(url.origin + '/sitemap.xml', 301);
}

export async function onRequestGet(context) {
  return onRequest(context);
}
