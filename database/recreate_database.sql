-- =====================================================
-- SCRIPT DE RECRIAÇÃO DO BANCO DE DADOS - CARPLUS
-- =====================================================
-- Este script recria toda a estrutura do banco de dados
-- unificando os 3 projetos: Cliente, Revendedor e Admin
-- =====================================================

-- Remover tabelas existentes (se necessário)
-- CUIDADO: Este comando apaga todos os dados!
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- =====================================================
-- 1. TABELAS BASE (sem dependências)
-- =====================================================

-- Tabela central de usuários (todos os tipos)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- SHA-256 hash
    telefone VARCHAR(20),
    cpf VARCHAR(14),
    tipo VARCHAR(20) DEFAULT 'cliente' CHECK (tipo IN ('admin', 'revendedor', 'cliente', 'usuario')),
    foto TEXT,
    cep VARCHAR(10),
    rua VARCHAR(200),
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de pacotes/produtos (unificada)
CREATE TABLE pacotes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0,
    cor VARCHAR(7), -- Código hexadecimal #FFFFFF
    imagem TEXT,
    descricao TEXT,
    estoque INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de tamanhos de rodas
CREATE TABLE tamanhos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. TABELAS DEPENDENTES NÍVEL 1
-- =====================================================

-- Tabela específica de revendedores
CREATE TABLE revendedores (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    loja VARCHAR(150),
    cidade VARCHAR(100),
    uf VARCHAR(2),
    rua VARCHAR(200),
    complemento VARCHAR(100),
    vendas INTEGER DEFAULT 0,
    frete DECIMAL(10,2) DEFAULT 0,
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de alturas (dependente de tamanhos)
CREATE TABLE alturas (
    id SERIAL PRIMARY KEY,
    tamanho_id INTEGER NOT NULL REFERENCES tamanhos(id) ON DELETE CASCADE,
    valor VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de controle de estoque por revendedor
CREATE TABLE revendedor_estoque (
    id SERIAL PRIMARY KEY,
    revendedor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    pacote_id INTEGER NOT NULL REFERENCES pacotes(id) ON DELETE CASCADE,
    produto VARCHAR(100), -- Nome do produto (compatibilidade)
    quantidade INTEGER DEFAULT 0,
    preco DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'ativo',
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(revendedor_id, pacote_id)
);

-- Tabela de relacionamento cliente-revendedor
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    revendedor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(revendedor_id, cliente_id)
);

-- Tabela de carrinho de usuários
CREATE TABLE carrinho_usuarios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    produto_nome VARCHAR(100) NOT NULL,
    quantidade INTEGER DEFAULT 5,
    imagem TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. TABELAS DEPENDENTES NÍVEL 2
-- =====================================================

-- Tabela de larguras (dependente de alturas)
CREATE TABLE larguras (
    id SERIAL PRIMARY KEY,
    altura_id INTEGER NOT NULL REFERENCES alturas(id) ON DELETE CASCADE,
    valor VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE,
    cliente_id INTEGER NOT NULL REFERENCES usuarios(id),
    revendedor_id INTEGER NOT NULL REFERENCES usuarios(id),
    total DECIMAL(10,2) DEFAULT 0, -- Compatibilidade com projeto cliente
    frete DECIMAL(10,2) DEFAULT 0,
    valor_total DECIMAL(10,2) NOT NULL,
    tipo_entrega VARCHAR(20) DEFAULT 'retirada' CHECK (tipo_entrega IN ('retirada', 'entrega')),
    pagamento_tipo VARCHAR(30) DEFAULT 'cartao',
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    status_detalhado VARCHAR(50) DEFAULT 'aguardando_preparacao' CHECK (
        status_detalhado IN (
            'aguardando_preparacao', 'preparando_pedido', 'pronto_para_retirada', 'retirado',
            'aguardando_aceite', 'aceito', 'cancelado', 'a_caminho', 'entregue'
        )
    ),
    repasse_status VARCHAR(20) DEFAULT 'pendente' CHECK (repasse_status IN ('pendente', 'pago', 'processando')),
    data_estimada_entrega TIMESTAMP,
    data_entrega_real TIMESTAMP,
    observacoes_revendedor TEXT,
    dados_adicionais JSONB, -- Endereço alternativo, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de repasses
CREATE TABLE repasses (
    id SERIAL PRIMARY KEY,
    revendedor_id INTEGER NOT NULL REFERENCES usuarios(id),
    valor_total DECIMAL(10,2) NOT NULL,
    pedidos TEXT[], -- Array com IDs dos pedidos (compatibilidade)
    transferencia_id VARCHAR(255), -- ID da transferência no Asaas
    metodo_pagamento VARCHAR(50),
    comprovante_url TEXT,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
    data_repasse TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de cálculos de usuários
CREATE TABLE calculo_usuarios (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tamanho VARCHAR(20),
    altura VARCHAR(20),
    largura VARCHAR(20),
    pacote VARCHAR(100),
    resultado TEXT, -- Compatibilidade
    cor VARCHAR(7), -- Compatibilidade
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. TABELAS DEPENDENTES NÍVEL 3
-- =====================================================

-- Atualizar referência de largura em pacotes
ALTER TABLE pacotes ADD COLUMN largura_id INTEGER REFERENCES larguras(id);

-- Tabela de itens de pedidos (unificada)
CREATE TABLE pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    pacote_id INTEGER REFERENCES pacotes(id),
    produto_nome VARCHAR(100), -- Compatibilidade com projeto cliente
    qtd INTEGER NOT NULL DEFAULT 1,
    quantidade INTEGER, -- Compatibilidade
    valor_unitario DECIMAL(10,2) NOT NULL,
    preco_unitario DECIMAL(10,2), -- Compatibilidade
    revendedor_id INTEGER REFERENCES usuarios(id), -- Compatibilidade
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de detalhamento de repasses
CREATE TABLE repasse_itens (
    id SERIAL PRIMARY KEY,
    repasse_id INTEGER NOT NULL REFERENCES repasses(id) ON DELETE CASCADE,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
    valor_repassado DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de histórico de status de pedidos
CREATE TABLE pedido_historico_status (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    observacao TEXT,
    updated_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices únicos
CREATE UNIQUE INDEX idx_usuarios_email ON usuarios(email);
CREATE UNIQUE INDEX idx_pedidos_numero ON pedidos(numero);

-- Índices de busca frequente
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_cidade_uf ON usuarios(cidade, uf);

CREATE INDEX idx_revendedores_usuario_id ON revendedores(usuario_id);
CREATE INDEX idx_revendedores_status ON revendedores(status);
CREATE INDEX idx_revendedores_cidade_uf ON revendedores(cidade, uf);

CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_revendedor_id ON pedidos(revendedor_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_status_detalhado ON pedidos(status_detalhado);
CREATE INDEX idx_pedidos_repasse_status ON pedidos(repasse_status);
CREATE INDEX idx_pedidos_created_at ON pedidos(created_at);

CREATE INDEX idx_pedido_itens_pedido_id ON pedido_itens(pedido_id);
CREATE INDEX idx_pedido_itens_pacote_id ON pedido_itens(pacote_id);

CREATE INDEX idx_repasses_revendedor_id ON repasses(revendedor_id);
CREATE INDEX idx_repasses_status ON repasses(status);
CREATE INDEX idx_repasses_data_repasse ON repasses(data_repasse);

CREATE INDEX idx_repasse_itens_repasse_id ON repasse_itens(repasse_id);
CREATE INDEX idx_repasse_itens_pedido_id ON repasse_itens(pedido_id);

CREATE INDEX idx_revendedor_estoque_revendedor_id ON revendedor_estoque(revendedor_id);
CREATE INDEX idx_revendedor_estoque_pacote_id ON revendedor_estoque(pacote_id);

CREATE INDEX idx_clientes_revendedor_id ON clientes(revendedor_id);
CREATE INDEX idx_clientes_cliente_id ON clientes(cliente_id);

CREATE INDEX idx_carrinho_user_id ON carrinho_usuarios(user_id);

CREATE INDEX idx_calculo_usuarios_userid ON calculo_usuarios(userid);
CREATE INDEX idx_calculo_usuarios_created_at ON calculo_usuarios(created_at);

CREATE INDEX idx_alturas_tamanho_id ON alturas(tamanho_id);
CREATE INDEX idx_larguras_altura_id ON larguras(altura_id);

-- =====================================================
-- 6. TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revendedores_updated_at BEFORE UPDATE ON revendedores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repasses_updated_at BEFORE UPDATE ON repasses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carrinho_updated_at BEFORE UPDATE ON carrinho_usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estoque_updated_at BEFORE UPDATE ON revendedor_estoque 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de pedido único
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero IS NULL THEN
        NEW.numero := 'PED-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_gerar_numero_pedido 
    BEFORE INSERT ON pedidos 
    FOR EACH ROW EXECUTE FUNCTION gerar_numero_pedido();

-- =====================================================
-- 7. DADOS INICIAIS (SEEDS)
-- =====================================================

-- Usuário administrador padrão
INSERT INTO usuarios (nome, sobrenome, email, senha, tipo) VALUES 
('Admin', 'Sistema', 'admin@carplus.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin');

-- Tamanhos de rodas padrão
INSERT INTO tamanhos (nome) VALUES 
('13'), ('14'), ('15'), ('16'), ('17'), ('18'), ('19'), ('20');

-- Pacotes padrão
INSERT INTO pacotes (nome, preco, cor, imagem) VALUES 
('LTP60 Azul', 39.90, '#0066CC', 'https://exemplo.com/azul.jpg'),
('LTP60 Vermelho', 39.90, '#CC0000', 'https://exemplo.com/vermelho.jpg'),
('LTP60 Verde', 39.90, '#00CC66', 'https://exemplo.com/verde.jpg'),
('LTP60 Amarelo', 39.90, '#FFCC00', 'https://exemplo.com/amarelo.jpg'),
('LTP60 Preto', 39.90, '#000000', 'https://exemplo.com/preto.jpg'),
('LTP60 Branco', 39.90, '#FFFFFF', 'https://exemplo.com/branco.jpg');

-- =====================================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE usuarios IS 'Tabela central com todos os usuários do sistema (admin, revendedor, cliente)';
COMMENT ON TABLE revendedores IS 'Informações específicas dos revendedores';
COMMENT ON TABLE pacotes IS 'Catálogo de pacotes/produtos disponíveis';
COMMENT ON TABLE pedidos IS 'Registro de todos os pedidos realizados';
COMMENT ON TABLE pedido_itens IS 'Itens individuais de cada pedido';
COMMENT ON TABLE repasses IS 'Controle de repasses financeiros aos revendedores';
COMMENT ON TABLE repasse_itens IS 'Detalhamento dos pedidos incluídos em cada repasse';
COMMENT ON TABLE revendedor_estoque IS 'Controle de estoque por revendedor';
COMMENT ON TABLE clientes IS 'Relacionamento entre revendedores e clientes';
COMMENT ON TABLE carrinho_usuarios IS 'Carrinho de compras persistente dos usuários';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Para verificar se tudo foi criado corretamente:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;