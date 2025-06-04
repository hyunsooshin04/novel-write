import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; characterId: string } }) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)
    const characterId = Number.parseInt(params.characterId)

    // 프로젝트 소유권 확인
    const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1 AND user_id = $2", [
      projectId,
      user.id,
    ])

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
    }

    // 캐릭터 삭제
    const result = await pool.query("DELETE FROM characters WHERE id = $1 AND project_id = $2 RETURNING *", [
      characterId,
      projectId,
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete character error:", error)
    return NextResponse.json({ error: "캐릭터 삭제 중 오류가 발생했습니다." }, { status: 500 })
  }
}
