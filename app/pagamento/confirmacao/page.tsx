"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useCart } from "@/context/cart-context"
import SpinningWheel from "@/components/spinning-wheel"

export default function ConfirmacaoPagamento() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { clearCart } = useCart()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [pedidoId, setPedidoId] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [simulatingPayment, setSimulatingPayment] = useState(false)

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!user) {
      router.push("/login")
      return
    }

    // Obter dados da URL
    const paymentDataParam = searchParams.get("paymentData")
    const pedidoIdParam = searchParams.get("pedidoId")

    if (!paymentDataParam || !pedidoIdParam) {
      setError("Dados de pagamento não encontrados")
      setLoading(false)
      return
    }

    try {
      // Decodificar e parsear os dados do pagamento
      const decodedData = decodeURIComponent(paymentDataParam)
      const parsedData = JSON.parse(decodedData)

      setPaymentData(parsedData)
      setPedidoId(pedidoIdParam)

      // Limpar o carrinho após confirmação de pagamento
      clearCart()
    } catch (err) {
      console.error("Erro ao processar dados de pagamento:", err)
      setError("Erro ao processar dados de pagamento")
    } finally {
      setLoading(false)
    }
  }, [user, router, searchParams, clearCart])

  // Função para verificar o status do pagamento
  const checkPaymentStatus = async () => {
    if (!paymentData?.id || !pedidoId) return

    try {
      setCheckingStatus(true)
      const response = await fetch(`/api/payment/status?paymentId=${paymentData.id}&pedidoId=${pedidoId}`)
      const data = await response.json()

      if (data.success) {
        setPaymentStatus(data.status)
      } else {
        throw new Error(data.error || "Erro ao verificar status do pagamento")
      }
    } catch (err) {
      console.error("Erro ao verificar status:", err)
      setError("Não foi possível verificar o status do pagamento")
    } finally {
      setCheckingStatus(false)
    }
  }

  // Função para renderizar o status do pagamento
  const renderPaymentStatus = () => {
    const status = paymentStatus || paymentData?.status

    switch (status) {
      case "CONFIRMED":
      case "RECEIVED":
        return (
          <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-lg p-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-green-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-400 font-bold text-lg">Pagamento confirmado!</p>
            <p className="text-gray-300 mt-1">Seu pedido está sendo processado.</p>
          </div>
        )
      case "PENDING":
        return (
          <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-yellow-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-yellow-400 font-bold text-lg">Pagamento pendente</p>
            <p className="text-gray-300 mt-1">Aguardando confirmação do pagamento.</p>
          </div>
        )
      case "OVERDUE":
        return (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-red-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-400 font-bold text-lg">Pagamento vencido</p>
            <p className="text-gray-300 mt-1">O prazo para pagamento expirou.</p>
          </div>
        )
      case "REFUNDED":
      case "REFUND_REQUESTED":
        return (
          <div className="bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg p-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-blue-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <p className="text-blue-400 font-bold text-lg">Pagamento reembolsado</p>
            <p className="text-gray-300 mt-1">O valor foi devolvido.</p>
          </div>
        )
      case "CANCELED":
        return (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-red-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-red-400 font-bold text-lg">Pagamento cancelado</p>
            <p className="text-gray-300 mt-1">Este pagamento foi cancelado.</p>
          </div>
        )
      default:
        return (
          <div className="bg-gray-500 bg-opacity-20 border border-gray-500 rounded-lg p-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-400 font-bold text-lg">Status desconhecido</p>
            <p className="text-gray-300 mt-1">Não foi possível determinar o status do pagamento.</p>
          </div>
        )
    }
  }

  // Função para simular pagamento (apenas em desenvolvimento)
  const simulatePayment = async (status: string) => {
    if (!paymentData?.id) return

    try {
      setSimulatingPayment(true)
      const response = await fetch('/api/simulate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentData.id,
          status: status
        })
      })

      const data = await response.json()

      if (data.success) {
        // Atualizar o status local
        setPaymentStatus(status.replace('PAYMENT_', ''))
        alert(`Pagamento simulado com sucesso: ${status}`)
        // Verificar o status novamente para garantir que foi atualizado
        setTimeout(() => {
          checkPaymentStatus()
        }, 1000)
      } else {
        throw new Error(data.error || 'Erro ao simular pagamento')
      }
    } catch (err) {
      console.error('Erro ao simular pagamento:', err)
      alert('Erro ao simular pagamento: ' + err.message)
    } finally {
      setSimulatingPayment(false)
    }
  }

  // Função para renderizar informações específicas do método de pagamento
  const renderPaymentMethodInfo = () => {
    if (!paymentData) return null

    switch (paymentData.billingType) {
      case "PIX":
        return (
          <div className="bg-[#3A3942] rounded-lg p-4 mb-4">
            <h3 className="font-bold text-center mb-3">QR Code PIX</h3>
            {paymentData.pixData?.encodedImage ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-2 rounded-lg mb-3">
                  <Image
                    src={`data:image/png;base64,${paymentData.pixData.encodedImage}`}
                    alt="QR Code PIX"
                    width={200}
                    height={200}
                  />
                </div>
                <p className="text-sm text-gray-400 mb-3 text-center">
                  Escaneie o QR Code acima com o aplicativo do seu banco
                </p>
                <div className="w-full">
                  <p className="text-xs text-gray-400 mb-1">Código PIX copia e cola:</p>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value={paymentData.pixData.payload}
                      className="bg-[#2C2B34] text-white text-xs p-2 rounded-l-md flex-1 overflow-hidden"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentData.pixData.payload)
                        alert("Código PIX copiado!")
                      }}
                      className="bg-[#ED1C24] text-white px-3 rounded-r-md text-xs"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400">QR Code não disponível</p>
            )}
          </div>
        )
      case "BOLETO":
        return (
          <div className="bg-[#3A3942] rounded-lg p-4 mb-4">
            <h3 className="font-bold text-center mb-3">Boleto Bancário</h3>
            <p className="text-sm text-gray-400 mb-3 text-center">Seu boleto foi gerado com sucesso!</p>
            <a
              href={paymentData.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#ED1C24] text-white py-3 rounded-full font-bold text-center"
            >
              Visualizar Boleto
            </a>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Vencimento: {new Date(paymentData.dueDate).toLocaleDateString("pt-BR")}
            </p>
          </div>
        )
      case "CREDIT_CARD":
        return (
          <div className="bg-[#3A3942] rounded-lg p-4 mb-4">
            <h3 className="font-bold text-center mb-3">Cartão de Crédito</h3>
            <p className="text-sm text-gray-400 mb-3 text-center">
              Seu pagamento com cartão de crédito foi processado.
            </p>
            {renderPaymentStatus()}
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#2C2B34] px-5">
        <SpinningWheel size={120} color="#ED1C24" />
        <p className="text-white mt-4">Carregando informações do pagamento...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-[#2C2B34] px-5 pt-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={280} height={100} priority />
          </div>

          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-center">{error}</p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-[#ED1C24] text-white py-4 rounded-full font-bold"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#2C2B34] px-5 pt-10 pb-20">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={280} height={100} priority />
        </div>

        <h1 className="text-white text-2xl font-bold mb-6 text-center">Confirmação de Pagamento</h1>

        <div className="bg-[#3A3942] rounded-lg p-4 mb-6">
          <h2 className="font-bold text-lg mb-2">Resumo do Pedido</h2>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Pedido:</span>
            <span>#{pedidoId?.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Valor:</span>
            <span>R$ {paymentData?.value?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Método:</span>
            <span>
              {paymentData?.billingType === "PIX" && "PIX"}
              {paymentData?.billingType === "BOLETO" && "Boleto Bancário"}
              {paymentData?.billingType === "CREDIT_CARD" && "Cartão de Crédito"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Data:</span>
            <span>{new Date().toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        {/* Status do pagamento */}
        <div className="mb-6">{renderPaymentStatus()}</div>

        {/* Informações específicas do método de pagamento */}
        {renderPaymentMethodInfo()}

        {/* Botão para verificar status */}
        {paymentData?.billingType !== "CREDIT_CARD" && (
          <button
            onClick={checkPaymentStatus}
            disabled={checkingStatus}
            className="w-full bg-[#3A3942] text-white py-3 rounded-full font-bold mb-4 flex justify-center items-center"
          >
            {checkingStatus ? (
              <>
                <div className="w-5 h-5 border-t-2 border-[#ED1C24] border-solid rounded-full animate-spin mr-2"></div>
                Verificando...
              </>
            ) : (
              "Verificar Status do Pagamento"
            )}
          </button>
        )}

        {/* Botões de simulação (apenas para testes) */}
        {(process.env.NODE_ENV === 'development' || true) && (
          <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4 mb-4">
            <h3 className="text-yellow-400 font-bold text-center mb-3">🧪 Simulação de Pagamentos (Teste)</h3>
            <p className="text-yellow-300 text-xs text-center mb-4">
              Use os botões abaixo para simular diferentes status de pagamento
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => simulatePayment('PAYMENT_CONFIRMED')}
                disabled={simulatingPayment}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-medium disabled:opacity-50"
              >
                ✅ Confirmar
              </button>
              <button
                onClick={() => simulatePayment('PAYMENT_OVERDUE')}
                disabled={simulatingPayment}
                className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm font-medium disabled:opacity-50"
              >
                ⏰ Vencer
              </button>
              <button
                onClick={() => simulatePayment('PAYMENT_CANCELED')}
                disabled={simulatingPayment}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={() => simulatePayment('PAYMENT_REFUNDED')}
                disabled={simulatingPayment}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium disabled:opacity-50"
              >
                🔄 Reembolsar
              </button>
            </div>
            {simulatingPayment && (
              <div className="text-center mt-2">
                <div className="inline-flex items-center text-yellow-300 text-sm">
                  <div className="w-4 h-4 border-t-2 border-yellow-400 border-solid rounded-full animate-spin mr-2"></div>
                  Simulando...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botões de navegação */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/pedidos")}
            className="w-full bg-[#ED1C24] text-white py-4 rounded-full font-bold"
          >
            Ver Meus Pedidos
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-transparent border border-white text-white py-4 rounded-full font-bold"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    </main>
  )
}
