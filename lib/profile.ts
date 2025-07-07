import { updateUserProfile } from "./profile-actions"

export async function updateProfile(
  userId: string,
  userData: {
    nome: string
    sobrenome: string
    telefone: string
  },
) {
  try {
    const result = await updateUserProfile(userId, userData)
    return result
  } catch (error) {
    console.error("Error in updateProfile client wrapper:", error)
    return { success: false, error }
  }
}
