"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface EnderecoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (endereco: EnderecoAlternativo) => void
  enderecoInicial?: EnderecoAlternativo | null
}

export interface EnderecoAlternativo {
  nome: string
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export default function EnderecoModal({ isOpen, onClose, onSave, enderecoInicial }: EnderecoModalProps) {
  const [mounted, setMounted] = useState(false)
  const [endereco, setEndereco] = useState<EnderecoAlternativo>({
    nome: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  })

  useEffect(() => {
    setMounted(true)

    if (isOpen) {
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  useEffect(() => {
    if (enderecoInicial) {
      setEndereco(enderecoInicial)
    } else {
      // Sempre começar com campos vazios se não há endereço inicial
      setEndereco({
        nome: "",
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
      })
    }
  }, [enderecoInicial, isOpen])

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscapeKey)
    return () => document.removeEventListener("keydown", handleEscapeKey)
  }, [isOpen, onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEndereco((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(endereco)
    onClose()
  }

  const buscarCep = async () => {
    if (endereco.cep.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${endereco.cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setEndereco((prev) => ({
          ...prev,
          rua: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    }
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-lg bg-[#2C2B34] text-white shadow-xl transition-all">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-2">Endereço alternativo para entrega</h3>
          <p className="text-sm text-gray-400 mb-4">
            Este endereço será usado apenas para este pedido e não alterará o endereço da sua conta.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium mb-1">
                  Nome do destinatário
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={endereco.nome}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-[#3A3942] border border-[#4D4D57] rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]"
                />
              </div>

              <div>
                <label htmlFor="cep" className="block text-sm font-medium mb-1">
                  CEP
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="cep"
                    name="cep"
                    value={endereco.cep}
                    onChange={handleChange}
                    required
                    maxLength={8}
                    className="flex-1 px-3 py-2 bg-[#3A3942] border border-[#4D4D57] rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]"
                    placeholder="Somente números"
                  />
                  <button
                    type="button"
                    onClick={buscarCep}
                    className="px-3 py-2 bg-[#3A3942] border border-[#4D4D57] rounded-md hover:bg-[#4D4D57]"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label htmlFor="rua" className="block text-sm font-medium mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    id="rua"
                    name="rua"
                    value={endereco.rua}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[#3A3942] border border-[#4D4D57] rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]"
                  />
                </div>
                <div>
                  <label htmlFor="numero" className="block text-sm font-medium mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    id="numero"
                    name="numero"
                    value={endereco.numero}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[#3A3942] border border-[#4D4D57] rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="complemento" className="block text-sm font-medium mb-1">
                  Complemento (opcional)
                </label>
                <input
                  type="text"
                  id="complemento"
                  name="complemento"
                  value={endereco.complemento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#3A3942] border border-[#4D4D57] rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]"
                />
              </div>

              <div>
                <label htmlFor="bairro" className="block text-sm font-medium mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  id="bairro"
                  name="bairro"
                  value={endereco.bairro}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-[#3A3942] border border-[#4D4D57] rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cidade" className="block text-sm font-medium mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    id="cidade"
                    name="cidade"
                    value={endereco.cidade}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[#3A3942] border border-[#4D4D57] rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]"
                  />
                </div>
                <div>
                  <label htmlFor="uf" className="block text-sm font-medium mb-1">
                    Estado
                  </label>
                  <select
                    id="uf"
                    name="uf"
                    value={endereco.uf}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[#3A3942] border border-[#4D4D57] rounded-md focus:outline-none focus:ring-1 focus:ring-[#ED1C24]"
                  >
                    <option value="">Selecione</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AP">AP</option>
                    <option value="AM">AM</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="MG">MG</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RS">RS</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="SC">SC</option>
                    <option value="SP">SP</option>
                    <option value="SE">SE</option>
                    <option value="TO">TO</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#4D4D57] rounded-md hover:bg-[#3A3942]"
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-opacity-90">
                Salvar endereço alternativo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
