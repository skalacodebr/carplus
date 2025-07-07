"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import AlertDialog from "@/components/alert-dialog"
import ImageUpload from "@/components/image-upload"

export default function Perfil() {
  const router = useRouter()
  const { user, loading, refreshUser, logout } = useAuth()
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    telefone: "",
    email: "",
    // Campos de endereço
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [updateError, setUpdateError] = useState("")
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")

  // Alert dialog state
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success" as "success" | "error" | "info" | "warning",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }

    if (user) {
      setFormData({
        nome: user.nome || "",
        sobrenome: user.sobrenome || "",
        telefone: user.telefone || "",
        email: user.email || "",
        cep: user.cep || "",
        rua: user.rua || "",
        numero: user.numero || "",
        complemento: user.complemento || "",
        bairro: user.bairro || "",
        cidade: user.cidade || "",
        uf: user.uf || "",
      })
    }
  }, [user, loading, router])

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
        setAlertDialog({
          isOpen: true,
          title: "Erro",
          message: "CEP não encontrado",
          type: "error",
        })
        return
      }

      // Preenche os campos de endereço apenas se estiverem vazios
      setFormData((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: prev.cidade.trim() === "" ? data.localidade || "" : prev.cidade,
        uf: prev.uf.trim() === "" ? data.uf || "" : prev.uf,
      }))
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      setAlertDialog({
        isOpen: true,
        title: "Erro",
        message: "Erro ao buscar CEP",
        type: "error",
      })
    } finally {
      setIsFetchingCep(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let valorFormatado = value

    // Aplica formatação específica para cada campo
    if (name === "telefone") {
      valorFormatado = formatarTelefone(value)
    } else if (name === "cep") {
      valorFormatado = formatarCep(value)

      // Se o CEP estiver completo (9 caracteres com o hífen), busca o endereço
      if (valorFormatado.length === 9) {
        buscarEnderecoPorCep(valorFormatado)
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: valorFormatado,
    }))
  }

  const handleImageSelected = async (file: File) => {
    if (!user?.id) return

    setIsUploadingImage(true)
    try {
      // Convert file to base64 for server action
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = async () => {
        try {
          const base64File = reader.result as string
          const fileExt = file.name.split(".").pop() || "jpg"

          // Import the server action
          const { updateProfileImage } = await import("@/lib/profile-actions")

          // Call the server action
          const result = await updateProfileImage({
            userId: user.id.toString(),
            base64File,
            fileExt,
            fileName: file.name,
          })

          if (!result.success) {
            throw new Error(result.error || "Failed to update profile image")
          }

          // Refresh user data
          await refreshUser()

          // Show success message
          setAlertDialog({
            isOpen: true,
            title: "Foto Atualizada",
            message: "Sua foto de perfil foi atualizada com sucesso!",
            type: "success",
          })
        } catch (error) {
          console.error("Erro ao processar imagem:", error)
          setAlertDialog({
            isOpen: true,
            title: "Erro",
            message: "Ocorreu um erro ao atualizar sua foto. Tente novamente.",
            type: "error",
          })
        } finally {
          setIsUploadingImage(false)
        }
      }

      reader.onerror = () => {
        console.error("Erro ao ler o arquivo")
        setAlertDialog({
          isOpen: true,
          title: "Erro",
          message: "Ocorreu um erro ao ler o arquivo. Tente novamente.",
          type: "error",
        })
        setIsUploadingImage(false)
      }
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      setAlertDialog({
        isOpen: true,
        title: "Erro",
        message: "Ocorreu um erro ao atualizar sua foto. Tente novamente.",
        type: "error",
      })
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateError("")

    try {
      const { supabase } = await import("@/lib/supabase")

      console.log("Atualizando perfil para o usuário:", user?.id)
      console.log("Dados a serem atualizados:", {
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

      // Atualizar na tabela "usuarios" incluindo os campos de endereço
      const { error } = await supabase
        .from("usuarios")
        .update({
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
          updated_at: new Date(),
        })
        .eq("id", user?.id)

      if (error) {
        console.error("Erro detalhado ao atualizar perfil:", error)
        throw error
      }

      // Atualizar dados do usuário no contexto
      await refreshUser()

      setIsEditing(false)

      // Show success dialog instead of alert
      setAlertDialog({
        isOpen: true,
        title: "Perfil Atualizado",
        message: "Seu perfil foi atualizado com sucesso!",
        type: "success",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      setUpdateError("Ocorreu um erro ao atualizar o perfil. Tente novamente.")

      // Show error dialog
      setAlertDialog({
        isOpen: true,
        title: "Erro",
        message: "Ocorreu um erro ao atualizar o perfil. Tente novamente.",
        type: "error",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)

      // Show error dialog instead of alert
      setAlertDialog({
        isOpen: true,
        title: "Erro",
        message: "Ocorreu um erro ao fazer logout. Tente novamente.",
        type: "error",
      })
    }
  }

  const closeAlertDialog = () => {
    setAlertDialog((prev) => ({ ...prev, isOpen: false }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#2C2B34] px-5">
        <p className="text-white">Carregando...</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#2C2B34] text-white">
      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={closeAlertDialog}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

      {/* Cabeçalho */}
      <div className="relative flex justify-center items-center py-4 px-4 border-b border-[#3A3942]">
        <button onClick={() => router.back()} className="absolute left-4 text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Meu Perfil</h1>
      </div>

      {/* Foto de perfil */}
      <div className="flex flex-col items-center py-6">
        <ImageUpload
          currentImageUrl={user?.foto || null}
          onImageSelected={handleImageSelected}
          isUploading={isUploadingImage}
        />
      </div>

      {/* Abas */}
      <div className="flex border-b border-[#3A3942]">
        <button
          className={`flex-1 py-3 text-center font-medium relative ${
            activeTab === "personal" ? "text-white" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("personal")}
        >
          Dados Pessoais
          {activeTab === "personal" && <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-white"></div>}
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium relative ${
            activeTab === "address" ? "text-white" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("address")}
        >
          Endereço
          {activeTab === "address" && <div className="absolute bottom-0 left-1/4 w-1/2 h-[2px] bg-white"></div>}
        </button>
      </div>

      {/* Formulário de perfil */}
      <form onSubmit={handleSubmit} className="flex-1 px-4 py-2">
        {activeTab === "personal" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm text-gray-400 mb-1">
                Nome
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label htmlFor="sobrenome" className="block text-sm text-gray-400 mb-1">
                Sobrenome
              </label>
              <input
                type="text"
                id="sobrenome"
                name="sobrenome"
                value={formData.sobrenome}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm text-gray-400 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled={true}
                className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none opacity-70"
              />
            </div>
          </div>
        )}

        {activeTab === "address" && (
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="cep" className="block text-sm text-gray-400 mb-1">
                CEP
              </label>
              <input
                type="text"
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
              />
              {isFetchingCep && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-t-2 border-[#ED1C24] border-solid rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="rua" className="block text-sm text-gray-400 mb-1">
                Rua
              </label>
              <input
                type="text"
                id="rua"
                name="rua"
                value={formData.rua}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/3">
                <label htmlFor="numero" className="block text-sm text-gray-400 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  id="numero"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
                />
              </div>
              <div className="w-2/3">
                <label htmlFor="complemento" className="block text-sm text-gray-400 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  id="complemento"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bairro" className="block text-sm text-gray-400 mb-1">
                Bairro
              </label>
              <input
                type="text"
                id="bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
              />
            </div>

            <div className="flex gap-4">
              <div className="w-2/3">
                <label htmlFor="cidade" className="block text-sm text-gray-400 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  disabled={!isEditing || (formData.cidade && formData.cidade.trim() !== "")}
                  className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
                />
              </div>
              <div className="w-1/3">
                <label htmlFor="uf" className="block text-sm text-gray-400 mb-1">
                  UF
                </label>
                <input
                  type="text"
                  id="uf"
                  name="uf"
                  value={formData.uf}
                  onChange={handleChange}
                  disabled={!isEditing || (formData.uf && formData.uf.trim() !== "")}
                  className="w-full bg-[#3A3942] text-white py-3 px-4 rounded-[16px] focus:outline-none disabled:opacity-70"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        )}

        {updateError && (
          <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
            {updateError}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {isEditing ? (
            <>
              <button
                type="submit"
                className="w-full bg-[#ED1C24] text-white py-3 rounded-full font-bold flex justify-center items-center"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full bg-transparent border border-white text-white py-3 rounded-full font-bold"
                disabled={isUpdating}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full bg-[#ED1C24] text-white py-3 rounded-full font-bold"
            >
              Editar Perfil
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-transparent border border-[#ED1C24] text-[#ED1C24] py-3 rounded-full font-bold"
          >
            Sair da Conta
          </button>
        </div>
      </form>

      {/* Barra de navegação inferior */}
      <div className="flex justify-around items-center py-4 bg-[#2C2B34] border-t border-[#3A3942]">
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs mt-1">Início</span>
        </Link>
        <Link href="/historico" className="flex flex-col items-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs mt-1">Histórico</span>
        </Link>
        <Link href="/perfil" className="flex flex-col items-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs mt-1">Perfil</span>
        </Link>
      </div>
    </main>
  )
}
