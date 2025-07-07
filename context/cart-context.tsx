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
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
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
  const { user } = useAuth()

  // Carregar itens do carrinho do localStorage ou do banco de dados
  useEffect(() => {
    const loadCartItems = async () => {
      if (user) {
        try {
          const { getCarrinhoUsuario } = await import("@/lib/database")
          const { data, error } = await getCarrinhoUsuario(user.id)

          if (error) {
            console.error("Erro ao carregar carrinho:", error)
            return
          }

          if (data && data.length > 0) {
            const cartItems = data.map((item: any) => ({
              id: item.id.toString(),
              nome: item.produto,
              quantidade: item.quantidade,
              preco: item.preco,
              imagem: item.imagem,
            }))
            setItems(cartItems)
          }
        } catch (error) {
          console.error("Erro ao carregar carrinho:", error)
        }
      } else {
        // Se não estiver logado, carrega do localStorage
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          setItems(JSON.parse(savedCart))
        }
      }
    }

    loadCartItems()
  }, [user])

  // Salvar itens do carrinho no localStorage ou no banco de dados
  useEffect(() => {
    const saveCartItems = async () => {
      if (user) {
        try {
          const { atualizarCarrinhoUsuario } = await import("@/lib/database")
          await atualizarCarrinhoUsuario(user.id, items)
        } catch (error) {
          console.error("Erro ao salvar carrinho:", error)
        }
      } else {
        localStorage.setItem("cart", JSON.stringify(items))
      }
    }

    // Só salva se houver itens ou se o carrinho foi esvaziado
    if (items.length > 0 || (user && localStorage.getItem("cart"))) {
      saveCartItems()
    }
  }, [items, user])

  const addItem = (item: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)
      if (existingItem) {
        return prevItems.map((i) => (i.id === item.id ? { ...i, quantidade: i.quantidade + item.quantidade } : i))
      } else {
        return [...prevItems, item]
      }
    })
  }

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantidade: number) => {
    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantidade } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.preco * item.quantidade, 0)
  }

  const getTotal = () => {
    // Por enquanto, o total é igual ao subtotal
    // Futuramente pode incluir frete, descontos, etc.
    return getSubtotal()
  }

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantidade, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
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
