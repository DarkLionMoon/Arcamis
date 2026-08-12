# Scripts Arcamis

## Backup KV/R2 (`backup-kv.js`)

Esegue backup automatico di:
- **Cloudflare KV** (tutte le chiavi → R2 bucket)
- **Repository GitHub** (file di testo <5MB → R2 bucket)

### Requisiti

```bash
cd scripts
npm install
```

### Variabili d'ambiente richieste

| Variabile | Descrizione |
|-----------|-------------|
| `CF_API_TOKEN` | Token Cloudflare con permessi `Workers KV Storage:Edit` + `R2:Edit` |
| `CF_ACCOUNT_ID` | Account ID Cloudflare |
| `KV_NAMESPACE_ID` | ID del namespace KV (o binding name) |
| `R2_BUCKET` | Nome bucket R2 per i backup (opzionale) |
| `GH_TOKEN` | GitHub PAT per backup repo (opzionale) |
| `GH_REPO` | Repo formato `owner/repo` (default: `DarkLionMoon/Arcamis`) |

### Esecuzione manuale

```bash
# Con variabili d'ambiente
CF_API_TOKEN=xxx CF_ACCOUNT_ID=xxx KV_NAMESPACE_ID=xxx R2_BUCKET=arcamis-backups node backup-kv.js

# Oppure via npm script (richiede .env)
npm run backup
```

### Output su R2

```
arcamis-backup/
├── kv/
│   ├── admin_log.json
│   ├── admin_session_xxx.json
│   └── ...
└── repo/
    ├── admin/index.html
    ├── content/pages/regole.json
    └── ...
```

### Automazione

Il workflow GitHub Actions `.github/workflows/backup.yml` esegue il backup ogni giorno alle 03:00 UTC.

### Pulizia vecchi backup

R2 non ha lifecycle policy nativa via API REST. Opzioni:
1. **Cloudflare Dashboard** → R2 → Bucket → *Lifecycle rules* → elimina oggetti `arcamis-backup/*` > 30 giorni
2. **wrangler CLI**: `wrangler r2 object delete <bucket> --prefix "arcamis-backup/" --older-than 30d`
3. **Worker schedulato** separato che lista ed elimina oggetti vecchi
