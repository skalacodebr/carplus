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
    // <-- Cole aqui direto a URL e a Service Role Key do seu projeto Supabase -->
    const SUPABASE_URL = "https://lqiabcgdtnadggjswbmr.supabase.co"
    const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxaWFiY2dkdG5hZGdnanN3Ym1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNTM2NTksImV4cCI6MjA2MjYyOTY1OX0.6_FBwdlkA2bVS0-lJwn3twyLNmqk_QFZdUpwilyA-ac"

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
