"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import CreditCardForm, { type CreditCardData } from "@/components/credit-card-form"
import SpinningWheel from "@/components/spinning-wheel"

export default function PagamentoCartao() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pedidoId, setPedidoId] = useState<string | null>(null)
  const [customerData, setCustomerData] = useState<any>(null)
  const [amount, setAmount] = useState<number>(0)

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!user) {
      router.push("/login")
      return
    }

    // Obter dados da URL
    const pedidoIdParam = searchParams.get("pedidoId")
    const customerDataParam = searchParams.get("customerData")
    const amountParam = searchParams.get("amount")

    if (!pedidoIdParam || !customerDataParam || !amountParam) {
      setError("Dados de pagamento incompletos")
      setLoading(false)
      return
    }

    try {
      // Decodificar e parsear os dados
      const decodedCustomerData = decodeURIComponent(customerDataParam)
      const parsedCustomerData = JSON.parse(decodedCustomerData)
      const parsedAmount = Number.parseFloat(amountParam)

      setPedidoId(pedidoIdParam)
      setCustomerData(parsedCustomerData)
      setAmount(parsedAmount)
    } catch (err) {
      console.error("Erro ao processar dados de pagamento:", err)
      setError("Erro ao processar dados de pagamento")
    } finally {
      setLoading(false)
    }
  }, [user, router, searchParams])

  const handleSubmit = async (cardData: CreditCardData) => {
    if (!pedidoId || !customerData || !amount) {
      setError("Dados de pagamento incompletos")
      return
    }

    try {
      setIsProcessing(true)

      // Processar pagamento via API
      const paymentResponse = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          pedidoId,
          paymentMethod: "cartao",
          customerData,
          amount,
          creditCardData: {
            holderName: cardData.holderName,
            number: cardData.number,
            expiryMonth: cardData.expiryMonth,
            expiryYear: cardData.expiryYear,
            ccv: cardData.ccv,
          },
        }),
      })

      const paymentResult = await paymentResponse.json()

      if (!paymentResponse.ok) {
        throw new Error(paymentResult.error || "Erro ao processar pagamento")
      }

      // Redirecionar para a página de confirmação com os dados do pagamento
      const paymentDataEncoded = encodeURIComponent(JSON.stringify(paymentResult.payment))
      router.push(`/pagamento/confirmacao?paymentData=${paymentDataEncoded}&pedidoId=${pedidoId}`)
    } catch (err: any) {
      console.error("Erro ao processar pagamento:", err)
      setError(err.message || "Erro ao processar pagamento com cartão")
    } finally {
      setIsProcessing(false)
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

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#2C2B34] px-5 pt-10 pb-20">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={280} height={100} priority />
        </div>

        <h1 className="text-white text-2xl font-bold mb-6 text-center">Pagamento com Cartão</h1>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        <div className="bg-[#3A3942] rounded-lg p-4 mb-6">
          <h2 className="font-bold text-lg mb-2">Resumo do Pedido</h2>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Pedido:</span>
            <span>#{pedidoId?.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Valor:</span>
            <span className="font-bold">R$ {amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-[#3A3942] rounded-lg p-4 mb-6">
          <h2 className="font-bold text-lg mb-4">Dados do Cartão</h2>
          <CreditCardForm onSubmit={handleSubmit} isProcessing={isProcessing} />
        </div>

        <button
          onClick={() => router.back()}
          className="w-full bg-transparent border border-white text-white py-3 rounded-full font-bold"
          disabled={isProcessing}
        >
          Voltar
        </button>
      </div>
    </main>
  )
}
