"use client"

import type React from "react"
import { Sidebar, MobileHeader } from "./sidebar"
import { useState, useEffect } from "react"
import { ProfileSettingsModal } from "@/components/ui/profile-settings-modal"
import { useAuth } from "@/lib/auth-context"
import { AuthInitializer } from "@/components/AuthInitializer"
import { useRouter } from "next/navigation"


interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const { user, isLoading, refetchUser } = useAuth()
  const router = useRouter()

  // ตรวจสอบการล็อกอินเมื่อ user หรือ isLoading เปลี่ยนแปลง
  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [user, isLoading, router])

  // Close mobile sidebar on window resize (when switching to desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // โครงหน้าจางๆ ระหว่างตรวจสอบสถานะการล็อกอิน แทนจอว่างเปล่าแบบเดิม
  if (isLoading || !user) {
    return (
      <div className="flex h-screen bg-background">
        <div className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
          <div className="h-16 border-b border-border" />
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-4 p-4 md:p-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <>
      <AuthInitializer />
      <div className="flex h-screen flex-col bg-background">
        {/* Mobile Header */}
        <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar 
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
          
          {/* Main Content */}
          <main className="scrollbar-slim flex-1 overflow-auto">
            <div className="mx-auto max-w-[1600px] p-4 sm:p-5 md:px-8 md:py-7 lg:px-10 lg:py-8">{children}</div>
          </main>
        </div>
        
        <ProfileSettingsModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={user}
          onUpdateSuccess={refetchUser}
        />
      </div>
    </>
  )
}