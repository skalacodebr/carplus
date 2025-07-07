import { supabase } from "./supabase"

// Funções para produtos
export async function getProdutos() {
  const { data, error } = await supabase.from("produtos").select("*").order("created_at", { ascending: false })

  return { data, error }
}

export async function getProduto(id: string) {
  const { data, error } = await supabase.from("produtos").select("*").eq("id", id).single()

  return { data, error }
}

// Funções para cálculos
export async function salvarCalculo(
  tamanhoRoda: string,
  altura: string,
  largura: string,
  resultado: string,
  cor: string,
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
    .select()

  return { data, error }
}

// Nova função para salvar cálculos do usuário com limite de 10
export async function salvarCalculoUsuario(
  userId: string,
  tamanho: string,
  altura: string,
  largura: string,
  pacote: string,
) {
  try {
    // 1. Verificar quantos cálculos o usuário já tem
    const { data: calculos, error: contarError } = await supabase
      .from("calculo_usuarios")
      .select("id, created_at")
      .eq("userid", userId)
      .order("created_at", { ascending: true })

    if (contarError) {
      console.error("Erro ao contar cálculos do usuário:", contarError)
      return { data: null, error: contarError }
    }

    // 2. Se já tiver 10 ou mais, excluir o mais antigo
    if (calculos && calculos.length >= 10) {
      const calculoMaisAntigo = calculos[0]
      const { error: deleteError } = await supabase.from("calculo_usuarios").delete().eq("id", calculoMaisAntigo.id)

      if (deleteError) {
        console.error("Erro ao excluir cálculo mais antigo:", deleteError)
        return { data: null, error: deleteError }
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
      .select()

    if (error) {
      console.error("Erro ao salvar cálculo do usuário:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Erro ao salvar cálculo do usuário:", error)
    return { data: null, error }
  }
}

// Função para obter os cálculos do usuário
export async function getCalculosUsuario(userId: string) {
  const { data, error } = await supabase
    .from("calculo_usuarios")
    .select("*")
    .eq("userid", userId)
    .order("created_at", { ascending: false })

  return { data, error }
}

export async function getCalculos(userId: string) {
  const { data, error } = await supabase
    .from("calculos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return { data, error }
}

// Funções para pedidos
export async function criarPedido(
  userId: string,
  items: any[],
  total: number,
  tipoEntrega = "retirada",
  metodoPagamento = "cartao",
  dadosAdicionais: any = {},
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
      .single()

    if (pedidoError) throw pedidoError

    // Inserir os itens do pedido
    const itens = items.map((item) => ({
      pedido_id: pedido.id,
      produto_nome: item.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      revendedor_id: item.revendedor_id,
    }))

    const { error: itensError } = await supabase.from("itens_pedido").insert(itens)

    if (itensError) throw itensError

    return { data: pedido, error: null }
  } catch (error) {
    console.error("Erro ao criar pedido:", error)
    return { data: null, error }
  }
}

// Remover as funções getClienteByUsuarioId e garantirCliente que estavam criando uma tabela clientes desnecessária

// Função para buscar pacote baseado no nome do produto
export async function getPacoteByProdutoNome(produtoNome: string) {
  try {
    // Mapear nomes de produtos para pacotes
    // Você pode ajustar essa lógica conforme sua regra de negócio
    const mapeamentoProdutos: Record<string, number> = {
      "Microesferas Azul": 1,
      "Microesferas Vermelha": 2,
      "Microesferas Verde": 3,
      "Microesferas Amarela": 4,
      "Microesferas Preta": 5,
      "Microesferas Branca": 6,
    }

    // Se existe um mapeamento direto, usar ele
    if (mapeamentoProdutos[produtoNome]) {
      return { data: mapeamentoProdutos[produtoNome], error: null }
    }

    // Caso contrário, tentar buscar por nome similar
    const { data: pacotes, error } = await supabase
      .from("pacotes")
      .select("id, nome, cor")
      .ilike("nome", `%${produtoNome}%`)
      .limit(1)

    if (error) {
      console.error("Erro ao buscar pacote por nome:", error)
      return { data: 1, error: null } // Fallback para ID 1
    }

    if (pacotes && pacotes.length > 0) {
      return { data: pacotes[0].id, error: null }
    }

    // Se não encontrou nada, tentar buscar por cor
    const cores = ["azul", "vermelha", "verde", "amarela", "preta", "branca"]
    for (const cor of cores) {
      if (produtoNome.toLowerCase().includes(cor)) {
        const { data: pacotePorCor, error: errorCor } = await supabase
          .from("pacotes")
          .select("id")
          .ilike("cor", `%${cor}%`)
          .limit(1)

        if (!errorCor && pacotePorCor && pacotePorCor.length > 0) {
          return { data: pacotePorCor[0].id, error: null }
        }
      }
    }

    // Fallback final
    return { data: 1, error: null }
  } catch (error) {
    console.error("Erro ao buscar pacote:", error)
    return { data: 1, error: null }
  }
}

// Função para buscar um pacote válido (por enquanto retorna o primeiro disponível)
export async function getPacoteValido() {
  try {
    const { data: pacotes, error } = await supabase.from("pacotes").select("id").limit(1)

    if (error) {
      console.error("Erro ao buscar pacote:", error)
      return 1 // Fallback para ID 1
    }

    return pacotes && pacotes.length > 0 ? pacotes[0].id : 1
  } catch (error) {
    console.error("Erro ao buscar pacote:", error)
    return 1 // Fallback para ID 1
  }
}

// Função para registrar mudança de status no histórico
export async function registrarMudancaStatus(
  pedidoId: number,
  statusAnterior: string | null,
  statusNovo: string,
  observacao?: string,
  updatedBy?: number,
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
      .select()

    if (error) {
      console.error("Erro ao registrar mudança de status:", error)
    }

    return { data, error }
  } catch (error) {
    console.error("Erro ao registrar mudança de status:", error)
    return { data: null, error }
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
  metodoPagamento: string,
) {
  try {
    console.log("Iniciando criação do pedido para usuário:", userId)

    // Converter userId para número
    const clienteId = Number.parseInt(userId)

    // Buscar o usuario_id do revendedor baseado no revendedor_id
    const { data: revendedorUsuarioId, error: revendedorError } = await getUsuarioIdRevendedor(revendedorId)

    if (revendedorError || !revendedorUsuarioId) {
      throw new Error("Erro ao buscar revendedor: " + (revendedorError?.message || "Revendedor não encontrado"))
    }

    console.log("Cliente ID:", clienteId)
    console.log("Revendedor ID:", revendedorId)
    console.log("Revendedor Usuario ID:", revendedorUsuarioId)

    // Gerar número do pedido único
    const numeroPedido = `PED-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Definir status inicial baseado no tipo de entrega
    const statusInicial = tipoEntrega === "retirada" ? "aguardando_preparacao" : "aguardando_aceite"

    // Criar o pedido usando o schema correto
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
          status: "pago", // Status de pagamento
          status_detalhado: statusInicial, // Status detalhado baseado no tipo de entrega
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (pedidoError) {
      console.error("Erro ao criar pedido:", pedidoError)
      throw pedidoError
    }

    console.log("Pedido criado com sucesso:", pedido)

    // Registrar o status inicial no histórico
    await registrarMudancaStatus(pedido.id, null, statusInicial, "Pedido criado", null)

    // Preparar itens para inserção com pacote_id correto para cada item
    const itensParaInserir = await Promise.all(
      items.map(async (item, index) => {
        // Buscar o pacote_id correto baseado no nome do produto
        const { data: pacoteId } = await getPacoteByProdutoNome(item.nome)

        const itemParaInserir = {
          pedido_id: pedido.id,
          pacote_id: pacoteId,
          qtd: Number(item.quantidade) || 0,
          valor_unitario: Number(item.preco) || 0,
        }

        console.log(`Item ${index + 1} preparado:`, itemParaInserir)
        console.log(`Produto: ${item.nome} -> Pacote ID: ${pacoteId}`)
        return itemParaInserir
      }),
    )

    console.log("Todos os itens preparados:", itensParaInserir)

    // Inserir os itens do pedido
    const { data: itensInseridos, error: itensError } = await supabase
      .from("pedido_itens")
      .insert(itensParaInserir)
      .select()

    if (itensError) {
      console.error("Erro detalhado ao inserir itens do pedido:", itensError)
      console.error("Dados que tentamos inserir:", itensParaInserir)
      throw itensError
    }

    console.log("Itens inseridos com sucesso:", itensInseridos)

    return { data: pedido, error: null }
  } catch (error) {
    console.error("Erro ao criar pedido:", error)
    return { data: null, error }
  }
}

// Função para atualizar status do pedido
export async function atualizarStatusPedido(
  pedidoId: number,
  novoStatus: string,
  dataEstimada?: string,
  observacoes?: string,
  updatedBy?: number,
) {
  try {
    // Primeiro, buscar o status atual
    const { data: pedidoAtual, error: errorBusca } = await supabase
      .from("pedidos")
      .select("status_detalhado")
      .eq("id", pedidoId)
      .single()

    if (errorBusca) {
      throw errorBusca
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {
      status_detalhado: novoStatus,
      updated_at: new Date().toISOString(),
    }

    if (dataEstimada) {
      dadosAtualizacao.data_estimada_entrega = dataEstimada
    }

    if (observacoes) {
      dadosAtualizacao.observacoes_revendedor = observacoes
    }

    // Se o status for "entregue" ou "retirado", definir data real
    if (novoStatus === "entregue" || novoStatus === "retirado") {
      dadosAtualizacao.data_entrega_real = new Date().toISOString()
    }

    // Atualizar o pedido
    const { data, error } = await supabase.from("pedidos").update(dadosAtualizacao).eq("id", pedidoId).select()

    if (error) {
      throw error
    }

    // Registrar mudança no histórico
    await registrarMudancaStatus(pedidoId, pedidoAtual.status_detalhado, novoStatus, observacoes, updatedBy)

    return { data, error: null }
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error)
    return { data: null, error }
  }
}

export async function getPedidos(userId: string) {
  const { data, error } = await supabase
    .from("pedidos")
    .select(`
      *,
      itens_pedido:itens_pedido(
        *,
        produto:produtos(*)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return { data, error }
}

// Substituir a função getPedidosCliente por esta versão corrigida:
export async function getPedidosCliente(userId: string) {
  try {
    console.log("Buscando pedidos para usuário:", userId)

    // Converter userId para número
    const clienteId = Number.parseInt(userId)

    // Buscar pedidos usando o cliente_id diretamente
    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select(`
        *,
        pedido_itens:pedido_itens(
          id,
          pedido_id,
          pacote_id,
          qtd,
          valor_unitario,
          pacotes:pacotes(id, nome, cor, imagem)
        )
      `)
      .eq("cliente_id", clienteId) // Corrigido: cliente_id em vez de client_id
      .order("created_at", { ascending: false })

    console.log("Pedidos encontrados:", pedidos?.length || 0)

    if (pedidosError) {
      console.error("Erro ao buscar pedidos:", pedidosError)
      throw pedidosError
    }

    return { data: pedidos || [], error: null }
  } catch (error) {
    console.error("Erro ao buscar pedidos do cliente:", error)
    return { data: [], error }
  }
}

// Função para buscar tamanhos de rodas disponíveis
export async function getTamanhos() {
  const { data, error } = await supabase.from("tamanhos").select("id, nome").order("nome", { ascending: true })

  return { data, error }
}

// Função para buscar alturas disponíveis com base no tamanho da roda
export async function getAlturasByTamanhoId(tamanhoId: string) {
  const { data, error } = await supabase
    .from("alturas")
    .select("id, valor")
    .eq("tamanho_id", tamanhoId)
    .order("valor", { ascending: true })

  return { data, error }
}

// Função para buscar larguras based on altura_id
export async function getLargurasByAlturaId(alturaId: string) {
  const { data, error } = await supabase
    .from("larguras")
    .select("id, valor")
    .eq("altura_id", alturaId)
    .order("valor", { ascending: true })

  return { data, error }
}

// Função para buscar package details by largura_id
export async function getPacoteByLarguraId(larguraId: string) {
  try {
    const { data, error } = await supabase.from("pacotes").select("id, nome, cor").eq("largura_id", larguraId).single()

    if (error) {
      console.error("Erro ao buscar pacote por largura_id:", error)
      // Fallback: retornar um pacote padrão
      return {
        data: {
          id: 1,
          nome: "LTP60",
          cor: "#4A4953",
        },
        error: null,
      }
    }

    if (!data) {
      console.log("Nenhum pacote encontrado para largura_id:", larguraId)
      // Fallback: retornar um pacote padrão
      return {
        data: {
          id: 1,
          nome: "LTP60",
          cor: "#4A4953",
        },
        error: null,
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Erro ao buscar pacote:", error)
    // Fallback: retornar um pacote padrão
    return {
      data: {
        id: 1,
        nome: "LTP60",
        cor: "#4A4953",
      },
      error: null,
    }
  }
}

// ==================== FUNÇÕES DO CARRINHO ====================

// Buscar carrinho do usuário
export async function getCarrinhoUsuario(userId: string) {
  const { data, error } = await supabase
    .from("carrinho_usuarios")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return { data, error }
}

// Adicionar item ao carrinho
export async function adicionarItemCarrinho(userId: string, produtoNome: string, quantidade = 5, imagem?: string) {
  // Ensure quantity is a multiple of 5 and at least 5
  const adjustedQuantity = Math.max(Math.round(quantidade / 5) * 5, 5)

  // Verificar se o item já existe no carrinho
  const { data: itemExistente, error: errorBusca } = await supabase
    .from("carrinho_usuarios")
    .select("*")
    .eq("user_id", userId)
    .eq("produto_nome", produtoNome)
    .single()

  if (errorBusca && errorBusca.code !== "PGRST116") {
    // PGRST116 = No rows found (esperado se item não existe)
    return { data: null, error: errorBusca }
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
      .select()

    return { data, error }
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
      .select()

    return { data, error }
  }
}

// Atualizar quantidade de item no carrinho
export async function atualizarQuantidadeCarrinho(userId: string, produtoNome: string, quantidade: number) {
  // Ensure quantity is a multiple of 5 and at least 5
  const adjustedQuantity = Math.max(Math.round(quantidade / 5) * 5, 5)

  const { data, error } = await supabase
    .from("carrinho_usuarios")
    .update({
      quantidade: adjustedQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("produto_nome", produtoNome)
    .select()

  return { data, error }
}

// Remover item do carrinho
export async function removerItemCarrinho(userId: string, produtoNome: string) {
  const { data, error } = await supabase
    .from("carrinho_usuarios")
    .delete()
    .eq("user_id", userId)
    .eq("produto_nome", produtoNome)

  return { data, error }
}

// Limpar carrinho do usuário
export async function limparCarrinhoUsuario(userId: string) {
  const { data, error } = await supabase.from("carrinho_usuarios").delete().eq("user_id", userId)

  return { data, error }
}

// ==================== FUNÇÕES DE REVENDEDORES E ESTOQUE ====================

// Buscar revendedores que possuem um produto específico em estoque
export async function getRevendedoresComProduto(produtoNome: string) {
  // Usando JOIN manual em vez de relacionamento
  const { data: estoque, error } = await supabase
    .from("revendedor_estoque")
    .select(`
      id,
      revendedor_id,
      produto,
      quantidade,
      preco,
      status
    `)
    .eq("produto", produtoNome)
    .gt("quantidade", 0) // Apenas com estoque disponível

  if (error) {
    return { data: null, error }
  }

  // Buscar informações dos revendedores
  const revendedorIds = estoque?.map((item) => item.revendedor_id) || []

  if (revendedorIds.length === 0) {
    return { data: [], error: null }
  }

  const { data: revendedores, error: revendedoresError } = await supabase
    .from("revendedores")
    .select(`
      id,
      usuario_id,
      loja,
      cidade,
      uf,
      frete,
      vendas,
      status
    `)
    .in("id", revendedorIds)

  if (revendedoresError) {
    return { data: null, error: revendedoresError }
  }

  // Combinar os dados
  const resultado =
    estoque
      ?.map((item) => {
        const revendedor = revendedores?.find((r) => r.id === item.revendedor_id)
        return {
          ...item,
          revendedor: revendedor || null,
        }
      })
      .filter((item) => item.revendedor !== null) || []

  // Ordenar por preço
  resultado.sort((a, b) => a.preco - b.preco)

  return { data: resultado, error: null }
}

// Buscar revendedores para múltiplos produtos
export async function getRevendedoresParaProdutos(produtoNomes: string[]) {
  if (!produtoNomes.length) return { data: {}, error: null }

  // Buscar todos os produtos de uma vez
  const { data: estoque, error } = await supabase
    .from("revendedor_estoque")
    .select(`
      id,
      revendedor_id,
      produto,
      quantidade,
      preco,
      status
    `)
    .in("produto", produtoNomes)
    .gt("quantidade", 0) // Apenas com estoque disponível

  if (error) {
    return { data: {}, error }
  }

  if (!estoque || estoque.length === 0) {
    return { data: {}, error: null }
  }

  // Buscar informações dos revendedores
  const revendedorIds = [...new Set(estoque.map((item) => item.revendedor_id))]

  const { data: revendedores, error: revendedoresError } = await supabase
    .from("revendedores")
    .select(`
      id,
      usuario_id,
      loja,
      cidade,
      uf,
      frete,
      vendas,
      status
    `)
    .in("id", revendedorIds)

  if (revendedoresError) {
    return { data: {}, error: revendedoresError }
  }

  // Combinar os dados e agrupar por produto
  const produtosAgrupados: Record<string, any[]> = {}

  produtoNomes.forEach((produtoNome) => {
    const produtoEstoque = estoque
      .filter((item) => item.produto === produtoNome)
      .map((item) => {
        const revendedor = revendedores?.find((r) => r.id === item.revendedor_id)
        return revendedor ? { ...item, revendedor } : null
      })
      .filter((item) => item !== null)

    // Ordenar por preço
    produtoEstoque.sort((a, b) => a.preco - b.preco)

    produtosAgrupados[produtoNome] = produtoEstoque
  })

  return { data: produtosAgrupados, error: null }
}

// Buscar informações do usuário
export async function getUserInfo(userId: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, cidade, uf, cep, rua, bairro, complemento, numero")
    .eq("id", userId)
    .single()

  return { data, error }
}

// Função para buscar usuario_id do revendedor baseado no revendedor_id
export async function getUsuarioIdRevendedor(revendedorId: number) {
  try {
    const { data, error } = await supabase.from("revendedores").select("usuario_id").eq("id", revendedorId).single()

    if (error) {
      console.error("Erro ao buscar usuario_id do revendedor:", error)
      return { data: null, error }
    }

    return { data: data.usuario_id, error: null }
  } catch (error) {
    console.error("Erro ao buscar usuario_id do revendedor:", error)
    return { data: null, error }
  }
}
