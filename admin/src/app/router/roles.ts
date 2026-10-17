/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — roles.ts

   Un solo posto per la gerarchia dei ruoli, condiviso da router e
   sidebar: prima la sidebar filtrava le voci per sé e le rotte non
   controllavano nulla, quindi un editor poteva aprire a mano /utenti
   e vedere la pagina vuota (o mezza rotta) invece di un rifiuto.
   ════════════════════════════════════════════════════════════════ */

import type { UserRole } from '@/types'

export type RequiredRole = 'viewer' | 'editor' | 'admin'

export const ROLE_LEVEL: Record<UserRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2
}

/** true se `role` soddisfa il requisito `min` (assente = solo essere autenticati). */
export function canAccess(role: UserRole, min?: RequiredRole): boolean {
  if (!min) return true
  return ROLE_LEVEL[role] >= ROLE_LEVEL[min]
}

/** Etichetta leggibile del ruolo, usata anche nei messaggi di rifiuto. */
export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'amministratore'
    case 'editor':
      return 'editor'
    default:
      return 'visualizzatore'
  }
}

export function deniedMessage(min: RequiredRole): string {
  return min === 'admin'
    ? 'Questa sezione è riservata agli amministratori'
    : 'Questa sezione richiede i permessi di editor'
}
