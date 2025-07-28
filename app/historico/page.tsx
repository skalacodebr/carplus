"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

type CalculoHistorico = {
  id: string
  tamanho: string
  altura: string
  largura: string
  pacote: string
  created_at: string
}

export default function Historico() {
  const [calculos, setCalculos] = useState<CalculoHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user?.id) {
      buscarHistorico()
    }
  }, [user, authLoading, router])

  const buscarHistorico = async () => {
    try {
      setLoading(true)
      const { getCalculosUsuario } = await import("@/lib/database")
      const { data, error } = await getCalculosUsuario(user?.id.toString() || "")

      if (error) {
        console.error("Erro ao buscar histórico:", error)
        return
      }

      setCalculos(data || [])
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }


  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#2C2B34] px-5">
        <div className="animate-pulse text-white">Carregando...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#2C2B34] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#3A3942]">
        <Link href="/dashboard" className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold">Histórico de Cálculos</h1>
        <div className="w-6"></div> {/* Spacer */}
      </div>

      {/* Logo */}
      <div className="flex justify-center py-6">
        <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={200} height={60} priority />
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-20">
        {calculos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">Nenhum cálculo realizado ainda</p>
              <p className="text-sm mt-2">Seus últimos 10 cálculos aparecerão aqui</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center text-gray-400 text-sm mb-6">
              Últimos {calculos.length} cálculos (máximo 10)
            </div>
            
            {calculos.map((calculo, index) => (
              <div key={calculo.id} className="bg-[#3A3942] rounded-lg p-4 relative">
                <div className="mb-3">
                  <div className="text-sm text-gray-400">
                    #{calculos.length - index} • {formatarData(calculo.created_at)}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Tamanho</div>
                    <div className="font-medium">{calculo.tamanho}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Altura</div>
                    <div className="font-medium">{calculo.altura}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Largura</div>
                    <div className="font-medium">{calculo.largura}</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-[#4A4953]">
                  <div className="text-gray-400 text-sm">Resultado</div>
                  <div className="font-bold text-[#fdc300]">{calculo.pacote}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Barra de navegação inferior */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-4 bg-[#2C2B34] border-t border-[#3A3942]">
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Início</span>
        </Link>
        <Link href="/pedidos" className="flex flex-col items-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="text-xs mt-1">Pedidos</span>
        </Link>
        <Link href="/perfil" className="flex flex-col items-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs mt-1">Perfil</span>
        </Link>
      </div>
    </main>
  )
}