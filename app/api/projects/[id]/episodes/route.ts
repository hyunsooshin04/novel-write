import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)

    // 프로젝트 소유권 확인
    const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1 AND user_id = $2", [
      projectId,
      user.id,
    ])

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
    }

    const episodesResult = await pool.query("SELECT * FROM episodes WHERE project_id = $1 ORDER BY episode_number", [
      projectId,
    ])

    return NextResponse.json({
      project: projectResult.rows[0],
      episodes: episodesResult.rows,
    })
  } catch (error) {
    console.error("Get episodes error:", error)
    return NextResponse.json({ error: "에피소드 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)
    const { title, prompt, content, minWordCount } = await request.json()

    // 프로젝트 소유권 확인
    const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1 AND user_id = $2", [
      projectId,
      user.id,
    ])

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
    }

    // 다음 에피소드 번호 계산
    const episodeCountResult = await pool.query(
      "SELECT COALESCE(MAX(episode_number), 0) + 1 as next_episode FROM episodes WHERE project_id = $1",
      [projectId],
    )
    const nextEpisodeNumber = episodeCountResult.rows[0].next_episode

    // 글자 수 계산
    const wordCount = content?.length || 0

    // 에피소드 저장
    const result = await pool.query(
      "INSERT INTO episodes (project_id, episode_number, title, prompt, content, min_word_count, actual_word_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        projectId,
        nextEpisodeNumber,
        title || `${nextEpisodeNumber}화`,
        prompt,
        content,
        minWordCount || 1000,
        wordCount,
      ],
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Create episode error:", error)
    return NextResponse.json({ error: "에피소드 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}
