"use client"

import type React from "react"

import { useState } from "react"

interface CreditCardFormProps {
  onSubmit: (cardData: CreditCardData) => void
  isProcessing: boolean
}

export interface CreditCardData {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export default function CreditCardForm({ onSubmit, isProcessing }: CreditCardFormProps) {
  const [cardData, setCardData] = useState<CreditCardData>({
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Função para formatar número do cartão
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    const groups = []

    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.slice(i, i + 4))
    }

    return groups.join(" ").slice(0, 19) // Limita a 16 dígitos + 3 espaços
  }

  // Função para formatar data de validade
  const formatExpiry = (month: string, year: string) => {
    const monthDigits = month.replace(/\D/g, "").slice(0, 2)
    const yearDigits = year.replace(/\D/g, "").slice(0, 2)

    return { month: monthDigits, year: yearDigits }
  }

  // Função para formatar CCV
  const formatCCV = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 3)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    let formattedValue = value

    // Aplicar formatação específica para cada campo
    if (name === "number") {
      formattedValue = formatCardNumber(value)
    } else if (name === "expiryMonth") {
      const monthValue = Number.parseInt(value.replace(/\D/g, ""))
      if (monthValue > 12) {
        formattedValue = "12"
      } else {
        formattedValue = value.replace(/\D/g, "").slice(0, 2)
      }
    } else if (name === "expiryYear") {
      formattedValue = value.replace(/\D/g, "").slice(0, 2)
    } else if (name === "ccv") {
      formattedValue = formatCCV(value)
    }

    setCardData((prev) => ({ ...prev, [name]: formattedValue }))

    // Limpar erro do campo quando o usuário digita
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar nome do titular
    if (!cardData.holderName.trim()) {
      newErrors.holderName = "Nome do titular é obrigatório"
    }

    // Validar número do cartão
    const cardNumber = cardData.number.replace(/\s/g, "")
    if (!cardNumber) {
      newErrors.number = "Número do cartão é obrigatório"
    } else if (cardNumber.length < 16) {
      newErrors.number = "Número do cartão inválido"
    }

    // Validar mês de validade
    if (!cardData.expiryMonth) {
      newErrors.expiryMonth = "Mês é obrigatório"
    } else {
      const month = Number.parseInt(cardData.expiryMonth)
      if (isNaN(month) || month < 1 || month > 12) {
        newErrors.expiryMonth = "Mês inválido"
      }
    }

    // Validar ano de validade
    if (!cardData.expiryYear) {
      newErrors.expiryYear = "Ano é obrigatório"
    } else {
      const currentYear = new Date().getFullYear() % 100 // Últimos 2 dígitos do ano atual
      const year = Number.parseInt(cardData.expiryYear)

      if (isNaN(year)) {
        newErrors.expiryYear = "Ano inválido"
      } else if (year < currentYear) {
        newErrors.expiryYear = "Cartão vencido"
      }

      // Verificar se o cartão está vencido no mês atual
      if (year === currentYear) {
        const currentMonth = new Date().getMonth() + 1 // getMonth() retorna 0-11
        const month = Number.parseInt(cardData.expiryMonth)

        if (month < currentMonth) {
          newErrors.expiryMonth = "Cartão vencido"
        }
      }
    }

    // Validar CCV
    if (!cardData.ccv) {
      newErrors.ccv = "CCV é obrigatório"
    } else if (cardData.ccv.length < 3) {
      newErrors.ccv = "CCV inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // Remover espaços do número do cartão antes de enviar
      const formattedCardData = {
        ...cardData,
        number: cardData.number.replace(/\s/g, ""),
      }

      onSubmit(formattedCardData)
    }
  }

  // Detectar bandeira do cartão
  const getCardType = () => {
    const number = cardData.number.replace(/\s/g, "")

    if (number.startsWith("4")) {
      return "visa"
    } else if (/^5[1-5]/.test(number)) {
      return "mastercard"
    } else if (/^3[47]/.test(number)) {
      return "amex"
    } else if (/^6(?:011|5)/.test(number)) {
      return "discover"
    } else if (/^(36|38|30[0-5])/.test(number)) {
      return "diners"
    } else if (/^(50|5[6-9]|6[0-9])/.test(number)) {
      return "elo"
    } else if (/^(60|6[4-9]|65)/.test(number)) {
      return "hipercard"
    }

    return null
  }

  const cardType = getCardType()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="holderName" className="block text-sm font-medium mb-1 text-gray-300">
          Nome no cartão
        </label>
        <input
          type="text"
          id="holderName"
          name="holderName"
          value={cardData.holderName}
          onChange={handleChange}
          placeholder="Nome como está no cartão"
          className={`w-full px-3 py-2 bg-[#3A3942] border ${errors.holderName ? "border-red-500" : "border-[#4D4D57]"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]`}
          disabled={isProcessing}
        />
        {errors.holderName && <p className="text-red-500 text-xs mt-1">{errors.holderName}</p>}
      </div>

      <div>
        <label htmlFor="number" className="block text-sm font-medium mb-1 text-gray-300">
          Número do cartão
        </label>
        <div className="relative">
          <input
            type="text"
            id="number"
            name="number"
            value={cardData.number}
            onChange={handleChange}
            placeholder="0000 0000 0000 0000"
            className={`w-full px-3 py-2 bg-[#3A3942] border ${errors.number ? "border-red-500" : "border-[#4D4D57]"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24] pr-10`}
            disabled={isProcessing}
          />
          {cardType && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-8 h-6 bg-white rounded flex items-center justify-center">
                {cardType === "visa" && <span className="text-blue-600 font-bold text-xs">VISA</span>}
                {cardType === "mastercard" && <span className="text-red-600 font-bold text-xs">MC</span>}
                {cardType === "amex" && <span className="text-blue-800 font-bold text-xs">AMEX</span>}
                {cardType === "discover" && <span className="text-orange-600 font-bold text-xs">DISC</span>}
                {cardType === "diners" && <span className="text-gray-600 font-bold text-xs">DC</span>}
                {cardType === "elo" && <span className="text-green-600 font-bold text-xs">ELO</span>}
                {cardType === "hipercard" && <span className="text-red-600 font-bold text-xs">HIPER</span>}
              </div>
            </div>
          )}
        </div>
        {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiry" className="block text-sm font-medium mb-1 text-gray-300">
            Data de validade
          </label>
          <div className="flex gap-2">
            <div className="w-1/2">
              <input
                type="text"
                id="expiryMonth"
                name="expiryMonth"
                value={cardData.expiryMonth}
                onChange={handleChange}
                placeholder="MM"
                className={`w-full px-3 py-2 bg-[#3A3942] border ${errors.expiryMonth ? "border-red-500" : "border-[#4D4D57]"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24] text-center`}
                disabled={isProcessing}
              />
              {errors.expiryMonth && <p className="text-red-500 text-xs mt-1">{errors.expiryMonth}</p>}
            </div>
            <div className="w-1/2">
              <input
                type="text"
                id="expiryYear"
                name="expiryYear"
                value={cardData.expiryYear}
                onChange={handleChange}
                placeholder="AA"
                className={`w-full px-3 py-2 bg-[#3A3942] border ${errors.expiryYear ? "border-red-500" : "border-[#4D4D57]"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24] text-center`}
                disabled={isProcessing}
              />
              {errors.expiryYear && <p className="text-red-500 text-xs mt-1">{errors.expiryYear}</p>}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="ccv" className="block text-sm font-medium mb-1 text-gray-300">
            CCV
          </label>
          <input
            type="text"
            id="ccv"
            name="ccv"
            value={cardData.ccv}
            onChange={handleChange}
            placeholder="123"
            className={`w-full px-3 py-2 bg-[#3A3942] border ${errors.ccv ? "border-red-500" : "border-[#4D4D57]"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]`}
            disabled={isProcessing}
          />
          {errors.ccv && <p className="text-red-500 text-xs mt-1">{errors.ccv}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[#ED1C24] text-white py-3 rounded-full font-bold flex justify-center items-center"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
            Processando...
          </>
        ) : (
          "Pagar com Cartão"
        )}
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-400">Pagamento seguro processado pelo Asaas</p>
      </div>
    </form>
  )
}
