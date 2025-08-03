"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import {
  getNotificacoesUsuario,
  contarNotificacoesNaoLidas,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  type Notificacao
} from "@/lib/database"

interface NotificationsContextType {
  notificacoes: Notificacao[]
  notificacoesNaoLidas: number
  loading: boolean
  buscarNotificacoes: () => Promise<void>
  marcarComoLida: (id: number) => Promise<void>
  marcarTodasComoLidas: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType>({
  notificacoes: [],
  notificacoesNaoLidas: 0,
  loading: false,
  buscarNotificacoes: async () => {},
  marcarComoLida: async () => {},
  marcarTodasComoLidas: async () => {},
  refreshNotifications: async () => {},
})

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // Função para buscar notificações
  async function buscarNotificacoes() {
    if (!user?.id) return

    try {
      setLoading(true)
      const { data: notifs, error } = await getNotificacoesUsuario(user.id)
      
      if (error) {
        console.error("Erro ao buscar notificações:", error)
        return
      }

      setNotificacoes(notifs || [])
      
      // Contar não lidas
      const naoLidas = (notifs || []).filter(n => !n.lida).length
      setNotificacoesNaoLidas(naoLidas)
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para marcar como lida
  async function marcarComoLida(id: number) {
    try {
      const { error } = await marcarNotificacaoComoLida(id)
      
      if (error) {
        console.error("Erro ao marcar notificação como lida:", error)
        return
      }

      // Atualizar estado local
      setNotificacoes(prev => 
        prev.map(n => 
          n.id === id 
            ? { ...n, lida: true, updated_at: new Date().toISOString() }
            : n
        )
      )

      // Diminuir contador de não lidas
      setNotificacoesNaoLidas(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  // Função para marcar todas como lidas
  async function marcarTodasComoLidas() {
    if (!user?.id) return

    try {
      const { error } = await marcarTodasNotificacoesComoLidas(user.id)
      
      if (error) {
        console.error("Erro ao marcar todas as notificações como lidas:", error)
        return
      }

      // Atualizar estado local
      const agora = new Date().toISOString()
      setNotificacoes(prev => 
        prev.map(n => ({ ...n, lida: true, updated_at: agora }))
      )

      // Resetar contador
      setNotificacoesNaoLidas(0)
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error)
    }
  }

  // Função para refresh manual
  async function refreshNotifications() {
    await buscarNotificacoes()
  }

  // Buscar notificações quando usuário muda
  useEffect(() => {
    if (user?.id) {
      buscarNotificacoes()
    } else {
      // Limpar estado quando não há usuário
      setNotificacoes([])
      setNotificacoesNaoLidas(0)
    }
  }, [user?.id])

  // Polling para novas notificações a cada 30 segundos
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      buscarNotificacoes()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [user?.id])

  const value: NotificationsContextType = {
    notificacoes,
    notificacoesNaoLidas,
    loading,
    buscarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    refreshNotifications,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error("useNotifications deve ser usado dentro de NotificationsProvider")
  }
  return context
}