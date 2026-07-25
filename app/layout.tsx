import type React from "react"
import type { Metadata } from "next"
import { Inter, Noto_Sans_Thai } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { QueryProvider } from "@/lib/query-provider"
import { ThemeProvider } from "@/components/theme-provider"

const latin = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
})

const thai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-thai",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ระบบจัดการคอนโด by 3CAT",
  description: "ระบบจัดการคอนโด",
  generator: "3CAT",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning className={`${thai.variable} ${latin.variable}`}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
