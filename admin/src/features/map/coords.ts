/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — coordinate della mappa

   Le puntine sono percentuali del canvas (0–100%), non pixel. Tenere
   qui la conversione evita il bug storico del drag: il vecchio codice
   sottraeva un offset calcolato in coordinate del canvas a coordinate
   del viewport, quindi ogni trascinamento spostava la puntina verso
   l'alto di `rect.top / rect.height` (su una mappa sotto la piega la
   Y finiva a 0%). Le funzioni sono pure: il test le verifica senza DOM.
   ════════════════════════════════════════════════════════════════ */

export interface PercentPoint {
  x: number
  y: number
}

/** La parte di DOMRect che serve: `getBoundingClientRect()` la soddisfa. */
export interface BoxRect {
  left: number
  top: number
  width: number
  height: number
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/** Legge `"42.50%"` (o `"42.5"`) e ricade su `fallback` se non è un numero. */
export function parsePercent(value: string | null | undefined, fallback = 50): number {
  const parsed = Number.parseFloat(String(value ?? '').replace('%', ''))
  return Number.isFinite(parsed) ? clampPercent(parsed) : fallback
}

/** Formato salvato nel repository: due decimali con il segno di percentuale. */
export function formatPercent(value: number): string {
  return clampPercent(value).toFixed(2) + '%'
}

/**
 * Converte un punto del viewport (clientX/clientY, gli stessi di
 * PointerEvent/MouseEvent) nella percentuale dentro il canvas.
 * `rect` deve venire da `canvas.getBoundingClientRect()`: include già
 * scroll e zoom del browser.
 */
export function pointFromClient(clientX: number, clientY: number, rect: BoxRect): PercentPoint {
  if (!rect.width || !rect.height) return { x: 50, y: 50 }
  return {
    x: clampPercent(((clientX - rect.left) / rect.width) * 100),
    y: clampPercent(((clientY - rect.top) / rect.height) * 100)
  }
}

/** Offset del punto afferrato rispetto al centro della puntina, in punti percentuali. */
export function grabOffset(point: PercentPoint, pin: PercentPoint): PercentPoint {
  return { x: point.x - clampPercent(pin.x), y: point.y - clampPercent(pin.y) }
}

/** Posizione della puntina durante il trascinamento, mantenendo il punto afferrato. */
export function dragPosition(point: PercentPoint, grab: PercentPoint): PercentPoint {
  return {
    x: clampPercent(point.x - grab.x),
    y: clampPercent(point.y - grab.y)
  }
}
