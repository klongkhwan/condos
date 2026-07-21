// components/AuthInitializer.tsx
"use client"
import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"

export function AuthInitializer() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return

    const isPublicPath = ["/login", "/register"].includes(pathname)

    // Middleware already enforces this server-side; this is just a fast
    // client-side redirect in case the session state changes mid-session
    // (e.g. after signOut) without a full page navigation.
    if (!user && !isPublicPath) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }

    if (user && isPublicPath) {
      router.push("/dashboard")
    }
  }, [user, isLoading, pathname])

  return null
}
