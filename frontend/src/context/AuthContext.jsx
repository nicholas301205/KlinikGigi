import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      const parsed = stored ? JSON.parse(stored) : null
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  const login = (userData, jwt) => {
    setUser(userData)
    setToken(jwt)
    localStorage.setItem('token', jwt)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = Boolean(token && user)

  useEffect(() => {
    if (!user && token) {
      localStorage.removeItem('token')
      setToken(null)
    }
  }, [token, user])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
