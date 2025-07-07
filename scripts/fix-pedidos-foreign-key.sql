-- Remover a constraint atual que referencia revendedores.id
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_revendedor_id_fkey;

-- Criar nova constraint que referencia usuarios.id
ALTER TABLE pedidos 
ADD CONSTRAINT pedidos_revendedor_id_fkey 
FOREIGN KEY (revendedor_id) REFERENCES usuarios(id);

-- Verificar se a constraint foi criada corretamente
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='pedidos'
AND kcu.column_name='revendedor_id';
