// Script para configurar o Storage do Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://djqueobbsqebtfnqysmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcXVlb2Jic3FlYnRmbnF5c210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIyNzQsImV4cCI6MjA2OTE5ODI3NH0.8bUtQl__vruvkxUFcMEWB9IGNU8eZmDQEnDOs9J8i30'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupStorage() {
  console.log('🔍 Verificando configuração do Storage...\n')
  
  try {
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError)
      console.log('\n⚠️ IMPORTANTE: Você precisa usar a Service Role Key (não a anon key) para criar buckets!')
      console.log('1. Vá no Dashboard do Supabase')
      console.log('2. Settings > API')
      console.log('3. Copie a "service_role" key (não a "anon public")')
      console.log('4. Atualize este script com a service_role key')
      return
    }
    
    console.log('📦 Buckets existentes:', buckets?.map(b => b.name) || [])
    
    // Verificar se o bucket "images" existe
    const imagesBucket = buckets?.find(b => b.name === 'images')
    
    if (!imagesBucket) {
      console.log('\n⚠️ Bucket "images" não encontrado!')
      console.log('\n📝 Para criar o bucket, vá no Dashboard do Supabase:')
      console.log('1. Navegue até Storage')
      console.log('2. Clique em "New bucket"')
      console.log('3. Nome: images')
      console.log('4. Public bucket: ✅ (marque como público)')
      console.log('5. Clique em "Create bucket"')
    } else {
      console.log('\n✅ Bucket "images" encontrado!')
      console.log('Público:', imagesBucket.public ? 'Sim' : 'Não')
      
      if (!imagesBucket.public) {
        console.log('\n⚠️ ATENÇÃO: O bucket não está público!')
        console.log('Para torná-lo público:')
        console.log('1. Vá em Storage no Dashboard')
        console.log('2. Clique nos 3 pontos do bucket "images"')
        console.log('3. Selecione "Make public"')
      }
    }
    
    // Testar upload de arquivo
    console.log('\n🧪 Testando upload...')
    const testFile = Buffer.from('test', 'utf-8')
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload('test/test.txt', testFile, {
        upsert: true
      })
    
    if (uploadError) {
      console.log('❌ Erro no teste de upload:', uploadError.message)
    } else {
      console.log('✅ Teste de upload bem-sucedido!')
      
      // Limpar arquivo de teste
      await supabase.storage.from('images').remove(['test/test.txt'])
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

setupStorage()