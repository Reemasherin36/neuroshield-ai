import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, onUnauthorized, type User } from './api'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.users
      .me()
      .then(setUser)
      .catch(() => setUser(null)) // 401 (signed out) and network errors both mean "no session"
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => onUnauthorized(() => setUser(null)), [])

  const login = useCallback(
    async (email: string, password: string) => setUser(await api.auth.login(email, password)),
    [],
  )
  const register = useCallback(
    async (email: string, password: string) => setUser(await api.auth.register(email, password)),
    [],
  )
  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
