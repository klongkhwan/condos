"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      return
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return
    }

    setLoading(true)
    try {
      const result = await signup(email, password, fullName)
      if (result.success) {
        setMessage("สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี แล้วเข้าสู่ระบบ")
      } else {
        setError(result.message || "ไม่สามารถสมัครสมาชิกได้")
      }
    } catch (err) {
      setError("ไม่สามารถสมัครสมาชิกได้")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">สมัครสมาชิก</h2>
          <p className="mt-2 text-sm text-muted-foreground">สร้างบัญชีสำหรับระบบจัดการคอนโด</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="bg-destructive-muted border border-destructive/40 text-destructive px-4 py-3 rounded">{error}</div>}
            {message && (
              <div className="bg-success-muted border border-primary/40 text-success px-4 py-3 rounded">{message}</div>
            )}

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
                ชื่อ-นามสกุล
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-muted border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="ชื่อ-นามสกุล"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-muted border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 bg-muted border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-foreground">
                ยืนยัน Password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-muted border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              มีบัญชีอยู่แล้ว?{" "}
              <a href="/login" className="text-success hover:text-success">
                เข้าสู่ระบบ
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
