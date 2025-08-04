import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { paymentId, status, orderNumber } = await request.json();

    if (!paymentId && !orderNumber) {
      return NextResponse.json(
        { error: "PaymentId ou orderNumber é obrigatório" },
        { status: 400 }
      );
    }

    console.log("=== SIMULAÇÃO DE PAGAMENTO ===");
    console.log("Payment ID:", paymentId);
    console.log("Order Number:", orderNumber);
    console.log("Status solicitado:", status);

    // Buscar o pedido
    let query = supabaseAdmin
      .from("pedidos")
      .select("id, numero, status");

    // Tentar buscar pelo número do pedido primeiro
    if (orderNumber) {
      query = query.eq("numero", orderNumber);
    }

    const { data: pedido, error: pedidoError } = await query.single();

    if (pedidoError || !pedido) {
      console.error("Pedido não encontrado:", pedidoError);
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    console.log("Pedido encontrado:", pedido);

    // Definir o novo status baseado na simulação
    const novoStatus = status === "PAYMENT_CONFIRMED" || status === "PAYMENT_RECEIVED" 
      ? "pago" 
      : "pendente";

    // Se o status já é o desejado, não fazer nada
    if (pedido.status === novoStatus) {
      console.log("Pedido já está com o status desejado");
      return NextResponse.json({
        success: true,
        message: `Pedido já está ${novoStatus}`,
        pedido: {
          numero: pedido.numero,
          status: pedido.status
        }
      });
    }

    // Atualizar o status do pedido diretamente
    const { error: updateError } = await supabaseAdmin
      .from("pedidos")
      .update({
        status: novoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pedido.id);

    if (updateError) {
      console.error("Erro ao atualizar pedido:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar status do pedido" },
        { status: 500 }
      );
    }

    // Registrar no histórico de status
    const { error: historicoError } = await supabaseAdmin
      .from("pedido_historico_status")
      .insert({
        pedido_id: pedido.id,
        status_anterior: pedido.status,
        status_novo: novoStatus,
        observacao: `Status simulado para testes - Evento: ${status}`,
        updated_by: null,
        created_at: new Date().toISOString(),
      });

    if (historicoError) {
      console.error("Erro ao registrar histórico:", historicoError);
      // Não retornar erro, pois o importante é atualizar o pedido
    }

    console.log(`Pedido ${pedido.numero} atualizado de "${pedido.status}" para "${novoStatus}"`);

    return NextResponse.json({
      success: true,
      message: `Pagamento simulado com sucesso`,
      pedido: {
        numero: pedido.numero,
        statusAnterior: pedido.status,
        statusNovo: novoStatus
      }
    });

  } catch (error: any) {
    console.error("Erro ao simular pagamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}