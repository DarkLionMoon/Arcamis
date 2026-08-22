-- Schema D1 per le Schede PG (Cloudflare Pages Functions /api/schede/*)
-- Applicare con: npx wrangler d1 execute arcamis-schede --remote --file=schede/schema.sql

CREATE TABLE IF NOT EXISTS personaggi (
	id TEXT PRIMARY KEY,
	edit_token TEXT NOT NULL,
	dati TEXT NOT NULL,
	creato_il TEXT NOT NULL DEFAULT (datetime('now')),
	aggiornato_il TEXT NOT NULL DEFAULT (datetime('now'))
);
