import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { pageSnapshot, useAuthStore, useEditorStore } from './index'
import type { PageContent } from '@/types'

describe('admin auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
  })

  it('stores the authenticated user, role, CSRF token, and session markers', () => {
    const auth = useAuthStore()

    auth.setAuth('editor-user', 'editor', 'csrf-token')

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.isEditor).toBe(true)
    expect(auth.isAdmin).toBe(false)
    expect(auth.csrfToken).toBe('csrf-token')
    expect(sessionStorage.getItem('arcadmin')).toBe('1')
    expect(sessionStorage.getItem('arcadmin_user')).toBe('editor-user')
    expect(sessionStorage.getItem('arcadmin_role')).toBe('editor')
  })

  it('clears authentication state and session markers', () => {
    const auth = useAuthStore()
    auth.setAuth('admin-user', 'admin', 'csrf-token')

    auth.clearAuth()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.role).toBe('viewer')
    expect(auth.csrfToken).toBeNull()
    expect(sessionStorage.getItem('arcadmin')).toBeNull()
  })
})

describe('admin editor store', () => {
  const page: PageContent = {
    k: 'pantheon',
    title: 'Pantheon',
    icon: '🛐',
    content: '# Divinità',
    lastModified: '2026-01-01T00:00:00.000Z',
    sha: 'sha-1'
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('l’impronta ignora sha e lastModified', () => {
    expect(pageSnapshot(page)).toBe(pageSnapshot({ ...page, sha: 'altro', lastModified: '2030-01-01' }))
    expect(pageSnapshot(null)).toBe('')
  })

  it('segna come modifica il testo e il ritorno al valore salvato la azzera', () => {
    const editor = useEditorStore()
    editor.setPage({ ...page })
    expect(editor.hasUnsavedChanges).toBe(false)

    editor.setContent('# Divinità\n\nTesto')
    expect(editor.hasUnsavedChanges).toBe(true)

    editor.setContent('# Divinità')
    expect(editor.hasUnsavedChanges).toBe(false)
  })

  it('segna come modifica anche i metadati e i dati strutturati', () => {
    const editor = useEditorStore()
    editor.setPage({ ...page })

    editor.setMetadata({ title: 'Nuovo titolo' })
    expect(editor.hasUnsavedChanges).toBe(true)

    editor.setPage({ ...page })
    editor.setTemplateData({ fields: { intro: 'ciao' }, collections: {} })
    expect(editor.hasUnsavedChanges).toBe(true)

    editor.setPage({ ...page })
    editor.setDraftFields(['fields.intro'])
    expect(editor.hasUnsavedChanges).toBe(true)
  })

  it('markSaved registra il nuovo stato salvato', () => {
    const editor = useEditorStore()
    editor.setPage({ ...page })
    editor.setContent('# Aggiornato')
    editor.markSaved('2026-02-02T10:00:00.000Z')

    expect(editor.hasUnsavedChanges).toBe(false)
    expect(editor.lastSavedAt).toBe('2026-02-02T10:00:00.000Z')
  })
})
