/* ════════════════════════════════════════════════════════════════
   Tema dell'interfaccia del pannello.

   Chiaro è il default (è il tema pensato per il lavoro quotidiano);
   lo scuro riprende la palette della wiki e resta a un clic.

   Il tema vive su <html data-theme="…">, così il CSS può scoped-arlo
   (:root[data-theme='dark'] .arc-app) e vale anche per la pagina di
   login e per i pannelli montati fuori dalla shell.
   ════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'arc-admin-theme'

export const theme = ref<Theme>('light')

function stored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    /* storage negato (es. Safari in navigazione privata): nessuna preferenza */
    return null
  }
}

export function applyTheme(next: Theme) {
  theme.value = next
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* la preferenza resta valida solo per questa scheda */
  }
}

/* Chiamata in main.ts prima del mount: evita il lampo del tema sbagliato. */
export function initTheme() {
  applyTheme(stored() === 'dark' ? 'dark' : 'light')
}

export function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}
