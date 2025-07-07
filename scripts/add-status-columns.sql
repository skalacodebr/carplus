-- 1. Adicionar colunas na tabela pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS status_detalhado VARCHAR(50);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_estimada_entrega TIMESTAMP;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_entrega_real TIMESTAMP;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS observacoes_revendedor TEXT;

-- 2. Adicionar constraint para status detalhado
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS check_status_detalhado;
ALTER TABLE pedidos ADD CONSTRAINT check_status_detalhado 
CHECK (status_detalhado IN (
  'aguardando_preparacao', 'preparando_pedido', 'pronto_para_retirada', 'retirado',
  'aguardando_aceite', 'aceito', 'cancelado', 'a_caminho', 'entregue'
));

-- 3. Criar tabela de histórico de status
CREATE TABLE IF NOT EXISTS pedido_historico_status (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id),
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50),
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by INTEGER
);

-- 4. Atualizar pedidos existentes com status inicial baseado no tipo de entrega
UPDATE pedidos 
SET status_detalhado = CASE 
  WHEN tipo_entrega = 'retirada' THEN 'aguardando_preparacao'
  WHEN tipo_entrega = 'entrega' THEN 'aguardando_aceite'
  ELSE 'aguardando_preparacao'
END
WHERE status_detalhado IS NULL;
