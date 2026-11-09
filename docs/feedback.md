# Widget e API feedback

Il sito raccoglie segnalazioni pubbliche tramite un widget flottante
(`scripts/js/feedback.js`) che invia a una Cloudflare Pages Function
(`functions/api/feedback.js`). I messaggi finiscono in KV e sono leggibili
dal pannello admin (`/admin` → **Sicurezza → Feedback**).

## Endpoint

```
POST /api/feedback
Content-Type: application/json
```

L'endpoint è instradato da `_routes.json` (`/api/*`) e non richiede
autenticazione: è il canale pubblico del widget.

### Payload

| Campo      | Tipo   | Obbligatorio | Note                                              |
| ---------- | ------ | ------------ | ------------------------------------------------- |
| `category` | string | sì           | `bug` \| `feature` \| `ux` \| `general`            |
| `message`  | string | sì           | 5–2000 caratteri (il widget ne consente 1200)      |
| `email`    | string | no           | max 120 caratteri, validata lato server            |
| `page`     | string | no           | path della pagina, normalizzato a `^/[\w\-./]*$`   |
| `locale`   | string | no           | es. `it-IT`, troncato a 16 caratteri               |
| `website`  | string | no           | honeypot: se compilato la richiesta viene ignorata |

```json
{
  "category": "bug",
  "message": "Il link della scheda Arena porta alla pagina sbagliata",
  "email": "avventuriero@example.com",
  "page": "/lore/arcamis"
}
```

### Risposte

| Stato | Corpo                                              | Significato                                  |
| ----- | -------------------------------------------------- | -------------------------------------------- |
| 200   | `{ "ok": true, "id": "…" }`                        | Salvato (o honeypot compilato, nessuna write) |
| 204   | —                                                  | Preflight `OPTIONS`                          |
| 400   | `{ "error": "invalid_category" \| "message_required" \| "message_too_long" \| "invalid_email" \| "invalid_json" }` | Dati non validi |
| 403   | `{ "error": "forbidden_origin" }`                   | `Origin` diversa dalla stessa origine o da `arcamis.pages.dev` |
| 405   | `{ "error": "method_not_allowed" }`                 | Metodo diverso da `POST`/`OPTIONS`           |
| 413   | `{ "error": "payload_too_large" }`                  | Corpo oltre 8 KB                             |
| 429   | `{ "error": "rate_limited" }`                       | Più di 5 invii/ora dallo stesso IP           |
| 503   | `{ "error": "storage_unavailable" }`                | Né KV né webhook configurati (o KV in errore) |

Il client tratta 429/503/400 con messaggi dedicati e offre **Riprova**;
senza rete salva il payload in `localStorage` (`arc_feedback_queue`, max 8)
e lo invia all'evento `online`.

## Storage

- Binding KV: **`ARCAMIS_CACHE`** (lo stesso usato da admin, copertine e carousel).
- Chiave: `feedback:<id>`, dove `id` è `timestamp-base36-random`.
- Valore JSON:

```json
{
  "id": "m8x1y2-ab12cd",
  "category": "bug",
  "message": "…",
  "email": "avventuriero@example.com",
  "page": "/lore/arcamis",
  "locale": "it-IT",
  "country": "IT",
  "userAgent": "Mozilla/5.0 …",
  "createdAt": "2026-11-09T10:00:00.000Z"
}
```

- **TTL: 180 giorni** (`expirationTtl: 15552000`). Alla scadenza la chiave
  sparisce da sola: esportare i dati prima se servono a lungo termine.
- L'**IP non viene mai salvato** nel record. Viene usato solo come chiave
  temporanea `rl_feedback_<ip>` per il rate limit (TTL 1 ora).

## Protezioni

- **Rate limit**: 5 invii/ora per IP; superata la soglia → `429`.
- **Honeypot**: il campo nascosto `website` deve restare vuoto; se compilato
  la risposta è `200 { ok: true }` ma non viene scritto nulla.
- **Origin**: se il browser invia `Origin`, deve coincidere con l'origine
  della richiesta o con `https://arcamis.pages.dev`.
- **Dimensione**: corpo massimo 8 KB (`Content-Length`) e messaggio massimo
  2000 caratteri.
- **Sanitizzazione**: il path è ridotto a `^/[\w\-./]*$`; nel client il testo
  viene sempre inserito con `textContent`, mai con `innerHTML`.

## Webhook Discord (opzionale)

Imposta la variabile `FEEDBACK_WEBHOOK_URL` nel progetto Cloudflare Pages
(Settings → Environment variables → Production, e Preview se serve): deve
essere un URL `https://` di un webhook Discord.

```bash
# esempio di verifica locale del formato, senza salvare il valore nel repo
wrangler pages secret put FEEDBACK_WEBHOOK_URL --project-name arcamis
```

Comportamento:

- il record viene **prima** scritto in KV, poi inoltrato;
- se il webhook risponde con errore o va in timeout, il feedback resta
  comunque salvato e l'endpoint risponde `200`;
- senza la variabile non viene inviato nulla e non cambia nient'altro.

## Lettura dal pannello admin

`GET /api/admin?action=get_feedback` — richiede sessione **admin** (editor
riceve `403`, anonimo `401`).

Parametri: `category` (filtro), `limit` (1–200, default 50), `cursor`
(paginazione KV).

```json
{
  "ok": true,
  "items": [{ "id": "…", "category": "bug", "message": "…", "createdAt": "…" }],
  "counts": { "bug": 3, "general": 1 },
  "cursor": "…",
  "listComplete": false
}
```

La vista admin è in `admin/src/features/feedback/FeedbackView.vue`
(rotta `#/feedback`, sola lettura). Per un export massivo si può usare
`wrangler kv key list --prefix feedback:` seguito da `wrangler kv key get`.

## Test

```bash
npx vitest run functions/__tests__/feedback.test.js
npx vitest run scripts/__tests__/feedback-widget.test.js
```

I test dell'endpoint usano uno stub KV in memoria: non toccano la produzione.
