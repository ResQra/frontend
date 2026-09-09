import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearSession, getStoredUser, getToken } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getToken() ? getStoredUser() : null)

  useEffect(() => {
    if (!getToken()) return
    api.me()
      .then((me) => {
        const normalized = { ...me, role: (me.role || '').toLowerCase() }
        setUser(normalized)
        try { localStorage.setItem('resqra_user', JSON.stringify(normalized)) } catch { /* noop */ }
      })
      .catch(() => {
        clearSession()
        setUser(null)
      })
  }, [])

  const signOut = () => {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
