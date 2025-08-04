"use client"

// Function to get a cookie value by name
export function getCookie(name: string): string | undefined {
  // Check if we're on the client side
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return undefined
  }
  
  const cookies = document.cookie.split(";")
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    // Check if this cookie starts with the name we're looking for
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1)
    }
  }
  return undefined
}

// Function to set a cookie
export function setCookie(name: string, value: string, days = 30): void {
  // Check if we're on the client side
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = "; expires=" + date.toUTCString()
  document.cookie = name + "=" + value + expires + "; path=/; SameSite=Lax"
}

// Function to delete a cookie
export function deleteCookie(name: string): void {
  // Check if we're on the client side
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
}

// Function to check if a user is authenticated (has userId cookie)
export function isAuthenticated(): boolean {
  return !!getCookie("userId")
}
