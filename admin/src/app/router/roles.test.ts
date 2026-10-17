import { describe, expect, it } from 'vitest'

import { ROLE_LEVEL, canAccess, deniedMessage, roleLabel } from './roles'

describe('canAccess', () => {
  it('consente tutto ai ruoli senza requisito', () => {
    expect(canAccess('viewer')).toBe(true)
    expect(canAccess('editor')).toBe(true)
    expect(canAccess('admin')).toBe(true)
  })

  it('blocca il visualizzatore sulle sezioni di scrittura', () => {
    expect(canAccess('viewer', 'editor')).toBe(false)
    expect(canAccess('viewer', 'admin')).toBe(false)
  })

  it('consente all’editor le sezioni editoriali ma non quelle admin', () => {
    expect(canAccess('editor', 'editor')).toBe(true)
    expect(canAccess('editor', 'admin')).toBe(false)
  })

  it('consente all’admin anche i requisiti di editor', () => {
    expect(canAccess('admin', 'editor')).toBe(true)
    expect(canAccess('admin', 'admin')).toBe(true)
  })

  it('mantiene la gerarchia attesa', () => {
    expect(ROLE_LEVEL.viewer).toBeLessThan(ROLE_LEVEL.editor)
    expect(ROLE_LEVEL.editor).toBeLessThan(ROLE_LEVEL.admin)
  })
})

describe('messaggi', () => {
  it('spiega quale ruolo serve', () => {
    expect(deniedMessage('admin')).toMatch(/amministratori/)
    expect(deniedMessage('editor')).toMatch(/editor/)
  })

  it('traduce i ruoli per l’interfaccia', () => {
    expect(roleLabel('admin')).toBe('amministratore')
    expect(roleLabel('editor')).toBe('editor')
    expect(roleLabel('viewer')).toBe('visualizzatore')
  })
})
