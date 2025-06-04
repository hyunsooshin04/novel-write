import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/db"

// 에피소드 상세 조회
export async function GET(request: NextRequest, { params }: { params: { id: string; episodeId: string } }) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)
    const episodeId = Number.parseInt(params.episodeId)

    // 프로젝트 소유권 확인
    const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1 AND user_id = $2", [
      projectId,
      user.id,
    ])

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
    }

    // 에피소드 조회
    const episodeResult = await pool.query("SELECT * FROM episodes WHERE id = $1 AND project_id = $2", [
      episodeId,
      projectId,
    ])

    if (episodeResult.rows.length === 0) {
      return NextResponse.json({ error: "에피소드를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json(episodeResult.rows[0])
  } catch (error) {
    console.error("Get episode error:", error)
    return NextResponse.json({ error: "에피소드 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 에피소드 수정
export async function PUT(request: NextRequest, { params }: { params: { id: string; episodeId: string } }) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)
    const episodeId = Number.parseInt(params.episodeId)
    const { title, prompt, content } = await request.json()

    // 프로젝트 소유권 확인
    const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1 AND user_id = $2", [
      projectId,
      user.id,
    ])

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
    }

    // 에피소드 존재 확인
    const episodeCheckResult = await pool.query("SELECT * FROM episodes WHERE id = $1 AND project_id = $2", [
      episodeId,
      projectId,
    ])

    if (episodeCheckResult.rows.length === 0) {
      return NextResponse.json({ error: "에피소드를 찾을 수 없습니다." }, { status: 404 })
    }

    // 글자 수 계산
    const wordCount = content?.length || 0

    // 에피소드 업데이트
    const result = await pool.query(
      `
      UPDATE episodes 
      SET title = $1, prompt = $2, content = $3, actual_word_count = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND project_id = $6
      RETURNING *
      `,
      [title, prompt, content, wordCount, episodeId, projectId],
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Update episode error:", error)
    return NextResponse.json({ error: "에피소드 수정 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 에피소드 삭제
export async function DELETE(request: NextRequest, { params }: { params: { id: string; episodeId: string } }) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)
    const episodeId = Number.parseInt(params.episodeId)

    // 프로젝트 소유권 확인
    const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1 AND user_id = $2", [
      projectId,
      user.id,
    ])

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
    }

    // 에피소드 삭제
    const result = await pool.query("DELETE FROM episodes WHERE id = $1 AND project_id = $2 RETURNING *", [
      episodeId,
      projectId,
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "에피소드를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete episode error:", error)
    return NextResponse.json({ error: "에피소드 삭제 중 오류가 발생했습니다." }, { status: 500 })
  }
}
