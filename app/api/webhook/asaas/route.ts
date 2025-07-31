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

async function atualizarStatusPedido(novoStatus: string, pagamentoId: string) {
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
      .from("pedido_historico_status")
      .insert({
        pedido_id: pedido.id,
        status_novo: novoStatus,
        status_anterior: pedido.status,
        observacao: `Status do pagamento atualizado para ${novoStatus}`,
        pagamento_id: pagamentoId,
        created_at: new Date().toISOString(),
      });

    if (historicoError) throw historicoError;
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status do pedido1:", error);
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
    const resultado = await atualizarStatusPedido(novoStatus, pagamentoId);
    console.log("Resultado do atualizarStatusPedido:", resultado);
    if (!resultado.success) {
        const erroDetalhes = resultado.error?.details || "";
        const erroMensagem = resultado.error?.message || "";
      
        const erroChaveDuplicada =
          erroDetalhes.includes("duplicate key value") ||
          erroMensagem.includes("duplicate key value") ||
          erroDetalhes.includes("violates unique constraint");
      
        if (erroChaveDuplicada) {
          console.error("Erro ao atualizar status do pedido (chave duplicada):", resultado.error);
          return NextResponse.json(
            { error: "Já existe um pagamento com esse ID" },
            { status: 200 }
          );
        }
      
        console.error("Erro genérico ao atualizar status do pedido:", resultado.error);
        return NextResponse.json(
          { error: "Erro ao atualizar status do pedido" },
          { status: 200 }
        );
      }
      

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no webhook2:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
