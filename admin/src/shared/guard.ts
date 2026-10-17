/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — guard.ts

   Protegge il lavoro non salvato su due fronti:
     • navigazione interna  → modale di conferma (onBeforeRouteLeave)
     • chiusura/refresh tab → prompt nativo (beforeunload)

   Prima l'unica protezione era un confirm() dentro il watch della
   chiave pagina: navigare via dalla sidebar o chiudere la scheda
   perdeva le modifiche in silenzio.
   ════════════════════════════════════════════════════════════════ */

import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { confirmAction, type ConfirmOptions } from './confirm'

/** Handler di beforeunload puro, così è verificabile senza montare Vue. */
export function createBeforeUnloadHandler(isDirty: () => boolean) {
  return (event: BeforeUnloadEvent): void => {
    if (!isDirty()) return
    event.preventDefault()
    /* I browser moderni ignorano il testo: serve solo returnValue non vuoto. */
    event.returnValue = ''
  }
}

/** Opzioni della modale mostrata quando si esce con modifiche pendenti. */
export function unsavedConfirmOptions(label: string): ConfirmOptions {
  return {
    title: 'Modifiche non salvate',
    message: `Hai ${label}. Uscire senza salvare?`,
    detail: 'Le modifiche non salvate vengono perse definitivamente.',
    confirmLabel: 'Esci senza salvare',
    cancelLabel: 'Resta qui',
    danger: true
  }
}

/**
 * Registra i guard per la vista corrente.
 * @param isDirty funzione che indica se ci sono modifiche pendenti
 * @param label   descrizione delle modifiche, es. "modifiche non salvate sulla pagina"
 */
export function useUnsavedGuard(isDirty: () => boolean, label = 'modifiche non salvate'): void {
  const handler = createBeforeUnloadHandler(isDirty)

  onMounted(() => window.addEventListener('beforeunload', handler))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', handler))

  onBeforeRouteLeave(async () => {
    if (!isDirty()) return true
    return confirmAction(unsavedConfirmOptions(label))
  })
}
