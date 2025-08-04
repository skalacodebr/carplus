import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { paymentId, status } = await request.json();

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: "PaymentId e status são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar se o status é válido
    const validStatuses = [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED", 
      "PAYMENT_OVERDUE",
      "PAYMENT_CANCELED",
      "PAYMENT_REFUNDED"
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      );
    }

    // Simular webhook do Asaas enviando para nossa própria API
    const webhookPayload = {
      event: status,
      payment: {
        id: paymentId,
        status: status.replace("PAYMENT_", ""),
        externalReference: null, // Simular webhook real sem referência externa
        value: 100.00, // Valor de exemplo
        billingType: "PIX",
        dateCreated: new Date().toISOString(),
      }
    };

    // Chamar nossa própria API de webhook
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const webhookResponse = await fetch(`${baseUrl}/api/webhooks/asaas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    const webhookResult = await webhookResponse.json();

    if (!webhookResponse.ok) {
      throw new Error(`Erro no webhook: ${webhookResult.error}`);
    }

    return NextResponse.json({
      success: true,
      message: `Pagamento simulado com status: ${status}`,
      webhookResult
    });

  } catch (error: any) {
    console.error("Erro ao simular pagamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}