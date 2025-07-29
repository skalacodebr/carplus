// Biblioteca para integração com o Asaas

// Tipos para a API do Asaas
export interface AsaasCustomer {
  id?: string
  name: string
  email: string
  phone: string
  mobilePhone?: string
  cpfCnpj: string
  postalCode: string
  address: string
  addressNumber: string
  complement?: string
  province: string // bairro
  city: string
  state: string
  externalReference?: string
  notificationDisabled?: boolean
}

export interface AsaasPayment {
  id?: string
  customer: string // ID do cliente no Asaas
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED"
  value: number
  dueDate: string // Formato: YYYY-MM-DD
  description?: string
  externalReference?: string
  installmentCount?: number
  totalValue?: number
  installmentValue?: number
  discount?: {
    value?: number
    dueDateLimitDays?: number
    type?: "FIXED" | "PERCENTAGE"
  }
  interest?: {
    value: number
  }
  fine?: {
    value: number
  }
  postalService?: boolean
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    addressComplement?: string
    phone: string
    mobilePhone?: string
  }
  remoteIp?: string
  split?: any[]
}

export interface AsaasPixQrCode {
  encodedImage: string
  payload: string
  expirationDate: string
}

// Função para fazer requisições à API do Asaas
async function asaasRequest(endpoint: string, method = "POST", data?: any) {
  try {
    const response = await fetch("/api/asaas/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, method, data }), // <-- mantemos data agrupado
    });

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Erro na requisição Asaas:", error);
    return { error: true, message: error.message };
  }
}


// Funções para interagir com a API do Asaas

// Criar ou atualizar cliente
export async function createOrUpdateCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
  // Verificar se o cliente já existe pelo CPF/CNPJ
  try {
    console.log("Verificando cliente no Asaas:", customerData)
    const searchResult = await asaasRequest(`/customers?cpfCnpj=${customerData.cpfCnpj}`)

    if (searchResult.data && searchResult.data.length > 0) {
      // Cliente já existe, atualizar
      const existingCustomer = searchResult.data[0]
      return await asaasRequest(`/customers/${existingCustomer.id}`, "PUT", customerData)
    } else {
      // Cliente não existe, criar
      return await asaasRequest("/customers", "POST", customerData)
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar cliente no Asaas:", error)
    throw error
  }
}

// Criar cobrança
export async function createPayment(paymentData: AsaasPayment): Promise<any> {
  try {
    return await asaasRequest("/payments", "POST", paymentData)
  } catch (error) {
    console.error("Erro ao criar cobrança no Asaas:", error)
    throw error
  }
}

// Obter QR Code PIX
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  try {
    return await asaasRequest(`/payments/${paymentId}/pixQrCode`)
  } catch (error) {
    console.error("Erro ao obter QR Code PIX:", error)
    throw error
  }
}

// Obter link de pagamento
export async function getPaymentLink(paymentId: string): Promise<string> {
  try {
    const payment = await asaasRequest(`/payments/${paymentId}`)
    return payment.invoiceUrl
  } catch (error) {
    console.error("Erro ao obter link de pagamento:", error)
    throw error
  }
}

// Verificar status de pagamento
export async function checkPaymentStatus(paymentId: string): Promise<string> {
  try {
    const payment = await asaasRequest(`/payments/${paymentId}`)
    return payment.status
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error)
    throw error
  }
}

// Cancelar cobrança
export async function cancelPayment(paymentId: string): Promise<any> {
  try {
    return await asaasRequest(`/payments/${paymentId}/cancel`, "POST")
  } catch (error) {
    console.error("Erro ao cancelar cobrança:", error)
    throw error
  }
}

// Função para formatar CPF/CNPJ (remover caracteres especiais)
export function formatCpfCnpj(cpfCnpj: string): string {
  return cpfCnpj.replace(/[^\d]/g, "")
}

// Função para formatar telefone (remover caracteres especiais)
export function formatPhone(phone: string): string {
  return phone.replace(/[^\d]/g, "")
}

// Função para formatar CEP (remover caracteres especiais)
export function formatCep(cep: string): string {
  return cep.replace(/[^\d]/g, "")
}
