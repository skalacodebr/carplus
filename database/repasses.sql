-- Tabela para controlar repasses
CREATE TABLE repasses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  revendedor_id INTEGER REFERENCES revendedores(id),
  valor DECIMAL(10,2) NOT NULL,
  pedidos TEXT[] NOT NULL, -- Array com IDs dos pedidos
  transferencia_id VARCHAR(255), -- ID da transferência no Asaas
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, processando, concluido, erro
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar coluna de controle de repasse na tabela pedidos
ALTER TABLE pedidos 
ADD COLUMN repasse_status VARCHAR(50) DEFAULT 'pendente';

-- Índices para performance
CREATE INDEX idx_repasses_revendedor ON repasses(revendedor_id);
CREATE INDEX idx_repasses_status ON repasses(status);
CREATE INDEX idx_pedidos_repasse_status ON pedidos(repasse_status);
