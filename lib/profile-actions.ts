"use server"

import { createClient } from "@supabase/supabase-js"

type UpdateProfileImageParams = {
  userId: string
  base64File: string
  fileExt: string
  fileName: string
}

export async function updateProfileImage({
  userId,
  base64File,
  fileExt,
  fileName,
}: UpdateProfileImageParams) {
  try {
    // Use as credenciais do novo projeto Supabase
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://djqueobbsqebtfnqysmt.supabase.co"
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcXVlb2Jic3FlYnRmbnF5c210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjIyNzQsImV4cCI6MjA2OTE5ODI3NH0.8bUtQl__vruvkxUFcMEWB9IGNU8eZmDQEnDOs9J8i30"

    // Cria o client com permissão total (ignora RLS/roles)
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    // Extrai os dados base64 da string
    const base64Data = base64File.split(",")[1]
    const buffer = Buffer.from(base64Data, "base64")

    // Gera um nome único e monta o caminho no bucket
    const uniqueFileName = `${userId}_${Date.now()}.${fileExt}`
    const filePath = `perfil_images/${uniqueFileName}`

    // Faz o upload para o bucket "images"
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return { success: false, error: uploadError.message }
    }

    // Obtém a URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath)

    // Atualiza a coluna "foto" na tabela "usuarios"
    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ foto: publicUrl })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user profile:", updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, publicUrl }
  } catch (err) {
    console.error("Exception in updateProfileImage:", err)
    return { success: false, error: (err as Error).message }
  }
}
