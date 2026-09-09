import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from './index'

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
