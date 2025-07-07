"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useCart } from "@/context/cart-context"
import SpinningWheel from "@/components/spinning-wheel"

// Adicione este tipo
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

// Add this type for calculation results
type CalculationResult = {
  tamanhoRoda: string
  altura: string
  largura: string
  resultado: string
  cor: string
}

// Updated type for products with image
type Produto = {
  nome: string
  preco: number
  imagem?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("calculadora")
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    largura: "",
    altura: "",
    tamanhoRoda: "",
  })
  const [selectedTamanhoId, setSelectedTamanhoId] = useState("")
  const [selectedAlturaId, setSelectedAlturaId] = useState("")
  const [selectedLarguraId, setSelectedLarguraId] = useState("")
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([])
  const [alturas, setAlturas] = useState<Altura[]>([])
  const [larguras, setLarguras] = useState<Largura[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAlturas, setLoadingAlturas] = useState(false)
  const [loadingLarguras, setLoadingLarguras] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // New state for calculation results
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)

  // Add these new state variables after the existing state declarations
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)

  // Estados para revendedores
  const [revendedores, setRevendedores] = useState<any[]>([])
  const [revendedorSelecionado, setRevendedorSelecionado] = useState<any | null>(null)
  const [loadingRevendedores, setLoadingRevendedores] = useState(false)
  const [estoqueRevendedor, setEstoqueRevendedor] = useState<Record<string, number>>({})

  const { user, loading: authLoading } = useAuth()
  const { getItemCount, addItem, items, currentRevendedorId, currentRevendedorNome } = useCart()
  const [cartCount, setCartCount] = useState(0)

  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

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

  // Updated fetchProdutos function to include image and description
  const fetchProdutos = async () => {
    try {
      setLoadingProdutos(true)
      const { supabase } = await import("@/lib/supabase")

      // Get all packages and then filter for distinct names with minimum price
      const { data, error } = await supabase
        .from("pacotes")
        .select("nome, preco, imagem")
        .order("preco", { ascending: true })

      if (error) {
        console.error("Erro ao buscar produtos:", error)
        return
      }

      if (data) {
        // Get distinct packages by name, keeping the one with lowest price
        const distinctProdutos = data.reduce((acc: Produto[], current: Produto) => {
          const existing = acc.find((item) => item.nome === current.nome)
          if (!existing) {
            acc.push(current)
          }
          return acc
        }, [])

        setProdutos(distinctProdutos)
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
    } finally {
      setLoadingProdutos(false)
    }
  }

  // Função para buscar revendedores disponíveis
  const fetchRevendedores = async () => {
    try {
      setLoadingRevendedores(true)
      const { supabase } = await import("@/lib/supabase")

      // Buscar todos os revendedores ativos com foto da tabela usuarios
      const { data: revendedoresData, error } = await supabase
        .from("revendedores")
        .select(`
          *,
          usuarios!inner(foto)
        `)
        .eq("status", true)
        .eq("usuarios.tipo", "revendedor")
        .order("cidade", { ascending: true })

      if (error) {
        console.error("Erro ao buscar revendedores:", error)
        return
      }

      if (revendedoresData) {
        setRevendedores(revendedoresData)

        // Se o usuário tem cidade, tentar selecionar revendedor da mesma cidade
        if (user && user.cidade) {
          const revendedorLocal = revendedoresData.find((r) => r.cidade.toLowerCase() === user.cidade.toLowerCase())
          if (revendedorLocal) {
            setRevendedorSelecionado(revendedorLocal)
            await fetchEstoqueRevendedor(revendedorLocal.id)
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar revendedores:", error)
    } finally {
      setLoadingRevendedores(false)
    }
  }

  // Função para buscar estoque do revendedor
  const fetchEstoqueRevendedor = async (revendedorId: number) => {
    try {
      const { supabase } = await import("@/lib/supabase")

      const { data: estoqueData, error } = await supabase
        .from("revendedor_estoque")
        .select("produto, quantidade")
        .eq("revendedor_id", revendedorId)
        .gt("quantidade", 0)

      if (error) {
        console.error("Erro ao buscar estoque:", error)
        return
      }

      if (estoqueData) {
        const estoqueMap: Record<string, number> = {}
        estoqueData.forEach((item) => {
          estoqueMap[item.produto] = item.quantidade
        })
        setEstoqueRevendedor(estoqueMap)
      }
    } catch (error) {
      console.error("Erro ao buscar estoque:", error)
    }
  }

  // Function to add product to cart
  const handleAddToCart = async (produto: Produto) => {
    // Verificar se há revendedor selecionado
    if (!revendedorSelecionado) {
      alert("Por favor, selecione um revendedor antes de adicionar produtos ao carrinho.")
      return
    }

    // Verificar se o produto está em estoque
    const estoque = estoqueRevendedor[produto.nome] || 0
    if (estoque < 5) {
      alert(`Produto ${produto.nome} não está disponível em estoque suficiente.`)
      return
    }

    try {
      setAddingToCart(produto.nome)

      // Create cart item with quantity 5 (minimum increment)
      const cartItem = {
        id: produto.nome.toLowerCase().replace(/\s+/g, "-"),
        nome: produto.nome,
        descricao: `Pacote de microesferas ${produto.nome}`,
        preco: produto.preco,
        quantidade: 5, // Start with 5 instead of 1
        imagem: produto.imagem || "/placeholder.svg",
        revendedorId: revendedorSelecionado.id,
        revendedorNome: revendedorSelecionado.loja,
      }

      // Add to cart - this will throw an error if different revendedor
      await addItem(cartItem)

      // Update cart count
      setCartCount(getItemCount())

      // Show success message
      setShowSuccessMessage(`${produto.nome} adicionado ao carrinho!`)

      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(null)
      }, 2000)
    } catch (error: any) {
      console.error("Erro ao adicionar produto ao carrinho:", error)
      alert(error.message || "Erro ao adicionar produto ao carrinho. Tente novamente.")
    } finally {
      setAddingToCart(null)
    }
  }

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!authLoading && !user) {
      router.push("/login")
    }

    // Atualizar contagem do carrinho
    setCartCount(getItemCount())

    // Buscar tamanhos disponíveis
    async function fetchTamanhos() {
      try {
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
    // In the existing useEffect, add this line after fetchTamanhos()
    fetchProdutos()
    fetchRevendedores()
  }, [user, authLoading, router, getItemCount])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0))
    setScrollLeft(carouselRef.current?.scrollLeft || 0)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (carouselRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 2 // Velocidade do scroll
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0))
    setScrollLeft(carouselRef.current?.scrollLeft || 0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const x = e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 2
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Updated handleCalcular function to show results in the same container
  const handleCalcular = async () => {
    try {
      // Reset any previous errors
      setSaveError(null)

      // Verificar se todos os campos foram preenchidos
      if (!formData.tamanhoRoda || !formData.altura || !formData.largura || !selectedLarguraId) {
        alert("Por favor, preencha todos os campos")
        return
      }

      // Show loading animation
      setIsCalculating(true)

      // Fetch package details based on the selected width ID
      const { getPacoteByLarguraId, salvarCalculoUsuario } = await import("@/lib/database")
      const { data, error } = await getPacoteByLarguraId(selectedLarguraId)

      if (error) {
        console.error("Erro ao buscar pacote:", error)
        setIsCalculating(false)
        alert("Ocorreu um erro ao buscar o pacote recomendado. Tente novamente.")
        return
      }

      // Check if data is empty or has multiple items
      if (!data || data.length === 0) {
        console.error("Pacote não encontrado")
        setIsCalculating(false)
        alert("Pacote não encontrado para as dimensões selecionadas. Tente outras dimensões.")
        return
      }

      // Use the first package if multiple are returned
      const pacote = Array.isArray(data) ? data[0] : data

      // Save calculation to calculo_usuarios if user is logged in
      if (user && user.id) {
        const { data: savedData, error: saveError } = await salvarCalculoUsuario(
          user.id.toString(),
          formData.tamanhoRoda,
          formData.altura,
          formData.largura,
          pacote.nome,
        )

        if (saveError) {
          console.error("Erro ao salvar cálculo do usuário:", saveError)
          setSaveError("Não foi possível salvar seu cálculo. O resultado ainda é válido.")
        }
      }

      // Wait for 1.5 seconds to show the loading animation
      setTimeout(() => {
        setIsCalculating(false)

        // Set the calculation result instead of redirecting
        setCalculationResult({
          tamanhoRoda: formData.tamanhoRoda,
          altura: formData.altura,
          largura: formData.largura,
          resultado: pacote.nome,
          cor: pacote.cor,
        })
      }, 1500)
    } catch (error) {
      console.error("Erro ao calcular:", error)
      setIsCalculating(false)
      alert("Ocorreu um erro ao realizar o cálculo. Tente novamente.")
    }
  }

  // Function to reset the calculator
  const handleResetCalculator = () => {
    setCalculationResult(null)
    setSaveError(null)
    setFormData({
      largura: "",
      altura: "",
      tamanhoRoda: "",
    })
    setSelectedTamanhoId("")
    setSelectedAlturaId("")
    setSelectedLarguraId("")
    setAlturas([])
    setLarguras([])
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const navigateToCart = () => {
    router.push("/carrinho")
  }

  // Update the calculadora tab content to include the altura dropdown
  return (
    <main className="flex flex-col min-h-screen bg-[#2C2B34] text-white">
      {/* Loading overlay */}
      {isCalculating && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#2C2B34] p-8 rounded-lg flex flex-col items-center">
            <SpinningWheel size={120} color="#ED1C24" />
            <p className="text-white mt-4 text-lg">Calculando...</p>
          </div>
        </div>
      )}

      {/* Success message overlay */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {showSuccessMessage}
          </div>
        </div>
      )}

      {/* Título e ícone de carrinho */}
      <div className="relative flex justify-center items-center py-4 px-4">
        <h1 className="text-xl font-bold mt-4">Car+ Microesferas</h1>
        <button
          onClick={navigateToCart}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-[#3A3942] transition-colors"
          aria-label="Ver carrinho"
        >
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#ED1C24] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Barra de pesquisa */}
      <div className="px-4 py-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              style={{ color: "#FFFFFFB2" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 bg-[#3A3942] rounded-full text-white placeholder-white focus:outline-none"
            placeholder="Procurar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label="Limpar pesquisa"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Seletor de Revendedores */}
      <div className="px-4 py-2 mt-4">
        <h3 className="text-lg font-bold mb-3">Selecione um Revendedor</h3>

        {/* Alert se já há produtos de outro revendedor no carrinho */}
        {currentRevendedorId && revendedorSelecionado && currentRevendedorId !== revendedorSelecionado.id && (
          <div className="bg-orange-500 bg-opacity-20 border border-orange-500 rounded-lg p-3 mb-4">
            <p className="text-orange-300 text-sm">
              ⚠️ Você já possui produtos de "{currentRevendedorNome}" no carrinho. Para adicionar produtos de outro
              revendedor, finalize o pedido atual ou limpe o carrinho.
            </p>
          </div>
        )}

        {loadingRevendedores ? (
          <div className="bg-[#3A3942] rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-600 rounded mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-2/3"></div>
          </div>
        ) : revendedores.length === 0 ? (
          <div className="bg-[#3A3942] rounded-lg p-4 text-center">
            <p className="text-gray-300">Nenhum revendedor disponível</p>
            <p className="text-sm text-gray-400 mt-1">Não será possível adicionar produtos ao carrinho</p>
          </div>
        ) : (
          <div className={`space-y-2 ${revendedores.length > 2 ? "max-h-64 overflow-y-auto" : ""}`}>
            {revendedores.map((revendedor) => (
              <div
                key={revendedor.id}
                className={`bg-[#3A3942] rounded-lg p-4 cursor-pointer transition-all ${
                  revendedorSelecionado?.id === revendedor.id
                    ? "ring-2 ring-[#ED1C24] bg-[#4A4953]"
                    : "hover:bg-[#4A4953]"
                }`}
                onClick={async () => {
                  setRevendedorSelecionado(revendedor)
                  await fetchEstoqueRevendedor(revendedor.id)
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Imagem da loja */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-600 flex-shrink-0">
                      {revendedor.usuarios?.foto ? (
                        <Image
                          src={revendedor.usuarios.foto || "/placeholder.svg"}
                          alt={`Loja ${revendedor.loja}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Informações da loja */}
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{revendedor.loja}</h4>
                      <p className="text-sm text-gray-300">
                        {revendedor.cidade}, {revendedor.uf}
                      </p>
                      {revendedor.frete && (
                        <p className="text-xs text-gray-400 mt-1">Frete: R$ {revendedor.frete.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {revendedorSelecionado?.id === revendedor.id && (
                      <div className="w-4 h-4 bg-[#ED1C24] rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex mt-4 border-b border-[#3A3942]">
        <button
          className={`flex-1 py-3 text-center font-medium relative ${
            activeTab === "calculadora" ? "text-white" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("calculadora")}
        >
          Calculadora
          {activeTab === "calculadora" && <div className="absolute bottom-0 left-4 w-24 h-[2px] bg-white"></div>}
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium relative ${
            activeTab === "comprar" ? "text-white" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("comprar")}
        >
          Comprar agora
          {activeTab === "comprar" && <div className="absolute bottom-0 left-4 w-28 h-[2px] bg-white"></div>}
        </button>
      </div>

      {/* Conteúdo da aba "Comprar" */}
      {activeTab === "comprar" && (
        <div className="space-y-4">
          {!revendedorSelecionado && (
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-3 mb-4">
              <p className="text-yellow-300 text-sm">
                ⚠️ Selecione um revendedor para ver a disponibilidade dos produtos
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 justify-items-center">
            {loadingProdutos ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-[#3A3942] rounded-lg" style={{ width: "176.5px", height: "195px" }} />
                  <div className="p-3 bg-transparent">
                    <div className="h-4 bg-[#3A3942] rounded mb-2"></div>
                    <div className="h-4 bg-[#3A3942] rounded w-16"></div>
                  </div>
                </div>
              ))
            ) : produtos.length === 0 ? (
              <div className="col-span-2 text-center text-gray-400 py-8">Nenhum produto disponível</div>
            ) : (
              produtos.map((produto, index) => {
                const estoque = estoqueRevendedor[produto.nome] || 0
                const temEstoque = estoque >= 5
                const revendedorDiferente =
                  currentRevendedorId && revendedorSelecionado && currentRevendedorId !== revendedorSelecionado.id
                const podeAdicionar = revendedorSelecionado && temEstoque && !revendedorDiferente

                return (
                  <div
                    key={produto.nome}
                    onClick={() => podeAdicionar && handleAddToCart(produto)}
                    className={`relative ${podeAdicionar ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    <div
                      className={`relative overflow-hidden bg-[#3A3942] rounded-lg flex items-center justify-center ${
                        !podeAdicionar ? "opacity-50" : ""
                      }`}
                      style={{ width: "176.5px", height: "195px" }}
                    >
                      {/* Loading overlay for individual product */}
                      {addingToCart === produto.nome && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}

                      {/* Overlay para produtos sem estoque */}
                      {!temEstoque && revendedorSelecionado && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
                          <div className="text-center text-white">
                            <p className="text-sm font-bold">Sem Estoque</p>
                            <p className="text-xs">Indisponível</p>
                          </div>
                        </div>
                      )}

                      {/* Overlay para revendedor diferente */}
                      {revendedorDiferente && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
                          <div className="text-center text-white">
                            <p className="text-sm font-bold">Revendedor Diferente</p>
                            <p className="text-xs">Finalize o pedido atual</p>
                          </div>
                        </div>
                      )}

                      {/* Use database image if available, otherwise show placeholder */}
                      {produto.imagem ? (
                        <Image
                          src={produto.imagem || "/placeholder.svg"}
                          alt={`Pacote ${produto.nome}`}
                          fill
                          className={`object-cover transition-transform duration-300 ease-in-out ${
                            podeAdicionar ? "hover:scale-110" : ""
                          } ${!podeAdicionar ? "blur-sm" : ""}`}
                        />
                      ) : (
                        <div className="text-center text-white">
                          <div className="text-4xl mb-2">📦</div>
                          <p className="text-sm">{produto.nome}</p>
                        </div>
                      )}

                      {/* Add to cart icon overlay */}
                      {podeAdicionar && (
                        <div className="absolute bottom-2 right-2 bg-[#ED1C24] rounded-full p-2 opacity-80 hover:opacity-100 transition-opacity">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-transparent">
                      <h3 className={`font-bold ${!podeAdicionar ? "text-gray-500" : ""}`}>Pacote {produto.nome}</h3>
                      <p className={`${!podeAdicionar ? "text-gray-500" : "text-white"}`}>
                        A partir de R${produto.preco?.toFixed(2) || "0.00"}
                      </p>
                      {revendedorSelecionado && (
                        <p className={`text-xs mt-1 ${temEstoque ? "text-green-400" : "text-red-400"}`}>
                          {revendedorDiferente
                            ? "Revendedor diferente"
                            : temEstoque
                              ? `Estoque: ${estoque} unidades`
                              : "Sem estoque"}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Conteúdo da aba "Calculadora" */}
      <div className="flex-1 p-4">
        {activeTab === "calculadora" && (
          <div className="space-y-4">
            {/* Tamanho da Roda - Select personalizado */}
            <div className="relative">
              <div
                className="relative bg-[#3A3942] rounded-lg p-4 cursor-pointer flex justify-between items-center"
                onClick={() => setOpenDropdown(openDropdown === "tamanho" ? null : "tamanho")}
              >
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Calendar-1vKEefHxTCdNYT9uW7SQFPfRMiXYUm.png"
                    alt="Calendário"
                    width={20}
                    height={20}
                    className="opacity-70"
                  />
                </div>
                <span className="w-full bg-transparent text-white pl-10 focus:outline-none">
                  {formData.tamanhoRoda || "Tamanho da Roda"}
                </span>
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
                <div className="absolute z-10 mt-1 w-full bg-[#3A3942] rounded-lg shadow-lg max-h-60 overflow-auto">
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
                          setFormData((prev) => ({ ...prev, tamanhoRoda: tamanho.nome, altura: "", largura: "" }))
                          setSelectedTamanhoId(tamanho.id)
                          setSelectedAlturaId("")
                          setSelectedLarguraId("")
                          setOpenDropdown(null)
                          // Reset larguras when tamanho changes
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
              <div
                className={`relative bg-[#3A3942] rounded-lg p-4 cursor-pointer flex justify-between items-center ${!selectedTamanhoId ? "opacity-70" : ""}`}
                onClick={() => {
                  if (selectedTamanhoId) {
                    setOpenDropdown(openDropdown === "altura" ? null : "altura")
                  }
                }}
              >
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Calendar-1vKEefHxTCdNYT9uW7SQFPfRMiXYUm.png"
                    alt="Calendário"
                    width={20}
                    height={20}
                    className="opacity-70"
                  />
                </div>
                <span className="w-full bg-transparent text-white pl-10 focus:outline-none">
                  {formData.altura || "Altura"}
                </span>
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
                <div className="absolute z-10 mt-1 w-full bg-[#3A3942] rounded-lg shadow-lg max-h-60 overflow-auto">
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
                          setFormData((prev) => ({ ...prev, altura: alturaItem.valor, largura: "" }))
                          setSelectedAlturaId(alturaItem.id)
                          setOpenDropdown(null)
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
              <div
                className={`relative bg-[#3A3942] rounded-lg p-4 cursor-pointer flex justify-between items-center ${!selectedAlturaId ? "opacity-70" : ""}`}
                onClick={() => {
                  if (selectedAlturaId) {
                    setOpenDropdown(openDropdown === "largura" ? null : "largura")
                  }
                }}
              >
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Calendar-1vKEefHxTCdNYT9uW7SQFPfRMiXYUm.png"
                    alt="Calendário"
                    width={20}
                    height={20}
                    className="opacity-70"
                  />
                </div>
                <span className="w-full bg-transparent text-white pl-10 focus:outline-none">
                  {formData.largura || "Largura"}
                </span>
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
                <div className="absolute z-10 mt-1 w-full bg-[#3A3942] rounded-lg shadow-lg max-h-60 overflow-auto">
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
                          setFormData((prev) => ({ ...prev, largura: larguraItem.valor }))
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

            {/* Erro ao salvar cálculo */}
            {saveError && (
              <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
                {saveError}
              </div>
            )}

            {/* Resultado da calculadora - aparece acima do botão quando calculado */}
            {calculationResult && (
              <div
                className="w-full py-3 px-4 rounded-full text-center text-white mt-4"
                style={{ backgroundColor: calculationResult.cor }}
              >
                <h3 className="text-xl font-bold">{calculationResult.resultado}</h3>
                <p className="text-sm">Pacote recomendado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botão Calcular ou Novo cálculo */}
      {activeTab === "calculadora" && (
        <div className="p-4">
          <button
            onClick={calculationResult ? handleResetCalculator : handleCalcular}
            className="w-full bg-[#ED1C24] text-white py-4 rounded-full font-bold"
            disabled={isCalculating}
          >
            {isCalculating ? "Calculando..." : calculationResult ? "Novo cálculo" : "Calcular"}
          </button>
        </div>
      )}

      {/* Barra de navegação inferior */}
      <div className="flex justify-around items-center py-4 bg-[#2C2B34]">
        <Link href="/dashboard" className="flex flex-col items-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs mt-1">Início</span>
        </Link>
        <Link href="/pedidos" className="flex flex-col items-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <span className="text-xs mt-1">Pedidos</span>
        </Link>
        <Link href="/perfil" className="flex flex-col items-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs mt-1">Perfil</span>
        </Link>
      </div>
    </main>
  )
}
