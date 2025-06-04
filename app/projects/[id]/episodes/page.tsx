"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Wand2, Plus, BookOpen, Eye, Edit, Save, X } from "lucide-react"
import Link from "next/link"

interface Project {
  id: number
  title: string
}

interface Episode {
  id: number
  episode_number: number
  title: string
  prompt: string
  content: string
  min_word_count: number
  actual_word_count: number
  created_at: string
}

export default function EpisodesPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [newEpisode, setNewEpisode] = useState({
    title: "",
    prompt: "",
    minWordCount: 1000,
    content: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showNewEpisodeForm, setShowNewEpisodeForm] = useState(false)

  // AI 생성 결과를 저장하는 상태
  const [generatedContent, setGeneratedContent] = useState("")
  const [showGeneratedContent, setShowGeneratedContent] = useState(false)

  // 에피소드 상세 보기 및 수정 관련 상태
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedEpisode, setEditedEpisode] = useState<{
    title: string
    prompt: string
    content: string
  }>({
    title: "",
    prompt: "",
    content: "",
  })

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/episodes`)
      const data = await response.json()

      if (response.ok) {
        setProject(data.project)
        setEpisodes(data.episodes || [])
      } else {
        setError(data.error || "데이터를 불러오는 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("데이터를 불러오는 중 오류가 발생했습니다.")
    }
  }

  const handleGenerate = async () => {
    if (!newEpisode.prompt.trim()) {
      setError("프롬프트를 입력해주세요.")
      return
    }

    setGenerating(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/episodes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newEpisode.prompt,
          minWordCount: newEpisode.minWordCount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // 생성된 내용을 상태에 저장하고 편집 모드로 전환
        setGeneratedContent(data.content)
        setShowGeneratedContent(true)
      } else {
        setError(data.error || "AI 생성 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("AI 생성 중 오류가 발생했습니다.")
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveGenerated = async () => {
    if (!newEpisode.title.trim()) {
      setError("제목을 입력해주세요.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEpisode.title,
          prompt: newEpisode.prompt,
          content: generatedContent,
          minWordCount: newEpisode.minWordCount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEpisodes([...episodes, data])
        setNewEpisode({ title: "", prompt: "", minWordCount: 1000, content: "" })
        setGeneratedContent("")
        setShowGeneratedContent(false)
        setShowNewEpisodeForm(false)
      } else {
        setError(data.error || "저장 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("저장 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleManualSave = async () => {
    if (!newEpisode.prompt.trim() || !newEpisode.content.trim()) {
      setError("프롬프트와 내용을 모두 입력해주세요.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEpisode.title || `${episodes.length + 1}화`,
          prompt: newEpisode.prompt,
          content: newEpisode.content,
          minWordCount: newEpisode.minWordCount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEpisodes([...episodes, data])
        setNewEpisode({ title: "", prompt: "", minWordCount: 1000, content: "" })
        setShowNewEpisodeForm(false)
      } else {
        setError(data.error || "저장 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("저장 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 에피소드 상세 보기
  const handleViewEpisode = (episode: Episode) => {
    setSelectedEpisode(episode)
    setIsEditing(false)
  }

  // 에피소드 수정 모드 시작
  const handleStartEditing = () => {
    if (selectedEpisode) {
      setEditedEpisode({
        title: selectedEpisode.title,
        prompt: selectedEpisode.prompt,
        content: selectedEpisode.content,
      })
      setIsEditing(true)
    }
  }

  // 에피소드 수정 저장
  const handleSaveEdited = async () => {
    if (!selectedEpisode) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/episodes/${selectedEpisode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedEpisode),
      })

      const data = await response.json()

      if (response.ok) {
        // 에피소드 목록 업데이트
        const updatedEpisodes = episodes.map((ep) =>
          ep.id === selectedEpisode.id
            ? { ...ep, ...editedEpisode, actual_word_count: editedEpisode.content.length }
            : ep,
        )
        setEpisodes(updatedEpisodes)

        // 선택된 에피소드 업데이트
        setSelectedEpisode({
          ...selectedEpisode,
          ...editedEpisode,
          actual_word_count: editedEpisode.content.length,
        })
        setIsEditing(false)
      } else {
        setError(data.error || "수정 중 오류가 발생했습니다.")
      }
    } catch (error) {
      setError("수정 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 에피소드 수정 취소
  const handleCancelEditing = () => {
    setIsEditing(false)
  }

  // 에피소드 상세 보기 닫기
  const handleCloseEpisodeView = () => {
    setSelectedEpisode(null)
    setIsEditing(false)
  }

  if (!project) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href={`/projects/${projectId}/characters`} className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  캐릭터 설정
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <p className="text-gray-600">회차 생성</p>
              </div>
            </div>
            <Link href={`/projects/${projectId}/preview`}>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                소설 미리보기
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">회차 목록 ({episodes.length}화)</h2>
            <Button onClick={() => setShowNewEpisodeForm(true)}>
              <Plus className="w-4 h-4 mr-2" />새 회차 생성
            </Button>
          </div>

          {showNewEpisodeForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>새 회차 생성</CardTitle>
                <CardDescription>프롬프트를 입력하면 AI가 회차를 생성하거나, 직접 작성할 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>회차 제목 (선택사항)</Label>
                    <Input
                      value={newEpisode.title}
                      onChange={(e) => setNewEpisode({ ...newEpisode, title: e.target.value })}
                      placeholder="예: 첫 번째 만남"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>최소 글자 수</Label>
                    <Input
                      type="number"
                      value={newEpisode.minWordCount}
                      onChange={(e) =>
                        setNewEpisode({ ...newEpisode, minWordCount: Number.parseInt(e.target.value) || 1000 })
                      }
                      min="100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>프롬프트 *</Label>
                  <Textarea
                    value={newEpisode.prompt}
                    onChange={(e) => setNewEpisode({ ...newEpisode, prompt: e.target.value })}
                    placeholder="이 회차에서 어떤 일이 벌어지나요? 예: 주인공이 마법학교에 입학하여 첫 수업을 받는다."
                    rows={3}
                  />
                </div>

                {!showGeneratedContent && (
                  <div className="space-y-2">
                    <Label>직접 작성 (선택사항)</Label>
                    <Textarea
                      value={newEpisode.content}
                      onChange={(e) => setNewEpisode({ ...newEpisode, content: e.target.value })}
                      placeholder="AI 생성 대신 직접 작성하려면 여기에 내용을 입력하세요."
                      rows={8}
                    />
                  </div>
                )}

                {error && (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewEpisodeForm(false)
                      setNewEpisode({ title: "", prompt: "", minWordCount: 1000, content: "" })
                      setGeneratedContent("")
                      setShowGeneratedContent(false)
                      setError("")
                    }}
                  >
                    취소
                  </Button>
                  {newEpisode.content.trim() ? (
                    <Button onClick={handleManualSave} disabled={loading}>
                      {loading ? "저장 중..." : "직접 작성 저장"}
                    </Button>
                  ) : (
                    <Button onClick={handleGenerate} disabled={generating}>
                      <Wand2 className="w-4 h-4 mr-2" />
                      {generating ? "AI 생성 중..." : "AI로 생성하기"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI 생성 결과 편집 */}
          {showGeneratedContent && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>AI 생성 결과 편집</CardTitle>
                <CardDescription>AI가 생성한 내용을 확인하고 필요한 부분을 수정한 후 저장하세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>회차 제목 *</Label>
                  <Input
                    value={newEpisode.title}
                    onChange={(e) => setNewEpisode({ ...newEpisode, title: e.target.value })}
                    placeholder="회차 제목을 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>내용</Label>
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows={15}
                    className="font-serif"
                  />
                </div>

                {error && (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGeneratedContent(false)
                    setGeneratedContent("")
                  }}
                >
                  취소
                </Button>
                <Button onClick={handleSaveGenerated} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "저장 중..." : "저장하기"}
                </Button>
              </CardFooter>
            </Card>
          )}

          {episodes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 회차가 없습니다</h3>
                <p className="text-gray-500 text-center mb-4">첫 번째 회차를 생성하여 소설을 시작해보세요.</p>
                <Button onClick={() => setShowNewEpisodeForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />새 회차 생성
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {episodes.map((episode) => (
                <Card
                  key={episode.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewEpisode(episode)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {episode.episode_number}화: {episode.title || `${episode.episode_number}화`}
                        </CardTitle>
                        <CardDescription className="mt-1">프롬프트: {episode.prompt}</CardDescription>
                      </div>
                      <Badge variant="secondary">{episode.actual_word_count}자</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-3">{episode.content}</p>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                      목표: {episode.min_word_count}자 이상 | 실제: {episode.actual_word_count}자
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewEpisode(episode)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      상세 보기
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 에피소드 상세 보기 모달 */}
      <Dialog
        open={selectedEpisode !== null}
        onOpenChange={(open) => {
          if (!open) handleCloseEpisodeView()
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEpisode && (
            <>
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center">
                  <span>
                    {selectedEpisode.episode_number}화: {selectedEpisode.title}
                  </span>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancelEditing}>
                          <X className="w-4 h-4 mr-1" />
                          취소
                        </Button>
                        <Button size="sm" onClick={handleSaveEdited} disabled={loading}>
                          <Save className="w-4 h-4 mr-1" />
                          {loading ? "저장 중..." : "저장"}
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleStartEditing}>
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                    )}
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <div>
                        <Label>제목</Label>
                        <Input
                          value={editedEpisode.title}
                          onChange={(e) => setEditedEpisode({ ...editedEpisode, title: e.target.value })}
                          className="mb-2"
                        />
                      </div>
                      <div>
                        <Label>프롬프트</Label>
                        <Input
                          value={editedEpisode.prompt}
                          onChange={(e) => setEditedEpisode({ ...editedEpisode, prompt: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm">프롬프트: {selectedEpisode.prompt}</p>
                      <p className="text-sm mt-1">
                        {selectedEpisode.actual_word_count}자 | 작성일:{" "}
                        {new Date(selectedEpisode.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                {isEditing ? (
                  <Textarea
                    value={editedEpisode.content}
                    onChange={(e) => setEditedEpisode({ ...editedEpisode, content: e.target.value })}
                    rows={20}
                    className="font-serif"
                  />
                ) : (
                  <div className="prose prose-lg max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-serif">
                      {selectedEpisode.content}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <Alert className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
