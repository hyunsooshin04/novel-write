"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const genres = ["판타지", "로맨스", "미스터리", "스릴러", "공포", "SF", "역사", "현대", "무협", "액션"]

export default function NewProjectPage() {
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    keywords: "",
    overview: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.title.trim()) {
      setError("제목을 입력해주세요.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/projects/${data.id}/worldbuilding`)
      } else {
        setError(data.error || "프로젝트 생성 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("프로젝트 생성 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                돌아가기
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">새 프로젝트 만들기</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 기본 정보</CardTitle>
              <CardDescription>
                소설의 기본 정보를 입력해주세요. 이 정보를 바탕으로 AI가 세계관과 캐릭터를 생성합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">소설 제목 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 마법사의 모험"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">장르</Label>
                  <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="장르를 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">키워드</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="예: 마법, 모험, 우정, 성장"
                  />
                  <p className="text-sm text-gray-500">쉼표로 구분하여 여러 키워드를 입력할 수 있습니다.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overview">간단한 개요</Label>
                  <Textarea
                    id="overview"
                    value={formData.overview}
                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    placeholder="소설의 전체적인 줄거리나 설정을 간단히 설명해주세요."
                    rows={4}
                  />
                </div>

                {error && (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-4">
                  <Link href="/" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      취소
                    </Button>
                  </Link>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "생성 중..." : "세계관 생성 시작하기"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
