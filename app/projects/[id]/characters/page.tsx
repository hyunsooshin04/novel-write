"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Wand2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface Project {
  id: number
  title: string
  genre: string
}

interface Character {
  id?: number
  name: string
  role: string
  description: string
  personality: string
  background: string
  appearance: string
}

export default function CharactersPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/characters`)
      const data = await response.json()

      if (response.ok) {
        setProject(data.project)
        setCharacters(data.characters || [])
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
      const response = await fetch(`/api/projects/${projectId}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })

      const data = await response.json()

      if (response.ok) {
        setCharacters(data)
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
      const response = await fetch(`/api/projects/${projectId}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", characters }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/projects/${projectId}/episodes`)
      } else {
        setError(data.error || "저장 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("저장 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const addCharacter = () => {
    setCharacters([
      ...characters,
      {
        name: "",
        role: "",
        description: "",
        personality: "",
        background: "",
        appearance: "",
      },
    ])
  }

  const removeCharacter = async (index: number) => {
    const characterToRemove = characters[index]

    // 로컬 상태에서 먼저 제거
    const updatedCharacters = characters.filter((_, i) => i !== index)
    setCharacters(updatedCharacters)

    // 만약 DB에 저장된 캐릭터라면 DB에서도 삭제
    if (characterToRemove.id) {
      try {
        await fetch(`/api/projects/${projectId}/characters/${characterToRemove.id}`, {
          method: "DELETE",
        })
      } catch (error) {
        console.error("Character deletion error:", error)
        // 삭제 실패시 상태 복원
        setCharacters(characters)
        setError("캐릭터 삭제 중 오류가 발생했습니다.")
      }
    }
  }

  const updateCharacter = (index: number, field: keyof Character, value: string) => {
    const updated = [...characters]
    updated[index] = { ...updated[index], [field]: value }
    setCharacters(updated)
  }

  if (!project) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href={`/projects/${projectId}/worldbuilding`} className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                세계관 설정
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600">캐릭터 설정</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>캐릭터 설정</CardTitle>
                  <CardDescription>
                    AI가 생성한 캐릭터를 확인하고 수정하거나 새로운 캐릭터를 추가할 수 있습니다.
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={addCharacter}>
                    <Plus className="w-4 h-4 mr-2" />
                    캐릭터 추가
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {generating ? "AI 생성 중..." : "AI로 생성하기"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {characters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 text-center mb-4">
                  아직 캐릭터가 없습니다. AI로 생성하거나 직접 추가해보세요.
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={addCharacter}>
                    <Plus className="w-4 h-4 mr-2" />
                    캐릭터 추가
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {generating ? "AI 생성 중..." : "AI로 생성하기"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {characters.map((character, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        캐릭터 {index + 1}: {character.name || "이름 없음"}
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => removeCharacter(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>이름</Label>
                        <Input
                          value={character.name}
                          onChange={(e) => updateCharacter(index, "name", e.target.value)}
                          placeholder="캐릭터 이름"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>역할</Label>
                        <Input
                          value={character.role}
                          onChange={(e) => updateCharacter(index, "role", e.target.value)}
                          placeholder="주인공, 조연, 악역 등"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>설명</Label>
                      <Textarea
                        value={character.description}
                        onChange={(e) => updateCharacter(index, "description", e.target.value)}
                        placeholder="캐릭터의 기본 정보와 특징"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>성격</Label>
                      <Textarea
                        value={character.personality}
                        onChange={(e) => updateCharacter(index, "personality", e.target.value)}
                        placeholder="성격적 특징"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>배경</Label>
                      <Textarea
                        value={character.background}
                        onChange={(e) => updateCharacter(index, "background", e.target.value)}
                        placeholder="캐릭터의 과거나 출신"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>외모</Label>
                      <Textarea
                        value={character.appearance}
                        onChange={(e) => updateCharacter(index, "appearance", e.target.value)}
                        placeholder="외모 묘사"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Alert className="mt-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {characters.length > 0 && (
            <div className="flex justify-end space-x-4 mt-6">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "저장 중..." : "회차 생성으로 이동"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
