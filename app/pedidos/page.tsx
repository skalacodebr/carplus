"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getPedidosCliente, cancelarPedido } from "@/lib/database"

interface PedidoItem {
  id: number
  pedido_id: number
  pacote_id: number
  qtd: number
  valor_unitario: number
}

interface Pedido {
  id: number
  numero: string
  revendedor_id: number
  cliente_id: number
  frete: number
  valor_total: number
  pagamento_tipo: string
  tipo_entrega: string
  status: string
  status_detalhado: string
  data_estimada_entrega: string | null
  data_entrega_real: string | null
  created_at: string
  updated_at: string
  pedido_itens: PedidoItem[]
}

export default function Historico() {
  const router = useRouter()
  const { user } = useAuth()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState<number | null>(null)

  useEffect(() => {
    const fetchPedidos = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await getPedidosCliente(user.id)
        if (error) {
          console.error("Erro ao buscar pedidos:", error)
        } else {
          setPedidos(data || [])
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPedidos()
  }, [user])

  // Função para cancelar pedido
  const handleCancelarPedido = async (pedidoId: number, pagamentoId?: string) => {
    if (!confirm("Tem certeza que deseja cancelar este pedido?")) {
      return
    }

    try {
      setCancelando(pedidoId)
      
      // Se houver pagamento_id, cancelar no Asaas também
      if (pagamentoId) {
        const response = await fetch('/api/asaas/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: `payments/${pagamentoId}`,
            method: 'DELETE'
          })
        })
        
        if (!response.ok) {
          console.error('Erro ao cancelar pagamento no Asaas')
        }
      }

      // Cancelar no banco local
      const { error } = await cancelarPedido(pedidoId.toString())
      
      if (error) {
        throw new Error('Erro ao cancelar pedido')
      }

      // Atualizar lista local
      setPedidos(prev => 
        prev.map(p => 
          p.id === pedidoId 
            ? { ...p, status: 'cancelado' }
            : p
        )
      )
      
      alert('Pedido cancelado com sucesso!')
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      alert('Erro ao cancelar pedido. Tente novamente.')
    } finally {
      setCancelando(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pago":
        return "text-green-400"
      case "pendente":
        return "text-yellow-400"
      case "cancelado":
        return "text-red-400"
      case "entregue":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "pago":
        return "✓ Pago"
      case "pendente":
        return "⏳ Pendente"
      case "cancelado":
        return "✗ Cancelado"
      case "entregue":
        return "📦 Entregue"
      default:
        return status
    }
  }

  const getStatusDetalhadoColor = (statusDetalhado: string) => {
    switch (statusDetalhado) {
      // Status de retirada
      case "aguardando_preparacao":
        return "text-yellow-400"
      case "preparando_pedido":
        return "text-blue-400"
      case "pronto_para_retirada":
        return "text-green-400"
      case "retirado":
        return "text-green-500"

      // Status de entrega
      case "aguardando_aceite":
        return "text-yellow-400"
      case "aceito":
        return "text-blue-400"
      case "cancelado":
        return "text-red-400"
      case "a_caminho":
        return "text-purple-400"
      case "entregue":
        return "text-green-500"

      default:
        return "text-gray-400"
    }
  }

  const getStatusDetalhadoText = (statusDetalhado: string, tipoEntrega: string) => {
    switch (statusDetalhado) {
      // Status de retirada
      case "aguardando_preparacao":
        return "⏳ Aguardando preparação"
      case "preparando_pedido":
        return "🔄 Preparando pedido"
      case "pronto_para_retirada":
        return "✅ Pronto para retirada"
      case "retirado":
        return "📦 Retirado"

      // Status de entrega
      case "aguardando_aceite":
        return "⏳ Aguardando aceite"
      case "aceito":
        return "✅ Aceito"
      case "cancelado":
        return "❌ Cancelado"
      case "a_caminho":
        return "🚚 A caminho"
      case "entregue":
        return "📦 Entregue"

      default:
        return statusDetalhado || "Status não definido"
    }
  }

  const getStatusDetalhadoIcon = (statusDetalhado: string) => {
    switch (statusDetalhado) {
      case "aguardando_preparacao":
      case "aguardando_aceite":
        return "⏳"
      case "preparando_pedido":
        return "🔄"
      case "aceito":
        return "✅"
      case "pronto_para_retirada":
        return "✅"
      case "a_caminho":
        return "🚚"
      case "retirado":
      case "entregue":
        return "📦"
      case "cancelado":
        return "❌"
      default:
        return "📋"
    }
  }

  if (loading) {
    return (
      <main className="flex flex-col min-h-screen bg-[#2C2B34] text-white">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Carregando histórico...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#2C2B34] text-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-[#3A3942]">
        <button onClick={() => router.push("/dashboard")} className="mr-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Meus Pedidos</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {pedidos.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Você ainda não tem pedidos</h2>
            <p className="text-gray-400 mb-6">Faça seu primeiro pedido agora mesmo!</p>
            <button
              onClick={() => router.push("/")}
              className="bg-[#fdc300] text-white px-6 py-3 rounded-full font-medium"
            >
              Fazer pedido
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-[#3A3942] rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">Pedido #{pedido.numero}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    {/* Status de pagamento */}
                    <div className={`text-sm font-medium mb-1 ${getStatusColor(pedido.status)}`}>
                      {getStatusText(pedido.status)}
                    </div>
                    {/* Status detalhado */}
                    <div className={`text-xs font-medium ${getStatusDetalhadoColor(pedido.status_detalhado)}`}>
                      {getStatusDetalhadoText(pedido.status_detalhado, pedido.tipo_entrega)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Itens:</span>
                    <span>{pedido.pedido_itens?.length || 0} produto(s)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Quantidade total:</span>
                    <span>{pedido.pedido_itens?.reduce((total, item) => total + item.qtd, 0) || 0} unidades</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tipo de entrega:</span>
                    <span className="capitalize">{pedido.tipo_entrega}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pagamento:</span>
                    <span className="capitalize">{pedido.pagamento_tipo}</span>
                  </div>
                  {pedido.frete > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Frete:</span>
                      <span>R$ {pedido.frete.toFixed(2)}</span>
                    </div>
                  )}
                  {pedido.data_estimada_entrega && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {pedido.tipo_entrega === "retirada" ? "Previsão retirada:" : "Previsão entrega:"}
                      </span>
                      <span>
                        {new Date(pedido.data_estimada_entrega).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {pedido.data_entrega_real && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {pedido.tipo_entrega === "retirada" ? "Data retirada:" : "Data entrega:"}
                      </span>
                      <span className="text-green-400">
                        {new Date(pedido.data_entrega_real).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#2C2B34]">
                  <span className="font-bold text-lg">Total: R$ {pedido.valor_total.toFixed(2)}</span>
                  <div className="flex gap-3 items-center">
                    {/* Botão cancelar para pedidos não pagos */}
                    {pedido.status.toLowerCase() === 'pendente' && (
                      <button
                        onClick={() => handleCancelarPedido(pedido.id)}
                        disabled={cancelando === pedido.id}
                        className="text-red-400 text-sm font-medium hover:underline disabled:opacity-50"
                      >
                        {cancelando === pedido.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/pedidos/${pedido.id}`)}
                      className="text-[#fdc300] text-sm font-medium hover:underline"
                    >
                      Ver detalhes →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
