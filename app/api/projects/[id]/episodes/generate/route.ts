import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/db"
import { generateEpisode } from "@/lib/openai"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)
    const { prompt, minWordCount } = await request.json()

    if (!prompt.trim()) {
      return NextResponse.json({ error: "프롬프트를 입력해주세요." }, { status: 400 })
    }

    // 프로젝트 소유권 확인 및 관련 데이터 조회
    const projectResult = await pool.query(
      `
      SELECT p.*, 
             w.background, w.history, w.mythology, w.rules,
             COALESCE(
               STRING_AGG(
                 c.name || ': ' || COALESCE(c.description, '') || ' (' || COALESCE(c.role, '') || ')', 
                 E'\n' ORDER BY c.id
               ), 
               ''
             ) as characters_info
      FROM projects p 
      LEFT JOIN worldbuilding w ON p.id = w.project_id 
      LEFT JOIN characters c ON p.id = c.project_id
      WHERE p.id = $1 AND p.user_id = $2
      GROUP BY p.id, w.background, w.history, w.mythology, w.rules
    `,
      [projectId, user.id],
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
    }

    const project = projectResult.rows[0]

    // 이전 에피소드들 조회
    const previousEpisodesResult = await pool.query(
      "SELECT episode_number, title, content FROM episodes WHERE project_id = $1 ORDER BY episode_number",
      [projectId],
    )

    const previousEpisodes = previousEpisodesResult.rows
      .map((ep) => `${ep.episode_number}화: ${ep.title || ""}\n${ep.content}`)
      .join("\n\n---\n\n")

    const worldbuilding = `배경: ${project.background || ""}\n역사: ${project.history || ""}\n신화: ${project.mythology || ""}\n질서: ${project.rules || ""}`

    // AI로 에피소드 생성
    const generatedContent = await generateEpisode(
      prompt,
      worldbuilding,
      project.characters_info || "",
      previousEpisodes,
      minWordCount || 1000,
    )

    // 생성된 내용만 반환 (저장하지 않음)
    return NextResponse.json({ content: generatedContent })
  } catch (error) {
    console.error("Generate episode error:", error)
    return NextResponse.json({ error: "에피소드 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}
