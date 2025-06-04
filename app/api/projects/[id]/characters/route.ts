import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { generateCharacters } from "@/lib/openai"

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

    const charactersResult = await pool.query("SELECT * FROM characters WHERE project_id = $1 ORDER BY id", [projectId])

    return NextResponse.json({
      project: projectResult.rows[0],
      characters: charactersResult.rows,
    })
  } catch (error) {
    console.error("Get characters error:", error)
    return NextResponse.json({ error: "캐릭터 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const projectId = Number.parseInt(params.id)
    const { action, characters } = await request.json()

    // 프로젝트 소유권 확인
    const projectResult = await pool.query(
      `SELECT p.*, w.background, w.history, w.mythology, w.rules FROM projects p 
       LEFT JOIN worldbuilding w ON p.id = w.project_id 
       WHERE p.id = $1 AND p.user_id = $2`,
      [projectId, user.id],
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 })
    }

    const project = projectResult.rows[0]

    if (action === "generate") {
      try {
        // AI로 캐릭터 생성
        const worldbuilding = `배경: ${project.background || ""}\n역사: ${project.history || ""}\n신화: ${project.mythology || ""}\n질서: ${project.rules || ""}`

        console.log("Generating characters for project:", project.title)

        const generatedContent = await generateCharacters(project.title, project.genre || "", worldbuilding)

        console.log("Generated characters content:", generatedContent)

        // 기존 캐릭터 삭제 후 새로 생성
        await pool.query("DELETE FROM characters WHERE project_id = $1", [projectId])

        // 생성된 내용을 파싱하여 캐릭터 생성
        const parsedCharacters = parseCharactersImproved(generatedContent)

        console.log("Parsed characters:", parsedCharacters)

        const createdCharacters = []
        for (const character of parsedCharacters) {
          if (character.name) {
            const result = await pool.query(
              "INSERT INTO characters (project_id, name, role, description, personality, background, appearance) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
              [
                projectId,
                character.name,
                character.role,
                character.description,
                character.personality,
                character.background,
                character.appearance,
              ],
            )
            createdCharacters.push(result.rows[0])
          }
        }

        return NextResponse.json(createdCharacters)
      } catch (aiError) {
        console.error("AI character generation error:", aiError)
        return NextResponse.json(
          {
            error: "AI 캐릭터 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
          },
          { status: 500 },
        )
      }
    } else {
      // 사용자가 직접 수정/추가
      const createdCharacters = []

      // 기존 캐릭터 삭제
      await pool.query("DELETE FROM characters WHERE project_id = $1", [projectId])

      // 새 캐릭터들 추가
      for (const character of characters) {
        if (character.name) {
          const result = await pool.query(
            "INSERT INTO characters (project_id, name, role, description, personality, background, appearance) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [
              projectId,
              character.name,
              character.role,
              character.description,
              character.personality,
              character.background,
              character.appearance,
            ],
          )
          createdCharacters.push(result.rows[0])
        }
      }

      return NextResponse.json(createdCharacters)
    }
  } catch (error) {
    console.error("Save characters error:", error)
    return NextResponse.json({ error: "캐릭터 저장 중 오류가 발생했습니다." }, { status: 500 })
  }
}

