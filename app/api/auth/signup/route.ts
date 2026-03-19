import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { signupSchema } from "@/lib/validations/scan"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = signupSchema.parse(body)

    const db = getDb()

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await db.insert(users).values({
      id: nanoid(),
      name,
      email,
      password: hashedPassword,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
