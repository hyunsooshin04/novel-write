import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"

interface Project {
  id: number
  title: string
  genre: string
  overview: string
}

interface Episode {
  id: number
  episode_number: number
  title: string
  prompt: string
  content: string
  actual_word_count: number
}

export default async function PreviewPage({ params }: { params: { id: string } }) {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  const projectId = Number.parseInt(params.id)

  // 프로젝트 정보 조회
  const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1 AND user_id = $2", [projectId, user.id])

  if (projectResult.rows.length === 0) {
    redirect("/")
  }

  const project: Project = projectResult.rows[0]

  // 에피소드 목록 조회
  const episodesResult = await pool.query("SELECT * FROM episodes WHERE project_id = $1 ORDER BY episode_number", [
    projectId,
  ])

  const episodes: Episode[] = episodesResult.rows

  const totalWordCount = episodes.reduce((sum, episode) => sum + episode.actual_word_count, 0)

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href={`/projects/${projectId}/episodes`} className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  회차 생성으로 돌아가기
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">소설 미리보기</h1>
                <p className="text-gray-600">전체 스토리를 확인해보세요</p>
              </div>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              PDF로 내보내기
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 소설 정보 */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-2">{project.title}</CardTitle>
            <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
              {project.genre && <Badge variant="secondary">{project.genre}</Badge>}
              <span>총 {episodes.length}화</span>
              <span>총 {totalWordCount.toLocaleString()}자</span>
            </div>
            {project.overview && <p className="text-gray-700 mt-4 max-w-2xl mx-auto">{project.overview}</p>}
          </CardHeader>
        </Card>

        {/* 에피소드 목록 */}
        {episodes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 text-center mb-4">아직 작성된 회차가 없습니다.</p>
              <Link href={`/projects/${projectId}/episodes`}>
                <Button>회차 생성하러 가기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {episodes.map((episode, index) => (
              <div key={episode.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {episode.episode_number}화: {episode.title || `${episode.episode_number}화`}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <span>{episode.actual_word_count.toLocaleString()}자</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>프롬프트:</strong> {episode.prompt}
                    </p>
                  </div>
                </div>

                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{episode.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 하단 네비게이션 */}
        {episodes.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                총 {episodes.length}화 완성 • {totalWordCount.toLocaleString()}자
              </div>
              <Link href={`/projects/${projectId}/episodes`}>
                <Button>계속 작성하기</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
