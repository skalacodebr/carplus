import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

// Webhook para receber notificações do Asaas
export async function POST(request: NextRequest) {
  try {
    // Verificar se a requisição é autêntica (em produção, você deve verificar a assinatura)
    // const signature = request.headers.get('asaas-signature');
    // if (!verifySignature(signature, await request.text())) {
    //   return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    // }

    const payload = await request.json()
    console.log("=== WEBHOOK ASAAS RECEBIDO ===")
    console.log("Payload completo:", JSON.stringify(payload, null, 2))

    // Verificar se é uma notificação de pagamento
    if (payload.event && payload.payment) {
      const { event, payment } = payload

      // Obter o ID do pedido a partir da referência externa ou buscar pelo pagamento_id
      let pedidoId = payment.externalReference

      if (!pedidoId) {
        console.log("Sem referência externa, buscando pedido pelo pagamento_id:", payment.id)
        
        // Buscar pedido pelo payment_id no banco
        const { data: pedido, error: pedidoError } = await supabaseAdmin
          .from("pedidos")
          .select("numero")
          .eq("pagamento_id", payment.id)
          .single()

        if (pedidoError || !pedido) {
          console.error("Pedido não encontrado para pagamento_id:", payment.id, pedidoError)
          return NextResponse.json({ error: "Pedido não encontrado" }, { status: 400 })
        }

        pedidoId = pedido.numero
        console.log("Pedido encontrado:", pedidoId)
      }

      // Mapear o evento para um status de pagamento
      let pagamentoStatus
      switch (event) {
        case "PAYMENT_CONFIRMED":
        case "PAYMENT_RECEIVED":
          pagamentoStatus = "CONFIRMED"
          break
        case "PAYMENT_OVERDUE":
          pagamentoStatus = "OVERDUE"
          break
        case "PAYMENT_DELETED":
        case "PAYMENT_CANCELED":
          pagamentoStatus = "CANCELED"
          break
        case "PAYMENT_REFUNDED":
        case "PAYMENT_REFUND_REQUESTED":
          pagamentoStatus = "REFUNDED"
          break
        default:
          pagamentoStatus = payment.status
      }

      // Primeiro, buscar o pedido atual para obter o status anterior e o ID numérico
      console.log("Buscando pedido atual para obter status anterior:", pedidoId)
      
      const { data: pedidoAtual, error: buscarError } = await supabaseAdmin
        .from("pedidos")
        .select("id, status")
        .eq("numero", pedidoId)
        .single()

      if (buscarError || !pedidoAtual) {
        console.error("Erro ao buscar pedido:", buscarError)
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      }

      const novoStatus = pagamentoStatus === "CONFIRMED" ? "pago" : "pendente"
      console.log(`Atualizando pedido ${pedidoAtual.id} de "${pedidoAtual.status}" para "${novoStatus}"`)
      
      // Atualizar o status do pedido
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from("pedidos")
        .update({
          status: novoStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("numero", pedidoId)
        .select()

      if (updateError) {
        console.error("Erro ao atualizar status do pedido:", updateError)
        return NextResponse.json({ error: "Erro ao atualizar status do pedido" }, { status: 500 })
      }

      // Registrar mudança no histórico
      const { error: historicoError } = await supabaseAdmin
        .from("pedido_historico_status")
        .insert([
          {
            pedido_id: pedidoAtual.id,
            status_anterior: pedidoAtual.status,
            status_novo: novoStatus,
            observacao: `Status atualizado via webhook do Asaas - Evento: ${event}`,
            updated_by: null, // Sistema/automático
            created_at: new Date().toISOString(),
          }
        ])

      if (historicoError) {
        console.error("Erro ao registrar histórico de status:", historicoError)
        // Não retornar erro aqui para não bloquear o webhook
      } else {
        console.log("Histórico de status registrado com sucesso")
      }

      // Registrar o webhook recebido para fins de auditoria
      const { error: logError } = await supabaseAdmin.from("webhook_logs").insert({
        provider: "asaas",
        event: event,
        payload: payload,
        pedido_id: pedidoId,
        created_at: new Date().toISOString(),
      })

      if (logError) {
        console.error("Erro ao registrar webhook:", logError)
      }

      return NextResponse.json({ success: true })
    }

    // Se não for uma notificação de pagamento válida
    return NextResponse.json({ error: "Evento não suportado" }, { status: 400 })
  } catch (error: any) {
    console.error("Erro ao processar webhook do Asaas:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
