import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type AuthUser = {
  id: string
  name: string
  username: string
}

type AuthContextType = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'tapajos.auth.user'

function uid(prefix = '') { return prefix + Math.random().toString(36).slice(2,9) }

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) as AuthUser : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const login = useCallback(async (username: string, password: string) => {
    // Simple mock auth: accept a couple of demo users
    const users: Record<string, { password: string, name: string }> = {
      'admin': { password: 'admin', name: 'Administrador' },
      'user1': { password: '123', name: 'Usuário 1' },
    }
    const record = users[username]
    if (!record || record.password !== password) {
      throw new Error('Credenciais inválidas')
    }
    setUser({ id: uid('u'), name: record.name, username })
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const value = useMemo(() => ({ user, isAuthenticated: !!user, login, logout }), [user, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}


