"use server"

import { cookies } from "next/headers"
import { createHash, randomBytes } from "crypto"
import { supabase } from "./supabase"

// Function to hash passwords securely
function hashPassword(password: string): string {
  // Generate a random salt
  const salt = randomBytes(16).toString("hex")

  // Hash the password with the salt using SHA-256
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex")

  // Return the salt and hash combined
  return `${salt}:${hash}`
}

// Function to verify a password against a stored hash
function verifyPassword(password: string, storedHash: string): boolean {
  // Extract the salt from the stored hash
  const [salt, hash] = storedHash.split(":")

  // Hash the provided password with the same salt
  const calculatedHash = createHash("sha256")
    .update(password + salt)
    .digest("hex")

  // Compare the calculated hash with the stored hash
  return calculatedHash === hash
}

// Server action for sign up
export async function serverSignUp(email: string, password: string, userData: any) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.from("usuarios").select("id").eq("email", email).single()

    if (existingUser) {
      return {
        data: null,
        error: { message: "Este email já está em uso" },
      }
    }

    // Hash the password
    const hashedPassword = hashPassword(password)

    // Insert user into the usuarios table - let the database generate the ID
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          nome: userData.nome,
          sobrenome: userData.sobrenome || "",
          email: email,
          telefone: userData.telefone,
          senha: hashedPassword,
          tipo: "usuario", // Set user type to 'usuario'
          created_at: new Date(),
          updated_at: new Date(),
          // Campos de endereço
          cep: userData.cep || "",
          rua: userData.rua || "",
          numero: userData.numero || "",
          complemento: userData.complemento || "",
          bairro: userData.bairro || "",
          cidade: userData.cidade || "",
          uf: userData.uf || "",
        },
      ])
      .select()
      .single()

    if (error) throw error

    console.log("User created successfully with ID:", data.id)

    // Set the user ID cookie with the auto-generated ID
    const cookieStore = cookies()
    cookieStore.set({
      name: "userId",
      value: data.id.toString(), // Convert to string to ensure compatibility
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax", // Add sameSite for better security
    })

    console.log("Cookie set successfully")

    // Return the user data without the password
    const userWithoutPassword = data ? { ...data, senha: undefined } : null

    return {
      data: { user: userWithoutPassword },
      error: null,
    }
  } catch (error) {
    console.error("Erro ao cadastrar:", error)
    return { data: null, error }
  }
}

// Server action for sign in
export async function serverSignIn(email: string, password: string) {
  try {
    // Get user from the database
    const { data: user, error } = await supabase.from("usuarios").select("*").eq("email", email).single()

    if (error || !user) {
      return {
        data: null,
        error: { message: "Credenciais inválidas" },
      }
    }

    // Verify the password
    const isPasswordValid = verifyPassword(password, user.senha)

    if (!isPasswordValid) {
      return {
        data: null,
        error: { message: "Credenciais inválidas" },
      }
    }

    console.log("User authenticated successfully with ID:", user.id)

    // Set the user ID cookie
    const cookieStore = cookies()
    cookieStore.set({
      name: "userId",
      value: user.id.toString(), // Convert to string to ensure compatibility
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax", // Add sameSite for better security
    })

    console.log("Cookie set successfully")

    // Return the user data without the password
    const userWithoutPassword = { ...user, senha: undefined }

    return {
      data: { user: userWithoutPassword },
      error: null,
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error)
    return { data: null, error }
  }
}

// Server action for sign out
export async function serverSignOut() {
  try {
    // Delete the user ID cookie
    cookies().delete("userId")
    return { error: null }
  } catch (error) {
    console.error("Erro ao fazer logout:", error)
    return { error }
  }
}

// Server action for password reset
export async function serverResetPassword(email: string) {
  try {
    // Check if user exists
    const { data: user, error } = await supabase.from("usuarios").select("id").eq("email", email).single()

    if (error || !user) {
      return {
        data: null,
        error: { message: "Email não encontrado" },
      }
    }

    // In a real application, you would send an email with a reset link
    // For now, we'll just return success
    return {
      data: { message: "Email de redefinição enviado" },
      error: null,
    }
  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error)
    return { data: null, error }
  }
}

// Server action to get the current user
export async function serverGetCurrentUser() {
  try {
    // Get the user ID from the cookie
    const userId = cookies().get("userId")?.value

    if (!userId) {
      return { user: null, error: null }
    }

    // Get the user from the database
    const { data: user, error } = await supabase.from("usuarios").select("*").eq("id", userId).single()

    if (error) {
      throw error
    }

    // Return the user data without the password
    const userWithoutPassword = user ? { ...user, senha: undefined } : null

    return {
      user: userWithoutPassword,
      error: null,
    }
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error)
    return { user: null, error }
  }
}
