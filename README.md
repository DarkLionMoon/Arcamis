# Arcamis Wiki 🏰

Wiki del server TTRPG Arcamis, hostata su Vercel con contenuto live da Notion.

## Deploy (15 minuti, tutto gratis)

### 1. Crea un'integrazione Notion

1. Vai su https://www.notion.so/my-integrations
2. Clicca **"New integration"**
3. Nome: `Arcamis Wiki`, tipo: **Internal**
4. Copia il **"Internal Integration Token"** (inizia con `secret_...`)
5. Torna al tuo Notion → apri la pagina root **Arcamis** → clicca `•••` in alto a destra → **"Connect to"** → seleziona la tua integrazione

### 2. Crea l'account Vercel

1. Vai su https://vercel.com e registrati (gratis, no carta di credito)
2. Collega il tuo account GitHub quando richiesto

### 3. Carica il codice su GitHub

1. Vai su https://github.com/new e crea un repo (es. `arcamis-wiki`)
2. Nella cartella di questo progetto, esegui:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/arcamis-wiki.git
git push -u origin main
```

### 4. Deploy su Vercel

1. Vai su https://vercel.com/new
2. Importa il repo `arcamis-wiki`
3. Nella sezione **"Environment Variables"** aggiungi:
   - Key: `NOTION_TOKEN`
   - Value: il token copiato al passo 1
4. Clicca **"Deploy"**

✅ Il sito sarà live su `https://arcamis-wiki.vercel.app` (o simile)

### Aggiornamenti automatici

Ogni volta che fai `git push`, Vercel rideploya automaticamente.
Il contenuto di Notion è live: si aggiorna ad ogni visita (con cache di 5 minuti).

---

## Struttura del progetto

```
arcamis-wiki/
├── api/
│   └── notion.js      ← Serverless function (proxy Notion API)
├── public/
│   └── index.html     ← Frontend (tutto in un file)
├── package.json
├── vercel.json
└── README.md
```

## Aggiungere nuove pagine al menu

Apri `public/index.html` e cerca l'array `const NAV = [...]`.
Aggiungi una nuova voce con l'ID della pagina Notion (senza trattini).

Per trovare l'ID di una pagina Notion: apri la pagina → copia l'URL → prendi gli ultimi 32 caratteri.
