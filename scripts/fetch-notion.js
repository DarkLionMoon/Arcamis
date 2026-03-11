const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");

const notion = new Client({ auth: "IL_TUO_INTERNAL_NOTION_TOKEN" });
const outDir = path.join(__dirname, "../public/data/pages");

// Assicurati che la cartella esista
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function savePage(id) {
  console.log(`Scaricando: ${id}...`);
  try {
    // Qui dovresti implementare la stessa logica che avevi in api/notion.js
    // per recuperare i blocchi e la pagina, poi:
    const data = { /* ... i dati della pagina ... */ };
    fs.writeFileSync(path.join(outDir, `${id.replace(/-/g,'')}.json`), JSON.stringify(data));
  } catch (e) {
    console.error(`Errore su ${id}:`, e.message);
  }
}

// Prendi gli ID da data.js o passali manualmente
const ids = ["ID_PAGINA_1", "ID_PAGINA_2"]; 
ids.forEach(savePage);
