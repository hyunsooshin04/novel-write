import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "사용자 정보 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}
