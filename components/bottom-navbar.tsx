"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export default function BottomNavbar() {
  const pathname = usePathname()

  // Páginas que NÃO devem mostrar a navbar (páginas públicas)
  const publicPages = [
    "/",           // página inicial
    "/login",      // login
    "/cadastro",   // cadastro
    "/calculadora", // calculadora pública
    "/resultado"   // resultado da calculadora pública
  ]

  // Se estamos em uma página pública, não renderizar a navbar
  if (publicPages.includes(pathname)) {
    return null
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="fixed-bottom-navbar">
      <Link href="/dashboard" className={`flex flex-col items-center ${isActive("/dashboard") ? "text-white" : "text-gray-400"}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <span className="text-xs mt-1">Início</span>
      </Link>
      <Link href="/pedidos" className={`flex flex-col items-center ${isActive("/pedidos") ? "text-white" : "text-gray-400"}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
        <span className="text-xs mt-1">Pedidos</span>
      </Link>
      <Link href="/perfil" className={`flex flex-col items-center ${isActive("/perfil") ? "text-white" : "text-gray-400"}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="text-xs mt-1">Perfil</span>
      </Link>
    </div>
  )
}