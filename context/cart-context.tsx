"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

interface CartItem {
  id: string
  nome: string
  quantidade: number
  preco: number
  imagem?: string
  revendedorId?: number
  revendedorNome?: string
}

interface CartContextType {
  items: CartItem[]
  currentRevendedorId: number | null
  currentRevendedorNome: string | null
  addItem: (item: CartItem) => Promise<void>
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantidade: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [currentRevendedorId, setCurrentRevendedorId] = useState<number | null>(null)
  const [currentRevendedorNome, setCurrentRevendedorNome] = useState<string | null>(null)
  const { user } = useAuth()

  // Carregar itens do carrinho do localStorage ou do banco de dados
  useEffect(() => {
    const loadCartItems = async () => {
      // Skip on server side to prevent SSR issues
      if (typeof window === 'undefined') {
        return
      }

      if (user) {
        try {
          const { getCarrinhoUsuario } = await import("@/lib/database")
          const { data, error } = await getCarrinhoUsuario(user.id)

          if (error) {
            console.error("Erro ao carregar carrinho:", error)
            return
          }

          if (data && Array.isArray(data) && data.length > 0) {
            const cartItems = data.map((item: any) => ({
              id: item.id.toString(),
              nome: item.produto_nome,
              quantidade: item.quantidade,
              preco: item.preco,
              imagem: item.imagem,
              revendedorId: item.revendedor_id,
              revendedorNome: item.revendedor_nome,
            }))
            setItems(cartItems)
            
            // Definir o revendedor atual baseado no primeiro item do carrinho
            if (cartItems.length > 0 && cartItems[0].revendedorId) {
              setCurrentRevendedorId(cartItems[0].revendedorId)
              setCurrentRevendedorNome(cartItems[0].revendedorNome || null)
            }
          } else {
            // Se não há dados ou dados não são array, inicializar com array vazio
            setItems([])
            setCurrentRevendedorId(null)
            setCurrentRevendedorNome(null)
          }
        } catch (error) {
          console.error("Erro ao carregar carrinho:", error)
          // Em caso de erro, garantir que temos um array vazio
          setItems([])
          setCurrentRevendedorId(null)
          setCurrentRevendedorNome(null)
        }
      } else {
        // Se não estiver logado, carrega do localStorage
        try {
          const savedCart = localStorage.getItem("cart")
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart)
            if (Array.isArray(parsedCart)) {
              setItems(parsedCart)
            } else {
              setItems([])
            }
          } else {
            setItems([])
          }
        } catch (error) {
          console.error("Erro ao carregar carrinho do localStorage:", error)
          setItems([])
        }
      }
    }

    loadCartItems()
  }, [user])

  // Salvar itens do carrinho no localStorage ou no banco de dados
  useEffect(() => {
    const saveCartItems = async () => {
      // Skip on server side to prevent SSR issues
      if (typeof window === 'undefined') {
        return
      }

      if (user) {
        try {
          const { atualizarCarrinhoUsuario } = await import("@/lib/database")
          await atualizarCarrinhoUsuario(user.id, items)
        } catch (error) {
          console.error("Erro ao salvar carrinho:", error)
        }
      } else {
        try {
          // Garantir que items é um array antes de salvar
          const itemsToSave = Array.isArray(items) ? items : []
          localStorage.setItem("cart", JSON.stringify(itemsToSave))
        } catch (error) {
          console.error("Erro ao salvar carrinho no localStorage:", error)
        }
      }
    }

    // Só salva se houver itens ou se o carrinho foi esvaziado
    if (Array.isArray(items) && (items.length > 0 || (user && typeof window !== 'undefined' && localStorage.getItem("cart")))) {
      saveCartItems()
    }
  }, [items, user])

  const addItem = async (item: CartItem) => {
    // Verificar se já existe um revendedor diferente no carrinho
    if (currentRevendedorId && item.revendedorId && currentRevendedorId !== item.revendedorId) {
      throw new Error(`Você já possui produtos de outro revendedor no carrinho. Finalize o pedido atual ou limpe o carrinho para adicionar produtos de "${item.revendedorNome}".`)
    }

    // Se é o primeiro item ou item do mesmo revendedor
    if (!currentRevendedorId && item.revendedorId) {
      setCurrentRevendedorId(item.revendedorId)
      setCurrentRevendedorNome(item.revendedorNome || null)
    }

    setItems((prevItems) => {
      // Garantir que prevItems é um array
      if (!Array.isArray(prevItems)) {
        return [item]
      }
      const existingItem = prevItems.find((i) => i.id === item.id)
      if (existingItem) {
        return prevItems.map((i) => (i.id === item.id ? { ...i, quantidade: i.quantidade + item.quantidade } : i))
      } else {
        return [...prevItems, item]
      }
    })
  }

  const removeItem = (id: string) => {
    setItems((prevItems) => {
      // Garantir que prevItems é um array
      if (!Array.isArray(prevItems)) {
        return []
      }
      const newItems = prevItems.filter((item) => item.id !== id)
      // Se o carrinho ficar vazio, limpar informações do revendedor
      if (newItems.length === 0) {
        setCurrentRevendedorId(null)
        setCurrentRevendedorNome(null)
      }
      return newItems
    })
  }

  const updateQuantity = (id: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeItem(id)
      return
    }
    setItems((prevItems) => {
      // Garantir que prevItems é um array
      if (!Array.isArray(prevItems)) {
        return []
      }
      return prevItems.map((item) => (item.id === id ? { ...item, quantidade } : item))
    })
  }

  const clearCart = () => {
    setItems([])
    setCurrentRevendedorId(null)
    setCurrentRevendedorNome(null)
  }

  const getSubtotal = () => {
    // Ensure items is always an array
    if (!Array.isArray(items)) {
      return 0
    }
    return items.reduce((total, item) => total + item.preco * item.quantidade, 0)
  }

  const getTotal = () => {
    // Por enquanto, o total é igual ao subtotal
    // Futuramente pode incluir frete, descontos, etc.
    return getSubtotal()
  }

  const getItemCount = () => {
    // Ensure items is always an array
    if (!Array.isArray(items)) {
      return 0
    }
    return items.reduce((count, item) => count + item.quantidade, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        currentRevendedorId,
        currentRevendedorNome,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getSubtotal,
        getTotal,
        getItemCount: () => getItemCount(),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
