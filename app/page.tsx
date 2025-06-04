import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { PlusCircle, BookOpen, Users, Globe } from "lucide-react"

export default async function HomePage() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  // 사용자의 프로젝트 목록 조회
  const projectsResult = await pool.query(
    `
    SELECT p.*, 
           (SELECT COUNT(*) FROM episodes WHERE project_id = p.id) as episode_count,
           (SELECT COUNT(*) FROM characters WHERE project_id = p.id) as character_count,
           (CASE WHEN w.id IS NOT NULL THEN true ELSE false END) as has_worldbuilding
    FROM projects p 
    LEFT JOIN worldbuilding w ON p.id = w.project_id
    WHERE p.user_id = $1 
    ORDER BY p.updated_at DESC
  `,
    [user.id],
  )

  const projects = projectsResult.rows

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">내 소설 프로젝트</h1>
              <p className="text-gray-600">안녕하세요, {user.username}님!</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">프로젝트 목록</h2>
            <Link href="/projects/new">
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />새 프로젝트 만들기
              </Button>
            </Link>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 프로젝트가 없습니다</h3>
                <p className="text-gray-500 text-center mb-4">
                  첫 번째 소설 프로젝트를 만들어 AI와 함께 창작을 시작해보세요.
                </p>
                <Link href="/projects/new">
                  <Button>
                    <PlusCircle className="w-4 h-4 mr-2" />새 프로젝트 만들기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {project.genre && (
                            <Badge variant="secondary" className="mr-2">
                              {project.genre}
                            </Badge>
                          )}
                          {new Date(project.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={project.status === "completed" ? "default" : "outline"}>
                        {project.status === "completed" ? "완성" : "작성중"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.overview && <p className="text-sm text-gray-600 mb-4 line-clamp-3">{project.overview}</p>}

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        {project.has_worldbuilding ? "세계관 완료" : "세계관 미완료"}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {project.character_count}명
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {project.episode_count}화
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/projects/${project.id}/worldbuilding`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          세계관 설정
                        </Button>
                      </Link>
                      <Link href={`/projects/${project.id}/episodes`} className="flex-1">
                        <Button size="sm" className="w-full">
                          회차 작성
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
