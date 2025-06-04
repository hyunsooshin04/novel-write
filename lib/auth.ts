import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { pool } from "./db"
import crypto from "crypto"

export interface User {
  id: number
  email: string
  username: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await pool.query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)", [sessionId, userId, expiresAt])

  const cookieStore = await cookies()
  cookieStore.set("session", sessionId, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })

  return sessionId
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (!sessionId) return null

  const result = await pool.query(
    `
    SELECT u.id, u.email, u.username 
    FROM users u 
    JOIN sessions s ON u.id = s.user_id 
    WHERE s.id = $1 AND s.expires_at > NOW()
  `,
    [sessionId],
  )

  return result.rows[0] || null
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (sessionId) {
    await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId])
  }

  cookieStore.delete("session")
}
