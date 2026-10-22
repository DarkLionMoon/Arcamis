/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Formato del changelog

   Il sito pubblico legge `content/changelog.json` come array puro
   (`entries.length`, `entry.id`). Una vecchia versione dell'Admin
   scriveva `{ entries: [...] }` e mostrava una lista vuota: qui il
   formato viene normalizzato in un solo punto e testato sul file reale.
   ════════════════════════════════════════════════════════════════ */

import type { ChangelogEntry } from '@/types'

export function parseChangelog(raw: unknown): ChangelogEntry[] {
  const candidate =
    Array.isArray(raw) ? raw : raw && typeof raw === 'object' && Array.isArray((raw as { entries?: unknown }).entries)
      ? (raw as { entries: unknown[] }).entries
      : []
  return candidate.filter(
    (entry): entry is ChangelogEntry =>
      Boolean(entry) && typeof entry === 'object' && typeof (entry as ChangelogEntry).title === 'string'
  )
}

/** Il formato pubblico resta un array: niente wrapper `{ entries }`. */
export function serializeChangelog(entries: ChangelogEntry[]): string {
  return JSON.stringify(entries, null, 2) + '\n'
}

export function newChangelogId(now = Date.now()): string {
  return 'cl-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7)
}
