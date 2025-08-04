import { supabase } from "./supabase";
import {
  createPayment,
  createOrUpdateCustomer,
  getPixQrCode,
  checkPaymentStatus,
  cancelPayment,
} from "@/lib/asaas";

// Funções para produtos
export async function getProdutos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getProduto(id: string) {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", id)
    .single();

  return { data, error };
}

// Funções para cálculos
export async function salvarCalculo(
  tamanhoRoda: string,
  altura: string,
  largura: string,
  resultado: string,
  cor: string
) {
  const { data, error } = await supabase
    .from("calculos")
    .insert([
      {
        tamanho_roda: tamanhoRoda,
        altura: altura,
        largura: largura,
        resultado: resultado,
        cor: cor,
      },
    ])
    .select();

  return { data, error };
}

// Nova função para salvar cálculos do usuário com limite de 10
export async function salvarCalculoUsuario(
  userId: string,
  tamanho: string,
  altura: string,
  largura: string,
  pacote: string
) {
  try {
    // 1. Verificar quantos cálculos o usuário já tem
    const { data: calculos, error: contarError } = await supabase
      .from("calculo_usuarios")
      .select("id, created_at")
      .eq("userid", userId)
      .order("created_at", { ascending: true });

    if (contarError) {
      console.error("Erro ao contar cálculos do usuário:", contarError);
      return { data: null, error: contarError };
    }

    // 2. Se já tiver 10 ou mais, excluir o mais antigo
    if (calculos && calculos.length >= 10) {
      const calculoMaisAntigo = calculos[0];
      const { error: deleteError } = await supabase
        .from("calculo_usuarios")
        .delete()
        .eq("id", calculoMaisAntigo.id);

      if (deleteError) {
        console.error("Erro ao excluir cálculo mais antigo:", deleteError);
        return { data: null, error: deleteError };
      }
    }

    // 3. Inserir o novo cálculo
    const { data, error } = await supabase
      .from("calculo_usuarios")
      .insert([
        {
          userid: userId,
          tamanho: tamanho,
          altura: altura,
          largura: largura,
          pacote: pacote,
          created_at: new Date(),
        },
      ])
      .select();

    if (error) {
      console.error("Erro ao salvar cálculo do usuário:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Erro ao salvar cálculo do usuário:", error);
    return { data: null, error };
  }
}

// Função para obter os cálculos do usuário
export async function getCalculosUsuario(userId: string) {
  const { data, error } = await supabase
    .from("calculo_usuarios")
    .select("*")
    .eq("userid", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getCalculos(userId: string) {
  const { data, error } = await supabase
    .from("calculos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

// Funções para pedidos
export async function criarPedido(
  userId: string,
  items: any[],
  total: number,
  tipoEntrega = "retirada",
  metodoPagamento = "cartao",
  dadosAdicionais: any = {}
) {
  try {
    // Criar o pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert([
        {
          user_id: userId,
          total: total,
          tipo_entrega: tipoEntrega,
          pagamento_tipo: metodoPagamento,
          status: "pendente",
          dados_adicionais: dadosAdicionais, // Armazena o endereço alternativo se existir
        },
      ])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    // Inserir os itens do pedido
    const itens = items.map((item) => ({
      pedido_id: pedido.id,
      produto_nome: item.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      revendedor_id: item.revendedor_id,
    }));

    const { error: itensError } = await supabase
      .from("itens_pedido")
      .insert(itens);

    if (itensError) throw itensError;

    return { data: pedido, error: null };
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return { data: null, error };
  }
}

// Remover as funções getClienteByUsuarioId e garantirCliente que estavam criando uma tabela clientes desnecessária

// Função para buscar pacote baseado no nome do produto
export async function getPacoteByProdutoNome(produtoNome: string) {
  try {
    console.log("Buscando pacote para produto:", produtoNome);

    // Estratégia 1: Buscar por descrição exata
    const { data: pacoteExato, error: errorExato } = await supabase
      .from("pacotes")
      .select("id, descricao, cor")
      .eq("descricao", produtoNome)
      .limit(1);

    if (!errorExato && pacoteExato && pacoteExato.length > 0) {
      console.log("Pacote encontrado por descrição exata:", pacoteExato[0]);
      return { data: pacoteExato[0].id, error: null };
    }

    // Estratégia 2: Buscar por descrição similar (usando ilike)
    const { data: pacoteSimilar, error: errorSimilar } = await supabase
      .from("pacotes")
      .select("id, descricao, cor")
      .ilike("descricao", `%${produtoNome}%`)
      .limit(1);

    if (!errorSimilar && pacoteSimilar && pacoteSimilar.length > 0) {
      console.log("Pacote encontrado por descrição similar:", pacoteSimilar[0]);
      return { data: pacoteSimilar[0].id, error: null };
    }

    // Estratégia 3: Buscar todos os pacotes e fazer busca local
    const { data: todosPacotes, error: errorTodos } = await supabase
      .from("pacotes")
      .select("id, descricao, cor")
      .limit(50);

    if (errorTodos) {
      console.error("Erro ao buscar todos os pacotes:", errorTodos);
      return { data: 1, error: null };
    }

    if (!todosPacotes || todosPacotes.length === 0) {
      console.log("Nenhum pacote encontrado na tabela");
      return { data: 1, error: null };
    }

    console.log("Total de pacotes no banco:", todosPacotes.length);
    console.log("Primeiros 3 pacotes:", todosPacotes.slice(0, 3));

    // Busca local por correspondência parcial na descrição
    const produtoLower = produtoNome.toLowerCase();
    for (const pacote of todosPacotes) {
      if (pacote.descricao && pacote.descricao.toLowerCase().includes(produtoLower)) {
        console.log("Pacote encontrado por busca local:", pacote);
        return { data: pacote.id, error: null };
      }
    }

    // Estratégia 4: Buscar por cor se o produto contém alguma cor
    const coresMapping = {
      "azul": ["azul", "blue"],
      "vermelh": ["vermelha", "vermelh", "red"], 
      "verde": ["verde", "green"],
      "amarelo": ["amarela", "amarelo", "yellow"],
      "preto": ["preta", "preto", "black"], 
      "branco": ["branca", "branco", "white"]
    };
    
    for (const [termo, variantes] of Object.entries(coresMapping)) {
      if (produtoLower.includes(termo)) {
        for (const pacote of todosPacotes) {
          if (pacote.cor) {
            const corLower = pacote.cor.toLowerCase();
            for (const variante of variantes) {
              if (corLower.includes(variante)) {
                console.log(`Pacote encontrado por cor '${termo}':`, pacote);
                return { data: pacote.id, error: null };
              }
            }
          }
        }
      }
    }
    
    // Fallback: retornar o primeiro pacote disponível
    console.log("Nenhuma correspondência encontrada. Usando fallback para o primeiro pacote:", todosPacotes[0]);
    return { data: todosPacotes[0].id, error: null };
    
  } catch (error) {
    console.error("Erro ao buscar pacote:", error);
    return { data: 1, error: null };
  }
}

// Função para buscar um pacote válido (por enquanto retorna o primeiro disponível)
export async function getPacoteValido() {
  try {
    const { data: pacotes, error } = await supabase
      .from("pacotes")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Erro ao buscar pacote:", error);
      return 1; // Fallback para ID 1
    }

    return pacotes && pacotes.length > 0 ? pacotes[0].id : 1;
  } catch (error) {
    console.error("Erro ao buscar pacote:", error);
    return 1; // Fallback para ID 1
  }
}

// Função para registrar mudança de status no histórico
export async function registrarMudancaStatus(
  pedidoId: number,
  statusAnterior: string | null,
  statusNovo: string,
  observacao?: string,
  updatedBy?: number
) {
  try {
    const { data, error } = await supabase
      .from("pedido_historico_status")
      .insert([
        {
          pedido_id: pedidoId,
          status_anterior: statusAnterior,
          status_novo: statusNovo,
          observacao: observacao,
          updated_by: updatedBy,
        },
      ])
      .select();

    if (error) {
      console.error("Erro ao registrar mudança de status:", error);
    }

    return { data, error };
  } catch (error) {
    console.error("Erro ao registrar mudança de status:", error);
    return { data: null, error };
  }
}

// Substituir a função criarPedidoNovo por esta versão corrigida:
export async function criarPedidoNovo(
  userId: string,
  revendedorId: number,
  items: any[],
  valorTotal: number,
  frete: number,
  tipoEntrega: string,
  metodoPagamento: string
) {
  try {
    console.log("Iniciando criação do pedido para usuário:", userId);
    console.log("Revendedor ID:", revendedorId);
    console.log("Items:", items);
    console.log("Valor Total:", valorTotal);
    console.log("Frete:", frete);
    console.log("Tipo de Entrega:", tipoEntrega);
    console.log("Método de Pagamento:", metodoPagamento);

    // Converter userId para número
    const clienteId = Number.parseInt(userId);

    // Buscar o usuario_id do revendedor baseado no revendedor_id
    const { data: revendedorUsuarioId, error: revendedorError } =
      await getUsuarioIdRevendedor(revendedorId);

    if (revendedorError || !revendedorUsuarioId) {
      throw new Error(
        "Erro ao buscar revendedor: " +
          (revendedorError?.message || "Revendedor não encontrado")
      );
    }

    console.log("Cliente ID:", clienteId);
    console.log("Revendedor ID:", revendedorId);
    console.log("Revendedor Usuario ID:", revendedorUsuarioId);

    // Gerar número do pedido único
    const numeroPedido = `PED-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;

    // Definir status inicial baseado no tipo de entrega
    const statusInicial =
      tipoEntrega === "retirada"
        ? "aguardando_preparacao"
        : "aguardando_aceite";

    // Criar o pedido usando o schema correto

    const user = await getUserInfo(clienteId.toString());
    console.log("User completo:", JSON.stringify(user, null, 2));

    if (!user.data) {
      throw new Error("Usuário não encontrado");
    }

    // Debug dos campos obrigatórios
    console.log("Validação dos campos obrigatórios:");
    console.log("- nome:", user.data?.nome);
    console.log("- email:", user.data?.email);
    console.log("- telefone:", user.data?.telefone);
    console.log("- cpf:", user.data?.cpf);

    const camposObrigatorios = {
      nome: user.data?.nome,
      email: user.data?.email,
      telefone: user.data?.telefone
    };

    const camposFaltando = Object.entries(camposObrigatorios)
      .filter(([campo, valor]) => !valor)
      .map(([campo]) => campo);

    if (camposFaltando.length > 0) {
      console.error("Campos obrigatórios faltando:", camposFaltando);
      throw new Error(`Dados do usuário incompletos. Campos faltando: ${camposFaltando.join(", ")}`);
    }

    // CPF é opcional - se não existir, usar um valor padrão
    const cpfParaUsar = user.data?.cpf || "00000000000"; // CPF padrão para casos sem CPF

    // Validar dados obrigatórios para criação do cliente no Asaas
    const dadosCliente = {
      name: user.data?.nome + " " + (user.data?.sobrenome || ""),
      email: user.data?.email,
      phone: user.data?.telefone || "11999999999",
      mobilePhone: user.data?.telefone || "11999999999",
      cpfCnpj: cpfParaUsar,
      postalCode: user.data?.cep || "01000-000",
      address: user.data?.rua || "Rua não informada",
      addressNumber: user.data?.numero || "S/N",
      complement: user.data?.complemento || "",
      province: user.data?.bairro || "Centro",
      city: user.data?.cidade || "São Paulo",
      state: user.data?.uf || "SP",
      externalReference: user.data?.id.toString(),
    };

    console.log("Dados do cliente para Asaas:", JSON.stringify(dadosCliente, null, 2));

    const cliente = await createOrUpdateCustomer(dadosCliente);

    console.log("Cliente criado:", cliente);

    // Validar se o cliente foi criado corretamente
    if (!cliente || !cliente.id) {
      console.error("Cliente não foi criado corretamente:", cliente);
      
      // Se há detalhes específicos do erro, mostrar para o usuário
      if (cliente && cliente.error && cliente.details) {
        const errorMessage = cliente.message || "Erro desconhecido do Asaas";
        const errorDetails = JSON.stringify(cliente.details, null, 2);
        console.error("Detalhes do erro do Asaas:", errorDetails);
        throw new Error(`Erro ao criar cliente no Asaas: ${errorMessage}. Detalhes: ${errorDetails}`);
      }
      
      throw new Error("Erro ao criar cliente no Asaas");
    }

    const pagamentoData: AsaasPayment = {
      billingType: metodoPagamento as
        | "BOLETO"
        | "CREDIT_CARD"
        | "PIX"
        | "UNDEFINED",
      customer: cliente.id,
      value: Math.round((Number(valorTotal) + Number(frete)) * 100) / 100, // Arredondar para 2 casas decimais
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      description: `Pedido #${numeroPedido}`,
      externalReference: numeroPedido,
    };

    if (metodoPagamento === "CREDIT_CARD") {
      pagamentoData.creditCard = {
        holderName: user.data.nome + " " + user.data.sobrenome,
        number: "4111111111111111",
        expiryMonth: "12",
        expiryYear: "2025",
        ccv: "123",
      };
      pagamentoData.installmentCount = 1;
      pagamentoData.totalValue = Number(valorTotal) + Number(frete);
      pagamentoData.installmentValue = Number(valorTotal) + Number(frete);
      pagamentoData.discount = {
        value: 0,
        dueDateLimitDays: 0,
        type: "FIXED",
      };
      pagamentoData.interest = {
        value: 0,
      };
      pagamentoData.fine = {
        value: 0,
      };
      pagamentoData.creditCardHolderInfo = {
        name: user.data.nome + " " + user.data.sobrenome,
        email: user.data.email,
        cpfCnpj: cpfParaUsar,
        postalCode: user.data.cep,
        addressNumber: user.data.numero,
        addressComplement: user.data.complemento || "",
        phone: user.data.telefone,
        mobilePhone: user.data.telefone,
      };
      pagamentoData.remoteIp = "127.0.0.1";
    }

    console.log("Dados do pagamento que serão enviados:", JSON.stringify(pagamentoData, null, 2));
    
    const pagamento = await createPayment(pagamentoData);

    console.log("Resposta completa do pagamento:", JSON.stringify(pagamento, null, 2));

    if (!pagamento) {
      throw new Error("Resposta vazia do Asaas - pagamento não foi criado");
    }

    if (pagamento.error) {
      console.error("Erro específico do Asaas:", pagamento.error);
      throw new Error(`Erro do Asaas: ${pagamento.error}`);
    }

    if (!pagamento.id) {
      console.error("Pagamento retornado sem ID:", pagamento);
      throw new Error("Erro ao criar pagamento no Asaas - ID não retornado");
    }

    let dadosPagamento = null;
    if (metodoPagamento === "PIX" || metodoPagamento === "BOLETO") {
      dadosPagamento = await getPixQrCode(pagamento.id);
      console.log("QR Code PIX:", dadosPagamento);
    }

    let pix = null;
    let boleto = null;

    if (dadosPagamento) {
      pix = dadosPagamento.pix;
      boleto = dadosPagamento.bankSlip;
    }

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert([
        {
          cliente_id: clienteId, // ID do usuário que fez a compra
          revendedor_id: revendedorUsuarioId, // ID do usuário revendedor (da tabela usuarios)
          numero: numeroPedido,
          frete: frete,
          valor_total: valorTotal,
          pagamento_tipo: metodoPagamento,
          tipo_entrega: tipoEntrega,
          status: "pendente", // Status de pagamento
          status_detalhado: statusInicial, // Status detalhado baseado no tipo de entrega
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pagamento_id: pagamento.id,
        },
      ])
      .select()
      .single();

    if (pedidoError) {
      console.error("Erro ao criar pedido:", pedidoError);
      throw pedidoError;
    }

    // Registrar o status inicial no histórico
    await registrarMudancaStatus(
      pedido.id,
      null,
      statusInicial,
      "Pedido criado",
      null
    );

    // Preparar itens para inserção com pacote_id correto para cada item
    const itensParaInserir = await Promise.all(
      items.map(async (item, index) => {
        // Buscar o pacote_id correto baseado no nome do produto
        const { data: pacoteId } = await getPacoteByProdutoNome(item.nome);

        const itemParaInserir = {
          pedido_id: pedido.id,
          pacote_id: pacoteId,
          qtd: Number(item.quantidade) || 0,
          valor_unitario: Number(item.preco) || 0,
        };

        console.log(`Item ${index + 1} preparado:`, itemParaInserir);
        console.log(`Produto: ${item.nome} -> Pacote ID: ${pacoteId}`);
        return itemParaInserir;
      })
    );

    console.log("Todos os itens preparados:", itensParaInserir);

    // Inserir os itens do pedido
    const { data: itensInseridos, error: itensError } = await supabase
      .from("pedido_itens")
      .insert(itensParaInserir)
      .select();

    if (itensError) {
      console.error("Erro detalhado ao inserir itens do pedido:", itensError);
      console.error("Dados que tentamos inserir:", itensParaInserir);
      throw itensError;
    }

    console.log("Itens inseridos com sucesso:", itensInseridos);
    console.log("Pagamento criado com sucesso:", pix);
    console.log("Pagamento criado com sucesso:", boleto);
    console.log("Pagamento criado com sucesso:", pagamento.id);

    return {
      data: pedido,
      pix,
      boleto,
      pagamentoId: pagamento.id,
      error: null,
    };
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return { data: null, error };
  }
}

// Função para atualizar status do pedido
export async function atualizarStatusPedido(
  pedidoId: number,
  novoStatus: string,
  dataEstimada?: string,
  observacoes?: string,
  updatedBy?: number
) {
  try {
    // Primeiro, buscar o status atual
    const { data: pedidoAtual, error: errorBusca } = await supabase
      .from("pedidos")
      .select("status_detalhado")
      .eq("id", pedidoId)
      .single();

    if (errorBusca) {
      throw errorBusca;
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {
      status_detalhado: novoStatus,
      updated_at: new Date().toISOString(),
    };

    if (dataEstimada) {
      dadosAtualizacao.data_estimada_entrega = dataEstimada;
    }

    if (observacoes) {
      dadosAtualizacao.observacoes_revendedor = observacoes;
    }

    // Se o status for "entregue" ou "retirado", definir data real
    if (novoStatus === "entregue" || novoStatus === "retirado") {
      dadosAtualizacao.data_entrega_real = new Date().toISOString();
    }

    // Atualizar o pedido
    const { data, error } = await supabase
      .from("pedidos")
      .update(dadosAtualizacao)
      .eq("id", pedidoId)
      .select();

    if (error) {
      throw error;
    }

    // Registrar mudança no histórico
    await registrarMudancaStatus(
      pedidoId,
      pedidoAtual.status_detalhado,
      novoStatus,
      observacoes,
      updatedBy
    );

    return { data, error: null };
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    return { data: null, error };
  }
}

export async function getPedidos(userId: string) {
  const { data, error } = await supabase
    .from("pedidos")
    .select(
      `
      *,
      itens_pedido:itens_pedido(
        *,
        produto:produtos(*)
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

// Substituir a função getPedidosCliente por esta versão corrigida:
export async function getPedidosCliente(userId: string) {
  try {
    console.log("Buscando pedidos para usuário:", userId);

    // Converter userId para número
    const clienteId = Number.parseInt(userId);

    // Buscar pedidos usando o cliente_id diretamente
    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select(
        `
        *,
        pedido_itens:pedido_itens(
          id,
          pedido_id,
          pacote_id,
          qtd,
          valor_unitario,
          pacotes:pacotes(id, descricao, cor, imagem)
        )
      `
      )
      .eq("cliente_id", clienteId) // Corrigido: cliente_id em vez de client_id
      .order("created_at", { ascending: false });

    console.log("Pedidos encontrados:", pedidos?.length || 0);

    if (pedidosError) {
      console.error("Erro ao buscar pedidos:", pedidosError);
      throw pedidosError;
    }

    return { data: pedidos || [], error: null };
  } catch (error) {
    console.error("Erro ao buscar pedidos do cliente:", error);
    return { data: [], error };
  }
}

// Função para buscar tamanhos de rodas disponíveis
export async function getTamanhos() {
  const { data, error } = await supabase
    .from("tamanhos")
    .select("id, nome")
    .order("nome", { ascending: true });

  return { data, error };
}

// Função para buscar alturas disponíveis com base no tamanho da roda
export async function getAlturasByTamanhoId(tamanhoId: string) {
  const { data, error } = await supabase
    .from("alturas")
    .select("id, valor")
    .eq("tamanho_id", tamanhoId)
    .order("valor", { ascending: true });

  // Remover duplicatas baseado no valor
  if (data && data.length > 0) {
    const uniqueAlturas = data.reduce((acc: any[], current) => {
      const exists = acc.find((item) => item.valor === current.valor);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    return { data: uniqueAlturas, error };
  }

  return { data, error };
}

// Função para buscar larguras based on altura_id
export async function getLargurasByAlturaId(alturaId: string) {
  console.log("🔍 Buscando larguras para alturaId:", alturaId);

  const { data, error } = await supabase
    .from("larguras")
    .select("id, valor")
    .eq("altura_id", alturaId)
    .order("valor", { ascending: true });

  // Remover duplicatas baseado no valor
  if (data && data.length > 0) {
    const uniqueLarguras = data.reduce((acc: any[], current) => {
      const exists = acc.find((item) => item.valor === current.valor);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    console.log("📏 Larguras únicas encontradas:", {
      data: uniqueLarguras,
      error,
    });
    return { data: uniqueLarguras, error };
  }

  console.log("📏 Larguras encontradas:", { data, error });
  return { data, error };
}

// Função para buscar package details by largura_id
export async function getPacoteByLarguraId(larguraId: string) {
  try {
    console.log("🔍 Buscando pacote para larguraId:", larguraId);

    const { data, error } = await supabase
      .from("pacotes")
      .select("*")
      .eq("largura_id", larguraId)
      .single();

    console.log("📦 Resultado da busca:", { data, error });

    if (error) {
      console.error("❌ Erro ao buscar pacote por largura_id:", error);
      // Fallback: retornar um pacote padrão
      return {
        data: {
          id: 1,
          nome: "LTP60",
          cor: "#4A4953",
        },
        error: null,
      };
    }

    if (!data) {
      console.log("Nenhum pacote encontrado para largura_id:", larguraId);
      // Fallback: retornar um pacote padrão
      return {
        data: {
          id: 1,
          nome: "LTP60",
          cor: "#4A4953",
        },
        error: null,
      };
    }

    // Ajustar dados se nome estiver null
    const pacoteAjustado = {
      id: data.id,
      nome: data.nome || data.descricao || "LTP60",
      cor: data.cor || "#949698", // Cor padrão baseada nos dados existentes
    };

    return { data: pacoteAjustado, error: null };
  } catch (error) {
    console.error("Erro ao buscar pacote:", error);
    // Fallback: retornar um pacote padrão
    return {
      data: {
        id: 1,
        nome: "LTP60",
        cor: "#4A4953",
      },
      error: null,
    };
  }
}

// ==================== FUNÇÕES DO CARRINHO ====================

// Buscar carrinho do usuário
export async function getCarrinhoUsuario(userId: string) {
  const { data, error } = await supabase
    .from("carrinho_usuarios")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

// Adicionar item ao carrinho
export async function adicionarItemCarrinho(
  userId: string,
  produtoNome: string,
  quantidade = 5,
  imagem?: string
) {
  // Ensure quantity is a multiple of 5 and at least 5
  const adjustedQuantity = Math.max(Math.round(quantidade / 5) * 5, 5);

  // Verificar se o item já existe no carrinho
  const { data: itemExistente, error: errorBusca } = await supabase
    .from("carrinho_usuarios")
    .select("*")
    .eq("user_id", userId)
    .eq("produto_nome", produtoNome)
    .single();

  if (errorBusca && errorBusca.code !== "PGRST116") {
    // PGRST116 = No rows found (esperado se item não existe)
    return { data: null, error: errorBusca };
  }

  if (itemExistente) {
    // Item já existe, adicionar 5 unidades
    const { data, error } = await supabase
      .from("carrinho_usuarios")
      .update({
        quantidade: itemExistente.quantidade + 5,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemExistente.id)
      .select();

    return { data, error };
  } else {
    // Item não existe, criar novo com quantidade ajustada
    const { data, error } = await supabase
      .from("carrinho_usuarios")
      .insert([
        {
          user_id: userId,
          produto_nome: produtoNome,
          quantidade: adjustedQuantity,
          imagem: imagem,
        },
      ])
      .select();

    return { data, error };
  }
}

// Atualizar quantidade de item no carrinho
export async function atualizarQuantidadeCarrinho(
  userId: string,
  produtoNome: string,
  quantidade: number
) {
  // Ensure quantity is a multiple of 5 and at least 5
  const adjustedQuantity = Math.max(Math.round(quantidade / 5) * 5, 5);

  const { data, error } = await supabase
    .from("carrinho_usuarios")
    .update({
      quantidade: adjustedQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("produto_nome", produtoNome)
    .select();

  return { data, error };
}

// Remover item do carrinho
export async function removerItemCarrinho(userId: string, produtoNome: string) {
  const { data, error } = await supabase
    .from("carrinho_usuarios")
    .delete()
    .eq("user_id", userId)
    .eq("produto_nome", produtoNome);

  return { data, error };
}

// Limpar carrinho do usuário
export async function limparCarrinhoUsuario(userId: string) {
  const { data, error } = await supabase
    .from("carrinho_usuarios")
    .delete()
    .eq("user_id", userId);

  return { data, error };
}

// Atualizar carrinho completo do usuário
export async function atualizarCarrinhoUsuario(userId: string, items: any[]) {
  try {
    // Primeiro, limpar o carrinho atual
    await limparCarrinhoUsuario(userId);

    // Se não há itens, apenas retornar sucesso
    if (!items || items.length === 0) {
      return { data: null, error: null };
    }

    // Inserir todos os novos itens
    const itensParaInserir = items.map((item) => ({
      user_id: userId,
      produto_nome: item.nome,
      quantidade: item.quantidade,
      imagem: item.imagem,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("carrinho_usuarios")
      .insert(itensParaInserir)
      .select();

    return { data, error };
  } catch (error) {
    console.error("Erro ao atualizar carrinho:", error);
    return { data: null, error };
  }
}

// ==================== FUNÇÕES DE REVENDEDORES E ESTOQUE ====================

// Buscar revendedores que possuem um produto específico em estoque
export async function getRevendedoresComProduto(produtoNome: string) {
  // Usando JOIN manual em vez de relacionamento
  const { data: estoque, error } = await supabase
    .from("revendedor_estoque")
    .select(
      `
      id,
      revendedor_id,
      produto,
      quantidade,
      preco,
      status
    `
    )
    .eq("produto", produtoNome)
    .gt("quantidade", 0); // Apenas com estoque disponível

  if (error) {
    return { data: null, error };
  }

  // Buscar informações dos revendedores
  const revendedorIds = estoque?.map((item) => item.revendedor_id) || [];

  if (revendedorIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: revendedores, error: revendedoresError } = await supabase
    .from("revendedores")
    .select(
      `
      id,
      usuario_id,
      loja,
      cidade,
      uf,
      frete,
      vendas,
      status
    `
    )
    .in("id", revendedorIds);

  if (revendedoresError) {
    return { data: null, error: revendedoresError };
  }

  // Combinar os dados
  const resultado =
    estoque
      ?.map((item) => {
        const revendedor = revendedores?.find(
          (r) => r.id === item.revendedor_id
        );
        return {
          ...item,
          revendedor: revendedor || null,
        };
      })
      .filter((item) => item.revendedor !== null) || [];

  // Ordenar por preço
  resultado.sort((a, b) => a.preco - b.preco);

  return { data: resultado, error: null };
}

// Buscar revendedores para múltiplos produtos
export async function getRevendedoresParaProdutos(produtoNomes: string[]) {
  if (!produtoNomes.length) return { data: {}, error: null };

  // Buscar todos os produtos de uma vez
  const { data: estoque, error } = await supabase
    .from("revendedor_estoque")
    .select(
      `
      id,
      revendedor_id,
      produto,
      quantidade,
      preco,
      status
    `
    )
    .in("produto", produtoNomes)
    .gt("quantidade", 0); // Apenas com estoque disponível

  if (error) {
    return { data: {}, error };
  }

  if (!estoque || estoque.length === 0) {
    return { data: {}, error: null };
  }

  // Buscar informações dos revendedores
  const revendedorIds = [...new Set(estoque.map((item) => item.revendedor_id))];

  const { data: revendedores, error: revendedoresError } = await supabase
    .from("revendedores")
    .select(
      `
      id,
      usuario_id,
      loja,
      cidade,
      uf,
      frete,
      vendas,
      status
    `
    )
    .in("id", revendedorIds);

  if (revendedoresError) {
    return { data: {}, error: revendedoresError };
  }

  // Combinar os dados e agrupar por produto
  const produtosAgrupados: Record<string, any[]> = {};

  produtoNomes.forEach((produtoNome) => {
    const produtoEstoque = estoque
      .filter((item) => item.produto === produtoNome)
      .map((item) => {
        const revendedor = revendedores?.find(
          (r) => r.id === item.revendedor_id
        );
        return revendedor ? { ...item, revendedor } : null;
      })
      .filter((item) => item !== null);

    // Ordenar por preço
    produtoEstoque.sort((a, b) => a.preco - b.preco);

    produtosAgrupados[produtoNome] = produtoEstoque;
  });

  return { data: produtosAgrupados, error: null };
}

// Buscar informações do usuário
export async function getUserInfo(userId: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select(
      "id, nome, sobrenome, email, cpf, telefone, cidade, uf, cep, rua, bairro, complemento, numero"
    )
    .eq("id", userId)
    .single();

  return { data, error };
}

// Função para buscar usuario_id do revendedor baseado no revendedor_id
export async function getUsuarioIdRevendedor(revendedorId: number) {
  try {
    const { data, error } = await supabase
      .from("revendedores")
      .select("usuario_id")
      .eq("id", revendedorId)
      .single();

    if (error) {
      console.error("Erro ao buscar usuario_id do revendedor:", error);
      return { data: null, error };
    }

    return { data: data.usuario_id, error: null };
  } catch (error) {
    console.error("Erro ao buscar usuario_id do revendedor:", error);
    return { data: null, error };
  }
}

export async function checkStatusPedido(id: string) {
  try {
    console.log("Verificando status do pagamento:", id);

    if (!id) {
      throw new Error("ID do pagamento não encontrado");
    }

    const status = await checkPaymentStatus(id);

    console.log("Status do pagamento:", status);

    return { data: status, error: null };
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    return { data: null, error };
  }
}

export async function cancelarPedido(id: string) {
  try {
    console.log("Cancelando pedido:", id);

    if (!id) {
      throw new Error("ID do pagamento não encontrado");
    }

    const response = await cancelPayment(id);

    console.log("Status do pagamento:", response);

    return { data: response, error: null };
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    return { data: null, error };
  }
}

// ==================== FUNÇÕES DE NOTIFICAÇÕES ====================

// Interface para notificações
export interface Notificacao {
  id: number;
  usuario_id: number;
  pedido_id?: number;
  titulo: string;
  mensagem: string;
  tipo: "info" | "success" | "warning" | "error";
  lida: boolean;
  created_at: string;
  updated_at: string;
}

// Buscar notificações do usuário
export async function getNotificacoesUsuario(userId: string, apenasNaoLidas = false) {
  try {
    let query = supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", parseInt(userId))
      .order("created_at", { ascending: false });

    if (apenasNaoLidas) {
      query = query.eq("lida", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar notificações:", error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Erro ao buscar notificações do usuário:", error);
    return { data: [], error };
  }
}

// Contar notificações não lidas
export async function contarNotificacoesNaoLidas(userId: string) {
  try {
    const { count, error } = await supabase
      .from("notificacoes")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", parseInt(userId))
      .eq("lida", false);

    if (error) {
      console.error("Erro ao contar notificações não lidas:", error);
      return { data: 0, error };
    }

    return { data: count || 0, error: null };
  } catch (error) {
    console.error("Erro ao contar notificações não lidas:", error);
    return { data: 0, error };
  }
}

// Marcar notificação como lida
export async function marcarNotificacaoComoLida(notificacaoId: number) {
  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .update({ 
        lida: true, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", notificacaoId)
      .select();

    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return { data: null, error };
  }
}

// Marcar todas as notificações como lidas
export async function marcarTodasNotificacoesComoLidas(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .update({ 
        lida: true, 
        updated_at: new Date().toISOString() 
      })
      .eq("usuario_id", parseInt(userId))
      .eq("lida", false)
      .select();

    if (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Erro ao marcar todas as notificações como lidas:", error);
    return { data: null, error };
  }
}

// Criar nova notificação
export async function criarNotificacao(
  usuarioId: number,
  titulo: string,
  mensagem: string,
  tipo: "info" | "success" | "warning" | "error" = "info",
  pedidoId?: number
) {
  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .insert([{
        usuario_id: usuarioId,
        pedido_id: pedidoId,
        titulo,
        mensagem,
        tipo,
        lida: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error("Erro ao criar notificação:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    return { data: null, error };
  }
}
