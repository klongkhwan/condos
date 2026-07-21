"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { User } from "./supabase"
import { supabase } from "./supabase/client"
import { userService } from "./database"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  isLoading: boolean
  refetchUser: () => Promise<void>
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const loadProfile = useCallback(async (authUserId: string) => {
    const profile = await userService.getById(authUserId)
    setUser(profile)
  }, [])

  const refetchUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      await loadProfile(authUser.id)
    } else {
      setUser(null)
    }
  }, [loadProfile])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        await loadProfile(session.user.id)
      }
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { success: false, message: error.message }
    }
    return { success: true }
  }

  const signup = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      return { success: false, message: error.message }
    }
    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isLoading,
        refetchUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
