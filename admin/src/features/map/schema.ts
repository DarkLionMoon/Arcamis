/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Schema della mappa

   `content/mappins.json` è letto dal sito pubblico e validato dalla
   suite content-integrity. Qui usiamo lo stesso contratto prima del
   PUT: l'Admin non deve poter pubblicare coordinate fuori range,
   tipi sconosciuti o campi che il renderer non conosce.
   ════════════════════════════════════════════════════════════════ */

import { z } from 'zod'

import type { MapData } from '@/types'

export const PIN_TYPES = ['city', 'village', 'fort', 'forest', 'water', 'ruin', 'fog'] as const

const percent = z.string().regex(/^([0-9]{1,2}(\.[0-9]+)?|100(\.0+)?)%$/, 'percentuale non valida (0–100%)')

const pinSchema = z
  .object({
    id: z.string().min(1),
    left: percent,
    top: percent,
    type: z.enum(PIN_TYPES),
    name: z.string().min(1),
    desc: z.string(),
    explored: z.boolean(),
    sub: z.string().optional(),
    pageId: z.string().optional()
  })
  .strict()

export const mapDataSchema = z
  .object({
    mapImage: z.string().regex(/^(\/|https?:\/\/)/, 'immagine mappa non valida'),
    pins: z.array(pinSchema)
  })
  .strict()
  .superRefine((data, ctx) => {
    const seen = new Set<string>()
    data.pins.forEach((pin, index) => {
      if (seen.has(pin.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `id ripetuto «${pin.id}»`,
          path: ['pins', index, 'id']
        })
      }
      seen.add(pin.id)
    })
  })

export function mapDataError(data: unknown): string | null {
  const result = mapDataSchema.safeParse(data)
  if (result.success) return null
  const issue = result.error.issues[0]
  const where = issue.path.length ? ` (${issue.path.join('.')})` : ''
  return issue.message + where
}

/** Converte i dati dell'editor nella forma esatta dello schema. */
export function parseMapData(data: unknown): MapData {
  return mapDataSchema.parse(data) as MapData
}
