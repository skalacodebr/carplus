// Script para debugar o banco de dados
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://djqueobbsqebtfnqysmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcXVlb2Jic3FlYnRmbnF5c210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIyNzQsImV4cCI6MjA2OTE5ODI3NH0.8bUtQl__vruvkxUFcMEWB9IGNU8eZmDQEnDOs9J8i30'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  console.log('🔍 Verificando estrutura do banco...\n')
  
  // Verificar tabelas existentes
  const tabelas = ['usuarios', 'pacotes', 'tamanhos', 'alturas', 'larguras']
  
  for (const tabela of tabelas) {
    console.log(`📋 Verificando tabela: ${tabela}`)
    try {
      const { data, error, count } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ERRO na tabela ${tabela}:`, error.message)
      } else {
        console.log(`✅ Tabela ${tabela} existe! Registros: ${count}`)
      }
    } catch (err) {
      console.log(`❌ ERRO ao acessar ${tabela}:`, err.message)
    }
    console.log('')
  }
  
  // Verificar se há dados em pacotes
  console.log('🎯 Verificando dados em pacotes...')
  const { data: pacotes, error: pacotesError } = await supabase
    .from('pacotes')
    .select('*')
    .limit(5)
    
  if (pacotesError) {
    console.log('❌ Erro ao buscar pacotes:', pacotesError)
  } else {
    console.log('📦 Pacotes encontrados:', pacotes)
  }
}

debugDatabase().catch(console.error)