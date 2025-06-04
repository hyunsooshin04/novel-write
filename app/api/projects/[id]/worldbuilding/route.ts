import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { generateWorldbuilding } from "@/lib/openai"

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

    const worldbuildingResult = await pool.query("SELECT * FROM worldbuilding WHERE project_id = $1", [projectId])

    return NextResponse.json({
      project: projectResult.rows[0],
      worldbuilding: worldbuildingResult.rows[0] || null,
    })
  } catch (error) {
    console.error("Get worldbuilding error:", error)
    return NextResponse.json({ error: "세계관 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)
    const { action, background, history, mythology, rules } = await request.json()

    // 프로젝트 소유권 확인
    const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1 AND user_id = $2", [
      projectId,
      user.id,
    ])

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
    }

    const project = projectResult.rows[0]

    // 먼저 기존 세계관이 있는지 확인
    const existingWorldbuilding = await pool.query("SELECT id FROM worldbuilding WHERE project_id = $1", [projectId])
    const worldbuildingExists = existingWorldbuilding.rows.length > 0

    if (action === "generate") {
      try {
        console.log("Generating worldbuilding for project:", project.title)

        // AI로 세계관 생성
        const worldbuildingData = await generateWorldbuilding(
          project.title,
          project.genre || "",
          project.keywords || "",
          project.overview || "",
        )

        console.log("Generated worldbuilding data:", worldbuildingData)

        let result

        if (worldbuildingExists) {
          // 기존 세계관 업데이트
          result = await pool.query(
            `UPDATE worldbuilding 
             SET background = $1, history = $2, mythology = $3, rules = $4, updated_at = CURRENT_TIMESTAMP
             WHERE project_id = $5
             RETURNING *`,
            [
              worldbuildingData.background,
              worldbuildingData.history,
              worldbuildingData.mythology,
              worldbuildingData.rules,
              projectId,
            ],
          )
        } else {
          // 새 세계관 생성
          result = await pool.query(
            `INSERT INTO worldbuilding (project_id, background, history, mythology, rules) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [
              projectId,
              worldbuildingData.background,
              worldbuildingData.history,
              worldbuildingData.mythology,
              worldbuildingData.rules,
            ],
          )
        }

        return NextResponse.json(result.rows[0])
      } catch (aiError) {
        console.error("AI generation error:", aiError)
        return NextResponse.json(
          {
            error: "AI 세계관 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
          },
          { status: 500 },
        )
      }
    } else {
      // 사용자가 직접 수정
      let result

      if (worldbuildingExists) {
        // 기존 세계관 업데이트
        result = await pool.query(
          `UPDATE worldbuilding 
           SET background = $1, history = $2, mythology = $3, rules = $4, updated_at = CURRENT_TIMESTAMP
           WHERE project_id = $5
           RETURNING *`,
          [background, history, mythology, rules, projectId],
        )
      } else {
        // 새 세계관 생성
        result = await pool.query(
          `INSERT INTO worldbuilding (project_id, background, history, mythology, rules) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [projectId, background, history, mythology, rules],
        )
      }

      return NextResponse.json(result.rows[0])
    }
  } catch (error) {
    console.error("Save worldbuilding error:", error)
    return NextResponse.json({ error: "세계관 저장 중 오류가 발생했습니다." }, { status: 500 })
  }
}
