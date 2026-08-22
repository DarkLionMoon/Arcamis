# schede-src — sorgenti della sezione Scheda PG

Codice sorgente dell'app in `/schede/` (SvelteKit 5 + Tailwind v4, build statica
in modalità SPA, montata come sezione della wiki).

## Struttura

```
src/lib/data/*.json     ← database homebrew estratti dal foglio Excel Arcamis
src/lib/engine/         ← motore di calcolo (regole D&D 5e homebrew)
src/lib/api.ts          ← client per le Pages Functions (/api/schede/*)
src/routes/             ← pagine: lista PG, wizard /crea, scheda /pg/[id]
scripts/extract.py      ← rigenera i JSON dati dal foglio Excel (serve openpyxl)
```

## Ricompilare e aggiornare la sezione

```bash
npm install
npm run check       # typecheck
npm run build       # output in build/
```

Poi copia il risultato nella cartella servita dal sito:

```bash
rm -rf ../schede && mkdir ../schede
cp -r build/* ../schede/
git add -A && git commit -m "aggiorna schede" && git push
```

Cloudflare Pages deploya automaticamente.

> **Nota:** il build usa `base: '/schede'` (già impostato in `svelte.config.js`).
> Le API devono essere raggiungibili su `/api/schede/*` con binding D1 `DB`
> (vedi `schede-schema.sql` alla radice del repo).

## Rigenerare i dati dall'Excel

Se modifichi il foglio Google ("SCHEDA AUTOMATICA ARCAMIS"), scaricalo come
`.xlsx`, salvalo accanto a questo README ed esegui:

```bash
pip install openpyxl   # se serve
python3 scripts/extract.py
```

I file in `src/lib/data/*.json` verranno sovrascritti; poi ricompila.
