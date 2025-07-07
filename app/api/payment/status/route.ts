import { type NextRequest, NextResponse } from "next/server"
import { checkPaymentStatus } from "@/lib/asaas"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get("paymentId")
    const pedidoId = searchParams.get("pedidoId")

    if (!paymentId || !pedidoId) {
      return NextResponse.json({ error: "ID do pagamento e ID do pedido são obrigatórios" }, { status: 400 })
    }

    // Verificar status do pagamento no Asaas
    const status = await checkPaymentStatus(paymentId)

    // Atualizar status do pagamento no banco de dados
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        pagamento_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pedidoId)

    if (updateError) {
      console.error("Erro ao atualizar status do pagamento no banco de dados:", updateError)
    }

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error: any) {
    console.error("Erro ao verificar status do pagamento:", error)
    return NextResponse.json({ error: error.message || "Erro ao verificar status do pagamento" }, { status: 500 })
  }
}
