"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Wand2, Save } from "lucide-react"
import Link from "next/link"

interface Project {
  id: number
  title: string
  genre: string
  keywords: string
  overview: string
}

interface Worldbuilding {
  background: string
  history: string
  mythology: string
  rules: string
}

export default function WorldbuildingPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [worldbuilding, setWorldbuilding] = useState<Worldbuilding>({
    background: "",
    history: "",
    mythology: "",
    rules: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/worldbuilding`)
      const data = await response.json()

      if (response.ok) {
        setProject(data.project)
        if (data.worldbuilding) {
          setWorldbuilding(data.worldbuilding)
        }
      } else {
        setError(data.error || "데이터를 불러오는 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("데이터를 불러오는 중 오류가 발생했습니다.")
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/worldbuilding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })

      const data = await response.json()

      if (response.ok) {
        setWorldbuilding(data)
      } else {
        setError(data.error || "AI 생성 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("AI 생성 중 오류가 발생했습니다.")
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/worldbuilding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", ...worldbuilding }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/projects/${projectId}/characters`)
      } else {
        setError(data.error || "저장 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("저장 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  if (!project) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">로딩 중...</div>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600">세계관 설정</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>프로젝트 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>장르:</strong> {project.genre || "미설정"}
                </div>
                <div>
                  <strong>키워드:</strong> {project.keywords || "미설정"}
                </div>
                <div className="md:col-span-2">
                  <strong>개요:</strong> {project.overview || "미설정"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>세계관 설정</CardTitle>
                  <CardDescription>AI가 생성한 세계관을 확인하고 수정할 수 있습니다.</CardDescription>
                </div>
                <Button onClick={handleGenerate} disabled={generating}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {generating ? "AI 생성 중..." : "AI로 생성하기"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="background">배경</Label>
                <Textarea
                  id="background"
                  value={worldbuilding.background}
                  onChange={(e) => setWorldbuilding({ ...worldbuilding, background: e.target.value })}
                  placeholder="시대적 배경, 장소적 배경을 설명해주세요."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="history">역사</Label>
                <Textarea
                  id="history"
                  value={worldbuilding.history}
                  onChange={(e) => setWorldbuilding({ ...worldbuilding, history: e.target.value })}
                  placeholder="세계의 주요 역사적 사건들을 설명해주세요."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mythology">신화</Label>
                <Textarea
                  id="mythology"
                  value={worldbuilding.mythology}
                  onChange={(e) => setWorldbuilding({ ...worldbuilding, mythology: e.target.value })}
                  placeholder="세계의 신화나 전설을 설명해주세요."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">질서</Label>
                <Textarea
                  id="rules"
                  value={worldbuilding.rules}
                  onChange={(e) => setWorldbuilding({ ...worldbuilding, rules: e.target.value })}
                  placeholder="사회 체계, 법칙, 규칙을 설명해주세요."
                  rows={4}
                />
              </div>

              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button variant="outline" onClick={handleSave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "저장 중..." : "저장하기"}
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "저장 중..." : "캐릭터 설정으로 이동"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
