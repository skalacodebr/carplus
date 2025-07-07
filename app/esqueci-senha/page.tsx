"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function EsqueciSenha() {
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [emailValido, setEmailValido] = useState(true)

  const validarEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoEmail = e.target.value
    setEmail(novoEmail)

    // Só valida se o campo não estiver vazio
    if (novoEmail) {
      setEmailValido(validarEmail(novoEmail))
    } else {
      setEmailValido(true) // Reseta o estado de validação quando o campo está vazio
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verifica se o email é válido antes de enviar
    if (validarEmail(email)) {
      try {
        // Importar a função de redefinição de senha
        const { resetPassword } = await import("@/lib/auth")

        // Chamar a função de redefinição de senha
        const { data, error } = await resetPassword(email)

        if (error) {
          console.error("Erro ao solicitar redefinição de senha:", error)
          alert(`Erro ao solicitar redefinição de senha: ${error.message}`)
          return
        }

        // Mostrar mensagem de sucesso
        setEnviado(true)
      } catch (error) {
        console.error("Erro ao solicitar redefinição de senha:", error)
        alert("Ocorreu um erro ao solicitar redefinição de senha. Tente novamente.")
      }
    } else {
      setEmailValido(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#2C2B34] px-5 pt-10 pb-20">
      {/* Logo */}
      <div className="mb-2">
        <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={280} height={100} priority />
      </div>

      {/* Título */}
      <h1 className="text-white text-3xl font-bold mb-2">Recuperar Senha</h1>

      {/* Subtítulo */}
      <p className="text-gray-400 text-sm mb-8 text-center">
        Digite seu email para receber um link de recuperação de senha
      </p>

      {!enviado ? (
        /* Formulário de recuperação */
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            className={`w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none ${
              !emailValido ? "border border-red-500" : ""
            }`}
            pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            required
          />

          <button type="submit" className="w-full bg-[#ED1C24] text-white py-4 rounded-full font-bold mt-4">
            Enviar Link de Recuperação
          </button>

          <div className="text-center mt-4">
            <Link href="/login" className="text-white text-sm underline hover:text-gray-300 transition-colors">
              Voltar para o Login
            </Link>
          </div>
        </form>
      ) : (
        /* Mensagem de sucesso */
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <div className="bg-[#3A3942] text-white p-6 rounded-[16px] text-center">
            <p className="mb-2">Um link de recuperação foi enviado para:</p>
            <p className="font-bold">{email}</p>
            <p className="mt-4 text-sm text-gray-300">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
          </div>

          <Link href="/login" className="w-full bg-[#ED1C24] text-white py-4 rounded-full font-bold text-center">
            Voltar para o Login
          </Link>
        </div>
      )}
    </main>
  )
}
