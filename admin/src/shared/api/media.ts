/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — media.ts
   Gestione immagini: compressione lato browser, upload nel repo,
   elenco e cancellazione.
   ════════════════════════════════════════════════════════════════ */

import { ghApi } from './github'
import type { GHFile } from '@/types'

export const MEDIA_DIR = 'images'

/** Rende un nome file sicuro e univoco, sempre in WebP. */
export function mediaName(original: string): string {
  const base = original.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${base || 'immagine'}-${Date.now()}.webp`
}

/** Comprime e ridimensiona un'immagine nel browser (WebP). */
export function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas non disponibile')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/webp', quality))
      } catch (e) {
        reject(e)
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Immagine non leggibile'))
    }
    img.src = objectUrl
  })
}

/** Carica un data URI nel repository e restituisce il percorso pubblico. */
export async function uploadImage(dataUri: string, filename: string): Promise<string> {
  await ghApi.putBinary(`${MEDIA_DIR}/${filename}`, `admin: upload image ${filename}`, dataUri)
  return `/${MEDIA_DIR}/${filename}`
}

export function mediaUrl(name: string): string {
  return `/${MEDIA_DIR}/${name}`
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'kB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** i
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}

export const mediaApi = {
  async list(): Promise<GHFile[]> {
    const files = await ghApi.list(MEDIA_DIR)
    return files.filter((f) => f.type === 'file')
  },

  async remove(file: GHFile): Promise<void> {
    await ghApi.delete(file.path, `admin: delete media ${file.name}`, file.sha)
  }
}
