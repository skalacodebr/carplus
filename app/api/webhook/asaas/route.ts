import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Definir os possíveis status do Asaas
type AsaasPaymentStatus = "PENDING" | "RECEIVED" | "CONFIRMED";

// Mapeamento de status do Asaas para nosso sistema
const statusMap: Record<AsaasPaymentStatus, string> = {
  PENDING: "pendente",
  RECEIVED: "pago",
  CONFIRMED: "pago",
};

async function atualizarStatusPedido(
  novoStatus: string,
  pagamentoId: string
) {
  try {
    // Buscar o pedido atual
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("id, status, status_detalhado")
      .eq("pagamento_id", pagamentoId)
      .single();

    if (pedidoError) throw pedidoError;

    // Determinar o novo status_detalhado baseado no tipo de entrega
    let novoStatusDetalhado = pedido.status_detalhado;

    if (novoStatus === "pago" && pedido.status !== "pago") {
      // Se o pedido foi pago, atualizar o status detalhado
      novoStatusDetalhado = "aguardando_preparacao";
    }

    // Atualizar o pedido
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        status: novoStatus,
        status_detalhado: novoStatusDetalhado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pedido.id);

    if (updateError) throw updateError;

    // Registrar a mudança no histórico
    const { error: historicoError } = await supabase
      .from("historico_status_pedido")
      .insert({
        pedido_id: pedido.id,
        status_novo: novoStatus,
        status_anterior: pedido.status,
        descricao: `Status do pagamento atualizado para ${novoStatus}`,
        pagamento_id: pagamentoId,
        created_at: new Date().toISOString(),
      });

    if (historicoError) throw historicoError;

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    return { success: false, error };
  }
}

export async function POST(req: Request) {
  try {
    // Verificar se a requisição é do Asaas (você pode adicionar mais segurança aqui)
    const body = await req.json();

    console.log("Webhook recebido:", body);

    const event = body.event;
    const payment = body.payment;
    const pagamentoId = payment.id;

    // Mapear o status do Asaas para nosso sistema
    const status = payment.status as AsaasPaymentStatus;
    const novoStatus = statusMap[status] || "pendente";

    // Atualizar o status do pedido
    const resultado = await atualizarStatusPedido(
      novoStatus,
      pagamentoId
    );

    if (!resultado.success) {
      return NextResponse.json(
        { error: "Erro ao atualizar status do pedido" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
