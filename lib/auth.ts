import { serverSignUp, serverSignIn, serverSignOut, serverResetPassword, serverGetCurrentUser } from "./auth-actions"

// Export the server actions as client-callable functions
export async function signUp(email: string, password: string, userData: any) {
  return serverSignUp(email, password, userData)
}

export async function signIn(email: string, password: string) {
  return serverSignIn(email, password)
}

export async function signOut() {
  return serverSignOut()
}

export async function resetPassword(email: string) {
  return serverResetPassword(email)
}

export async function getCurrentUser() {
  return serverGetCurrentUser()
}
