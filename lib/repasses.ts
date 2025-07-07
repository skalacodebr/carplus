import { supabase } from "./supabase"
import { createPayment } from "./asaas"

// Função para calcular repasses pendentes
export async function calcularRepassesPendentes() {
  try {
    // Buscar pedidos confirmados que ainda não foram repassados
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select(`
        *,
        itens_pedido:itens_pedido(
          *,
          revendedor_id
        )
      `)
      .eq("pagamento_status", "CONFIRMED")
      .eq("repasse_status", "pendente")

    if (error) throw error

    // Agrupar por revendedor
    const repassesPorRevendedor: Record<
      number,
      {
        revendedorId: number
        valorTotal: number
        pedidos: string[]
      }
    > = {}

    pedidos?.forEach((pedido) => {
      pedido.itens_pedido.forEach((item: any) => {
        const revendedorId = item.revendedor_id

        if (!repassesPorRevendedor[revendedorId]) {
          repassesPorRevendedor[revendedorId] = {
            revendedorId,
            valorTotal: 0,
            pedidos: [],
          }
        }

        // Calcular valor do repasse (ex: 80% do valor do item)
        const valorItem = item.preco_unitario * item.quantidade
        const valorRepasse = valorItem * 0.8 // 80% para o revendedor

        repassesPorRevendedor[revendedorId].valorTotal += valorRepasse
        repassesPorRevendedor[revendedorId].pedidos.push(pedido.id)
      })
    })

    return Object.values(repassesPorRevendedor)
  } catch (error) {
    console.error("Erro ao calcular repasses:", error)
    throw error
  }
}

// Função para processar repasses
export async function processarRepasses() {
  try {
    const repasses = await calcularRepassesPendentes()

    for (const repasse of repasses) {
      // Buscar dados do revendedor
      const { data: revendedor, error: revendedorError } = await supabase
        .from("revendedores")
        .select(`
          *,
          usuarios!inner(nome, email, cpf, telefone)
        `)
        .eq("id", repasse.revendedorId)
        .single()

      if (revendedorError) {
        console.error(`Erro ao buscar revendedor ${repasse.revendedorId}:`, revendedorError)
        continue
      }

      // Criar transferência via Asaas
      const transferencia = await criarTransferencia({
        revendedor,
        valor: repasse.valorTotal,
        pedidos: repasse.pedidos,
      })

      // Registrar repasse no banco
      await registrarRepasse({
        revendedorId: repasse.revendedorId,
        valor: repasse.valorTotal,
        pedidos: repasse.pedidos,
        transferenciaId: transferencia.id,
      })
    }
  } catch (error) {
    console.error("Erro ao processar repasses:", error)
    throw error
  }
}

// Função para criar transferência via Asaas
async function criarTransferencia(dados: {
  revendedor: any
  valor: number
  pedidos: string[]
}) {
  // Implementar transferência via API do Asaas
  // Pode ser PIX, TED ou boleto de pagamento

  const transferencia = await createPayment({
    customer: dados.revendedor.usuarios.id, // Cliente = revendedor
    billingType: "PIX",
    value: dados.valor,
    dueDate: new Date().toISOString().split("T")[0],
    description: `Repasse de vendas - Pedidos: ${dados.pedidos.join(", ")}`,
    externalReference: `repasse_${dados.revendedor.id}_${Date.now()}`,
  })

  return transferencia
}

// Função para registrar repasse no banco
async function registrarRepasse(dados: {
  revendedorId: number
  valor: number
  pedidos: string[]
  transferenciaId: string
}) {
  // Inserir registro de repasse
  const { error: repasseError } = await supabase.from("repasses").insert({
    revendedor_id: dados.revendedorId,
    valor: dados.valor,
    pedidos: dados.pedidos,
    transferencia_id: dados.transferenciaId,
    status: "processando",
    created_at: new Date().toISOString(),
  })

  if (repasseError) throw repasseError

  // Atualizar status dos pedidos
  const { error: updateError } = await supabase
    .from("pedidos")
    .update({ repasse_status: "processado" })
    .in("id", dados.pedidos)

  if (updateError) throw updateError
}
