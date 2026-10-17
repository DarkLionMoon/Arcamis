/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — confirm.ts

   Sostituisce window.confirm() con una modale coerente con il tema,
   bloccante e — per le azioni irreversibili — con conferma digitata.

   Uso:
     if (!(await confirmAction({ message: 'Eliminare la pagina?', danger: true }))) return
     if (!(await confirmDanger('Svuota cestino', 'Svuotare il cestino?', 'SVUOTA'))) return
   ════════════════════════════════════════════════════════════════ */

import { readonly, ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  /** Riga secondaria: conseguenze, numero di elementi coinvolti, ecc. */
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Se presente, l'utente deve digitarla per abilitare la conferma. */
  keyword?: string
  danger?: boolean
}

export interface ConfirmState extends ConfirmOptions {
  id: number
  resolve: (ok: boolean) => void
}

const current = ref<ConfirmState | null>(null)
let nextId = 0

/** Stato osservabile della modale attiva (usato da ConfirmHost). */
export const confirmState = readonly(current)

/** Apre la modale e risolve con la scelta dell'utente. */
export function confirmAction(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options
  /* Una conferma alla volta: la precedente viene annullata, non accodata,
     altrimenti l'utente potrebbe confermare l'azione sbagliata. */
  current.value?.resolve(false)
  return new Promise<boolean>((resolve) => {
    current.value = { ...opts, id: ++nextId, resolve }
  })
}

/** Conferma rapida per azioni distruttive. */
export function confirmDanger(title: string, message: string, keyword: string, detail?: string): Promise<boolean> {
  return confirmAction({
    title,
    message,
    detail,
    keyword,
    danger: true,
    confirmLabel: 'Elimina definitivamente'
  })
}

/** Chiude la modale attiva con l'esito indicato. */
export function resolveConfirm(ok: boolean): void {
  const state = current.value
  current.value = null
  state?.resolve(ok)
}
