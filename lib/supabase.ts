import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lqiabcgdtnadggjswbmr.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxaWFiY2dkdG5hZGdnanN3Ym1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNTM2NTksImV4cCI6MjA2MjYyOTY1OX0.6_FBwdlkA2bVS0-lJwn3twyLNmqk_QFZdUpwilyA-ac"

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
