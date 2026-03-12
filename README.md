# Arcamis Wiki — Static Version

Zero dipendenze da Notion API. Il sito legge solo file JSON locali.

---

## Come aggiornare il contenuto

### 1. Esporta da Notion

In Notion, per ogni pagina che vuoi aggiornare:

1. Apri la pagina
2. Clicca `...` (tre puntini) in alto a destra
3. **Export** → **Markdown & CSV** oppure **HTML**
4. Formato consigliato: **HTML** (mantiene più formattazione)
5. Includi sottopagine se necessario

### 2. Converti con lo script

```bash
# Estrai lo zip dell'export in una cartella
unzip notion-export.zip -d ./notion-export/

# Lancia lo script
node scripts/import-notion.js ./notion-export/

# I file JSON vengono creati in: public/data/pages/<id>.json
```

### 3. Carica su GitHub

```bash
git add public/data/
git commit -m "Aggiorna contenuto wiki"
git push
```

Vercel/Cloudflare Pages deploya automaticamente in ~30 secondi.

---

## Struttura file

```
/
├── index.html          ← Home page (non toccare)
├── app.js              ← Logica UI
├── notion-render.js    ← Renderer pagine (no API)
├── data.js             ← Registro pagine e ID
├── style-base.css      ← CSS base
├── style-page.css      ← CSS pagine interne
├── style-fx.css        ← CSS effetti
├── fx.js               ← Animazioni e effetti
├── sw.js               ← Service Worker (cache)
├── vercel.json         ← Config deployment
├── scripts/
│   └── import-notion.js ← Script conversione export
└── data/
    ├── pages/
    │   ├── 2f00274fdc1c8065a11ff45192aa5dcb.json  ← Gameplay
    │   ├── 2f00274fdc1c800b9d8fc366e8e40c5c.json  ← Regole
    │   └── ...
    └── db/
        └── *.json  ← Database Notion (gallerie)
```

---

## Aggiungere una pagina manualmente

Se non vuoi usare lo script, puoi creare un JSON a mano in `data/pages/<id>.json`:

```json
{
  "page": {
    "id": "NOTION_PAGE_ID_32CHARS",
    "icon": { "emoji": "⚔️" },
    "cover": null,
    "properties": {
      "title": {
        "title": [{ "plain_text": "Nome Pagina" }]
      }
    }
  },
  "blocks": [
    {
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{ "plain_text": "Testo del paragrafo.", "annotations": {}, "href": null }]
      }
    },
    {
      "type": "heading_1",
      "heading_1": {
        "rich_text": [{ "plain_text": "Titolo Sezione", "annotations": {}, "href": null }]
      }
    }
  ]
}
```

### Tipi di blocco supportati

| Tipo | Descrizione |
|------|-------------|
| `paragraph` | Paragrafo testo |
| `heading_1` / `heading_2` / `heading_3` | Titoli |
| `bulleted_list_item` | Lista puntata |
| `numbered_list_item` | Lista numerata |
| `quote` | Citazione |
| `callout` | Box callout colorato |
| `toggle` | Sezione espandibile |
| `divider` | Separatore `✦` |
| `code` | Blocco codice |
| `image` | Immagine |
| `video` | Video (YouTube/Vimeo/file) |
| `embed` | Link embed |
| `pdf` | Link PDF |
| `bookmark` | Link bookmark |
| `table` | Tabella |
| `column_list` | Layout a colonne |
| `to_do` | Checkbox |
| `child_page` | Link a sottopagina (carousel) |
| `child_database` | Database Notion (carousel) |

---

## Deployment

### Vercel
```bash
vercel --prod
```
Nessun build command necessario. Output directory: `.` (root).

### Cloudflare Pages
- Build command: *(vuoto)*
- Output directory: `/`

### GitHub Pages
Aggiungi un file `.nojekyll` nella root e abilita Pages dal branch main.

---

## ID Pagine di riferimento

| Pagina | ID |
|--------|----|
| Gameplay | `2f00274fdc1c8065a11ff45192aa5dcb` |
| Regole | `2f00274fdc1c800b9d8fc366e8e40c5c` |
| Materiale approvato | `3130274fdc1c807eb61fde24e8236659` |
| Come si inizia | `2dd222f22ef8413f8cb48f03bbb4f4b0` |
| Andando avanti | `5cea525d149f4acb9c59007bf6b3d5ff` |
| Galleria PG | `2fd0274fdc1c80d8b948c4133f874f28` |
| Biblioteca | `2f00274fdc1c8089bfe6c24434d53b67` |
| Bottega farmaceutica | `2f00274fdc1c801c9697e75caa8d5f13` |
| Caserma | `2ff0274fdc1c80688dd6c2b293a1f626` |
| Corporazione | `2ff0274fdc1c80769a4ae243f22f0582` |
| Forgia | `2f00274fdc1c805ca01ec57f18d2ffee` |
| Gilda avventurieri | `2f00274fdc1c801b8c13cefd9e15694e` |
| Locanda | `2f00274fdc1c80faa99eda064ef0fabc` |
| Ospedale | `2f00274fdc1c807aa03cc6cbeb3687cc` |
| Sartoria | `2ff0274fdc1c8035bad4f0b6ab705192` |
| Pantheon | `2f00274fdc1c80679bd3c3df8a1fa040` |
| Changelog | `3000274fdc1c8033a214c44a1aa7f01f` |
| Maestria / Titoli | `2f00274fdc1c802a9babd4239d97a319` |
| Lore | `2f00274fdc1c806f8f17dbc6532d2211` |
| Homebrew | `2f00274fdc1c80e78ad7ce985007b7c6` |
| Mappe | `2f10274fdc1c80489f23c49164747770` |
