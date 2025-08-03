"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { criarNotificacao } from "@/lib/database"
import { Button } from "@/components/ui/button"

export default function TestNotifications() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const criarNotificacaoTeste = async (tipo: "info" | "success" | "warning" | "error", titulo: string, mensagem: string) => {
    if (!user?.id) {
      setMessage("Usuário não autenticado")
      return
    }

    setLoading(true)
    try {
      const { error } = await criarNotificacao(
        parseInt(user.id),
        titulo,
        mensagem,
        tipo
      )

      if (error) {
        setMessage(`Erro ao criar notificação: ${error}`)
      } else {
        setMessage(`Notificação do tipo "${tipo}" criada com sucesso!`)
      }
    } catch (error) {
      setMessage(`Erro: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2C2B34] text-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Teste de Notificações</h1>
        
        {message && (
          <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg text-blue-300">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={() => criarNotificacaoTeste(
              "info",
              "Informação",
              "Esta é uma notificação informativa para teste."
            )}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Criar Notificação Info
          </Button>

          <Button
            onClick={() => criarNotificacaoTeste(
              "success",
              "Pedido Confirmado",
              "Seu pedido #PED-123 foi confirmado e está sendo preparado!"
            )}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Criar Notificação Success
          </Button>

          <Button
            onClick={() => criarNotificacaoTeste(
              "warning",
              "Atenção",
              "Seu pedido está com atraso na entrega. Previsão atualizada: 2 dias."
            )}
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            Criar Notificação Warning
          </Button>

          <Button
            onClick={() => criarNotificacaoTeste(
              "error",
              "Problema no Pagamento",
              "Houve um problema com o pagamento do seu pedido. Verifique seus dados."
            )}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Criar Notificação Error
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Use esta página para testar o sistema de notificações.
            <br />
            Vá para o dashboard para ver as notificações no sino.
          </p>
        </div>
      </div>
    </div>
  )
}