"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, BookOpen, User } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface UserType {
  id: number
  email: string
  username: string
}

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)

  useEffect(() => {
    // 사용자 정보 확인
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("User check error:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">AI 소설 작가</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              내 프로젝트
            </Link>
            <span className="text-gray-400 cursor-not-allowed">템플릿 (준비중)</span>
            <span className="text-gray-400 cursor-not-allowed">가이드 (준비중)</span>
          </nav>

          {/* 사용자 메뉴 */}
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  로그인
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
