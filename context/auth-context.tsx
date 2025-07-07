"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getCurrentUser, signOut } from "@/lib/auth"

type User = {
  id: string
  email: string
  nome?: string
  sobrenome?: string
  telefone?: string
} | null

type AuthContextType = {
  user: User
  loading: boolean
  error: Error | null
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  async function refreshUser() {
    try {
      setLoading(true)
      const { user, error } = await getCurrentUser()

      if (error) {
        throw error
      }

      setUser(user)
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      await signOut()
      setUser(null)
      window.location.href = "/login" // Force a full page refresh
    } catch (err) {
      console.error("Erro ao fazer logout:", err)
      setError(err as Error)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return <AuthContext.Provider value={{ user, loading, error, refreshUser, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
