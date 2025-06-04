import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { hashPassword, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 })
    }

    // 이메일 중복 확인
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "이미 존재하는 이메일입니다." }, { status: 400 })
    }

    // 사용자 생성
    const hashedPassword = await hashPassword(password)
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id",
      [email, hashedPassword, username],
    )

    const userId = result.rows[0].id
    await createSession(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "회원가입 중 오류가 발생했습니다." }, { status: 500 })
  }
}