function parseCharactersImproved(content: string) {
  const characters = []

  try {
    console.log("Original content:", content)

    // 먼저 전체 텍스트를 정리
    const cleanContent = content.trim()

    // 캐릭터 블록들을 찾기 위한 패턴들
    const characterPatterns = [/캐릭터\d+:/g, /Character\d+:/g, /\d+\./g]

    let characterBlocks = []

    // 캐릭터 구분자로 분할 시도
    for (const pattern of characterPatterns) {
      const matches = [...cleanContent.matchAll(pattern)]
      if (matches.length > 0) {
        // 구분자 위치들을 찾아서 블록 분할
        const positions = matches.map((match) => match.index)

        for (let i = 0; i < positions.length; i++) {
          const start = positions[i]
          const end = i < positions.length - 1 ? positions[i + 1] : cleanContent.length
          const block = cleanContent.substring(start, end).trim()

          if (block) {
            characterBlocks.push(block)
          }
        }
        break
      }
    }

    // 구분자로 분할이 실패한 경우, 전체를 하나의 블록으로 처리
    if (characterBlocks.length === 0) {
      characterBlocks = [cleanContent]
    }

    console.log("Character blocks:", characterBlocks)

    // 각 블록에서 캐릭터 정보 추출
    for (const block of characterBlocks) {
      const character = extractCharacterFromBlock(block)
      if (character.name) {
        characters.push(character)
      }
    }

    console.log("Parsed characters:", characters)
    return characters
  } catch (error) {
    console.error("Character parsing error:", error)
    return []
  }
}

function extractCharacterFromBlock(block: string) {
  const character = {
    name: "",
    role: "",
    description: "",
    personality: "",
    background: "",
    appearance: "",
  }

  try {
    // 각 필드를 정규식으로 추출
    const patterns = {
      name: /이름:\s*([^\n]*?)(?=\n|역할:|설명:|성격:|배경:|외모:|$)/i,
      role: /역할:\s*([^\n]*?)(?=\n|이름:|설명:|성격:|배경:|외모:|$)/i,
      description: /설명:\s*(.*?)(?=\n성격:|배경:|외모:|이름:|역할:|$)/is,
      personality: /성격:\s*(.*?)(?=\n배경:|외모:|이름:|역할:|설명:|$)/is,
      background: /배경:\s*(.*?)(?=\n외모:|이름:|역할:|설명:|성격:|$)/is,
      appearance: /외모:\s*(.*?)(?=\n이름:|역할:|설명:|성격:|배경:|$)/is,
    }

    // 각 패턴으로 매칭 시도
    for (const [field, pattern] of Object.entries(patterns)) {
      const match = block.match(pattern)
      if (match && match[1]) {
        character[field as keyof typeof character] = match[1].trim()
      }
    }

    // 만약 정규식으로 추출이 실패한 경우, 라인별 처리
    if (!character.name && !character.role) {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)
      let currentField = ""
      let currentContent = ""

      for (const line of lines) {
        if (line.startsWith("이름:")) {
          if (currentField) {
            character[currentField as keyof typeof character] = currentContent.trim()
          }
          currentField = "name"
          currentContent = line.replace("이름:", "").trim()
        } else if (line.startsWith("역할:")) {
          if (currentField) {
            character[currentField as keyof typeof character] = currentContent.trim()
          }
          currentField = "role"
          currentContent = line.replace("역할:", "").trim()
        } else if (line.startsWith("설명:")) {
          if (currentField) {
            character[currentField as keyof typeof character] = currentContent.trim()
          }
          currentField = "description"
          currentContent = line.replace("설명:", "").trim()
        } else if (line.startsWith("성격:")) {
          if (currentField) {
            character[currentField as keyof typeof character] = currentContent.trim()
          }
          currentField = "personality"
          currentContent = line.replace("성격:", "").trim()
        } else if (line.startsWith("배경:")) {
          if (currentField) {
            character[currentField as keyof typeof character] = currentContent.trim()
          }
          currentField = "background"
          currentContent = line.replace("배경:", "").trim()
        } else if (line.startsWith("외모:")) {
          if (currentField) {
            character[currentField as keyof typeof character] = currentContent.trim()
          }
          currentField = "appearance"
          currentContent = line.replace("외모:", "").trim()
        } else if (currentField && line) {
          // 현재 필드에 이어지는 내용 추가
          currentContent += " " + line
        }
      }

      // 마지막 필드 저장
      if (currentField && currentContent) {
        character[currentField as keyof typeof character] = currentContent.trim()
      }
    }

    console.log("Extracted character:", character)
    return character
  } catch (error) {
    console.error("Character extraction error:", error)
    return character
  }
}
