"use client"

import { usePathname } from "next/navigation"

interface MainContentWrapperProps {
  children: React.ReactNode
}

export default function MainContentWrapper({ children }: MainContentWrapperProps) {
  const pathname = usePathname()

  // Páginas que NÃO devem mostrar a navbar (páginas públicas)
  const publicPages = [
    "/",           // página inicial
    "/login",      // login
    "/cadastro",   // cadastro
    "/calculadora", // calculadora pública
    "/resultado"   // resultado da calculadora pública
  ]

  // Usar classe diferente baseada no tipo de página
  const contentClass = publicPages.includes(pathname) ? "main-content-full" : "main-content"

  return (
    <div className={contentClass}>
      {children}
    </div>
  )
}