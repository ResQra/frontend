import { createContext, useContext, useState } from 'react'
import { clearSession, getStoredUser, getToken } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getToken() ? getStoredUser() : null)

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
