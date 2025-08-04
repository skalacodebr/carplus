"use client"

import { useState } from "react"
import { Bell, Check, CheckCheck, Info, AlertCircle, AlertTriangle, X } from "lucide-react"
import { useNotifications } from "@/context/notifications-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Função para formatar tempo relativo
function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Agora"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
  return date.toLocaleDateString()
}

// Função para obter ícone baseado no tipo
function getNotificationIcon(tipo: string) {
  switch (tipo) {
    case "success":
      return <Check className="h-4 w-4 text-green-600" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />
    default:
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

// Função para obter cor do indicador baseado no tipo
function getNotificationColor(tipo: string): string {
  switch (tipo) {
    case "success":
      return "border-l-green-500"
    case "warning":
      return "border-l-yellow-500"
    case "error":
      return "border-l-red-500"
    default:
      return "border-l-blue-500"
  }
}

// Função para formatar status de forma amigável
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    // Status de pedido
    "aguardando_preparacao": "Aguardando Preparação",
    "preparando_pedido": "Preparando Pedido",
    "pronto_para_retirada": "Pronto para Retirada",
    "retirado": "Retirado",
    "aguardando_aceite": "Aguardando Aceite",
    "aceito": "Aceito",
    "cancelado": "Cancelado",
    "a_caminho": "A Caminho",
    "entregue": "Entregue",
    
    // Status de pagamento
    "aguardando_pagamento": "Aguardando Pagamento",
    "pago": "Pago",
    "pendente": "Pendente",
    
    // Outros status comuns
    "novo_pedido": "Novo Pedido",
    "pedido_atualizado": "Pedido Atualizado",
    "status_atualizado": "Status Atualizado",
  }
  
  return statusMap[status] || status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Função para formatar mensagens de notificação
function formatMessage(mensagem: string): string {
  // Substituir underscores por espaços
  let formatted = mensagem.replace(/_/g, ' ')
  
  // Capitalizar primeira letra de cada frase
  formatted = formatted.replace(/(^|\. )(\w)/g, (match, p1, p2) => p1 + p2.toUpperCase())
  
  // Substituir termos técnicos por versões amigáveis
  const replacements: Record<string, string> = {
    "status detalhado": "status",
    "pedido id": "pedido",
    "cliente id": "cliente",
    "revendedor id": "revendedor",
  }
  
  Object.entries(replacements).forEach(([from, to]) => {
    formatted = formatted.replace(new RegExp(from, 'gi'), to)
  })
  
  return formatted
}

export default function NotificationBell() {
  const {
    notificacoes,
    notificacoesNaoLidas,
    loading,
    marcarComoLida,
    marcarTodasComoLidas,
    refreshNotifications,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)

  const handleNotificationClick = async (notificacao: any) => {
    if (!notificacao.lida) {
      await marcarComoLida(notificacao.id)
    }
  }

  const handleMarkAllAsRead = async () => {
    await marcarTodasComoLidas()
  }

  const handleRefresh = async () => {
    await refreshNotifications()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative transition-colors",
            isOpen && "bg-accent"
          )}
        >
          <Bell className="h-5 w-5" />
          {notificacoesNaoLidas > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {notificacoesNaoLidas > 99 ? "99+" : notificacoesNaoLidas}
                </span>
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-[32rem] overflow-y-auto overflow-x-hidden bg-black/95 border-yellow-500/50 backdrop-blur-sm shadow-xl"
        side="bottom"
        sideOffset={5}
      >
        <div className="flex items-center justify-between p-3 bg-gray-900/70 border-b border-yellow-500/20">
          <DropdownMenuLabel className="p-0 text-white">
            Notificações
            {notificacoesNaoLidas > 0 && (
              <Badge variant="secondary" className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {notificacoesNaoLidas} nova{notificacoesNaoLidas !== 1 ? "s" : ""}
              </Badge>
            )}
          </DropdownMenuLabel>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-8 w-8 p-0 hover:bg-yellow-500/20 text-gray-300 hover:text-yellow-400"
            >
              <Bell className="h-4 w-4" />
            </Button>
            
            {notificacoesNaoLidas > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 w-8 p-0 hover:bg-yellow-500/20 text-gray-300 hover:text-yellow-400"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-400">
            Carregando notificações...
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">
            Nenhuma notificação encontrada
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notificacoes.map((notificacao) => (
              <DropdownMenuItem
                key={notificacao.id}
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer border-l-2 transition-colors bg-gray-900/50 hover:bg-gray-800/70 mb-1 rounded-r-md",
                  getNotificationColor(notificacao.tipo),
                  !notificacao.lida && "bg-yellow-500/10 hover:bg-yellow-500/20"
                )}
                onClick={() => handleNotificationClick(notificacao)}
              >
                <div className="flex items-start justify-between w-full overflow-hidden">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notificacao.tipo)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "text-sm font-medium text-white break-words",
                          !notificacao.lida && "font-semibold"
                        )}>
                          {formatStatus(notificacao.titulo)}
                        </h4>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTimeAgo(notificacao.created_at)}
                          </span>
                          {!notificacao.lida && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-300 mt-1 break-words">
                        {formatMessage(notificacao.mensagem)}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notificacoes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 bg-gray-900/50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/20"
                onClick={() => setIsOpen(false)}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}