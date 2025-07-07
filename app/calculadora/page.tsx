"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SpinningWheel from "@/components/spinning-wheel"

// Adicione um tipo para os tamanhos
type Tamanho = {
  id: string
  nome: string
}

// Add this type for heights
type Altura = {
  id: string
  valor: string
}

// Add this type for widths
type Largura = {
  id: string
  valor: string
}

// Add this type for packages
type Pacote = {
  id: string
  nome: string
  cor: string
}

// Update the component to include the heights state and dropdown
export default function Calculadora() {
  const router = useRouter()
  const [tamanhoRoda, setTamanhoRoda] = useState("")
  const [selectedTamanhoId, setSelectedTamanhoId] = useState("")
  const [altura, setAltura] = useState("")
  const [selectedAlturaId, setSelectedAlturaId] = useState("")
  const [largura, setLargura] = useState("")
  const [selectedLarguraId, setSelectedLarguraId] = useState("")
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([])
  const [alturas, setAlturas] = useState<Altura[]>([])
  const [larguras, setLarguras] = useState<Largura[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAlturas, setLoadingAlturas] = useState(false)
  const [loadingLarguras, setLoadingLarguras] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Add this function to fetch heights when a wheel size is selected
  const fetchAlturas = async (tamanhoId: string) => {
    if (!tamanhoId) return

    try {
      setLoadingAlturas(true)
      const { getAlturasByTamanhoId } = await import("@/lib/database")
      const { data, error } = await getAlturasByTamanhoId(tamanhoId)

      if (error) {
        console.error("Erro ao buscar alturas:", error)
        return
      }

      if (data) {
        setAlturas(data)
      }
    } catch (error) {
      console.error("Erro ao buscar alturas:", error)
    } finally {
      setLoadingAlturas(false)
    }
  }

  // Add this function to fetch widths when a height is selected
  const fetchLarguras = async (alturaId: string) => {
    if (!alturaId) return

    try {
      setLoadingLarguras(true)
      const { getLargurasByAlturaId } = await import("@/lib/database")
      const { data, error } = await getLargurasByAlturaId(alturaId)

      if (error) {
        console.error("Erro ao buscar larguras:", error)
        return
      }

      if (data) {
        setLarguras(data)
      }
    } catch (error) {
      console.error("Erro ao buscar larguras:", error)
    } finally {
      setLoadingLarguras(false)
    }
  }

  // Modify the useEffect to store the full tamanho objects
  useEffect(() => {
    async function fetchTamanhos() {
      try {
        setLoading(true)
        const { getTamanhos } = await import("@/lib/database")
        const { data, error } = await getTamanhos()

        if (error) {
          console.error("Erro ao buscar tamanhos:", error)
          return
        }

        if (data) {
          setTamanhos(data)
        }
      } catch (error) {
        console.error("Erro ao buscar tamanhos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTamanhos()
  }, [])

  const handleCalcular = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Verificar se todos os campos foram preenchidos
      if (!tamanhoRoda || !altura || !largura || !selectedLarguraId) {
        alert("Por favor, preencha todos os campos")
        return
      }

      // Show loading animation
      setIsCalculating(true)

      // Fetch package details based on the selected width ID
      const { getPacoteByLarguraId, salvarCalculo } = await import("@/lib/database")
      const { data: pacote, error: pacoteError } = await getPacoteByLarguraId(selectedLarguraId)

      console.log("Pacote encontrado:", pacote)
      console.log("Erro do pacote:", pacoteError)

      if (pacoteError) {
        console.error("Erro ao buscar pacote:", pacoteError)
        setIsCalculating(false)
        alert("Ocorreu um erro ao buscar o pacote recomendado. Tente novamente.")
        return
      }

      if (!pacote || !pacote.nome) {
        console.error("Pacote não encontrado ou inválido:", pacote)
        setIsCalculating(false)
        alert("Pacote não encontrado para as dimensões selecionadas. Tente outras dimensões.")
        return
      }

      // Save calculation if user is logged in
      const { getCurrentUser } = await import("@/lib/auth")
      const { user } = await getCurrentUser()

      if (user) {
        await salvarCalculo(tamanhoRoda, altura, largura, pacote.nome, pacote.cor)
      }

      // Wait for 1.5 seconds to show the loading animation
      setTimeout(() => {
        setIsCalculating(false)
        // Redirect to result page with parameters
        router.push(
          `/resultado?tamanhoRoda=${encodeURIComponent(tamanhoRoda)}&altura=${encodeURIComponent(altura)}&largura=${encodeURIComponent(largura)}&resultado=${encodeURIComponent(pacote.nome)}&cor=${encodeURIComponent(pacote.cor)}`,
        )
      }, 1500)
    } catch (error) {
      console.error("Erro ao calcular:", error)
      setIsCalculating(false)
      alert("Ocorreu um erro ao realizar o cálculo. Tente novamente.")
    }
  }

  // Update the form to include the altura dropdown
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#2C2B34] px-5 py-10">
      {/* Logo */}
      <div className="mb-1">
        <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={280} height={100} priority />
      </div>

      {/* Título e subtítulo */}
      <div className="text-center mb-8 -mt-2">
        <p className="text-gray-400 text-sm">Calculadora de Pacotes de Microesferas</p>
      </div>

      {/* Loading overlay */}
      {isCalculating && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#2C2B34] p-8 rounded-lg flex flex-col items-center">
            <SpinningWheel size={120} color="#ED1C24" />
            <p className="text-white mt-4 text-lg">Calculando...</p>
          </div>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleCalcular} className="w-full max-w-md flex flex-col gap-4">
        {/* Tamanho da Roda - Select personalizado */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Image src="/images/calendar-icon.png" alt="Calendário" width={20} height={20} />
          </div>
          <div
            className="w-full bg-[#3A3942] text-white py-4 pl-12 pr-4 rounded-[16px] focus:outline-none cursor-pointer flex justify-between items-center"
            onClick={() => setOpenDropdown(openDropdown === "tamanho" ? null : "tamanho")}
          >
            <span>{tamanhoRoda || "Tamanho da Roda"}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${openDropdown === "tamanho" ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Dropdown para tamanhos */}
          {openDropdown === "tamanho" && (
            <div className="absolute z-10 mt-1 w-full bg-[#3A3942] rounded-[16px] shadow-lg max-h-60 overflow-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">Carregando...</div>
              ) : tamanhos.length === 0 ? (
                <div className="p-4 text-center text-gray-400">Nenhum tamanho disponível</div>
              ) : (
                tamanhos.map((tamanho) => (
                  <div
                    key={tamanho.id}
                    className="px-4 py-3 hover:bg-[#4A4953] cursor-pointer"
                    onClick={() => {
                      setTamanhoRoda(tamanho.nome)
                      setSelectedTamanhoId(tamanho.id)
                      setOpenDropdown(null)
                      // Reset altura and largura when tamanho changes
                      setAltura("")
                      setSelectedAlturaId("")
                      setLargura("")
                      setSelectedLarguraId("")
                      setLarguras([])
                      // Fetch alturas for the selected tamanho
                      fetchAlturas(tamanho.id)
                    }}
                  >
                    {tamanho.nome}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Altura - Select personalizado */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Image src="/images/calendar-icon.png" alt="Calendário" width={20} height={20} />
          </div>
          <div
            className={`w-full bg-[#3A3942] text-white py-4 pl-12 pr-4 rounded-[16px] focus:outline-none cursor-pointer flex justify-between items-center ${!selectedTamanhoId ? "opacity-70" : ""}`}
            onClick={() => {
              if (selectedTamanhoId) {
                setOpenDropdown(openDropdown === "altura" ? null : "altura")
              }
            }}
          >
            <span>{altura || "Altura"}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${openDropdown === "altura" ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Dropdown para alturas */}
          {openDropdown === "altura" && (
            <div className="absolute z-10 mt-1 w-full bg-[#3A3942] rounded-[16px] shadow-lg max-h-60 overflow-auto">
              {loadingAlturas ? (
                <div className="p-4 text-center text-gray-400">Carregando...</div>
              ) : alturas.length === 0 ? (
                <div className="p-4 text-center text-gray-400">Nenhuma altura disponível</div>
              ) : (
                alturas.map((alturaItem) => (
                  <div
                    key={alturaItem.id}
                    className="px-4 py-3 hover:bg-[#4A4953] cursor-pointer"
                    onClick={() => {
                      setAltura(alturaItem.valor)
                      setSelectedAlturaId(alturaItem.id)
                      setOpenDropdown(null)
                      // Reset largura when altura changes
                      setLargura("")
                      setSelectedLarguraId("")
                      // Fetch larguras for the selected altura
                      fetchLarguras(alturaItem.id)
                    }}
                  >
                    {alturaItem.valor}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Largura - Select personalizado */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Image src="/images/calendar-icon.png" alt="Calendário" width={20} height={20} />
          </div>
          <div
            className={`w-full bg-[#3A3942] text-white py-4 pl-12 pr-4 rounded-[16px] focus:outline-none cursor-pointer flex justify-between items-center ${!selectedAlturaId ? "opacity-70" : ""}`}
            onClick={() => {
              if (selectedAlturaId) {
                setOpenDropdown(openDropdown === "largura" ? null : "largura")
              }
            }}
          >
            <span>{largura || "Largura"}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${openDropdown === "largura" ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Dropdown para larguras */}
          {openDropdown === "largura" && (
            <div className="absolute z-10 mt-1 w-full bg-[#3A3942] rounded-[16px] shadow-lg max-h-60 overflow-auto">
              {loadingLarguras ? (
                <div className="p-4 text-center text-gray-400">Carregando...</div>
              ) : larguras.length === 0 ? (
                <div className="p-4 text-center text-gray-400">Nenhuma largura disponível</div>
              ) : (
                larguras.map((larguraItem) => (
                  <div
                    key={larguraItem.id}
                    className="px-4 py-3 hover:bg-[#4A4953] cursor-pointer"
                    onClick={() => {
                      setLargura(larguraItem.valor)
                      setSelectedLarguraId(larguraItem.id)
                      setOpenDropdown(null)
                    }}
                  >
                    {larguraItem.valor}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-[#fdc300] text-white py-4 rounded-full font-bold mt-4"
          disabled={isCalculating}
        >
          {isCalculating ? "Calculando..." : "Calcular"}
        </button>
      </form>

      {/* Links de rodapé */}
      <div className="flex justify-between w-full max-w-md mt-8">
        <Link href="/login" className="text-white underline">
          Login
        </Link>
        <Link href="/cadastro" className="text-white underline">
          Cadastre-se
        </Link>
      </div>
    </main>
  )
}
