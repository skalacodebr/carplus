"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

// Atualize o tipo PedidoDetalhado para incluir os novos campos
type PedidoDetalhado = {
  id: string | number
  status: string
  total: number | null
  created_at: string
  status_detalhado?: string | null
  data_estimada_entrega?: string | null
  data_entrega_real?: string | null
  observacoes_revendedor?: string | null
  tipo_entrega?: "retirada" | "entrega" | string
  pedido_itens: {
    id: string | number
    qtd: number
    valor_unitario: number | null
    pacote_id: string | number
    pacote: {
      id: number
      nome: string
      cor: string
      imagem: string | null
    }
  }[]
}

export default function PedidoDetalhe({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [pedido, setPedido] = useState<PedidoDetalhado | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user && params.id) {
      fetchPedido()
    }
  }, [user, loading, router, params.id])

  const fetchPedido = async () => {
    try {
      setIsLoading(true)
      console.log("Buscando pedido:", params.id)

      const { supabase } = await import("@/lib/supabase")

      // Primeiro, buscar o cliente_id baseado no user_id
      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("id")
        .eq("usuario_id", user!.id)
        .single()

      if (clienteError) throw clienteError

      // Buscar o pedido usando o cliente_id
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          pedido_itens:pedido_itens(
            *,
            pacote:pacotes(
              id,
              nome,
              cor,
              imagem
            )
          )
        `)
        .eq("id", params.id)
        .eq("cliente_id", cliente.id)
        .single()

      if (error) throw error

      console.log("Dados do pedido:", data)
      setPedido(data)
    } catch (error) {
      console.error("Erro ao buscar pedido:", error)
      alert("Não foi possível carregar os detalhes do pedido.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return "Data indisponível"
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-500"
      case "processando":
        return "bg-blue-500"
      case "enviado":
        return "bg-green-500"
      case "entregue":
        return "bg-green-700"
      case "cancelado":
        return "bg-red-500"
      case "pago":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  // Função auxiliar para formatar valores monetários com segurança
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "0,00"
    }
    return value.toFixed(2).replace(".", ",")
  }

  // Vamos adicionar uma função para formatar o status detalhado de forma amigável
  const formatarStatusDetalhado = (status: string | null | undefined) => {
    if (!status) return "Status não disponível"

    const statusMap: Record<string, { texto: string; icone: string }> = {
      aguardando_preparacao: { texto: "Aguardando preparação", icone: "⏳" },
      preparando_pedido: { texto: "Preparando seu pedido", icone: "🔄" },
      pronto_para_retirada: { texto: "Pronto para retirada", icone: "✅" },
      retirado: { texto: "Pedido retirado", icone: "📦" },
      aguardando_aceite: { texto: "Aguardando aceite", icone: "⏳" },
      aceito: { texto: "Pedido aceito", icone: "✅" },
      a_caminho: { texto: "A caminho", icone: "🚚" },
      entregue: { texto: "Entregue", icone: "📦" },
      cancelado: { texto: "Cancelado", icone: "❌" },
    }

    return statusMap[status] ? `${statusMap[status].icone} ${statusMap[status].texto}` : status
  }

  // Função para obter a classe CSS do status detalhado
  const getStatusDetalhadoClass = (status: string | null | undefined) => {
    if (!status) return "bg-gray-500"

    switch (status) {
      case "aguardando_preparacao":
      case "aguardando_aceite":
        return "bg-yellow-500"
      case "preparando_pedido":
      case "aceito":
        return "bg-blue-500"
      case "pronto_para_retirada":
        return "bg-green-500"
      case "retirado":
      case "entregue":
        return "bg-green-700"
      case "a_caminho":
        return "bg-purple-500"
      case "cancelado":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Adicionar esta função para formatar datas estimadas e reais
  const formatarDataEstimada = (dateString: string | null | undefined) => {
    if (!dateString) return "Não definida"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#2C2B34] px-5">
        <p className="text-white">Carregando...</p>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#2C2B34] px-5">
        <p className="text-white">Pedido não encontrado</p>
        <button onClick={() => router.back()} className="mt-4 bg-[#fdc300] text-white py-2 px-4 rounded-full">
          Voltar
        </button>
      </div>
    )
  }

  // Calcular o total se não estiver disponível
  const total =
    pedido.total ||
    pedido.pedido_itens?.reduce((acc, item) => acc + (item.valor_unitario || 0) * (item.qtd || 0), 0) ||
    0

  return (
    <main className="flex min-h-screen flex-col bg-[#2C2B34] text-white">
      {/* Cabeçalho */}
      <div className="relative flex justify-center items-center py-4 px-4 border-b border-[#3A3942]">
        <button onClick={() => router.back()} className="absolute left-4 text-white">
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
        <h1 className="text-xl font-bold">Detalhes do Pedido</h1>
      </div>

      {/* Informações do pedido */}
      <div className="p-4 border-b border-[#3A3942]">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-lg">Pedido #{String(pedido.id || "").slice(0, 8)}</h2>
          <span className="text-sm text-gray-400">{formatDate(pedido.created_at || "")}</span>
        </div>

        {/* Status de pagamento */}
        <div className="flex items-center mt-2">
          <span className="text-sm mr-2">Pagamento:</span>
          <span className={`text-sm px-2 py-1 rounded-full capitalize ${getStatusClass(pedido.status || "pendente")}`}>
            {pedido.status || "pendente"}
          </span>
        </div>

        {/* Status detalhado com destaque */}
        <div className="mt-4 bg-[#3A3942] rounded-lg p-4">
          <h3 className="text-sm text-gray-300 mb-2">Status do Pedido:</h3>
          <div
            className={`text-base font-medium px-3 py-2 rounded-md ${getStatusDetalhadoClass(pedido.status_detalhado)}`}
          >
            {formatarStatusDetalhado(pedido.status_detalhado)}
          </div>

          {/* Datas estimadas e reais */}
          {pedido.data_estimada_entrega && (
            <div className="mt-3 text-sm">
              <span className="text-gray-300">Data estimada: </span>
              <span className="text-white">{formatarDataEstimada(pedido.data_estimada_entrega)}</span>
            </div>
          )}

          {pedido.data_entrega_real && (
            <div className="mt-1 text-sm">
              <span className="text-gray-300">
                Data de {pedido.tipo_entrega === "retirada" ? "retirada" : "entrega"}:{" "}
              </span>
              <span className="text-white">{formatarDataEstimada(pedido.data_entrega_real)}</span>
            </div>
          )}

          {/* Observações do revendedor, se houver */}
          {pedido.observacoes_revendedor && (
            <div className="mt-3 p-2 bg-[#2C2B34] rounded-md">
              <p className="text-sm text-gray-300">Observações:</p>
              <p className="text-sm text-white">{pedido.observacoes_revendedor}</p>
            </div>
          )}
        </div>
      </div>

      {/* Itens do pedido */}
      <div className="flex-1 p-4">
        <h3 className="font-bold mb-3">Itens do Pedido</h3>
        <div className="space-y-4">
          {pedido.pedido_itens && pedido.pedido_itens.length > 0 ? (
            pedido.pedido_itens.map((item) => (
              <div key={item.id} className="flex items-center bg-[#3A3942] rounded-lg p-3">
                <div className="w-16 h-16 bg-[#2C2B34] rounded-md overflow-hidden mr-3">
                  <Image
                    src={item.pacote?.imagem || "/placeholder.svg"}
                    alt={item.pacote?.nome || "Pacote"}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.pacote?.nome || `Pacote #${item.pacote_id}`}</h4>
                  <p className="text-sm text-gray-400">{item.pacote?.cor || "Microesferas Premium"}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm">Qtd: {item.qtd || 0}</span>
                    <span className="font-bold">R$ {formatCurrency((item.valor_unitario || 0) * (item.qtd || 0))}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400">Nenhum item encontrado para este pedido.</p>
          )}
        </div>
      </div>

      {/* Resumo de valores */}
      <div className="p-4 border-t border-[#3A3942]">
        <div className="flex justify-between mb-2">
          <span>Subtotal</span>
          <span>R$ {formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Frete</span>
          <span>Grátis</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>R$ {formatCurrency(total)}</span>
        </div>
      </div>

      {/* Botão de ação */}
      <div className="p-4">
        <Link
          href="/historico"
          className="block w-full bg-[#fdc300] text-white py-3 rounded-full font-bold text-center"
        >
          Voltar para Histórico
        </Link>
      </div>
    </main>
  )
}
