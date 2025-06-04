import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const result = await pool.query(
      `
      SELECT p.*, 
             (SELECT COUNT(*) FROM episodes WHERE project_id = p.id) as episode_count
      FROM projects p 
      WHERE p.user_id = $1 
      ORDER BY p.updated_at DESC
    `,
      [user.id],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json({ error: "프로젝트 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const { title, genre, keywords, overview } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 })
    }

    const result = await pool.query(
      "INSERT INTO projects (user_id, title, genre, keywords, overview) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user.id, title, genre, keywords, overview],
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "프로젝트 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}
