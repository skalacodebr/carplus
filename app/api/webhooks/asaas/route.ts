import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Webhook para receber notificações do Asaas
export async function POST(request: NextRequest) {
  try {
    // Verificar se a requisição é autêntica (em produção, você deve verificar a assinatura)
    // const signature = request.headers.get('asaas-signature');
    // if (!verifySignature(signature, await request.text())) {
    //   return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    // }

    const payload = await request.json()

    // Verificar se é uma notificação de pagamento
    if (payload.event && payload.payment) {
      const { event, payment } = payload

      // Obter o ID do pedido a partir da referência externa
      const pedidoId = payment.externalReference

      if (!pedidoId) {
        console.error("Webhook recebido sem referência externa (pedidoId)")
        return NextResponse.json({ error: "Referência externa não encontrada" }, { status: 400 })
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

      // Atualizar o status do pagamento no banco de dados
      const { error: updateError } = await supabase
        .from("pedidos")
        .update({
          pagamento_status: pagamentoStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pedidoId)

      if (updateError) {
        console.error("Erro ao atualizar status do pedido:", updateError)
        return NextResponse.json({ error: "Erro ao atualizar status do pedido" }, { status: 500 })
      }

      // Se o pagamento foi confirmado, atualizar o status do pedido para "processando"
      if (pagamentoStatus === "CONFIRMED") {
        const { error: updatePedidoError } = await supabase
          .from("pedidos")
          .update({
            status: "processando",
            updated_at: new Date().toISOString(),
          })
          .eq("id", pedidoId)

        if (updatePedidoError) {
          console.error("Erro ao atualizar status do pedido para processando:", updatePedidoError)
        }
      }

      // Registrar o webhook recebido para fins de auditoria
      const { error: logError } = await supabase.from("webhook_logs").insert({
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
