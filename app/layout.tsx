import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { AuthProvider } from "@/context/auth-context"
import { CartProvider } from "@/context/cart-context"
import { NotificationsProvider } from "@/context/notifications-context"
import BottomNavbar from "@/components/bottom-navbar"
import MainContentWrapper from "@/components/main-content-wrapper"

export const metadata: Metadata = {
  title: "Car+ Microesferas Premium",
  description: "Aplicativo Car+ Microesferas Premium",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="fixed-navbar"></div>
        <MainContentWrapper>
          <AuthProvider>
            <NotificationsProvider>
              <CartProvider>{children}</CartProvider>
            </NotificationsProvider>
          </AuthProvider>
        </MainContentWrapper>
        <BottomNavbar />
      </body>
    </html>
  )
}
