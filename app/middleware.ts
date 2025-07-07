import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Check for userId in cookies
  const userId = req.cookies.get("userId")?.value

  // Get the current path
  const path = req.nextUrl.pathname

  console.log(`Middleware running for path: ${path}`)
  console.log(`Cookie userId: ${userId || "not found"}`)

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/perfil", "/historico", "/pedidos", "/carrinho"]

  // Check if the current route is in the list of protected routes
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // If it's a protected route and the user is not authenticated, redirect to login
  if (isProtectedRoute && !userId) {
    console.log(`Redirecting to login from ${path} - No userId found`)
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectedFrom", path)
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is authenticated and trying to access login/cadastro, redirect to dashboard
  if (userId && (path === "/login" || path === "/cadastro")) {
    console.log(`Redirecting to dashboard from ${path} - userId found`)
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Continue with the request
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/perfil/:path*",
    "/historico/:path*",
    "/pedidos/:path*",
    "/carrinho/:path*",
    "/login",
    "/cadastro",
  ],
}
