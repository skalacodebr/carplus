"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCookie, setCookie, isAuthenticated } from "@/lib/client-cookies"

export default function Cadastro() {
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    telefone: "",
    email: "",
    senha: "",
    // Campos de endereço
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  })
  const [errors, setErrors] = useState({
    nome: "",
    sobrenome: "",
    telefone: "",
    email: "",
    senha: "",
    cep: "",
    numero: "",
  })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const router = useRouter()

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      console.log("User is already authenticated, redirecting to dashboard")
      router.push("/dashboard")
    }
  }, [router])

  // Função para formatar telefone: (XX) XXXXX-XXXX
  const formatarTelefone = (valor: string) => {
    // Remove tudo que não for número
    const apenasNumeros = valor.replace(/\D/g, "")

    // Limita a 11 dígitos (DDD + 9 dígitos)
    const numeroLimitado = apenasNumeros.slice(0, 11)

    // Aplica a máscara
    if (numeroLimitado.length <= 2) {
      return numeroLimitado
    } else if (numeroLimitado.length <= 7) {
      return `(${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2)}`
    } else {
      return `(${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2, 7)}-${numeroLimitado.slice(7)}`
    }
  }

  // Função para formatar CEP: XXXXX-XXX
  const formatarCep = (valor: string) => {
    // Remove tudo que não for número
    const apenasNumeros = valor.replace(/\D/g, "")

    // Limita a 8 dígitos
    const numeroLimitado = apenasNumeros.slice(0, 8)

    // Aplica a máscara
    if (numeroLimitado.length <= 5) {
      return numeroLimitado
    } else {
      return `${numeroLimitado.slice(0, 5)}-${numeroLimitado.slice(5)}`
    }
  }

  // Função para buscar endereço pelo CEP
  const buscarEnderecoPorCep = async (cep: string) => {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, "")

    // Verifica se o CEP tem 8 dígitos
    if (cepLimpo.length !== 8) {
      return
    }

    try {
      setIsFetchingCep(true)
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (data.erro) {
        setErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }))
        return
      }

      // Preenche os campos de endereço
      setFormData((prev) => ({
        ...prev,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        uf: data.uf || "",
      }))

      // Limpa o erro do CEP se existir
      setErrors((prev) => ({ ...prev, cep: "" }))
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      setErrors((prev) => ({ ...prev, cep: "Erro ao buscar CEP" }))
    } finally {
      setIsFetchingCep(false)
    }
  }

  // Função para validar email
  const validarEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }

  // Função para validar senha (mínimo 6 caracteres)
  const validarSenha = (senha: string) => {
    return senha.length >= 6
  }

  // Função para formatar nome e sobrenome (primeira letra maiúscula)
  const formatarNome = (nome: string) => {
    if (!nome) return ""
    return nome.charAt(0).toUpperCase() + nome.slice(1)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let valorFormatado = value
    let erro = ""

    // Aplica formatação específica para cada campo
    switch (name) {
      case "nome":
      case "sobrenome":
        valorFormatado = formatarNome(value)
        break
      case "telefone":
        valorFormatado = formatarTelefone(value)
        if (valorFormatado.replace(/\D/g, "").length < 10 && valorFormatado) {
          erro = "Telefone incompleto"
        }
        break
      case "email":
        if (value && !validarEmail(value)) {
          erro = "Email inválido"
        }
        break
      case "senha":
        if (value && !validarSenha(value)) {
          erro = "A senha deve ter pelo menos 6 caracteres"
        }
        break
      case "cep":
        valorFormatado = formatarCep(value)
        break
    }

    setFormData((prev) => ({
      ...prev,
      [name]: valorFormatado,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: erro,
    }))

    // Se for o campo CEP e tiver 9 caracteres (incluindo o hífen), busca o endereço
    if (name === "cep" && valorFormatado.length === 9) {
      buscarEnderecoPorCep(valorFormatado)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Valida todos os campos antes de enviar
    const novosErros = {
      nome: formData.nome ? "" : "Nome é obrigatório",
      sobrenome: formData.sobrenome ? "" : "Sobrenome é obrigatório",
      telefone: formData.telefone.replace(/\D/g, "").length < 10 ? "Telefone incompleto" : "",
      email: validarEmail(formData.email) ? "" : "Email inválido",
      senha: validarSenha(formData.senha) ? "" : "A senha deve ter pelo menos 6 caracteres",
      cep: formData.cep.replace(/\D/g, "").length !== 8 ? "CEP inválido" : "",
      numero: formData.numero ? "" : "Número é obrigatório",
    }

    setErrors(novosErros)

    // Verifica se há erros
    if (Object.values(novosErros).some((erro) => erro)) {
      return // Não envia o formulário se houver erros
    }

    try {
      setIsLoading(true)
      // Importar a função de cadastro
      const { signUp } = await import("@/lib/auth")

      // Chamar a função de cadastro com os dados de endereço
      const { data, error } = await signUp(formData.email, formData.senha, {
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        telefone: formData.telefone,
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
      })

      if (error) {
        console.error("Erro ao cadastrar:", error)
        // Mostrar mensagem de erro
        if (error.message.includes("email")) {
          setErrors((prev) => ({ ...prev, email: "Este email já está em uso" }))
        } else {
          alert(`Erro ao criar conta: ${error.message}`)
        }
        return
      }

      // Debug: verificar o que foi retornado
      console.log("Dados retornados do cadastro:", data)
      console.log("User ID:", data?.user?.id)

      // Set redirecting state to show feedback
      setRedirecting(true)

      // Se o cadastro foi bem sucedido, redirecionar
      if (data?.user?.id) {
        console.log("Cadastro realizado com sucesso! Redirecionando...")
        
        // Usar router.push ao invés de window.location.href para manter o estado
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      } else {
        console.error("User ID não encontrado nos dados:", data)
        alert("Cadastro realizado, mas houve um erro ao fazer login automático. Por favor, faça login manualmente.")
        router.push("/login")
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error)
      alert("Ocorreu um erro ao criar sua conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha)
  }

  if (redirecting) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#2C2B34] px-5">
        <div className="text-center">
          <div className="mb-4">
            <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={280} height={100} priority />
          </div>
          <h1 className="text-white text-2xl font-bold mb-4">Cadastro bem-sucedido!</h1>
          <p className="text-white mb-8">Redirecionando para o dashboard...</p>
          <div className="w-16 h-16 border-t-4 border-[#ED1C24] border-solid rounded-full animate-spin mx-auto"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#2C2B34] px-5 pt-10 pb-20">
      {/* Back button */}
      <div className="w-full max-w-md mb-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-white hover:text-gray-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      </div>

      {/* Logo */}
      <div className="mb-2">
        <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={280} height={100} priority />
      </div>

      {/* Título */}
      <h1 className="text-white text-2xl font-bold mb-6">Crie sua conta</h1>

      {/* Formulário de cadastro */}
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
        {/* Dados pessoais */}
        <div className="flex gap-4">
          <div className="w-1/2">
            <input
              type="text"
              name="nome"
              placeholder="Nome"
              value={formData.nome}
              onChange={handleChange}
              className={`w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none ${
                errors.nome ? "border border-red-500" : ""
              }`}
              required
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>
          <div className="w-1/2">
            <input
              type="text"
              name="sobrenome"
              placeholder="Sobrenome"
              value={formData.sobrenome}
              onChange={handleChange}
              className={`w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none ${
                errors.sobrenome ? "border border-red-500" : ""
              }`}
              required
            />
            {errors.sobrenome && <p className="text-red-500 text-xs mt-1">{errors.sobrenome}</p>}
          </div>
        </div>

        <div>
          <input
            type="tel"
            name="telefone"
            placeholder="Telefone"
            value={formData.telefone}
            onChange={handleChange}
            className={`w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none ${
              errors.telefone ? "border border-red-500" : ""
            }`}
            required
          />
          {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
        </div>

        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none ${
              errors.email ? "border border-red-500" : ""
            }`}
            required
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="relative">
          <input
            type={mostrarSenha ? "text" : "password"}
            name="senha"
            placeholder="Senha"
            value={formData.senha}
            onChange={handleChange}
            className={`w-full bg-[#3A3942] text-white py-4 px-4 pr-12 rounded-[16px] focus:outline-none ${
              errors.senha ? "border border-red-500" : ""
            }`}
            required
          />
          <button
            type="button"
            onClick={toggleMostrarSenha}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            {mostrarSenha ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha}</p>}
        </div>

        {/* Separador para endereço */}
        <div className="w-full flex items-center my-2">
          <div className="flex-grow h-px bg-gray-600"></div>
          <span className="px-4 text-gray-400">Endereço</span>
          <div className="flex-grow h-px bg-gray-600"></div>
        </div>

        {/* Campos de endereço */}
        <div className="relative">
          <input
            type="text"
            name="cep"
            placeholder="CEP"
            value={formData.cep}
            onChange={handleChange}
            className={`w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none ${
              errors.cep ? "border border-red-500" : ""
            }`}
            required
          />
          {isFetchingCep && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-t-2 border-[#ED1C24] border-solid rounded-full animate-spin"></div>
            </div>
          )}
          {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
        </div>

        <div>
          <input
            type="text"
            name="rua"
            placeholder="Rua"
            value={formData.rua}
            onChange={handleChange}
            className="w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none"
            readOnly={!!formData.rua}
          />
        </div>

        <div className="flex gap-4">
          <div className="w-1/3">
            <input
              type="text"
              name="numero"
              placeholder="Número"
              value={formData.numero}
              onChange={handleChange}
              className={`w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none ${
                errors.numero ? "border border-red-500" : ""
              }`}
              required
            />
            {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
          </div>
          <div className="w-2/3">
            <input
              type="text"
              name="complemento"
              placeholder="Complemento"
              value={formData.complemento}
              onChange={handleChange}
              className="w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <input
            type="text"
            name="bairro"
            placeholder="Bairro"
            value={formData.bairro}
            onChange={handleChange}
            className="w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none"
            readOnly={!!formData.bairro}
          />
        </div>

        <div className="flex gap-4">
          <div className="w-2/3">
            <input
              type="text"
              name="cidade"
              placeholder="Cidade"
              value={formData.cidade}
              onChange={handleChange}
              className="w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none"
              readOnly={!!formData.cidade}
            />
          </div>
          <div className="w-1/3">
            <input
              type="text"
              name="uf"
              placeholder="UF"
              value={formData.uf}
              onChange={handleChange}
              className="w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none"
              readOnly={!!formData.uf}
              maxLength={2}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#fdc300] text-white py-4 rounded-full font-bold mt-4"
          disabled={isLoading}
        >
          {isLoading ? "Criando conta..." : "Criar Conta"}
        </button>
      </form>

      {/* Termos e condições */}
      <p className="text-center text-[#FFFFFFB2] text-xs mt-6">
        Ao criar uma conta, você concorda com os nossos{" "}
        <Link href="/termos" className="underline">
          Termos e Condições
        </Link>
        .
      </p>
    </main>
  )
}
