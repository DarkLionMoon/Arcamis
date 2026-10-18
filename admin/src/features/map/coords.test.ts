import { describe, expect, it } from 'vitest'

import { clampPercent, dragPosition, formatPercent, grabOffset, parsePercent, pointFromClient } from './coords'

const CANVAS = { left: 16, top: 269, width: 800, height: 400 }

describe('mappa · conversione coordinate', () => {
  it('converte centro del canvas in 50% / 50%', () => {
    expect(pointFromClient(416, 469, CANVAS)).toEqual({ x: 50, y: 50 })
  })

  it('converte gli angoli e non esce dal canvas', () => {
    expect(pointFromClient(16, 269, CANVAS)).toEqual({ x: 0, y: 0 })
    expect(pointFromClient(816, 669, CANVAS)).toEqual({ x: 100, y: 100 })
    expect(pointFromClient(-200, 900, CANVAS)).toEqual({ x: 0, y: 100 })
  })

  it('tiene conto di un canvas sotto la piega (il bug della Y a 0)', () => {
    /* Il vecchio drag sottraeva rect.top (269px) alla coordinata: la
       puntina centrata finiva a -67% e veniva schiacciata a 0. */
    const point = pointFromClient(416, 469, CANVAS)
    expect(grabOffset(point, { x: 50, y: 50 })).toEqual({ x: 0, y: 0 })
    expect(dragPosition(point, { x: 0, y: 0 })).toEqual({ x: 50, y: 50 })
  })

  it('mantiene il punto afferrato durante il trascinamento', () => {
    /* Si afferra la puntina 40px a sinistra e 20px sopra il centro:
       il centro resta sotto il cursore anche spostandolo. */
    const point = pointFromClient(376, 449, CANVAS)
    const grab = grabOffset(point, { x: 50, y: 50 })
    expect(grab.x).toBeCloseTo(-5)
    expect(grab.y).toBeCloseTo(-5)
    const moved = pointFromClient(616, 569, CANVAS)
    expect(dragPosition(moved, grab)).toEqual({ x: 80, y: 80 })
  })

  it('porta la puntina al bordo senza valori negativi', () => {
    const grab = { x: 50, y: 50 }
    expect(dragPosition({ x: 0, y: 0 }, grab)).toEqual({ x: 0, y: 0 })
    expect(dragPosition({ x: 100, y: 100 }, { x: -50, y: -50 })).toEqual({ x: 100, y: 100 })
  })

  it('un canvas senza dimensioni non divide per zero', () => {
    expect(pointFromClient(120, 80, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 50, y: 50 })
  })
})

describe('mappa · percentuali salvate', () => {
  it('legge il formato del repository', () => {
    expect(parsePercent('87.76%')).toBeCloseTo(87.76)
    expect(parsePercent(' 0.00% ')).toBe(0)
    expect(parsePercent('')).toBe(50)
    expect(parsePercent('boh')).toBe(50)
  })

  it('scrive sempre due decimali con %', () => {
    expect(formatPercent(49.999)).toBe('50.00%')
    expect(formatPercent(-3)).toBe('0.00%')
    expect(formatPercent(Number.NaN)).toBe('0.00%')
  })

  it('limita i valori fuori scala', () => {
    expect(clampPercent(140)).toBe(100)
    expect(clampPercent(-1)).toBe(0)
  })
})
