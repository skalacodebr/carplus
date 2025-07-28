import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para os dados do Supabase
export type User = {
  id: string
  email: string
  nome: string
  sobrenome: string
  telefone: string
  created_at: string
}

export type Produto = {
  id: string
  nome: string
  categoria: string
  preco: number
  descricao: string
  imagem_principal: string
  imagens: string[]
  estoque: number
  created_at: string
}

export type Pedido = {
  id: string
  user_id: string
  status: string
  total: number
  created_at: string
}

export type ItemPedido = {
  id: string
  pedido_id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  created_at: string
}

export type CalculoResultado = {
  id: string
  tamanho_roda: string
  altura: string
  largura: string
  resultado: string
  created_at: string
}
