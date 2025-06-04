import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 })
    }

    // 사용자 확인
    const result = await pool.query("SELECT id, password_hash FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "존재하지 않는 사용자입니다." }, { status: 400 })
    }

    const user = result.rows[0]
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 400 })
    }

    await createSession(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "로그인 중 오류가 발생했습니다." }, { status: 500 })
  }
}
