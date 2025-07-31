import { type NextRequest, NextResponse } from "next/server"
import { createOrUpdateCustomer, createPayment, getPixQrCode, formatCpfCnpj, formatPhone, formatCep } from "@/lib/asaas"
import { supabaseAdmin } from "@/lib/supabase-admin" // novo client com service role

export async function POST(request: NextRequest) {
  try {
    const { userId, pedidoId, paymentMethod, customerData, amount, creditCardData = null } = await request.json()

    // Validar dados obrigatórios
    if (!userId || !pedidoId || !paymentMethod || !customerData || !amount) {
      return NextResponse.json({ error: "Dados incompletos para processamento do pagamento" }, { status: 400 })
    }

    // Formatar dados do cliente
    const formattedCustomer = {
      name: customerData.nome,
      email: customerData.email,
      phone: formatPhone(customerData.telefone || ""),
      cpfCnpj: formatCpfCnpj(customerData.cpf || "00000000000"), // CPF é obrigatório
      postalCode: formatCep(customerData.cep),
      address: customerData.rua,
      addressNumber: customerData.numero,
      complement: customerData.complemento || "",
      province: customerData.bairro,
      city: customerData.cidade,
      state: customerData.uf,
      externalReference: userId.toString(),
    }

    // Criar ou atualizar cliente no Asaas
    const customer = await createOrUpdateCustomer(formattedCustomer)

    // Definir tipo de cobrança com base no método de pagamento
    let billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED" = "UNDEFINED"
    switch (paymentMethod) {
      case "boleto":
        billingType = "BOLETO"
        break
      case "cartao":
        billingType = "CREDIT_CARD"
        break
      case "pix":
        billingType = "PIX"
        break
      default:
        billingType = "UNDEFINED"
    }

    // Preparar dados da cobrança
    const paymentData: any = {
      customer: customer.id,
      billingType,
      value: amount,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Vencimento em 3 dias
      description: `Pedido #${pedidoId}`,
      externalReference: pedidoId.toString(),
    }

    // Adicionar dados do cartão de crédito se for pagamento por cartão
    if (billingType === "CREDIT_CARD" && creditCardData) {
      paymentData.creditCard = {
        holderName: creditCardData.holderName,
        number: creditCardData.number,
        expiryMonth: creditCardData.expiryMonth,
        expiryYear: creditCardData.expiryYear,
        ccv: creditCardData.ccv,
      }

      paymentData.creditCardHolderInfo = {
        name: formattedCustomer.name,
        email: formattedCustomer.email,
        cpfCnpj: formattedCustomer.cpfCnpj,
        postalCode: formattedCustomer.postalCode,
        addressNumber: formattedCustomer.addressNumber,
        phone: formattedCustomer.phone,
      }

      // IP do cliente para análise antifraude
      paymentData.remoteIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"
    }

    // Criar cobrança no Asaas
    const payment = await createPayment(paymentData)

    // Se for PIX, obter QR Code
    let pixData = null
    if (billingType === "PIX") {
      pixData = await getPixQrCode(payment.id)
    }

    // Atualizar pedido no banco de dados com informações de pagamento
    const { error: updateError } = await supabaseAdmin
      .from("pedidos")
      .update({
        pagamento_id: payment.id,
        pagamento_status: payment.status,
        pagamento_url: payment.invoiceUrl,
        pagamento_data: new Date().toISOString(),
      })
      .eq("id", pedidoId)

    if (updateError) {
      console.error("Erro ao atualizar pedido com informações de pagamento:", updateError)
    }

    // Retornar dados do pagamento
    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl,
        dueDate: payment.dueDate,
        value: payment.value,
        netValue: payment.netValue,
        billingType: payment.billingType,
        pixData,
      },
    })
  } catch (error: any) {
    console.error("Erro ao processar pagamento:", error)
    return NextResponse.json({ error: error.message || "Erro ao processar pagamento" }, { status: 500 })
  }
}
