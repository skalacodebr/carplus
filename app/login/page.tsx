"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/client-cookies"
import { useAuth } from "@/context/auth-context"

export default function Login() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [isEmailMode, setIsEmailMode] = useState(true)
  const [errors, setErrors] = useState({
    email: "",
    senha: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const router = useRouter()
  const { refreshUser } = useAuth()

  // Check if user is already authenticated
  useEffect(() => {
    // Comentado para evitar loop infinito
    // if (isAuthenticated()) {
    //   console.log("User is already authenticated, redirecting to dashboard")
    //   router.push("/dashboard")
    // }
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

  // Função para validar email
  const validarEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }

  // Detecta se o usuário está inserindo email ou telefone
  useEffect(() => {
    if (email) {
      // Se o primeiro caractere for um número, assume que é telefone
      const isPhone = /^\d/.test(email) || email.includes("(") || email.includes(")") || email.includes("-")
      setIsEmailMode(!isPhone)
    }
  }, [email])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value

    // Se parece ser um telefone, aplica a formatação
    if (!isEmailMode) {
      setEmail(formatarTelefone(valor))

      // Valida o telefone
      const numeroLimpo = valor.replace(/\D/g, "")
      if (numeroLimpo.length > 0 && numeroLimpo.length < 10) {
        setErrors((prev) => ({ ...prev, email: "Telefone incompleto" }))
      } else {
        setErrors((prev) => ({ ...prev, email: "" }))
      }
    } else {
      setEmail(valor)

      // Valida o email
      if (valor && !validarEmail(valor)) {
        setErrors((prev) => ({ ...prev, email: "Email inválido" }))
      } else {
        setErrors((prev) => ({ ...prev, email: "" }))
      }
    }
  }

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setSenha(valor)

    // Validação básica de senha
    if (valor && valor.length < 6) {
      setErrors((prev) => ({ ...prev, senha: "A senha deve ter pelo menos 6 caracteres" }))
    } else {
      setErrors((prev) => ({ ...prev, senha: "" }))
    }
  }

  const toggleMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação antes de enviar
    let hasErrors = false
    const newErrors = { ...errors }

    if (!email) {
      newErrors.email = "Campo obrigatório"
      hasErrors = true
    } else if (isEmailMode && !validarEmail(email)) {
      newErrors.email = "Email inválido"
      hasErrors = true
    } else if (!isEmailMode && email.replace(/\D/g, "").length < 10) {
      newErrors.email = "Telefone incompleto"
      hasErrors = true
    }

    if (!senha) {
      newErrors.senha = "Campo obrigatório"
      hasErrors = true
    } else if (senha.length < 6) {
      newErrors.senha = "A senha deve ter pelo menos 6 caracteres"
      hasErrors = true
    }

    setErrors(newErrors)

    if (!hasErrors) {
      try {
        setIsLoading(true)
        // Import the function for login
        const { signIn } = await import("@/lib/auth")

        console.log("Tentando fazer login com:", { email, senha: "***" })

        // Call the login function
        const { data, error } = await signIn(email, senha)

        console.log("Resposta do login:", { data, error })

        if (error) {
          console.error("Erro ao fazer login:", error)
          // Show error message
          alert(`Erro ao fazer login: ${error.message || "Erro desconhecido"}`)
          return
        }

        // Debug: verificar o que foi retornado
        console.log("Login realizado com sucesso:", data)

        // Set redirecting state to show feedback
        setRedirecting(true)

        // Atualizar o contexto de autenticação antes de redirecionar
        console.log("Atualizando contexto de autenticação...")
        await refreshUser()

        // Aguardar um pouco mais para garantir que o cookie seja definido
        setTimeout(() => {
          console.log("Redirecionando para dashboard...")
          router.push("/dashboard")
        }, 500)
      } catch (error) {
        console.error("Erro ao fazer login:", error)
        alert("Ocorreu um erro ao fazer login. Tente novamente.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (redirecting) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#2C2B34] px-5">
        <div className="text-center">
          <div className="mb-4">
            <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={280} height={100} priority />
          </div>
          <h1 className="text-white text-2xl font-bold mb-4">Login bem-sucedido!</h1>
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
      <h1 className="text-white text-3xl font-bold mb-8">Bem-vindo!</h1>

      {/* Formulário de login */}
      <form onSubmit={handleLogin} className="w-full max-w-md flex flex-col gap-4">
        <div>
          <input
            type={isEmailMode ? "email" : "tel"}
            placeholder="Email ou Telefone"
            value={email}
            onChange={handleEmailChange}
            className={`w-full bg-[#3A3942] text-white py-4 px-4 rounded-[16px] focus:outline-none ${
              errors.email ? "border border-red-500" : ""
            }`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="relative">
          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="Senha"
            value={senha}
            onChange={handleSenhaChange}
            className={`w-full bg-[#3A3942] text-white py-4 px-4 pr-12 rounded-[16px] focus:outline-none ${
              errors.senha ? "border border-red-500" : ""
            }`}
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

        <div className="text-right -mt-2">
          <Link href="/esqueci-senha" className="text-white text-sm underline hover:text-gray-300 transition-colors">
            Esqueceu sua senha?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-[#fdc300] text-white py-4 rounded-full font-bold mt-2"
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {/* Separador */}
      <div className="w-full max-w-md flex items-center my-6">
        <div className="flex-grow h-px bg-gray-600"></div>
        <span className="px-4 text-gray-400">ou</span>
        <div className="flex-grow h-px bg-gray-600"></div>
      </div>

      {/* Link de Cadastro */}
      <div className="w-full max-w-md">
        <Link
          href="/cadastro"
          className="w-full border border-[#fdc300] rounded-full py-4 font-barlow font-bold text-[20px] leading-[100%] text-white text-center bg-transparent block"
        >
          Cadastro
        </Link>
      </div>
    </main>
  )
}
