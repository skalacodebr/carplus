"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import {
  getRevendedoresParaProdutos,
  getUserInfo,
  limparCarrinhoUsuario,
  checkStatusPedido,
  cancelarPedido,
} from "@/lib/database";
import CustomAlert from "@/components/custom-alert";
import EnderecoModal, {
  type EnderecoAlternativo,
} from "@/components/endereco-modal";

interface RevendedorEstoque {
  quantidade: number;
  preco: number;
  status: string;
  revendedor: {
    id: number;
    loja: string;
    cidade: string;
    uf: string;
    frete: number;
    vendas: number;
    status: boolean;
  };
}

interface UserInfo {
  id: number;
  nome: string;
  email: string;
  cidade: string;
  uf: string;
  cep: string;
  rua: string;
  bairro: string;
  complemento: string;
  numero: string;
}

const billingTypeMap: Record<
  string,
  "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED"
> = {
  boleto: "BOLETO",
  cartao: "CREDIT_CARD",
  pix: "PIX",
};

export default function Carrinho() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    getTotal,
    clearCart,
  } = useCart();
  const [produtos, setProdutos] = useState(items);
  const [tipoEntrega, setTipoEntrega] = useState("retirada");
  const [metodoPagamento, setMetodoPagamento] = useState("pix");
  const [showModalPagamento, setShowModalPagamento] = useState(false);
  const [activeTab, setActiveTab] = useState<"pix" | "boleto">("pix");
  const [modalPagamentoCartao, setModalPagamentoCartao] = useState(false);
  const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<string | null>(null);
  const [revendedoresPorProduto, setRevendedoresPorProduto] = useState<
    Record<string, RevendedorEstoque[]>
  >({});
  const [revendedorSelecionado, setRevendedorSelecionado] = useState<
    Record<string, RevendedorEstoque>
  >({});
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);
  const [checkoutFinalizado, setCheckoutFinalizado] = useState(false);

  // Estado para o endereço alternativo
  const [enderecoAlternativo, setEnderecoAlternativo] =
    useState<EnderecoAlternativo | null>(null);
  const [isEnderecoModalOpen, setIsEnderecoModalOpen] = useState(false);

  // Alert state
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning" as "info" | "warning" | "error" | "success",
  });

  const [pedido, setPedido] = useState<any>(null);
  const pedidoRef = useRef<any>(null);
  const orderNumberRef = useRef<string | null>(null);
  const orderValueRef = useRef<number | null>(null);
  const [pedidoCancelado, setPedidoCancelado] = useState(false);

  // Estados para os dados do cartão
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    holderName: "",
  });

  // Função para atualizar os dados do cartão
  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    // Atualizar produtos quando os itens do carrinho mudarem
    setProdutos(items);
  }, [items]);

  // Buscar informações do usuário
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;

      setLoadingUserInfo(true);
      try {
        const { data, error } = await getUserInfo(user.id);
        if (error) {
          console.error("Erro ao buscar informações do usuário:", error);
        } else {
          setUserInfo(data);
        }
      } catch (error) {
        console.error("Erro ao buscar informações do usuário:", error);
      } finally {
        setLoadingUserInfo(false);
      }
    };

    fetchUserInfo();
  }, [user]);

  useEffect(() => {
    // Buscar revendedores quando os produtos mudarem
    const buscarRevendedores = async () => {
      if (produtos.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const produtoNomes = produtos.map((produto) => produto.nome);
        const { data, error } = await getRevendedoresParaProdutos(produtoNomes);

        if (error) {
          console.error("Erro ao buscar revendedores:", error);
          setLoading(false);
          return;
        }

        setRevendedoresPorProduto(data);

        // Selecionar automaticamente o revendedor da cidade do usuário com menor preço, ou o mais barato se não houver na cidade
        const revendedoresIniciais: Record<string, RevendedorEstoque> = {};
        Object.keys(data).forEach((produtoNome) => {
          const revendedores = data[produtoNome];
          if (revendedores && revendedores.length > 0) {
            // Tentar encontrar um revendedor da cidade do usuário primeiro
            const revendedorDaCidade = userInfo?.cidade
              ? revendedores.find(
                  (r) =>
                    r.revendedor.cidade.toLowerCase() ===
                    userInfo.cidade.toLowerCase()
                )
              : null;

            revendedoresIniciais[produtoNome] =
              revendedorDaCidade || revendedores[0];
          }
        });
        setRevendedorSelecionado(revendedoresIniciais);
      } catch (error) {
        console.error("Erro ao buscar revendedores:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarRevendedores();
  }, [produtos, userInfo]);

  useEffect(() => {
    const checkPendingPayment = () => {
      // Verificar se há pagamento pendente no sessionStorage
      const keys = Object.keys(sessionStorage);
      for (const key of keys) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key) || "");
          if (data.pagamentoId) {
            setPendingPayment(data.pagamentoId);
            setPedido(data);
            setShowModalPagamento(true);
            setActiveTab(data.pagamento_tipo === "PIX" ? "pix" : "boleto");
            break;
          }
        } catch (e) {
          continue;
        }
      }
    };

    // Só verificar pagamento pendente se o usuário estiver logado
    if (user) {
      checkPendingPayment();
    }
  }, [user]); // Executar quando o usuário mudar

  useEffect(() => {
    // Verificar pagamento pendente ao montar o componente
    const checkPendingPayment = () => {
      // Verificar se há pagamento pendente no sessionStorage
      const keys = Object.keys(sessionStorage);
      for (const key of keys) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key) || "");
          if (data.pagamentoId) {
            setPendingPayment(data.pagamentoId);
            setPedido(data);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    };

    checkPendingPayment();
  }, []);

  const removerProduto = (id: string) => {
    removeItem(id);
  };

  const alterarQuantidade = (id: string, novaQuantidade: number) => {
    // Ensure quantity is a multiple of 5 and at least 5
    const adjustedQuantity = Math.max(Math.round(novaQuantidade / 5) * 5, 5);
    updateQuantity(id, adjustedQuantity);
  };

  const calcularSubtotal = () => {
    return produtos.reduce((total, produto) => {
      const revendedor = revendedorSelecionado[produto.nome];
      const preco = revendedor ? revendedor.preco : 0;
      return total + preco * produto.quantidade;
    }, 0);
  };

  // Calcular frete total
  const calcularFrete = () => {
    if (tipoEntrega === "retirada") {
      return 0; // Retirada é sempre grátis
    }

    const revendedoresUnicos = new Set(
      Object.values(revendedorSelecionado).map((r) => r.revendedor.id)
    );
    return Array.from(revendedoresUnicos).reduce((total, revendedorId) => {
      const revendedor = Object.values(revendedorSelecionado).find(
        (r) => r.revendedor.id === revendedorId
      );
      return total + (revendedor?.revendedor.frete || 0);
    }, 0);
  };

  const subtotal = calcularSubtotal();
  const frete = calcularFrete();
  const total = subtotal + frete;
  const totalQuantity = produtos.reduce(
    (sum, produto) => sum + produto.quantidade,
    0
  );

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Substitua a função handleCheckout existente por esta:
  const handleCheckout = async () => {
    if (pendingPayment) {
      setAlertConfig({
        isOpen: true,
        title: "Pagamento Pendente",
        message:
          "Você já tem um pagamento pendente. Finalize-o antes de iniciar um novo.",
        type: "warning",
      });

      // Mostrar o modal de pagamento com os dados do pedido pendente
      setTimeout(() => {
        closeAlert();
        if (pedido) {
          setShowModalPagamento(true);
          setActiveTab(pedido.pagamento_tipo === "PIX" ? "pix" : "boleto");
        }
      }, 3000);
      return; // Importante: retornar aqui para não continuar com o checkout
    }

    if (!user) {
      setAlertConfig({
        isOpen: true,
        title: "Login Necessário",
        message:
          "Você precisa estar logado para finalizar a compra. Redirecionando para a página de login...",
        type: "warning",
      });

      setTimeout(() => {
        closeAlert();
        router.push("/login");
      }, 3000);
      return;
    }

    // Verificar se todos os produtos têm revendedores selecionados
    const produtosSemRevendedor = produtos.filter(
      (produto) => !revendedorSelecionado[produto.nome]
    );
    if (produtosSemRevendedor.length > 0) {
      setAlertConfig({
        isOpen: true,
        title: "Revendedor Necessário",
        message:
          "Selecione um revendedor para todos os produtos antes de finalizar a compra.",
        type: "warning",
      });
      return;
    }

    // Verificar quantidade mínima
    if (totalQuantity < 50) {
      const unidadesFaltando = 50 - totalQuantity;
      setAlertConfig({
        isOpen: true,
        title: "Quantidade Mínima",
        message: `A quantidade mínima do pedido é de 50 unidades.\n\nVocê tem ${totalQuantity} unidades no carrinho.\n\nAdicione mais ${unidadesFaltando} unidade${
          unidadesFaltando > 1 ? "s" : ""
        } para continuar com a compra.`,
        type: "warning",
      });
      return;
    }

    // Verificar se o endereço está completo para entrega
    if (tipoEntrega === "entrega") {
      const enderecoEntrega = enderecoAlternativo || userInfo;
      if (
        !enderecoEntrega ||
        !enderecoEntrega.cep ||
        !enderecoEntrega.rua ||
        !enderecoEntrega.numero ||
        !enderecoEntrega.cidade
      ) {
        setAlertConfig({
          isOpen: true,
          title: "Endereço Incompleto",
          message:
            "Por favor, complete o endereço de entrega antes de finalizar a compra.",
          type: "warning",
        });
        return;
      }
    }

    // Se o método de pagamento for cartão de crédito, mostrar o modal
    if (metodoPagamento === "cartao") {
      setModalPagamentoCartao(true);
      return;
    }

    try {
      setAlertConfig({
        isOpen: true,
        title: "Processando",
        message: "Estamos processando seu pedido, aguarde...",
        type: "info",
      });

      // Fechar o alerta de processamento após 3 segundos
      setTimeout(() => {
        closeAlert();
      }, 3000);

      // Importar a nova função
      const { criarPedidoNovo, limparCarrinhoUsuario } = await import(
        "@/lib/database"
      );

      // Pegar o primeiro revendedor (assumindo que todos os produtos são do mesmo revendedor por enquanto)
      const primeiroRevendedor = Object.values(revendedorSelecionado)[0];
      const revendedorId = primeiroRevendedor.revendedor.id;

      // Preparar itens com informações do revendedor
      const itensComRevendedor = produtos.map((produto) => ({
        ...produto,
        preco: revendedorSelecionado[produto.nome].preco,
        // Remover pacote_id fixo - será buscado dinamicamente na função criarPedidoNovo
      }));

      // Criar pedido no banco de dados usando o novo schema
      const {
        data: pedidoData,
        pix,
        boleto,
        pagamentoId,
        error,
      } = await criarPedidoNovo(
        user.id,
        revendedorId,
        itensComRevendedor,
        total,
        frete,
        tipoEntrega,
        billingTypeMap[metodoPagamento] // Aqui fazemos o mapeamento
      );

      if (error) {
        throw error;
      }

      if (metodoPagamento === "pix" || metodoPagamento === "boleto") {
        setShowModalPagamento(true);
        setPedido({
          ...pedidoData,
          pix,
          boleto,
          pagamentoId,
        });

        sessionStorage.setItem(pedidoData.numero, JSON.stringify(pedidoData));
        sessionStorage.setItem(pagamentoId, JSON.stringify(pedidoData));
        setPendingPayment(pagamentoId);

        console.log("pedido", pedidoData);
        setPedidoFinalizado(true);
      } else {
        // Limpar carrinho no banco de dados
        await limparCarrinhoUsuario(user.id);

        // Limpar carrinho no contexto (estado local)
        clearCart();

        // Após limpar carrinho e antes do setTimeout
        setCheckoutFinalizado(true);
        // Simular pagamento automático - mostrar sucesso
        setAlertConfig({
          isOpen: true,
          title: "Pedido Realizado com Sucesso! 🎉",
          message: `Seu pedido #${
            pedido.numero
          } foi criado e o pagamento foi processado automaticamente.\n\nTotal: R$ ${pedido.valor_total.toFixed(
            2
          )}\n\nVocê pode acompanhar o status do seu pedido na página de histórico.`,
          type: "success",
        });

        // Redirecionar para pedidos após 3 segundos
        setTimeout(() => {
          closeAlert();
          router.push("/pedidos");
        }, 3000);
      }
    } catch (error) {
      console.error("Erro ao finalizar compra:", error);
      setAlertConfig({
        isOpen: true,
        title: "Erro na Compra",
        message:
          "Ocorreu um erro ao finalizar a compra. Tente novamente em alguns instantes.",
        type: "error",
      });
    }
  };

  // Função para processar o pagamento com cartão
  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setAlertConfig({
        isOpen: true,
        title: "Processando",
        message: "Processando pagamento com cartão de crédito...",
        type: "info",
      });

      // Importar a nova função
      const { criarPedidoNovo, limparCarrinhoUsuario } = await import(
        "@/lib/database"
      );

      // Pegar o primeiro revendedor
      const primeiroRevendedor = Object.values(revendedorSelecionado)[0];
      const revendedorId = primeiroRevendedor.revendedor.id;

      // Preparar itens com informações do revendedor
      const itensComRevendedor = produtos.map((produto) => ({
        ...produto,
        preco: revendedorSelecionado[produto.nome].preco,
        // Remover pacote_id fixo - será buscado dinamicamente na função criarPedidoNovo
      }));

      // Criar pedido no banco de dados
      const { data: pedidoData, error } = await criarPedidoNovo(
        user.id,
        revendedorId,
        itensComRevendedor,
        total,
        frete,
        tipoEntrega,
        billingTypeMap[metodoPagamento],
        cardData // Enviando os dados do cartão
      );

      if (error) {
        throw error;
      }

      // Limpar carrinho no banco de dados
      await limparCarrinhoUsuario(user.id);

      // Limpar carrinho no contexto (estado local)
      clearCart();

      setModalPagamentoCartao(false);
      setCheckoutFinalizado(true);

      // Mostrar mensagem de sucesso
      setAlertConfig({
        isOpen: true,
        title: "Pedido Realizado com Sucesso! 🎉",
        message: `Seu pedido #${
          pedidoData.numero
        } foi criado e o pagamento foi processado com sucesso.\n\nTotal: R$ ${pedidoData.valor_total.toFixed(
          2
        )}\n\nVocê pode acompanhar o status do seu pedido na página de histórico.`,
        type: "success",
      });

      // Redirecionar para pedidos após 3 segundos
      setTimeout(() => {
        closeAlert();
        router.push("/pedidos");
      }, 3000);
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      setAlertConfig({
        isOpen: true,
        title: "Erro no Pagamento",
        message:
          "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.",
        type: "error",
      });
    }
  };

  // Atualize o pedidoRef sempre que o estado "pedido" mudar
  useEffect(() => {
    if (pedido?.pagamentoId) {
      pedidoRef.current = pedido.pagamentoId;
      orderNumberRef.current = pedido.numero;
      orderValueRef.current = pedido.valor_total;
    }
  }, [pedido]);

  // Verificação periódica do status do pedido
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (pedidoRef.current) {
        try {
          const statusResponse = await checkStatusPedido(pedidoRef.current);
          console.log("Status do pedido:", statusResponse);

          // Atualize o estado do pedido se necessário:
          if (statusResponse?.data !== pedido?.status) {
            setPedido((prev: any) => ({
              ...prev,
              status: statusResponse.data,
            }));
          }

          // Se o status for "RECEIVED" ou "CONFIRMED", você pode limpar o intervalo
          if (statusResponse.data === "RECEIVED" || statusResponse.data === "CONFIRMED") {
            clearInterval(intervalId);
            console.log("Status final alcançado, parando verificação.");
            setShowModalPagamento(false);
            setPendingPayment(null);

            setAlertConfig({
              isOpen: true,
              title: "Pedido Realizado com Sucesso! 🎉",
              message: `Seu pedido #${
                orderNumberRef.current || "N/A"
              } foi criado e o pagamento foi processado automaticamente.\n\nTotal: R$ ${orderValueRef.current?.toFixed(
                2
              )}\n\nVocê pode acompanhar o status do seu pedido na página de histórico.`,
              type: "success",
            });

            // Redirecionar para pedidos após 3 segundos
            setTimeout(() => {
              closeAlert();
              router.push("/pedidos");
            }, 3000);
          }

          if (statusResponse.data === "excluido") {
            clearInterval(intervalId);
            console.log("Status final alcançado, parando verificação.");
            setShowModalPagamento(false);            
          }
        } catch (error) {
          console.error("Erro ao verificar status do pedido:", error);
        }
      }
    }, 5000); // 5000ms = 5s

    // Limpa o intervalo ao desmontar o componente
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleOpenEnderecoModal = () => {
    // Sempre abre o modal para editar/criar endereço alternativo
    // Se já existe um endereço alternativo, usa ele, senão começa vazio
    setIsEnderecoModalOpen(true);
  };

  const handleSaveEndereco = (endereco: EnderecoAlternativo) => {
    setEnderecoAlternativo(endereco);
    setAlertConfig({
      isOpen: true,
      title: "Endereço Alternativo Salvo",
      message: "O endereço alternativo para este pedido foi salvo com sucesso!",
      type: "success",
    });
  };

  const handleRemoveEnderecoAlternativo = () => {
    setEnderecoAlternativo(null);
    setAlertConfig({
      isOpen: true,
      title: "Endereço Alternativo Removido",
      message: "Voltando a usar o endereço da sua conta para este pedido.",
      type: "info",
    });
  };

  const handleVoltar = () => {
    if (checkoutFinalizado) {
      router.push("/dashboard");
    } else {
      router.back();
    }
  };

  const [showEmbedBoleto, setShowEmbedBoleto] = useState(false);

  // Função para simular pagamento
  const simulatePayment = async (status: string, paymentId: string) => {
    try {
      const response = await fetch('/api/simulate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentId,
          orderNumber: pedido?.numero,
          status: status
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Pagamento simulado com sucesso: ${status}`)
        // Recarregar o status do pedido
        await checkStatusPedido(paymentId)
      } else {
        throw new Error(data.error || 'Erro ao simular pagamento')
      }
    } catch (err: any) {
      console.error('Erro ao simular pagamento:', err)
      alert('Erro ao simular pagamento: ' + err.message)
    }
  }

  const handleCancelarCompra = async (id: string) => {
    try {
      setShowModalPagamento(false);
      setPedidoCancelado(true);
      const response = await cancelarPedido(id);
      if (response.error) {
        setAlertConfig({
          isOpen: true,
          title: "Erro ao cancelar o pedido",
          message: "Erro ao cancelar o pedido",
          type: "error",
        });
      } else {
        // Limpar dados do pedido do sessionStorage
        const keys = Object.keys(sessionStorage);
        for (const key of keys) {
          try {
            const data = JSON.parse(sessionStorage.getItem(key) || "");
            if (data.pagamentoId === id) {
              sessionStorage.removeItem(key);
            }
          } catch (e) {
            continue;
          }
        }

        // Limpar estados
        setPendingPayment(null);
        setPedido(null);

        setAlertConfig({
          isOpen: true,
          title: "Pedido cancelado com sucesso",
          message: "Pedido cancelado com sucesso",
          type: "success",
        });
      }
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Erro ao cancelar o pedido",
        message: "Erro ao cancelar o pedido",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <main className="flex flex-col min-h-screen bg-[#2C2B34] text-white">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Carregando revendedores...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#2C2B34] text-white">
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      {/* Modal de Endereço */}
      <EnderecoModal
        isOpen={isEnderecoModalOpen}
        onClose={() => setIsEnderecoModalOpen(false)}
        onSave={handleSaveEndereco}
        enderecoInicial={enderecoAlternativo}
      />

      {/* Modal de Pagamento */}
      {showModalPagamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2C2B34] rounded-[15px] p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                Dados do Pagamento
              </h2>
              <button
                onClick={() => setShowModalPagamento(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Fechar modal"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                {pedido?.pagamento_tipo === "PIX" && (
                  <button
                    onClick={() => setActiveTab("pix")}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
                      activeTab === "pix"
                        ? "bg-white text-blue-700 shadow"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    PIX
                  </button>
                )}
                {pedido?.pagamento_tipo === "BOLETO" && (
                  <button
                    onClick={() => setActiveTab("boleto")}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
                      activeTab === "boleto"
                        ? "bg-white text-blue-700 shadow"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Boleto
                  </button>
                )}
              </div>

              <div className="mt-4">
                {activeTab === "pix" && pedido?.pagamento_tipo === "PIX" && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-64 h-64">
                      <img
                        src={`data:image/png;base64,${pedido?.pix?.encodedImage}`}
                        alt="QR Code PIX"
                        className="w-full h-full rounded-[15px]"
                      />
                    </div>
                    <div className="text-center w-full">
                      <p className="font-semibold mb-2 text-gray-800">
                        Vencimento:{" "}
                        {new Date(
                          pedido?.pix?.expirationDate
                        ).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm mb-2">Copie o código abaixo:</p>
                      <div className="space-y-3">
                        <input
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded bg-white text-gray-800"
                          type="text"
                          value={pedido?.pix?.payload}
                        />
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(pedido?.pix?.payload)
                          }
                          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Copiar Código PIX
                        </button>
                        <button
                          onClick={() =>
                            handleCancelarCompra(pedido?.pagamentoId)
                          }
                          className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Cancelar Compra
                        </button>
                        <button
                          onClick={() => simulatePayment('PAYMENT_CONFIRMED', pedido?.pagamentoId)}
                          className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Simular Pagamento
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "boleto" &&
                  pedido?.pagamento_tipo === "BOLETO" && (
                    <div className="flex flex-col space-y-4">
                      <div className="text-center space-y-4">
                        <div className="flex justify-center space-x-4">
                          <a
                            href={pedido?.boleto?.bankSlipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-4 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition-colors"
                          >
                            Abrir em Nova Aba
                          </a>
                          <button
                            onClick={() => setShowEmbedBoleto((prev) => !prev)}
                            className="flex-1 py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            {showEmbedBoleto
                              ? "Ocultar Boleto"
                              : "Visualizar Aqui"}
                          </button>
                        </div>
                        {showEmbedBoleto && (
                          <div className="w-full h-[600px] border border-gray-300 rounded">
                            <iframe
                              src={pedido?.boleto?.bankSlipUrl}
                              className="w-full h-full"
                              title="Boleto"
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          readOnly
                          value={pedido?.boleto?.identificationField}
                          className="w-full p-2 border rounded bg-white text-gray-800"
                        />
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              pedido?.boleto?.identificationField
                            )
                          }
                          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Copiar Linha Digitável
                        </button>
                        <button
                          onClick={() =>
                            handleCancelarCompra(pedido?.pagamentoId)
                          }
                          className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Cancelar Compra
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cartão de Crédito */}
      {modalPagamentoCartao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2C2B34] rounded-[15px] p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Dados do Cartão</h2>
              <button
                onClick={() => setModalPagamentoCartao(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Fechar modal"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCardPayment}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Número do Cartão
                </label>
                <input
                  type="text"
                  name="number"
                  value={cardData.number}
                  onChange={handleCardInputChange}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    name="expiry"
                    value={cardData.expiry}
                    onChange={handleCardInputChange}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="MM/AA"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={cardData.cvv}
                    onChange={handleCardInputChange}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome no Cartão
                </label>
                <input
                  type="text"
                  name="holderName"
                  value={cardData.holderName}
                  onChange={handleCardInputChange}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Nome como está no cartão"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Finalizar Pagamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Botão voltar */}
      <div className="p-4">
        <button onClick={handleVoltar} className="text-white">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Informação sobre quantidade mínima */}
      <div className="px-4 mb-4">
        <div
          className={`border rounded-lg p-3 ${
            totalQuantity >= 50
              ? "bg-green-500 bg-opacity-20 border-green-500"
              : "bg-blue-500 bg-opacity-20 border-blue-500"
          }`}
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 mr-2 ${
                totalQuantity >= 50 ? "text-green-400" : "text-blue-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p
              className={`text-sm ${
                totalQuantity >= 50 ? "text-green-400" : "text-blue-400"
              }`}
            >
              Quantidade total: {totalQuantity}/50 unidades{" "}
              {totalQuantity >= 50 ? "✓" : "(mínimo necessário)"}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de produtos no carrinho */}
      <div className="flex-1 px-4">
        {produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 bg-[#3A3942] rounded-lg p-6">
            <p className="text-gray-400 mb-4">Seu carrinho está vazio</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-[#fdc300] text-white rounded-md hover:bg-opacity-90"
            >
              Continuar comprando
            </button>
          </div>
        ) : (
          produtos.map((produto) => {
            const revendedorAtual = revendedorSelecionado[produto.nome];

            return (
              <div
                key={produto.id}
                className="mb-8 bg-[#3A3942] rounded-lg p-4"
              >
                {/* Produto */}
                <div className="flex items-center mb-4">
                  <div className="w-[120px] h-[120px] rounded-[12px] border border-[#3A3942] overflow-hidden mr-4">
                    <Image
                      src={produto.imagem || "/placeholder.svg"}
                      alt={produto.nome}
                      width={120}
                      height={120}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between h-[120px]">
                    <div>
                      <h3 className="font-bold">{produto.nome}</h3>
                      <p className="text-gray-400 mt-2">
                        {revendedorAtual
                          ? `R$ ${revendedorAtual.preco.toFixed(2)}`
                          : "Selecione um revendedor"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center border border-[#FFFFFF4D] rounded-[8px] px-2 py-1">
                        <button
                          onClick={() => removerProduto(produto.id)}
                          className="p-1 rounded-md mr-2"
                          aria-label="Remover produto"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            alterarQuantidade(
                              produto.id,
                              Math.max(produto.quantidade - 5, 5)
                            )
                          }
                          className="p-1 rounded-md mr-2"
                          aria-label="Diminuir quantidade"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 12H4"
                            />
                          </svg>
                        </button>
                        <span className="mx-2 min-w-[40px] text-center">
                          {produto.quantidade}
                        </span>
                        <button
                          onClick={() =>
                            alterarQuantidade(
                              produto.id,
                              produto.quantidade + 5
                            )
                          }
                          className="p-1 rounded-md"
                          aria-label="Aumentar quantidade"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          R${" "}
                          {revendedorAtual
                            ? (
                                revendedorAtual.preco * produto.quantidade
                              ).toFixed(2)
                            : "0,00"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {produtos.length > 0 && (
        <>
          {/* Revendedor selecionado */}
          <div className="px-4 py-6">
            <h3 className="font-bold mb-4">Revendedor selecionado</h3>
            {Object.keys(revendedorSelecionado).length === 0 ? (
              <p className="text-gray-400 text-sm">
                Nenhum revendedor selecionado para os produtos.
              </p>
            ) : (
              (() => {
                // Get unique resellers
                const revendedoresUnicos = Object.values(
                  revendedorSelecionado
                ).reduce((acc, item) => {
                  const key = item.revendedor.id;
                  if (!acc[key]) {
                    acc[key] = item;
                  }
                  return acc;
                }, {} as Record<number, RevendedorEstoque>);

                return Object.values(revendedoresUnicos).map((revendedor) => (
                  <div
                    key={revendedor.revendedor.id}
                    className="bg-[#3A3942] rounded-lg p-3 mb-3"
                  >
                    <div className="flex justify-between items-center p-2 bg-[#2C2B34] rounded">
                      <div>
                        <p className="font-medium text-sm">
                          {revendedor.revendedor.loja}
                        </p>
                        <p className="text-xs text-gray-400">
                          {revendedor.revendedor.cidade}/
                          {revendedor.revendedor.uf}
                        </p>
                        <p className="text-xs text-gray-400">
                          {revendedor.revendedor.vendas} vendas
                        </p>
                      </div>
                      <div className="text-right">
                        {userInfo?.cidade &&
                        revendedor.revendedor.cidade.toLowerCase() ===
                          userInfo.cidade.toLowerCase() ? (
                          <p className="text-xs text-green-400">
                            Retirada grátis
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">
                            + R$ {revendedor.revendedor.frete} frete
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ));
              })()
            )}
          </div>

          {/* Resumo de valores */}
          <div className="px-4 py-4 border-t border-[#3A3942]">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Frete</span>
              <span>
                {tipoEntrega === "retirada"
                  ? "Grátis"
                  : `R$ ${frete.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Tipo de entrega e Métodos de pagamento */}
          <div className="px-4 py-4 border-t border-[#3A3942]">
            <h3 className="font-bold mb-4">Tipo de entrega</h3>
            <div className="mb-6">
              <div className="flex items-start mb-3">
                <input
                  type="radio"
                  id="retirada"
                  name="entrega"
                  checked={tipoEntrega === "retirada"}
                  onChange={() => setTipoEntrega("retirada")}
                  className="mr-3 w-[20px] h-[20px] mt-1 accent-[#fdc300]"
                />
                <div>
                  <label
                    htmlFor="retirada"
                    className="font-medium cursor-pointer"
                  >
                    Retirada no local
                  </label>
                  <p className="text-sm text-gray-400">
                    Retire diretamente na loja do revendedor
                  </p>
                </div>
              </div>
              <div className="flex items-start mb-3">
                <input
                  type="radio"
                  id="entrega"
                  name="entrega"
                  checked={tipoEntrega === "entrega"}
                  onChange={() => setTipoEntrega("entrega")}
                  className="mr-3 w-[20px] h-[20px] mt-1 accent-[#fdc300]"
                />
                <div>
                  <label
                    htmlFor="entrega"
                    className="font-medium cursor-pointer"
                  >
                    Entrega
                  </label>
                  <p className="text-sm text-gray-400">
                    Receba em seu endereço
                  </p>
                </div>
              </div>

              {/* Botão e informações de endereço alternativo - aparece apenas quando "entrega" está selecionado */}
              {tipoEntrega === "entrega" && (
                <div className="mt-4 p-3 bg-[#3A3942] rounded-lg">
                  <h4 className="font-medium text-sm mb-2">
                    Endereço de entrega
                  </h4>

                  {enderecoAlternativo ? (
                    <div className="mb-3">
                      <div className="p-3 bg-[#2C2B34] rounded-lg mb-2">
                        <p className="text-xs text-green-400 mb-1">
                          📍 Endereço alternativo para este pedido
                        </p>
                        <p className="font-medium text-sm">
                          {enderecoAlternativo.nome}
                        </p>
                        <p className="text-xs text-gray-400">
                          {enderecoAlternativo.rua},{" "}
                          {enderecoAlternativo.numero}
                          {enderecoAlternativo.complemento
                            ? `, ${enderecoAlternativo.complemento}`
                            : ""}
                        </p>
                        <p className="text-xs text-gray-400">
                          {enderecoAlternativo.bairro} -{" "}
                          {enderecoAlternativo.cidade}/{enderecoAlternativo.uf}
                        </p>
                        <p className="text-xs text-gray-400">
                          CEP: {enderecoAlternativo.cep}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleOpenEnderecoModal}
                          className="text-xs text-[#fdc300] hover:underline"
                        >
                          Editar endereço alternativo
                        </button>
                        <button
                          onClick={handleRemoveEnderecoAlternativo}
                          className="text-xs text-gray-400 hover:underline"
                        >
                          Usar endereço da conta
                        </button>
                      </div>
                    </div>
                  ) : userInfo && userInfo.cep ? (
                    <div className="mb-3">
                      <div className="p-3 bg-[#2C2B34] rounded-lg mb-2">
                        <p className="text-xs text-blue-400 mb-1">
                          🏠 Endereço da sua conta
                        </p>
                        <p className="font-medium text-sm">{userInfo.nome}</p>
                        <p className="text-xs text-gray-400">
                          {userInfo.rua}, {userInfo.numero}
                          {userInfo.complemento
                            ? `, ${userInfo.complemento}`
                            : ""}
                        </p>
                        <p className="text-xs text-gray-400">
                          {userInfo.bairro} - {userInfo.cidade}/{userInfo.uf}
                        </p>
                        <p className="text-xs text-gray-400">
                          CEP: {userInfo.cep}
                        </p>
                      </div>
                      <button
                        onClick={handleOpenEnderecoModal}
                        className="text-xs text-[#fdc300] hover:underline"
                      >
                        Usar endereço alternativo para este pedido
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-2">
                        Você ainda não tem um endereço cadastrado ou seu
                        endereço está incompleto.
                      </p>
                      <button
                        onClick={handleOpenEnderecoModal}
                        className="px-3 py-2 bg-[#fdc300] text-white text-sm rounded-md hover:bg-opacity-90"
                      >
                        Adicionar endereço de entrega
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <h3 className="font-bold mb-4">Método de pagamento</h3>
            <div className="flex items-start mb-3">
              <input
                type="radio"
                id="pix"
                name="pagamento"
                checked={metodoPagamento === "pix"}
                onChange={() => setMetodoPagamento("pix")}
                className="mr-3 w-[20px] h-[20px] mt-1 accent-[#ED1C24]"
              />
              <div>
                <label htmlFor="pix" className="font-medium cursor-pointer">
                  Pagar com Pix
                </label>
                <p className="text-sm text-gray-400">Pagamento instantâneo</p>
              </div>
            </div>
            <div className="flex items-start mb-3">
              <input
                type="radio"
                id="cartao"
                name="pagamento"
                checked={metodoPagamento === "cartao"}
                onChange={() => setMetodoPagamento("cartao")}
                className="mr-3 w-[20px] h-[20px] mt-1 accent-[#ED1C24]"
              />
              <div>
                <label htmlFor="cartao" className="font-medium cursor-pointer">
                  Pagar com Cartão Débito/Crédito
                </label>
                <p className="text-sm text-gray-400">Débito ou crédito</p>
              </div>
            </div>
            <div className="flex items-start mb-3">
              <input
                type="radio"
                id="boleto"
                name="pagamento"
                checked={metodoPagamento === "boleto"}
                onChange={() => setMetodoPagamento("boleto")}
                className="mr-3 w-[20px] h-[20px] mt-1 accent-[#ED1C24]"
              />
              <div>
                <label htmlFor="boleto" className="font-medium cursor-pointer">
                  Pagar com Boleto Bancário
                </label>
                <p className="text-sm text-gray-400">
                  Vencimento em 3 dias úteis
                </p>
              </div>
            </div>
          </div>

          {/* Botão de checkout */}
          <button
            onClick={handleCheckout}
            disabled={
              produtos.length === 0 ||
              Object.keys(revendedorSelecionado).length !== produtos.length
            }
            className="w-full bg-[#fdc300] text-white py-4 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {totalQuantity < 50
              ? `Adicione mais ${50 - totalQuantity} unidades (mín. 50)`
              : "Prosseguir para o Checkout"}
          </button>
        </>
      )}
    </main>
  );
}
